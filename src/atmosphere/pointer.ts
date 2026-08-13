import { clamp, lerp } from "../lib/math";

/* =============================================================================
   THE POINTER FIELD — the page's ONE requestAnimationFrame loop
   =============================================================================

   This module owns the continuous pointer signal for the entire site. There is
   exactly one loop, one `pointermove` listener, and one place where CSS custom
   properties are written. Nothing else on this page may start a rAF loop; see
   `holdPointerFrames` at the bottom for how other systems borrow this one.

   WHAT IT PUBLISHES

     --pointer-x        −1 … 1   viewport left edge → right edge, centre 0
     --pointer-y        −1 … 1   viewport top edge  → bottom edge, centre 0
     --pointer-x-slow   the same signal on a slower time constant
     --pointer-y-slow   the same signal on a slower time constant

   The slow pair exists so that individual objects can settle at slightly
   different speeds without anybody running a second loop or a per-object
   animation. An object blends between the two channels by however much it
   wants — see `variance.ts`. Both channels converge on the SAME target, so the
   difference is entirely in the settle and there is none at rest: the field
   deforms slightly on its way to a position and then agrees on it.

   Unitless numbers, written on `document.documentElement` so every element on
   the page inherits them — the atmosphere sits at a negative z-index as an
   absolutely positioned sibling of the content, so publishing on the
   atmosphere root would put the signal out of reach of everything else.

   That choice has a price and it was measured rather than assumed. Changing an
   inherited custom property at the document root invalidates more of the tree
   than changing it on the atmosphere root does: 0.73ms against 0.42ms per
   published frame, on this page, including a forced style flush — so about
   0.3ms, or 2% of a 60fps frame budget. Cheap enough to buy the whole page a
   depth signal. Worth revisiting only if the page grows an order of magnitude
   more elements, in which case the fix is to publish on a wrapper around the
   content rather than to run a second loop.

   The signal is VIEWPORT-relative and deliberately independent of scroll.
   Parallax here is a viewing-angle cue, not a scroll effect: the page must not
   move as it scrolls (the composition is authored against the document — see
   composition.ts), so scrolling changes nothing about these two numbers.

   WHAT IT ALSO WRITES, AND WHY THAT IS A DIFFERENT KIND OF THING

     --star-push-x      px, per object
     --star-push-y      px, per object

   The four properties above are ONE global signal that every object reads at
   its own depth: the whole field responds together because the VIEWER moved.
   That is parallax, and it is the reason this module can be a single pair of
   numbers on the document element.

   The push pair is not that. It is per-object LOCAL REPULSION — each star
   reacts to its own distance and direction from the cursor and is displaced
   away from it. A star forty pixels from the pointer moves; its neighbour four
   hundred pixels away does not know anything happened. There is no global
   quantity that can express it, so it cannot be published once and read by CSS;
   the loop has to compute a vector per object and write it on that object.

   The two are additive — see `translate` in Stars.module.css. The world seen
   from a slightly different angle, plus the world disturbed in one place.

   That per-object work is bounded on purpose. Positions are measured on resize
   and cached; the frame does arithmetic only. Of the 38 stars, the frame's real
   work is confined to the ones inside a 140px radius, which is typically zero
   and rarely more than two — an axis-aligned reject discards the rest before
   any square root. See THE PUSH FIELD below.

   WHY REFS AND CUSTOM PROPERTIES AND NOT STATE

   A pointer at 120Hz is 120 renders per second, each reconciling a tree whose
   output differs by two decimals on a transform. Every value in here lives in
   a module-level binding and leaves through `style.setProperty`. React is not
   involved in a pointer move and never rerenders because of one.

   WHY IT IDLES

   The loop is not a heartbeat. It runs only while a value is still travelling
   toward its target, or while another system is holding it open. Pointer
   still, page idle: no frames scheduled at all, and `document.hidden` stops
   rAF on its own. A loop that runs forever to publish an unchanged number is
   a battery cost with no output.
   ========================================================================== */

/** The custom properties this module publishes, for consumers writing CSS. */
export const POINTER_VARS = {
  /** Unitless −1…1. Viewport left edge → right edge. */
  x: "--pointer-x",
  /** Unitless −1…1. Viewport top edge → bottom edge. */
  y: "--pointer-y",
  /** The same as `x`, on a ~286ms time constant instead of ~140ms. */
  xSlow: "--pointer-x-slow",
  /** The same as `y`, on a ~286ms time constant instead of ~140ms. */
  ySlow: "--pointer-y-slow",
} as const;

/** The proximity property published on the one pointer-reactive object. */
const PROXIMITY_VAR = "--star-proximity";

/** The per-object local-repulsion offset, in px. Written on stars in range. */
const PUSH_VAR_X = "--star-push-x";
const PUSH_VAR_Y = "--star-push-y";

