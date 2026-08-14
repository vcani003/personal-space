import { isFiniteNumber, scoped } from "../lib/storage";
import type { WallItemId } from "./types";

/* =============================================================================
   VISITOR POSITIONS — separate from authored positions, and subordinate to them
   =============================================================================

   Key:   personal-space:v2:wallPositions
   Shape: { "<wallItemId>": { "x": <px>, "y": <px> } }

   TWO CONCEPTS, AND THE SEPARATION IS ABSOLUTE.

     AUTHORED PLACEMENT   lives in `src/content/wall.ts`, is source-controlled,
                          and IS the composition. A visitor drag can never
                          modify it — it is a frozen literal in a module, and
                          nothing in this file can reach it.
     VISITOR POSITION     lives here, resolves ON TOP, and is a nicety. If it
                          is missing, corrupt, or storage is switched off, the
                          wall is exactly the wall Vero hung.

   WHAT IS STORED IS AN OFFSET, NOT A POSITION. Every value is a displacement in
   CSS pixels from the item's AUTHORED anchor, never an absolute coordinate.

   That is the same decision `src/interaction/positions.ts` made for the paper
   fragment in MVP 1, for the same reason, and it is worth restating: an anchor
   is a percentage of a box whose size changes with the window, with which font
   loaded, and with the breakpoint. A coordinate saved on a 1600px desktop lands
   somewhere arbitrary on a phone — possibly on top of a paragraph, possibly off
   the wall entirely. An offset means "you moved it a bit from where it was
   left", which survives all of that, and it makes the empty state exactly
   `{ x: 0, y: 0 }`.

   ── Why v2 and not v1 ───────────────────────────────────────────────────────

   `personal-space:v1:objectPositions` and `personal-space:v1:playerDock` are
   LIVE. They belong to the paper fragment and the docked player, both of which
   still exist and still work. Nothing is migrated here, because nothing moved:
   v2 is a new namespace for a new system, not a newer version of an old one.
   `lib/storage.ts` supports both at once — see `LIVE_VERSIONS`.

   ── What this file does not do ──────────────────────────────────────────────

   It does not drag anything. It reads and writes a map. A drag implementation
   writes `--wall-offset-x` / `--wall-offset-y` straight onto the element during
   the gesture and calls `writeWallOffset()` once, on release — never per frame.
   That is precisely the shape the paper fragment already uses.
   ========================================================================== */

const store = scoped("v2");

/** Resolves to `personal-space:v2:wallPositions`. */
const KEY = "wallPositions";

/**
 * Rejection bound, in px. Far beyond any plausible drag — a real drag is
 * clamped to the wall — so anything past it is corruption or a payload from an
 * incompatible idea of what these numbers mean.
 */
const LIMIT = 20_000;

export interface Offset {
  readonly x: number;
  readonly y: number;
}

export const NO_OFFSET: Offset = { x: 0, y: 0 };

export type WallOffsets = Readonly<Record<string, Offset>>;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isOffset = (value: unknown): value is Offset => {
  if (!isPlainObject(value)) return false;
  const { x, y } = value;
  return (
    isFiniteNumber(x) &&
    isFiniteNumber(y) &&
    Math.abs(x) <= LIMIT &&
    Math.abs(y) <= LIMIT
  );
};

/* An unknown id in the map is not corruption — it is an item this build no
   longer hangs, or does not hang yet. It is left alone and ignored. Only a
   malformed VALUE invalidates the payload. */
const isWallOffsets = (value: unknown): value is WallOffsets =>
  isPlainObject(value) && Object.values(value).every(isOffset);

/**
 * Every remembered displacement, in one read.
 *
 * Read ONCE, at mount, by `Wall`. A per-item read would be one `localStorage`
 * hit and one `JSON.parse` per artifact, on the render path, to answer a
 * question a single parse already answers.
 */
export function readWallOffsets(): WallOffsets {
  return store.read<WallOffsets>(KEY, isWallOffsets, {});
}

/** The remembered displacement for one item, or `{ x: 0, y: 0 }`. */
export function wallOffset(offsets: WallOffsets, id: WallItemId): Offset {
  return offsets[id] ?? NO_OFFSET;
}

/**
 * Remember where an artifact was left.
 *
 * Called once per gesture, after the item has finished settling — never per
 * frame. Rounded to a tenth of a pixel: the difference is invisible and the
 * payload stays short.
 *
 * The write result is deliberately ignored. There is no state in which this
 * site tells someone their browser could not remember where they put a
 * photograph.
 */
export function writeWallOffset(id: WallItemId, offset: Offset): void {
  const map = readWallOffsets();
  store.write(KEY, {
    ...map,
    [id]: { x: round(offset.x), y: round(offset.y) },
  });
}

/** Put every artifact back where it was hung. Nothing calls this yet; it is the
 *  honest counterpart to letting people move things. */
export function clearWallOffsets(): void {
  store.remove(KEY);
}

const round = (value: number): number => Math.round(value * 10) / 10;
