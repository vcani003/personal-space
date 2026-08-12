/**
 * ATMOSPHERE — the world the content sits inside.
 *
 * Mount once, as a sibling of the page:
 *
 *   <Atmosphere />
 *   <Home />
 *
 * Phase 3 ships layers 0–2: the deep tonal field, individually placed stars,
 * drifting haze, and film grain. Layers 4 and 5 (mid-depth objects, the
 * occasional foreground object) are unbuilt — there is no art for them — and
 * will need a second root in FRONT of the content, since this one sits behind
 * it by design. See the note at the top of Atmosphere.module.css.
 *
 * THE ENVIRONMENT IS DATA. `composition.ts` is the file to edit: every star is
 * a row in a table with a required one-line justification for existing, and
 * nothing about the sky is hardcoded into a page component. There is no star
 * generator here and there should never be one.
 *
 * Phase 4 added the pointer field. `<Atmosphere />` still takes no props and
 * still mounts once; everything below is the seam other systems read from.
 *
 * =============================================================================
 * THE POINTER SIGNAL — read this before writing any pointer code
 * =============================================================================
 *
 * There is exactly ONE `requestAnimationFrame` loop on this page and it lives
 * in `pointer.ts`, mounted by `<Atmosphere />`. Do not write another one. If
 * you need frames, borrow this one — `holdPointerFrames()` exists for that.
 *
 * The division of labour, which is the important part:
 *
 *   ATMOSPHERE owns the CONTINUOUS pointer signal — one loop, one listener,
 *              interpolated, published as CSS custom properties.
 *   INTERACTION owns DISCRETE GESTURES — pointerdown/up/cancel on a specific
 *              element: dragging, press-and-hold, click-to-reveal. Use Pointer
 *              Events directly for those. They are yours, and they do not need
 *              anything from this module except, occasionally, frames.
 *
 * -----------------------------------------------------------------------------
 * THREE WAYS TO READ IT, cheapest first
 * -----------------------------------------------------------------------------
 *
 * 1. FROM CSS — free, and the right answer for anything that is just moving.
 *
 *      --pointer-x   unitless, −1 … 1, viewport LEFT edge → RIGHT edge
 *      --pointer-y   unitless, −1 … 1, viewport TOP edge → BOTTOM edge
 *
 *    Centre of the viewport is 0, 0. Both are published on
 *    `document.documentElement`, so every element on the page inherits them.
 *    They are VIEWPORT-relative and independent of scroll — scrolling does not
 *    change them, because the page must not move as it scrolls.
 *
 *    They are the SMOOTHED values, not the raw cursor: the loop interpolates
 *    toward the pointer with a ~140ms time constant. Multiply by a distance to
 *    use them:  `translate: calc(var(--pointer-x, 0) * 6px) …`. Always supply
 *    the `, 0` fallback — under reduced motion, on touch, and before the first
 *    pointer move, the properties are NOT SET AT ALL, and the fallback is what
 *    makes that state resolve to no movement instead of to invalid CSS.
 *
 *    Prefer the atmosphere's own `--parallax-x` / `--parallax-y` if you are
 *    inside the atmosphere root; those are the same signal with the sign the
 *    depth model uses. On page content, use `--pointer-*`.
 *
 * 2. `readPointer()` — a synchronous snapshot, for inside an event handler.
 *    Returns smoothed `x` / `y` in the same −1…1 space, the RAW `clientX` /
 *    `clientY` in viewport px (or `null` before the first move), and `active`.
 *
 * 3. `subscribePointerFrame(fn)` — a callback on every frame the shared loop
 *    runs. Returns an unsubscribe function; call it in effect cleanup. It fires
 *    only while the loop is awake, which is deliberate: the loop STOPS when
 *    nothing is moving, and a subscription is not a heartbeat.
 *
 * `holdPointerFrames()` keeps the loop awake for work of your own — a drag, an
 * inertial settle — and returns a release function. Releasing is not optional.
 *
 * -----------------------------------------------------------------------------
 * WHEN THE SIGNAL IS OFF
 * -----------------------------------------------------------------------------
 * `active` is false, no properties are published, and no pointer listener is
 * attached, when the primary pointer is coarse, when hover is unavailable, or
 * under `prefers-reduced-motion: reduce`. All three are watched live via
 * `matchMedia` change events — plugging in a mouse or changing the OS setting
 * takes effect without a reload.
 *
 * This never disables a DISCRETE gesture. A drag must work on a phone and
 * under reduced motion; it just arrives instantly instead of gliding. Gate
 * continuous decoration on `active`. Do not gate content on it.
 */

export { Atmosphere } from "./Atmosphere";
export type { AtmosphereProps } from "./Atmosphere";
export { composition } from "./composition";
export {
  POINTER_VARS,
  holdPointerFrames,
  readPointer,
  subscribePointerFrame,
} from "./pointer";
export type { PointerReading } from "./pointer";
export type {
  Composition,
  Depth,
  EnvironmentObject,
  HazeMass,
  Presence,
  StarObject,
  ToneName,
} from "./types";