/* -----------------------------------------------------------------------------
   CALIBRATION
   -----------------------------------------------------------------------------
   Interpolation is exponential smoothing toward the target, framed as a time
   constant rather than a per-frame fraction:

     current += (target - current) * (1 - e^(-λ·dt))

   A raw `current += (target - current) * 0.1` is the usual shortcut and it is
   wrong: its speed is tied to the frame rate, so the same code settles nearly
   twice as fast on a 120Hz display as on a 60Hz one. The exponential form is
   framerate-independent by construction, which matters more here than usual —
   the whole effect is calibrated to be barely perceptible, and "barely" does
   not survive being doubled.

   λ = 7 gives an e-folding time of ~140ms: 63% of the distance in 140ms, 90%
   in ~330ms. That places the perceptible part of the settle inside the
   RESPONSE band (120–300ms) while the tail keeps travelling for another beat,
   which is what makes it read as the world settling rather than as tracking.

   THE SECOND, SLOWER CHANNEL. λ = 3.5 is an e-folding time of ~286ms — the far
   end of the RESPONSE band. It is not a separate signal, only the same target
   approached more gently, and no object follows it outright: the most laggard
   star in the composition blends 55% of it, landing at roughly 220ms. The
   channel exists so that a field of objects does not arrive at its new
   position all on the same beat, which is the other half of what makes a
   parallax layer read as one rigid sheet.
   -------------------------------------------------------------------------- */

const PARALLAX_LAMBDA = 7;
const PARALLAX_LAMBDA_SLOW = 3.5;
const PROXIMITY_LAMBDA = 9;

/* Below this the value is snapped to target and the loop is allowed to stop.
   0.0015 against the largest travel token (--parallax-foreground, 34px) is
   0.05px — a twentieth of a pixel, well under a device pixel on any display
   this will ever run on. */
const PARALLAX_EPSILON = 0.0015;
const PROXIMITY_EPSILON = 0.002;

/* A tab restored after five minutes must not deliver a five-minute dt. Frames
   longer than 50ms are treated as 50ms; the value arrives a beat later rather
   than snapping. */
const MAX_FRAME_SECONDS = 0.05;

/* How close the pointer must come to the reactive object before anything
   happens, in px. Large enough to be crossed by accident while reading, small
   enough that it is not "the page reacts to my mouse". */
const PROXIMITY_RADIUS = 200;

/* -----------------------------------------------------------------------------
   THE PUSH FIELD — local repulsion, and how it is kept from being a toy
   -----------------------------------------------------------------------------
   For each object, per frame:

     d       = |object − cursor|                    (viewport px)
     t       = 1 − d / PUSH_RADIUS                  (0 at the edge, 1 at centre)
     falloff = t²(3 − 2t)                           smoothstep
     push    = amplitude · falloff · (object − cursor) / (d + PUSH_CORE)

   THE RADIUS IS 140px, and it is a scarcity decision more than a physical one.
   A 140px disc is 5% of a 1280×900 viewport, and the field averages six or
   seven stars in view — so on any given frame the expected number of reacting
   objects is under one. Most of the time nothing is happening, and then one
   thing does. Widen this and several stars react at once, which is the moment
   it stops being "did that move?" and becomes a mouse effect.

   THE FALLOFF IS SMOOTHSTEPPED, not linear. Its derivative is zero at the
   boundary, so the reaction cannot be caught starting; a linear ramp has a
   discontinuity in slope at the edge and the eye reads that as a hit-box being
   entered. Same reason as the proximity curve above, and it matters more here,
   because this one MOVES something rather than dimming it.

   `/(d + PUSH_CORE)` IS DOING TWO JOBS. It normalises the direction vector, and
   the `+ PUSH_CORE` makes the displacement fall back to zero as the cursor
   arrives ON the object rather than peaking there. That kills a division by
   zero and a direction that would otherwise flip wildly under the cursor — but
   it is also the honest behaviour: the effect is a star being brushed past, not
   a star being shoved out from under the pointer. The product peaks at 0.697 of
   the amplitude, around 28px away, and decays to nothing in both directions.

   THE AMPLITUDES LIVE IN variance.ts (DEPTH_PUSH, times each object's own
   travel multiplier) and arrive here as `data-push` in px. This module does not
   know what a star is; it moves elements it was handed.

   ASYMMETRIC EASING. λ = 9 (~111ms) going out, λ = 5 (~200ms) coming back. A
   nudge should be prompt and the recovery should be reluctant — matched rates
   read as tracking, and a fast return reads as a snap. Both are inside the
   brief's motion budget: 111ms at the quick end of RESPONSE, 200ms in the
   middle of it, with the tail of the return landing around 460ms, inside
   TRANSITION.
   -------------------------------------------------------------------------- */

const PUSH_RADIUS = 140;
const PUSH_CORE = 8;
const PUSH_LAMBDA_ENGAGE = 9;
const PUSH_LAMBDA_RELEASE = 5;

/* A hundredth of a pixel. Below this the object is snapped to its target and
   stops being a reason for the loop to keep running. */
const PUSH_EPSILON = 0.01;

/* Two decimals, against a largest displacement of ~4.6px. The quantum is
   0.01px — far under a device pixel — and the coarser rounding means the last
   third of a settle mostly does not touch the CSSOM at all. */
const PUSH_PRECISION = 2;

