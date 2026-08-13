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
   0.0015 against the largest travel token (--parallax-foreground, 10px) is
   0.015px — a hundredth of a pixel, well under a device pixel on any display
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

  measureViewport();
  scrollTop = window.scrollY;

  /* Capability, not screen width and not user-agent.
     `pointer: fine` — the PRIMARY pointer resolves finely enough for a 6px
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

  if (reactiveElement !== null) {
    observeReactive(reactiveElement);
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

  targetX = clamp((event.clientX / viewportWidth) * 2 - 1, -1, 1);
  targetY = clamp((event.clientY / viewportHeight) * 2 - 1, -1, 1);

  updateProximityTarget();
  wake();
}

/**
 * The pointer left the document entirely. The world settles back to centre
 * rather than freezing wherever the cursor happened to exit, which would leave
 * the composition permanently 6px off its authored position.
 */
function handlePointerLeave(event: PointerEvent): void {
  if (event.pointerType === "touch") return;
  targetX = 0;
  targetY = 0;
  targetProximity = 0;
  wake();
}

/**
 * Scroll moves the reactive object under a stationary pointer, so proximity
 * has to be recomputed — but the pointer SIGNAL is viewport-relative and does
 * not change, so nothing here touches parallax. The page does not move as it
 * scrolls, by design.
 *
 * The listener is only attached when the composition actually declares a
 * reactive object, and `scrollY` is read here in the event rather than in the
 * frame so that the loop stays free of DOM reads.
 */
function handleScroll(): void {
  scrollTop = window.scrollY;
  if (!reactiveVisible) return;
  updateProximityTarget();
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
 * This is the only element measurement in the pointer system. It happens on
 * mount, on resize and whenever the body's box changes — fonts arriving, an
 * image loading, the page reflowing — and never during a frame.
 */
function measureReactive(): void {
  if (reactiveElement === null) return;
  const rect = reactiveElement.getBoundingClientRect();
  reactiveCentreX = rect.left + window.scrollX + rect.width / 2;
  reactiveCentreY = rect.top + window.scrollY + rect.height / 2;
}

function observeReactive(element: HTMLElement): void {
  measureReactive();

  if (typeof ResizeObserver !== "undefined") {
    /* The star is positioned as a percentage of a document-tall layer, so it
       moves whenever the document's height changes — which happens after the
       fonts load, not on any event `resize` fires for. */
    bodyObserver = new ResizeObserver(() => {
      measureReactive();
      updateProximityTarget();
      wakeIfTracking();
    });
    bodyObserver.observe(document.body);
  }

  if (typeof IntersectionObserver === "undefined") {
    reactiveVisible = true;
    return;
  }

  /* Off-screen, the proximity maths is skipped entirely and the value is
     pinned to 0. This also covers the case where the reactive star belongs to
     the wide composition and is `display: none` on a narrow page: a hidden
     element never intersects. */
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
  reactiveObserver.observe(element);
}

/**
 * Distance from the pointer to the reactive object, as 0…1.
 *
 * Smoothstepped rather than linear so the influence has no edge: the
 * derivative is zero at the boundary, which means the reaction cannot be
 * caught starting. A linear ramp reads as a hit-box.
 */
function updateProximityTarget(): void {
  if (reactiveElement === null || !reactiveVisible || clientX === null || clientY === null) {
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
