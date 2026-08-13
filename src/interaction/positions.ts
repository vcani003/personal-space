import { isFiniteNumber, read, write } from "../lib/storage";

/* =============================================================================
   REMEMBERED POSITIONS
   =============================================================================

   Key:  personal-space:v1:objectPositions
   Shape: { "<objectId>": { "x": <px>, "y": <px> } }

   WHAT IS STORED IS AN OFFSET, NOT A POSITION. Every value is a displacement in
   CSS pixels from the object's AUTHORED anchor in `placement.ts`, never an
   absolute coordinate.

   That distinction is the whole design of this file. The anchor is a percentage
   of the viewport's width and of the document's height, so it moves when the
   window is resized, when the fonts load, when the composition changes, and it
   is a different point entirely at the narrow breakpoint. An absolute
   coordinate saved on a 1600px desktop would land somewhere arbitrary on a
   phone — possibly on top of the prose, possibly outside the page. An offset
   means "you moved it a bit to the left of where it was left", which survives
   all of that, and it makes the empty state exactly `{ x: 0, y: 0 }`.

   The map is keyed by object id so a second movable object — if one is ever
   justified, and the MVP budget says one is not — costs a key in an existing
   payload rather than a new storage entry.

   NOTHING HERE CAN BREAK THE PAGE. `lib/storage.ts` never throws, and a value
   that fails the guard below is discarded and replaced by the authored
   position. Disabled storage, a full quota, private browsing and hand-edited
   JSON all resolve to the same thing: the paper sits where it was composed.
   ========================================================================== */

/** Resolves to `personal-space:v1:objectPositions` via `storageKey`. */
const KEY = "objectPositions";

/**
 * Rejection bound, in px. Far beyond any plausible drag — the drag itself is
 * clamped to the viewport — so anything past it is corruption or a payload from
 * an incompatible idea of what these numbers mean, not a real position.
 */
const LIMIT = 20_000;

export interface Offset {
  readonly x: number;
  readonly y: number;
}

export const NO_OFFSET: Offset = { x: 0, y: 0 };

type PositionMap = Readonly<Record<string, Offset>>;

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

/* An unknown id in the map is not corruption — it is an object this build no
   longer renders, or does not render yet. It is left alone and ignored. Only a
   malformed VALUE invalidates the payload. */
const isPositionMap = (value: unknown): value is PositionMap =>
  isPlainObject(value) && Object.values(value).every(isOffset);

/** The remembered displacement for one object, or `{ x: 0, y: 0 }`. */
export function readOffset(id: string): Offset {
  const stored = read<PositionMap>(KEY, isPositionMap, {})[id];
  return stored ?? NO_OFFSET;
}

/**
 * Remember where an object was left.
 *
 * Called once per gesture, after the object has finished settling — never per
 * frame. Rounded to a tenth of a pixel: the difference is invisible and the
 * payload stays short.
 *
 * The write result is deliberately ignored. There is no state in which this
 * site tells someone their browser could not remember where they put a piece of
 * paper.
 */
export function writeOffset(id: string, offset: Offset): void {
  const map = read<PositionMap>(KEY, isPositionMap, {});
  write(KEY, {
    ...map,
    [id]: { x: round(offset.x), y: round(offset.y) },
  });
}

const round = (value: number): number => Math.round(value * 10) / 10;