/* Values are published to four decimals. Against a 10px token that is a
   0.001px quantum — invisible — and it means an idling-but-awake loop stops
   touching the CSSOM once the change per frame drops below it. */
const PRECISION = 4;

/* -----------------------------------------------------------------------------
   STATE
   -----------------------------------------------------------------------------
   Module-level because the field is a singleton by design. All of it is
   reset by `teardown`, so a StrictMode mount/unmount/mount cycle leaves no
   residue.
   -------------------------------------------------------------------------- */

/** Whether pointer input is being tracked and published at all. */
let active = false;
/** Whether `mountPointerField` currently owns the listeners. */
let mounted = false;

let frame: number | null = null;
let lastFrameTime = 0;

/* Cached geometry. Measured on resize, never inside a frame. */
let viewportWidth = 1;
let viewportHeight = 1;
let scrollTop = 0;

let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;
/* The same target, approached at PARALLAX_LAMBDA_SLOW. */
let currentXSlow = 0;
let currentYSlow = 0;

let clientX: number | null = null;
let clientY: number | null = null;
/* False once the pointer has left the document. `clientX` is deliberately kept
   — resize still needs the last known position to re-derive the signal — so
   "where the pointer was" and "the pointer is here" have to be two facts. */
let pointerInside = false;

/* -----------------------------------------------------------------------------
   THE PUSH TARGETS
   -----------------------------------------------------------------------------
   One entry per object that opted into local repulsion. Everything mutable
   lives on the entry rather than in parallel arrays: 38 objects is not a number
   where cache layout matters, and one object per element is what makes the
   frame loop readable.

   `docX` / `docY` are DOCUMENT coordinates, measured on resize and whenever the
   page's box changes, and converted to viewport coordinates in the frame using
   the cached `scrollTop`. The composition is document-anchored (see
   composition.ts) and the pointer is viewport-relative, so one of the two has
   to be converted, and it must not be done with a DOM read inside a frame.
   -------------------------------------------------------------------------- */

interface PushTarget {
  element: HTMLElement;
  /** Displacement amplitude in px, before the falloff. From `data-push`. */
  amplitude: number;
  docX: number;
  docY: number;
  /** False when the element has no box — the composition for the other
      breakpoint is `display: none`, and a hidden object must not be pushed. */
  present: boolean;
  currentX: number;
  currentY: number;
  publishedX: string;
  publishedY: string;
}

let pushTargets: PushTarget[] = [];

/* The single pointer-reactive object. */
let reactiveElement: HTMLElement | null = null;
let reactiveVisible = false;
let reactiveCentreX = 0;
let reactiveCentreY = 0;
let targetProximity = 0;
let currentProximity = 0;

/* Last strings written, so an unchanged value costs no CSSOM write. */
let publishedX = "";
let publishedY = "";
let publishedXSlow = "";
let publishedYSlow = "";
let publishedProximity = "";

const frameListeners = new Set<(reading: PointerReading) => void>();
/** Outstanding requests from other systems to keep the loop running. */
let holds = 0;

/* Listener handles, kept so teardown can be exhaustive. */
let finePointerQuery: MediaQueryList | null = null;
let hoverQuery: MediaQueryList | null = null;
let reducedMotionQuery: MediaQueryList | null = null;
let bodyObserver: ResizeObserver | null = null;
let reactiveObserver: IntersectionObserver | null = null;

/* =============================================================================
   PUBLIC API — what Phase 5 and any other system may use
   ========================================================================== */

/**
 * A snapshot of the pointer field.
 *
 * `x` / `y` are the SMOOTHED, published signal — the same numbers CSS is
 * seeing this frame, in the same −1…1 viewport space. `clientX` / `clientY`
 * are the RAW last-known pointer position in CSS px relative to the viewport,
 * exactly as a `PointerEvent` reports them, and are `null` until the pointer
 * has moved at least once.
 */
export interface PointerReading {
  /** Smoothed. −1 at the viewport's left edge, 0 centre, 1 right edge. */
  x: number;
  /** Smoothed. −1 at the viewport's top edge, 0 centre, 1 bottom edge. */
  y: number;
  /** Raw viewport px, or null before the first pointer move. */
  clientX: number | null;
  /** Raw viewport px, or null before the first pointer move. */
  clientY: number | null;
  /**
   * False when the field is deliberately switched off — a coarse pointer, no
   * hover capability, or `prefers-reduced-motion: reduce`. When false, `x` and
   * `y` are 0 and stay 0, and the custom properties are not published at all.
   * Discrete gestures must still work in this state; continuous ones must not.
   */
  active: boolean;
}

/**
 * Read the pointer field right now.
 *
 * Cheap, synchronous, allocates one small object. Safe to call from an event
 * handler. Do NOT call it in a loop of your own — subscribe instead, or read
 * the custom properties from CSS, which is free.
 */
export function readPointer(): PointerReading {
  return {
    x: currentX,
    y: currentY,
    clientX,
    clientY,
    active,
  };
}

