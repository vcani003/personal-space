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
 *    There is also a slower pair, `--pointer-x-slow` / `--pointer-y-slow`:
 *    the same signal and the same destination on a ~286ms time constant rather
 *    than ~140ms. It exists so a field of objects can arrive on different beats
 *    without anybody running a second loop. Blend toward it by a fraction if
 *    you want something to settle late; do not follow it outright.
 *
 *    Centre of the viewport is 0, 0. Both are published on
 *    `document.documentElement`, so every element on the page inherits them.
 *    They are VIEWPORT-relative and independent of scroll — scrolling does not
 *    change them, because the page must not move as it scrolls.
 *
 *    They are the SMOOTHED values, not the raw cursor: the loop interpolates
 *    toward the pointer with a ~140ms time constant. Multiply by a distance to
 *    use them:  `translate: calc(var(--pointer-x, 0) * 10px) …`. Always supply
 *    the `, 0` fallback — under reduced motion, on touch, and before the first
 *    pointer move, the properties are NOT SET AT ALL, and the fallback is what
 *    makes that state resolve to no movement instead of to invalid CSS.
 *
 *    Prefer the atmosphere's own `--parallax-x` / `--parallax-y` if you are
 *    inside the atmosphere root; those are the same signal with the sign the
 *    depth model uses. On page content, use `--pointer-*`.
 *
 *    THERE IS ALSO A NON-GLOBAL CHANNEL, and it is not published for reuse.
 *    `--star-push-x` / `--star-push-y` are written by the same loop onto
 *    individual stars: LOCAL REPULSION, each object displaced away from a
 *    cursor that comes within 140px of it. That cannot be one pair of numbers
 *    on the document element, because it is a different vector per object, so
 *    it is not something other code can read from CSS. If something outside the
 *    atmosphere ever needs the same behaviour, add it to the loop's `pushed`
 *    list — do not compute distances in a second place, and above all do not
 *    start a second loop to do it.
 *
 *    Parallax and repulsion ADD. Parallax says the viewer moved; repulsion says
 *    one small part of the world was disturbed. Keeping them separate is what
 *    keeps depth legible: only the parallax term is scaled by the depth ladder.
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
/**
 * How one environmental object deviates from the plain behaviour of its depth.
 *
 * Exported for anything that needs to MOVE WITH a specific star rather than
 * merely near it — the hidden-star hit area in `src/interaction`, for one,
 * currently follows `--parallax-far` while `quote-witness` itself follows
 * ×0.800 of it rotated 6.9°.
 *
 * That divergence is now larger, and there are two terms to it. The parallax
 * mismatch went from 1.93px to 3.21px at the corner of the viewport, because
 * `--parallax-far` was raised from 6px to 10px. And local repulsion moves the
 * star by up to a further 2.0px while the hit area, which knows nothing about
 * it, stays put. Worst case they are ~5.2px apart, and only while the cursor is
 * within 140px of the star — which is to say while it is already well inside a
 * 44px target. Nothing is broken. But if a revealed element should sit exactly
 * on its star rather than merely near it, this is where the numbers are, and
 * `starVariance("quote-witness", "far")` returns all four of them including the
 * push amplitude.
 */
export {
  DEPTH_PUSH,
  DEPTH_TRAVEL_SPREAD,
  LAG_MAX,
  SKEW_MAX_RADIANS,
  starVariance,
  starVarianceTable,
} from "./variance";
export type { StarVariance, VarianceRow } from "./variance";
export type {
  Composition,
  Depth,
  EnvironmentObject,
  GlowSource,
  HazeMass,
  Presence,
  StarObject,
  ToneName,
} from "./types";
