import { read, write } from "../lib/storage";
import type { Offset } from "./positions";

/* =============================================================================
   CORNERS — what a corner is, where the player is resting in one, and how the
   answer survives a reload
   =============================================================================

   The docked player can be picked up and moved, and when it is let go it
   settles into the nearest corner of the viewport rather than staying where it
   was dropped. This file is the whole model behind that sentence. It is pure
   arithmetic and one storage key; nothing here touches an event.

   ── The corner is the position. The offset is temporary. ───────────────────

   The dock's resting place is NOT a coordinate. It is one of four corners, and
   CSS puts it there — `[data-corner]` in PlayerDock.module.css sets the two
   insets and that is the entire layout. The consequence is worth stating
   plainly, because it is why this file is short:

     · Between gestures the drag offset is always exactly 0,0.
     · A resize needs no JavaScript. The corner is still the corner; the CSS
       re-anchors it; nothing is measured, clamped or restored.
     · What is remembered across visits is a WORD, not a pixel. There is no
       coordinate saved on a 1600px desktop that has to mean something on a
       phone — the same four words describe every viewport.

   The px offset only exists WHILE something is moving: under the pointer, and
   for the ~200ms glide from wherever it was released to the corner it belongs
   in. `cornerDelta` computes the destination of that glide; the instant it
   lands, the component swaps the anchor and zeroes the offset in the same
   frame, which is visually a no-op and leaves the invariant above intact.

   ── Naming ────────────────────────────────────────────────────────────────

   `top` / `bottom` are the block axis; `start` / `end` the inline one, matching
   the logical properties the stylesheet uses. THIS PAGE IS `ltr` AND
   `horizontal-tb`, so inline-start is the left of the screen — an assumption
   used in exactly one place, `nearestCorner`, and nowhere else.
   ========================================================================== */

export type DockCorner = "top-start" | "top-end" | "bottom-start" | "bottom-end";

/**
 * Where the player is before anyone moves it, and where it returns to if
 * storage is unavailable, full, or holding something that fails validation.
 * Chosen by measurement — see the header of PlayerDock.module.css.
 */
export const DEFAULT_DOCK_CORNER: DockCorner = "bottom-start";

const CORNERS: readonly string[] = [
  "top-start",
  "top-end",
  "bottom-start",
  "bottom-end",
];

export interface CornerParts {
  readonly block: "top" | "bottom";
  readonly inline: "start" | "end";
}

export function cornerParts(corner: DockCorner): CornerParts {
  const [block, inline] = corner.split("-");
  return {
    block: block === "top" ? "top" : "bottom",
    inline: inline === "start" ? "start" : "end",
  };
}

export function toCorner(parts: CornerParts): DockCorner {
  return `${parts.block}-${parts.inline}`;
}

/* -----------------------------------------------------------------------------
   GEOMETRY
   -------------------------------------------------------------------------- */

/**
 * How far apart two opposite corners are, for this dock in this viewport.
 *
 * `x` is the distance the dock's left edge travels between the inline-start and
 * inline-end corners; `y` the same on the block axis. Both are the viewport
 * minus the dock minus its two margins, so they collapse to 0 for a dock that
 * fills its axis — which is what a narrow viewport does, and one of the reasons
 * dragging is not offered there.
 */
export interface DockSpans {
  readonly x: number;
  readonly y: number;
}

export const NO_SPANS: DockSpans = { x: 0, y: 0 };

/** The box a `position: fixed` element is laid out against — the viewport
 *  WITHOUT its scrollbars, which is what `innerWidth` would wrongly include. */
function viewport(): { width: number; height: number } {
  const root = document.documentElement;
  return { width: root.clientWidth, height: root.clientHeight };
}

/**
 * Measure the dock's corner-to-corner spans.
 *
 * ONLY VALID WHILE THE DOCK IS AT REST — the margin is derived from where the
 * element actually is, which is only the corner's margin when the drag offset
 * is zero. That is deliberate: it means the gap between the dock and the edge
 * of the screen lives in ONE place, the stylesheet, and is never a number
 * repeated in TypeScript that could drift from the token.
 *
 * One `getBoundingClientRect`, in an event handler, never in a frame.
 */
export function measureSpans(node: HTMLElement, corner: DockCorner): DockSpans {
  const rect = node.getBoundingClientRect();
  const view = viewport();
  const { block, inline } = cornerParts(corner);

  const marginInline = inline === "start" ? rect.left : view.width - rect.right;
  const marginBlock = block === "top" ? rect.top : view.height - rect.bottom;

  return {
    x: Math.max(0, view.width - marginInline * 2 - rect.width),
    y: Math.max(0, view.height - marginBlock * 2 - rect.height),
  };
}

/**
 * Which corner the dock is closest to, right now.
 *
 * By the quadrant its CENTRE is in, which is the model a hand can predict: let
 * go on the left half of the screen and it goes left. Distance from each of the
 * dock's own corners to each of the viewport's would be more arithmetic for the
 * same four answers, and a "nearest edge" model would let a dock dropped in the
 * middle of the top edge pick a side by a pixel.
 *
 * The one place this file compares physical left/right to logical start/end.
 */
export function nearestCorner(node: HTMLElement): DockCorner {
  const rect = node.getBoundingClientRect();
  const view = viewport();
  return toCorner({
    block: rect.top + rect.height / 2 < view.height / 2 ? "top" : "bottom",
    inline: rect.left + rect.width / 2 < view.width / 2 ? "start" : "end",
  });
}

/**
 * The offset that puts a dock still anchored to `from` exactly where it would
 * sit if it were anchored to `to`. The destination of the settle.
 */
export function cornerDelta(
  from: DockCorner,
  to: DockCorner,
  spans: DockSpans,
): Offset {
  const a = cornerParts(from);
  const b = cornerParts(to);
  return {
    x: a.inline === b.inline ? 0 : b.inline === "end" ? spans.x : -spans.x,
    y: a.block === b.block ? 0 : b.block === "bottom" ? spans.y : -spans.y,
  };
}

/* -----------------------------------------------------------------------------
   REMEMBERING IT
   -----------------------------------------------------------------------------
   Key:   personal-space:v1:playerDock
   Shape: { "corner": "bottom-start" }

   A separate key from `objectPositions` because it is a separate KIND of thing:
   that map stores px displacements from authored anchors, this stores one of
   four words. Putting a string where every other value is `{x, y}` would make
   one validator answer two questions.

   An object rather than a bare string so the next thing the dock has to
   remember — a size, a collapsed state — costs a field instead of a key.

   NOTHING HERE CAN BREAK THE PAGE. `lib/storage.ts` never throws; anything that
   fails the guard is discarded and the player opens in the corner it was
   composed in. Disabled storage, a full quota, private browsing, a hand-edited
   value and a payload from an older idea of what a corner is all resolve to the
   same thing, which is the page everybody else gets.
   -------------------------------------------------------------------------- */

const KEY = "playerDock";

interface DockState {
  readonly corner: DockCorner;
}

const isDockCorner = (value: unknown): value is DockCorner =>
  typeof value === "string" && CORNERS.includes(value);

const isDockState = (value: unknown): value is DockState =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  isDockCorner((value as { corner?: unknown }).corner);

export function readDockCorner(): DockCorner {
  return read<DockState>(KEY, isDockState, { corner: DEFAULT_DOCK_CORNER })
    .corner;
}

/**
 * Called once per settle, never per frame.
 *
 * The result is ignored on purpose. There is no state in which this site tells
 * someone their browser could not remember which corner they left a player in.
 */
export function writeDockCorner(corner: DockCorner): void {
  write(KEY, { corner });
}