/**
 * Receive the pointer field on every frame the shared loop runs.
 *
 * This exists so that nothing else on this page ever calls
 * `requestAnimationFrame`. The listener fires only while the loop is awake —
 * it will NOT be called at a steady 60Hz while the pointer is still, and that
 * is the point. The final frame of a settle is delivered like any other, so
 * the last value a listener sees is always the resting one.
 *
 * The listener runs inside a frame. Do not read layout in it, do not set React
 * state in it, and do not do anything in it that you would not do in a
 * `requestAnimationFrame` callback — because that is exactly what it is.
 *
 * Returns an unsubscribe function. Call it in effect cleanup.
 */
export function subscribePointerFrame(
  listener: (reading: PointerReading) => void,
): () => void {
  frameListeners.add(listener);
  return () => {
    frameListeners.delete(listener);
  };
}

/**
 * Keep the shared loop awake for work of your own — a drag, an inertial
 * settle, anything that needs frames while the pointer is not moving.
 *
 * Pair it with `subscribePointerFrame`: the hold provides the frames, the
 * subscription delivers them.
 *
 *   const release = holdPointerFrames();
 *   … later, when the gesture ends …
 *   release();
 *
 * Releasing is not optional. An unreleased hold is a rAF loop running forever,
 * which is the exact failure this module exists to prevent. Release is
 * idempotent, so calling it twice is safe.
 *
 * Holds work even when the field is inactive (touch, reduced motion) — a drag
 * on a phone still needs frames; it just will not have a parallax signal.
 */
export function holdPointerFrames(): () => void {
  holds += 1;
  wake();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    holds = Math.max(0, holds - 1);
  };
}

/* =============================================================================
   MOUNTING — called once, by the Atmosphere component
   ========================================================================== */

export interface PointerFieldOptions {
  /**
   * The one pointer-reactive object in the composition, if there is one.
   * Its `--star-proximity` is published as 0…1 as the pointer approaches.
   *
   * Exactly one. The interaction hierarchy in the shared brief is a scarcity
   * rule — when everything reacts, nothing feels special — and this parameter
   * is singular rather than a list so that adding a second one is a code
   * change somebody has to argue for.
   */
  reactive?: HTMLElement | null;
  /**
   * Objects that are displaced by LOCAL REPULSION as the pointer passes near
   * them. Each must carry its amplitude in px as `data-push`; anything without
   * a positive one is ignored.
   *
   * Plural, where `reactive` is singular, and the difference is not an
   * inconsistency. `reactive` singles one object out and gives it a behaviour
   * nothing else on the page has. This is a property of the FIELD — every star
   * already moves with the pointer, and being brushed aside by it is the same
   * continuous signal read locally instead of globally. Nothing is being made
   * special, so nothing needs to be scarce.
   */
  pushed?: ArrayLike<HTMLElement> | null;
}

/**
 * Start the pointer field. Returns its teardown.
 *
 * Idempotent-ish by assertion: mounting twice is a bug (two Atmospheres, or a
 * stray caller), and the second call warns in development and does nothing
 * rather than quietly running two loops.
 */
export function mountPointerField(options: PointerFieldOptions = {}): () => void {
  if (typeof window === "undefined") return () => {};

  if (mounted) {
    if (import.meta.env.DEV) {
      console.warn(
        "[atmosphere] The pointer field is already mounted. There must be exactly one <Atmosphere /> on the page.",
      );
    }
    return () => {};
  }

  mounted = true;
  reactiveElement = options.reactive ?? null;
  pushTargets = collectPushTargets(options.pushed);

  measureViewport();
  scrollTop = window.scrollY;

  /* Capability, not screen width and not user-agent.
     `pointer: fine` — the PRIMARY pointer resolves finely enough for a 10px
     effect to mean anything. `hover: hover` — it can rest somewhere without
     committing to a tap. A phone fails both; a laptop with a touchscreen
     passes both while the trackpad is in use, which is correct. */
  finePointerQuery = window.matchMedia("(pointer: fine)");
  hoverQuery = window.matchMedia("(hover: hover)");
  reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  finePointerQuery.addEventListener("change", syncCapability);
  hoverQuery.addEventListener("change", syncCapability);
  reducedMotionQuery.addEventListener("change", syncCapability);

  window.addEventListener("resize", handleResize, { passive: true });

  /* Both the proximity value and every push vector are computed from a
     DOCUMENT-anchored position against a VIEWPORT-relative pointer, so both
     need the scroll offset — read here, in the event, and cached. Neither
     listener is attached if the composition asked for neither behaviour. */
  if (reactiveElement !== null || pushTargets.length > 0) {
    observeGeometry();
    window.addEventListener("scroll", handleScroll, { passive: true });
  }

  syncCapability();

  return teardown;
}

function teardown(): void {
  mounted = false;

  deactivate();

  finePointerQuery?.removeEventListener("change", syncCapability);
  hoverQuery?.removeEventListener("change", syncCapability);
  reducedMotionQuery?.removeEventListener("change", syncCapability);
  finePointerQuery = null;
  hoverQuery = null;
  reducedMotionQuery = null;

  window.removeEventListener("resize", handleResize);
  window.removeEventListener("scroll", handleScroll);

  bodyObserver?.disconnect();
  bodyObserver = null;
  reactiveObserver?.disconnect();
  reactiveObserver = null;

  reactiveElement = null;
  reactiveVisible = false;
  pushTargets = [];

  /* Holds and subscriptions belong to their owners, not to this mount, and
     their own cleanups remove them. Cancelling the frame here is safe: the
     next hold or the next mount wakes the loop again. */
  if (frame !== null) {
    cancelAnimationFrame(frame);
    frame = null;
  }
}

