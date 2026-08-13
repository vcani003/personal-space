import type { CSSProperties } from "react";

/**
 * A style object that may also carry CSS custom properties.
 *
 * Same idea as the atmosphere's `vars.ts`, and declared again here rather than
 * imported across a layer boundary: it is one line, and it is not worth a
 * dependency between two systems that otherwise share only a documented pointer
 * API. If a third layer needs it, it belongs in `src/lib`.
 *
 * Everything positional this layer hands to CSS goes through a custom property.
 * Authored anchors, remembered offsets and the hold threshold are all DATA;
 * keeping them out of real style declarations is what lets the stylesheet stay
 * the only place that decides how any of it looks.
 */
export type StyleVars = CSSProperties & Record<`--${string}`, string | number>;
