import type { StyleVars } from "../lib/vars";
import type { Offset } from "./overrides";
import type {
  WallDepth,
  WallPlacement,
  WallPlacementNarrow,
  WallPlacementSet,
} from "./types";

/* =============================================================================
   PLACEMENT → CSS
   =============================================================================

   One direction, one file. A placement record goes in; custom properties come
   out. Nothing here decides how anything LOOKS — it decides where a box is, how
   wide, how turned, and how deep. Everything else belongs to a renderer's own
   module.

   BOTH COMPOSITIONS ARE PUBLISHED AT ONCE, under two prefixes:

     --wall-*    the wide composition
     --wall-n*   the narrow composition

   and a single media query in `WallItem.module.css` decides which set is live.
   The alternative — a resize listener choosing in JavaScript — would put a
   layout read and a re-render on every drag of a window border to answer a
   question CSS already answers for free, and would render the wrong composition
   for one frame on first paint.

   Values are emitted as RESOLVED CSS strings (`"62%"`, `"-2.4deg"`) rather than
   as bare numbers to be multiplied by a unit in `calc()`. It costs nothing, it
   makes the DOM readable in devtools, and it is what lets `size` be absent — an
   item with no authored size emits `fit-content`, which no amount of `calc()`
   on a missing number could have produced.
   ========================================================================== */

/**
 * The depth model, as the wall sees it.
 *
 * These are token REFERENCES, not values — the numbers live in `tokens.css`
 * with the rest of the depth model and nothing here knows what they are.
 *
 * The bands are the shared model's layers 3, 4 and 5, and the wall reuses that
 * vocabulary on purpose. But they resolve INSIDE the wall's own stacking
 * context (`isolation: isolate`), so they order artifacts against each other
 * and nothing else: a `front` memory is in front of the other artifacts, not in
 * front of the interaction layer's paper. The wall as a whole is layer 3.
 */
const DEPTH_LAYER: Record<WallDepth, string> = {
  back: "var(--layer-3-content)",
  base: "var(--layer-4-objects)",
  front: "var(--layer-5-foreground)",
};

const DEFAULT_DEPTH: WallDepth = "base";

/** Percentage, or `fit-content` when the author left the size to the content. */
const inlineSize = (size: number | undefined): string =>
  size === undefined ? "fit-content" : `${size}%`;

const percent = (value: number): string => `${value}%`;

const degrees = (value: number | undefined): string => `${value ?? 0}deg`;

const depth = (value: WallDepth | undefined): string =>
  DEPTH_LAYER[value ?? DEFAULT_DEPTH];

function wideVars(placement: WallPlacement): StyleVars {
  return {
    "--wall-x": percent(placement.x),
    "--wall-y": percent(placement.y),
    "--wall-inline-size": inlineSize(placement.size),
    "--wall-rotation": degrees(placement.rotation),
    "--wall-depth": depth(placement.depth),
    "--wall-z": placement.z ?? 0,
  };
}

function narrowVars(placement: WallPlacementNarrow): StyleVars {
  return {
    "--wall-nx": percent(placement.x),
    "--wall-ninline-size": inlineSize(placement.size),
    "--wall-nrotation": degrees(placement.rotation),
    "--wall-ndepth": depth(placement.depth),
    "--wall-nz": placement.z ?? 0,
  };
}

/**
 * The visitor's remembered displacement, in CSS pixels.
 *
 * Folded into the same `translate` that does the centre anchoring, so an
 * authored anchor and a visitor's nudge never fight over a property. Zero is
 * the normal state and costs nothing.
 *
 * Deliberately NOT applied on narrow — the stylesheet zeroes both there. A
 * vertical offset inside a flow column pushes an item into its neighbour, and a
 * position saved on a desktop should not be able to damage the phone view.
 */
function offsetVars(offset: Offset): StyleVars {
  return {
    "--wall-offset-x": `${offset.x}px`,
    "--wall-offset-y": `${offset.y}px`,
  };
}

export interface PlacementAttributes {
  readonly style: StyleVars;
  /** Removed from the narrow composition entirely. */
  readonly "data-narrow"?: "absent";
  /** Vertical rhythm before the item, in flow. Narrow only. */
  readonly "data-lead"?: "tight" | "normal" | "loose";
}

/**
 * Everything the placement shell needs, from one placement record.
 *
 * `lead` is an attribute rather than a custom property because it selects a
 * SPACING VALUE, and spacing values belong in the stylesheet next to the rest
 * of the space scale — not in a lookup table in TypeScript where a visual
 * engineer would never think to look for them.
 */
export function placementAttributes(
  placement: WallPlacementSet,
  offset: Offset,
): PlacementAttributes {
  const { wide, narrow } = placement;
  const absent = narrow === "absent";

  return {
    style: {
      ...wideVars(wide),
      /* An absent item still publishes a narrow set. It is `display: none` at
         that width, so the values are never read — but a var() with no
         definition anywhere is a debugging trap, and mirroring the wide
         composition is the least surprising thing for it to hold. */
      ...narrowVars(absent ? wide : narrow),
      ...offsetVars(offset),
    },
    ...(absent ? { "data-narrow": "absent" as const } : {}),
    ...(!absent && narrow.lead ? { "data-lead": narrow.lead } : {}),
  };
}