/* =============================================================================
   CAPABILITY
   ========================================================================== */

function syncCapability(): void {
  const capable =
    mounted &&
    (finePointerQuery?.matches ?? false) &&
    (hoverQuery?.matches ?? false) &&
    !(reducedMotionQuery?.matches ?? false);

  if (capable === active) return;
  if (capable) activate();
  else deactivate();
}

function activate(): void {
  active = true;
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  document.addEventListener("pointerleave", handlePointerLeave);
}

/**
 * Switch the field off and return the world to rest.
 *
 * The custom properties are REMOVED rather than set to 0. The declarations
 * that read them carry `var(--pointer-x, 0)`, so removal restores the exact
 * inert state the page had before this module existed — which is also what
 * the reduced-motion path needs, since the travel tokens are already 0px
 * there and a leftover published value would be multiplied by nothing anyway.
 */
function deactivate(): void {
  if (active) {
    window.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerleave", handlePointerLeave);
  }
  active = false;

  targetX = 0;
  targetY = 0;
  currentX = 0;
  currentY = 0;
  currentXSlow = 0;
  currentYSlow = 0;
  targetProximity = 0;
  currentProximity = 0;
  clientX = null;
  clientY = null;
  pointerInside = false;

  const root = document.documentElement;
  root.style.removeProperty(POINTER_VARS.x);
  root.style.removeProperty(POINTER_VARS.y);
  root.style.removeProperty(POINTER_VARS.xSlow);
  root.style.removeProperty(POINTER_VARS.ySlow);
  reactiveElement?.style.removeProperty(PROXIMITY_VAR);
  publishedX = "";
  publishedY = "";
  publishedXSlow = "";
  publishedYSlow = "";
  publishedProximity = "";

  /* Same reasoning for the push offsets, and one addition: this is the path
     taken when reduced motion is switched ON while a star is mid-displacement.
     It returns instantly rather than easing, which is correct — the setting
     says do not animate, and easing back would be one last animation. */
  for (const target of pushTargets) {
    target.currentX = 0;
    target.currentY = 0;
    target.publishedX = "";
    target.publishedY = "";
    target.element.style.removeProperty(PUSH_VAR_X);
    target.element.style.removeProperty(PUSH_VAR_Y);
  }
}

/* =============================================================================
   INPUT
   ========================================================================== */

function handlePointerMove(event: PointerEvent): void {
  /* A hybrid device passes the capability test on its trackpad and then also
     delivers pointermove for finger taps. Touch is not a hover signal. */
  if (event.pointerType === "touch") return;

  clientX = event.clientX;
  clientY = event.clientY;
  pointerInside = true;

  targetX = clamp((event.clientX / viewportWidth) * 2 - 1, -1, 1);
  targetY = clamp((event.clientY / viewportHeight) * 2 - 1, -1, 1);

  updateProximityTarget();
  wake();
}

/**
 * The pointer left the document entirely. The world settles back to centre
 * rather than freezing wherever the cursor happened to exit, which would leave
 * the composition permanently 10px off its authored position.
 *
 * `pointerInside` rather than clearing `clientX`, because the last known
 * position is still needed if the window is resized while the pointer is
 * outside it. Everything distance-based reads the flag; every displaced star
 * eases back to zero on the release rate.
 */
function handlePointerLeave(event: PointerEvent): void {
  if (event.pointerType === "touch") return;
  pointerInside = false;
  targetX = 0;
  targetY = 0;
  targetProximity = 0;
  wake();
}

/**
 * Scroll moves document-anchored objects under a stationary pointer, so both
 * the proximity value and every push vector have to be recomputed — but the
 * pointer SIGNAL is viewport-relative and does not change, so nothing here
 * touches parallax. The page does not move as it scrolls, by design.
 *
 * `scrollY` is read HERE, in the event, and cached. The frame loop then works
 * entirely from cached numbers; it never reads layout. That is the only reason
 * a document-anchored composition can be reconciled with a viewport-relative
 * pointer at 120Hz without touching the DOM.
 *
 * The push targets are not recomputed here — the frame recomputes them from
 * `scrollTop` anyway, and doing it twice during a momentum scroll would be
 * pure waste. Waking is enough.
 */
function handleScroll(): void {
  scrollTop = window.scrollY;
  if (pushTargets.length === 0 && !reactiveVisible) return;
  if (reactiveVisible) updateProximityTarget();
  wakeIfTracking();
}

/* =============================================================================
   GEOMETRY — measured on resize, cached, never read inside a frame
   ========================================================================== */

function measureViewport(): void {
  viewportWidth = window.innerWidth || 1;
  viewportHeight = window.innerHeight || 1;
}

