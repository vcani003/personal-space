import type { CSSProperties } from "react";

/**
 * A style object that may also carry CSS custom properties.
 *
 * This type was declared twice already — once in `src/atmosphere/vars.ts` and
 * once in `src/interaction/vars.ts` — and the second copy's own comment named
 * the condition for moving it: "if a third layer needs it, it belongs in
 * src/lib". The wall is the third layer, so here it is.
 *
 * The two existing copies are deliberately NOT edited: they belong to other
 * agents and are one line each. Their owners can re-export this at leisure, or
 * not.
 *
 * The principle behind it is worth restating, because it is why the wall works
 * at all: everything positional a component hands to CSS goes through a custom
 * property. Coordinates, rotations, sizes and remembered offsets are DATA.
 * Keeping them out of real style declarations is what lets the stylesheet stay
 * the only place that decides how any of it looks.
 */
export type StyleVars = CSSProperties & Record<`--${string}`, string | number>;