function handleResize(): void {
  measureViewport();
  scrollTop = window.scrollY;
  measureReactive();
  measurePushTargets();

  /* The pointer has not moved but the viewport it is measured against has, so
     the same pixel is now a different signal. Recompute from the last known
     raw position rather than waiting for the next move. */
  if (clientX !== null && clientY !== null) {
    targetX = clamp((clientX / viewportWidth) * 2 - 1, -1, 1);
    targetY = clamp((clientY / viewportHeight) * 2 - 1, -1, 1);
  }
  updateProximityTarget();
  wakeIfTracking();
}

/**
 * Cache the reactive object's position in DOCUMENT coordinates.
 *
 * It happens on mount, on resize and whenever the body's box changes — fonts
 * arriving, an image loading, the page reflowing — and never during a frame.
 */
function measureReactive(): void {
  if (reactiveElement === null) return;
  const rect = reactiveElement.getBoundingClientRect();
  reactiveCentreX = rect.left + window.scrollX + rect.width / 2;
  reactiveCentreY = rect.top + window.scrollY + rect.height / 2;
}

/**
 * Read each pushed object's amplitude once, at mount.
 *
 * Anything without a positive `data-push` is dropped rather than defaulted:
 * a missing amplitude means the element was never meant to be in this list,
 * and silently giving it one would be inventing motion.
 */
function collectPushTargets(source: ArrayLike<HTMLElement> | null | undefined): PushTarget[] {
  if (source == null) return [];

  const targets: PushTarget[] = [];
  for (let index = 0; index < source.length; index += 1) {
    const element = source[index];
    if (element === undefined) continue;

    const amplitude = Number.parseFloat(element.dataset.push ?? "");
    if (!Number.isFinite(amplitude) || amplitude <= 0) continue;

    targets.push({
      element,
      amplitude,
      docX: 0,
      docY: 0,
      present: false,
      currentX: 0,
      currentY: 0,
      publishedX: "",
      publishedY: "",
    });
  }
  return targets;
}

/**
 * Cache every pushed object's centre in DOCUMENT coordinates.
 *
 * THIS IS THE WHOLE REASON THE FRAME LOOP CAN BE CHEAP. Thirty-eight
 * `getBoundingClientRect` calls are around a fifth of a millisecond in one
 * batch, which would be catastrophic at 120Hz and is nothing at all on the
 * handful of occasions the page's box actually changes. Reads only — no writes
 * follow in the same callback, so this cannot start a layout thrash.
 *
 * Objects belonging to the other breakpoint's composition are `display: none`
 * and report a zero box; they are marked absent rather than dropped, because
 * the breakpoint can change under a resize and the list must survive it.
 */
function measurePushTargets(): void {
  if (pushTargets.length === 0) return;

  const offsetX = window.scrollX;
  const offsetY = window.scrollY;

  for (const target of pushTargets) {
    const rect = target.element.getBoundingClientRect();
    target.present = rect.width > 0 && rect.height > 0;
    target.docX = rect.left + offsetX + rect.width / 2;
    target.docY = rect.top + offsetY + rect.height / 2;
  }
}

function observeGeometry(): void {
  measureReactive();
  measurePushTargets();

  if (typeof ResizeObserver !== "undefined") {
    /* Stars are positioned as a percentage of a document-tall layer, so they
       move whenever the document's height changes — which happens after the
       fonts load, not on any event `resize` fires for. One observer for the
       whole field; there is nothing per-object about the reason it fires. */
    bodyObserver = new ResizeObserver(() => {
      measureReactive();
      measurePushTargets();
      updateProximityTarget();
      wakeIfTracking();
    });
    bodyObserver.observe(document.body);
  }

  if (reactiveElement === null) return;

  if (typeof IntersectionObserver === "undefined") {
    reactiveVisible = true;
    return;
  }

  /* Off-screen, the proximity maths is skipped entirely and the value is
     pinned to 0. This also covers the case where the reactive star belongs to
     the wide composition and is `display: none` on a narrow page: a hidden
     element never intersects.

     THE PUSH TARGETS GET NO SUCH OBSERVER, deliberately. Their off-screen cull
     is the axis-aligned reject in `stepPush` — four comparisons against a
     cached number, which is cheaper per object than an IntersectionObserver
     entry is to maintain, exact rather than margin-based, and correct on the
     frame the page scrolls rather than on the next observer flush. An observer
     here would be more machinery for a worse answer. */
  reactiveObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry === undefined) return;
      reactiveVisible = entry.isIntersecting;
      if (reactiveVisible) measureReactive();
      updateProximityTarget();
      wakeIfTracking();
    },
    { rootMargin: `${PROXIMITY_RADIUS}px` },
  );
  reactiveObserver.observe(reactiveElement);
}

/**
 * Distance from the pointer to the reactive object, as 0…1.
 *
 * Smoothstepped rather than linear so the influence has no edge: the
 * derivative is zero at the boundary, which means the reaction cannot be
 * caught starting. A linear ramp reads as a hit-box.
 */
function updateProximityTarget(): void {
  if (
    reactiveElement === null ||
    !reactiveVisible ||
    !pointerInside ||
    clientX === null ||
    clientY === null
  ) {
    targetProximity = 0;
    return;
  }

  /* Document coordinates → viewport coordinates. The page has no horizontal
     scroll (the atmosphere root is `overflow: clip` precisely so nothing can
     create one), so only the vertical axis needs converting. */
  const offsetX = clientX - reactiveCentreX;
  const offsetY = clientY - (reactiveCentreY - scrollTop);
  const distance = Math.hypot(offsetX, offsetY);

  const t = clamp(1 - distance / PROXIMITY_RADIUS, 0, 1);
  targetProximity = t * t * (3 - 2 * t);
}

/* =============================================================================
   THE LOOP
   ========================================================================== */

function wake(): void {
  if (frame !== null) return;
  lastFrameTime = performance.now();
  frame = requestAnimationFrame(step);
}

/**
 * Wake only if there is a pointer to track.
 *
 * Resize, scroll and both observers can fire long before the visitor has moved
 * a mouse — the observers in particular fire once on connection, during load.
 * Without this guard the loop would run a frame and publish `0` on a page
 * nobody has touched yet, which is both a wasted CSSOM write and a lie: an
 * unset property and a published 0 look identical on screen, but only one of
 * them is honest about the fact that nothing has happened.
 */
function wakeIfTracking(): void {
  if (!active || clientX === null) return;
  wake();
}

function step(now: number): void {
  frame = null;

  const dt = clamp((now - lastFrameTime) / 1000, 0, MAX_FRAME_SECONDS);
  lastFrameTime = now;

  let settled = true;

  /* `active` is the capability gate; `clientX !== null` is "the pointer has
     been somewhere at least once". Until both hold, the signal stays unpublished
     and the loop has nothing to do — it may still be running for a hold. */
  if (active && clientX !== null) {
    const parallaxT = 1 - Math.exp(-PARALLAX_LAMBDA * dt);
    const parallaxSlowT = 1 - Math.exp(-PARALLAX_LAMBDA_SLOW * dt);
    const proximityT = 1 - Math.exp(-PROXIMITY_LAMBDA * dt);

    currentX = lerp(currentX, targetX, parallaxT);
    currentY = lerp(currentY, targetY, parallaxT);
    currentXSlow = lerp(currentXSlow, targetX, parallaxSlowT);
    currentYSlow = lerp(currentYSlow, targetY, parallaxSlowT);
    currentProximity = lerp(currentProximity, targetProximity, proximityT);

    if (Math.abs(targetX - currentX) < PARALLAX_EPSILON) currentX = targetX;
    else settled = false;

    if (Math.abs(targetY - currentY) < PARALLAX_EPSILON) currentY = targetY;
    else settled = false;

    /* The slow channel is what actually decides when the loop may stop: it is
       always the last thing still travelling. Omitting it here would freeze the
       laggard stars part-way through their settle, which is a worse artefact
       than the rigidity this whole mechanism exists to fix. */
    if (Math.abs(targetX - currentXSlow) < PARALLAX_EPSILON) currentXSlow = targetX;
    else settled = false;

    if (Math.abs(targetY - currentYSlow) < PARALLAX_EPSILON) currentYSlow = targetY;
    else settled = false;

    if (Math.abs(targetProximity - currentProximity) < PROXIMITY_EPSILON) {
      currentProximity = targetProximity;
    } else {
      settled = false;
    }

    publish();
  }

  /* Outside the `active` gate on purpose: a star still easing back has to be
     allowed to finish even on the frames where the shared signal has nothing
     to say. The function is inert — and cheap — when nothing is displaced. */
  if (pushTargets.length > 0 && !stepPush(dt)) settled = false;

  if (frameListeners.size > 0) {
    const reading = readPointer();
    for (const listener of frameListeners) listener(reading);
  }

  /* The whole point: when nothing is travelling and nobody is holding the
     loop open, no frame is scheduled and this function is not called again
     until the next input. */
  if (!settled || holds > 0) {
    frame = requestAnimationFrame(step);
  }
}

function publish(): void {
  const root = document.documentElement;

  const nextX = currentX.toFixed(PRECISION);
  if (nextX !== publishedX) {
    publishedX = nextX;
    root.style.setProperty(POINTER_VARS.x, nextX);
  }

  const nextY = currentY.toFixed(PRECISION);
  if (nextY !== publishedY) {
    publishedY = nextY;
    root.style.setProperty(POINTER_VARS.y, nextY);
  }

  const nextXSlow = currentXSlow.toFixed(PRECISION);
  if (nextXSlow !== publishedXSlow) {
    publishedXSlow = nextXSlow;
    root.style.setProperty(POINTER_VARS.xSlow, nextXSlow);
  }

  const nextYSlow = currentYSlow.toFixed(PRECISION);
  if (nextYSlow !== publishedYSlow) {
    publishedYSlow = nextYSlow;
    root.style.setProperty(POINTER_VARS.ySlow, nextYSlow);
  }

  if (reactiveElement === null) return;

  const nextProximity = currentProximity.toFixed(PRECISION);
  if (nextProximity !== publishedProximity) {
    publishedProximity = nextProximity;
    reactiveElement.style.setProperty(PROXIMITY_VAR, nextProximity);
  }
}

/* =============================================================================
   LOCAL REPULSION — the per-object half of the frame
   =============================================================================
   Returns true when every object is at rest, which is what lets the loop stop.

   The shape of this function is the performance story, and it is all about not
   doing things:

     1. A target that is at rest AND out of range is `continue`d before anything
        is interpolated, published or allocated. On a normal frame that is every
        object in the composition.
     2. Range is tested with four comparisons on each axis before any square
        root. Every star outside the viewport fails on `dy` immediately, so the
        length of the page costs nothing.
     3. A displaced object writes two properties, and only when the ROUNDED
        value has actually changed — so the tail of a settle stops touching the
        CSSOM before it stops moving.

   MEASURED on the real page, 38 targets, headless Chrome, 400-iteration blocks,
   each including a forced style recalculation:

     forced style flush, nothing dirty            0.001ms   (the noise floor)
     the whole 38-target scan, none in range      0.00026ms (260 nanoseconds)
     write + recalc, 1 object displaced           0.045ms
     write + recalc, 3 objects displaced          0.126ms
     write + recalc, all 31 visible displaced     1.31ms

   The last row cannot happen. The densest neighbourhood anywhere in this
   composition holds THREE stars within 140px, so 0.13ms — under one percent of
   a 60fps frame — is the worst case the page can actually produce, and the
   ordinary case is the scan alone at a quarter of a microsecond.

   Read those rows together and the conclusion is that the arithmetic is free
   and the CSSOM write is not. That is why the effort here goes into not writing
   — the `continue`, the rounding, the radius — and none of it goes into making
   the maths faster.
   ========================================================================== */

function stepPush(dt: number): boolean {
  const engageT = 1 - Math.exp(-PUSH_LAMBDA_ENGAGE * dt);
  const releaseT = 1 - Math.exp(-PUSH_LAMBDA_RELEASE * dt);

  /* One capability gate for the whole field. Under reduced motion or on a
     coarse pointer this is false, every target resolves to zero, and — since
     `deactivate` has already cleared them — every one of them takes the
     `continue` on the next line and nothing is ever written. */
  const engaged = active && pointerInside && clientX !== null && clientY !== null;
  const pointerX = clientX ?? 0;
  const pointerY = clientY ?? 0;

  let settled = true;

  for (const target of pushTargets) {
    let toX = 0;
    let toY = 0;

    if (engaged && target.present) {
      /* Document → viewport. Only the vertical axis needs converting: the page
         has no horizontal scroll, by construction (the atmosphere root is
         `overflow: clip` so that nothing can create one). */
      const dx = target.docX - pointerX;
      const dy = target.docY - scrollTop - pointerY;

      if (
        dx > -PUSH_RADIUS &&
        dx < PUSH_RADIUS &&
        dy > -PUSH_RADIUS &&
        dy < PUSH_RADIUS
      ) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < PUSH_RADIUS) {
          const t = 1 - distance / PUSH_RADIUS;
          const falloff = t * t * (3 - 2 * t);
          /* Direction and magnitude in one division. See THE PUSH FIELD. */
          const scale = (target.amplitude * falloff) / (distance + PUSH_CORE);
          toX = dx * scale;
          toY = dy * scale;
        }
      }
    }

    if (toX === 0 && toY === 0 && target.currentX === 0 && target.currentY === 0) {
      continue;
    }

    /* Prompt going out, reluctant coming back. Compared as a Manhattan
       magnitude rather than a Euclidean one — this only decides which of two
       rates to use, and a square root to choose a constant would be silly. */
    const leaving =
      Math.abs(toX) + Math.abs(toY) >
      Math.abs(target.currentX) + Math.abs(target.currentY);
    const rate = leaving ? engageT : releaseT;

    target.currentX = lerp(target.currentX, toX, rate);
    target.currentY = lerp(target.currentY, toY, rate);

    if (Math.abs(toX - target.currentX) < PUSH_EPSILON) target.currentX = toX;
    else settled = false;

    if (Math.abs(toY - target.currentY) < PUSH_EPSILON) target.currentY = toY;
    else settled = false;

    const nextX = target.currentX.toFixed(PUSH_PRECISION);
    if (nextX !== target.publishedX) {
      target.publishedX = nextX;
      target.element.style.setProperty(PUSH_VAR_X, `${nextX}px`);
    }

    const nextY = target.currentY.toFixed(PUSH_PRECISION);
    if (nextY !== target.publishedY) {
      target.publishedY = nextY;
      target.element.style.setProperty(PUSH_VAR_Y, `${nextY}px`);
    }
  }

  return settled;
}

/* -----------------------------------------------------------------------------
   TEST SEAM
   -----------------------------------------------------------------------------
   Development only. Exposed so the loop's idling can be OBSERVED rather than
   asserted — "the loop stops" is the one claim in this file that cannot be
   verified by reading it.
   -------------------------------------------------------------------------- */

/** True while a frame is scheduled. Development diagnostics only. */
export function isPointerLoopRunning(): boolean {
  return frame !== null;
}
