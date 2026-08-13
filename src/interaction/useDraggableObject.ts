import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { holdPointerFrames, subscribePointerFrame } from "../atmosphere";
import { clamp, lerp } from "../lib/math";
import type { Offset } from "./positions";

/* =============================================================================
   DRAGGING — one object, Pointer Events, and NO SECOND rAF LOOP
   =============================================================================

   Pointer Events, so a mouse, a finger and a stylus are one code path with no
   branching and no touch fallback. Pointer capture, so the gesture survives the
   pointer leaving the object — which it will, because the object lags behind
   the pointer on purpose.

   ── The frames are borrowed ─────────────────────────────────────────────────

   The page has exactly one `requestAnimationFrame` loop and it belongs to the
   atmosphere. This module never calls rAF. It asks for the shared loop to stay
   awake with `holdPointerFrames()` and receives its frames through
   `subscribePointerFrame()`, then releases both the moment the object stops
   moving. A drag that ends leaves nothing running.

   ── Resistance, and how little of it there is ───────────────────────────────

   The object does not track the pointer. It travels toward it by an exponential
   approach — `drawn += (target − drawn) · (1 − e^(−λ·dt))` — at λ = 16, an
   e-folding time of 62ms. Framerate-independent by construction, for the reason
   spelled out in `atmosphere/pointer.ts`: the naive per-frame fraction settles
   twice as fast on a 120Hz display, and "barely perceptible" does not survive
   being doubled.

   62ms is roughly a third of the RESPONSE band's midpoint. It is enough that
   the paper feels like it has a little weight and a little friction against the
   page, and not enough to feel laggy. On release the same approach keeps
   running with the target now fixed, so the object glides the last few pixels
   and stops. That is the entire "settle" — there is no spring, no overshoot, no
   bounce and no second easing curve. The brief forbids exaggerated spring
   physics, and the honest way to obey that is to not write a spring.

   ── Bounds ─────────────────────────────────────────────────────────────────

   The object cannot be dragged out of the viewport. The limits are computed
   ONCE per gesture, from one `getBoundingClientRect` in the pointerdown
   handler, and never inside a frame.

   Separately, a remembered offset is re-checked against the PAGE — not the
   viewport — on mount, on resize, and whenever the layer's box changes. A
   window that becomes too narrow for where the paper was left pulls it back
   into view rather than hiding it behind `overflow: clip`, and a window that
   becomes large again lets it return. See `desired` and `reclaim` below: a
   clamp is never mistaken for something the visitor wanted.

   ── What this hook deliberately does not do ────────────────────────────────

   No inertia or fling: thrown objects are a toy, and this is a piece of paper
   on a desk. No drop targets, no snapping, no collision, no rotation from
   velocity, no drag preview, no ghost. No React state anywhere in the gesture —
   position leaves through two custom properties on the element.
   ========================================================================== */

/** Position, in px, published for CSS to add to the authored anchor. */
const OFFSET_X_PROPERTY = "--object-dx";
const OFFSET_Y_PROPERTY = "--object-dy";

/** Exponential approach rate. Higher is stiffer. λ=16 → ~62ms e-folding. */
const SMOOTHING_LAMBDA = 16;

/** Under this distance from its target, the object is placed and the loop may
 *  stop. A twentieth of a pixel is invisible on any display. */
const SETTLE_EPSILON = 0.05;

/** A tab restored after ten minutes must not deliver a ten-minute frame. */
const MAX_FRAME_SECONDS = 0.05;

/** How much of the object must stay inside the viewport: all of it, less a
 *  hair, so it can be tucked against an edge but never lost behind one. */
const EDGE_MARGIN = 8;

/** Pointer travel, in px, before a press becomes a drag. Small enough not to
 *  feel like slack; large enough that a hand shaking during a press-and-hold
 *  does not cancel the hold. */
const DRAG_THRESHOLD = 6;

export interface DraggableOptions {
  /** Displacement from the authored anchor at mount — usually from storage. */
  readonly initial: Offset;
  /**
   * Live, not a one-shot read. When true the object arrives at the pointer
   * instantly: dragging still works, it simply does not glide.
   */
  readonly reducedMotion: boolean;
  /** The press has become a drag. Fires once per gesture, after the threshold
   *  is crossed — the hold interaction uses this to abort itself. */
  readonly onDragStart?: () => void;
  /** The pointer is up. The object may still be settling. */
  readonly onDragEnd?: () => void;
  /** The object has stopped moving at a new position. Persist here. */
  readonly onCommit?: (offset: Offset) => void;
}

export interface Draggable {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  /** Move the object by a fixed step. The keyboard's whole drag vocabulary. */
  nudge: (stepX: number, stepY: number) => void;
}

export function useDraggableObject(
  ref: RefObject<HTMLElement | null>,
  options: DraggableOptions,
): Draggable {
  /* Options are read through a ref so the handlers below can be plain
     functions that close over nothing stale. `reducedMotion` in particular
     changes while the page is open. */
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });

  const state = useRef({
    /**
     * Where the visitor put it. The source of truth, and NOT the same thing as
     * `target`: if the object has been pushed back into view because the window
     * became small, this still remembers where it is supposed to be, and it
     * goes back there when there is room again. Only a drag or a nudge changes
     * it — never a clamp.
     */
    desired: { x: options.initial.x, y: options.initial.y },
    /** Where the object is asked to be, which is `desired` made legal. */
    target: { x: options.initial.x, y: options.initial.y },
    /** Where it is actually drawn, chasing `target`. */
    drawn: { x: options.initial.x, y: options.initial.y },
    /** The last value handed to `onCommit`. */
    committed: { x: options.initial.x, y: options.initial.y },

    pointerId: null as number | null,
    dragging: false,
    /** Pointer position and object offset at the moment of pointerdown. */
    originX: 0,
    originY: 0,
    baseX: 0,
    baseY: 0,
    /** Allowed pointer travel, relative to `base`, from this gesture's limits. */
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,

    lastFrameTime: 0,
    releaseFrames: null as null | (() => void),
    unsubscribe: null as null | (() => void),
  });

  /* Every function below touches only refs, so none of them can go stale and
     none of them needs to be memoised. */

  const apply = (): void => {
    const node = ref.current;
    if (node === null) return;
    const { drawn } = state.current;
    node.style.setProperty(OFFSET_X_PROPERTY, `${drawn.x.toFixed(2)}px`);
    node.style.setProperty(OFFSET_Y_PROPERTY, `${drawn.y.toFixed(2)}px`);
  };

  const commit = (): void => {
    const s = state.current;
    if (s.desired.x === s.committed.x && s.desired.y === s.committed.y) return;
    s.committed = { x: s.desired.x, y: s.desired.y };
    latest.current.onCommit?.(s.committed);
  };

  const stopFrames = (): void => {
    const s = state.current;
    s.unsubscribe?.();
    s.unsubscribe = null;
    /* Releasing is not optional: an unreleased hold is a rAF loop running for
       the rest of the session. */
    s.releaseFrames?.();
    s.releaseFrames = null;
  };

  const frame = (): void => {
    const s = state.current;

    const now = performance.now();
    const dt = clamp((now - s.lastFrameTime) / 1000, 0, MAX_FRAME_SECONDS);
    s.lastFrameTime = now;

    const t = 1 - Math.exp(-SMOOTHING_LAMBDA * dt);
    s.drawn.x = lerp(s.drawn.x, s.target.x, t);
    s.drawn.y = lerp(s.drawn.y, s.target.y, t);

    let settled = true;
    if (Math.abs(s.target.x - s.drawn.x) < SETTLE_EPSILON) s.drawn.x = s.target.x;
    else settled = false;
    if (Math.abs(s.target.y - s.drawn.y) < SETTLE_EPSILON) s.drawn.y = s.target.y;
    else settled = false;

    apply();

    /* Still under the pointer? Keep the loop awake even while settled: the next
       move is one frame away. Otherwise this was the last frame of the settle,
       which is the moment the position is worth remembering. */
    if (settled && !s.dragging) {
      stopFrames();
      commit();
    }
  };

  const startFrames = (): void => {
    const s = state.current;
    if (s.unsubscribe !== null) return;
    s.lastFrameTime = performance.now();
    s.releaseFrames = holdPointerFrames();
    s.unsubscribe = subscribePointerFrame(frame);
  };

  /** Move the object because the visitor moved it. Both positions change. */
  const setTarget = (x: number, y: number): void => {
    const s = state.current;
    s.desired.x = x;
    s.desired.y = y;
    s.target.x = x;
    s.target.y = y;

    if (latest.current.reducedMotion) {
      s.drawn.x = x;
      s.drawn.y = y;
      apply();
      if (!s.dragging) commit();
      return;
    }

    startFrames();
  };

  /**
   * How far the object may travel from where it is heading before part of it
   * ends up somewhere it cannot be seen. One layout read, in an event handler,
   * never in a frame.
   *
   * The rect describes `drawn`, which during a settle is not `target`, so the
   * difference is added back — otherwise a gesture begun mid-glide would be
   * measured against a position the object is already leaving.
   *
   * TWO SCOPES, and the difference matters more than it looks.
   *
   *   "gesture"  the visitor is moving it. The pointer is on screen, so the
   *              object should not be pushed off screen — but the range is
   *              always widened to include zero, so a gesture can only ever
   *              improve the position, never be forced to correct it. Without
   *              that, an object anchored below the fold — which is normal,
   *              since these are anchored to the PAGE and not to the screen —
   *              would jump into view the instant it was touched.
   *
   *   "page"     an unattended correction. The object may be anywhere in the
   *              document; what it must not be is outside it, or off the side
   *              of a viewport that has since become narrow. Clamping this one
   *              to the viewport would drag every object up to the fold at
   *              mount and call it keeping them visible.
   */
  const measureLimits = (node: HTMLElement, scope: "gesture" | "page"): void => {
    const s = state.current;
    const rect = node.getBoundingClientRect();
    const left = rect.left + (s.target.x - s.drawn.x);
    const top = rect.top + (s.target.y - s.drawn.y);

    /* Horizontally the two scopes agree: the layer is exactly as wide as the
       viewport and clips, so off-screen is off-screen either way. */
    let minX = EDGE_MARGIN - left;
    let maxX = window.innerWidth - EDGE_MARGIN - (left + rect.width);
    let minY: number;
    let maxY: number;

    if (scope === "gesture") {
      minY = EDGE_MARGIN - top;
      maxY = window.innerHeight - EDGE_MARGIN - (top + rect.height);
      minX = Math.min(minX, 0);
      maxX = Math.max(maxX, 0);
      minY = Math.min(minY, 0);
      maxY = Math.max(maxY, 0);
    } else {
      const pageTop = top + window.scrollY;
      const box = node.offsetParent;
      const pageHeight =
        box instanceof Element
          ? box.getBoundingClientRect().height
          : document.documentElement.scrollHeight;
      minY = EDGE_MARGIN - pageTop;
      maxY = pageHeight - EDGE_MARGIN - (pageTop + rect.height);
    }

    /* An object larger than its bounds has no valid range at all. Pinning it is
       better than letting an inverted clamp fling it to one edge. */
    s.minX = minX > maxX ? 0 : minX;
    s.maxX = minX > maxX ? 0 : maxX;
    s.minY = minY > maxY ? 0 : minY;
    s.maxY = minY > maxY ? 0 : maxY;
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>): void => {
    const node = ref.current;
    const s = state.current;
    if (node === null || s.pointerId !== null) return;
    /* Right- and middle-click are not gestures. Touch and pen report button 0. */
    if (event.button !== 0) return;

    s.pointerId = event.pointerId;
    s.dragging = false;
    s.originX = event.clientX;
    s.originY = event.clientY;
    s.baseX = s.target.x;
    s.baseY = s.target.y;
    measureLimits(node, "gesture");

    /* Capture keeps the gesture attached to this element once the object falls
       behind the pointer. It can throw if the pointer is already gone — a
       gesture cancelled between the event and this line — and losing capture is
       not a reason to lose the drag. */
    try {
      node.setPointerCapture(event.pointerId);
    } catch {
      /* the drag continues without capture */
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>): void => {
    const s = state.current;
    if (s.pointerId !== event.pointerId) return;

    const dx = event.clientX - s.originX;
    const dy = event.clientY - s.originY;

    if (!s.dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      s.dragging = true;
      latest.current.onDragStart?.();
    }

    setTarget(
      s.baseX + clamp(dx, s.minX, s.maxX),
      s.baseY + clamp(dy, s.minY, s.maxY),
    );
  };

  /** Also the pointercancel handler: a cancelled gesture ends where it is. */
  const onPointerUp = (event: ReactPointerEvent<HTMLElement>): void => {
    const node = ref.current;
    const s = state.current;
    if (s.pointerId !== event.pointerId) return;

    s.pointerId = null;
    try {
      if (node?.hasPointerCapture(event.pointerId) === true) {
        node.releasePointerCapture(event.pointerId);
      }
    } catch {
      /* already released, or the pointer is gone */
    }

    if (!s.dragging) return; // a press, not a drag — nothing moved
    s.dragging = false;
    latest.current.onDragEnd?.();

    if (latest.current.reducedMotion) {
      commit();
      stopFrames();
      return;
    }
    /* Let it glide to a stop. The final frame commits. */
    startFrames();
  };

  const nudge = (stepX: number, stepY: number): void => {
    const node = ref.current;
    const s = state.current;
    if (node === null || s.pointerId !== null) return;

    measureLimits(node, "gesture");
    setTarget(
      s.target.x + clamp(stepX, s.minX, s.maxX),
      s.target.y + clamp(stepY, s.minY, s.maxY),
    );
  };

  useEffect(() => {
    const node = ref.current;
    if (node === null) return;

    /* The remembered offset is also seeded as an inline style on the first
       render, so the object is never seen jumping from its anchor to where it
       was left. This re-asserts it and owns the property from here on. */
    apply();

    /**
     * Put the object as close to where it belongs as the page allows.
     *
     * This is the only thing that may move the object without the visitor
     * asking, and it is why `desired` exists. It travels from wherever the
     * object currently is toward `desired`, as far as the limits permit — so a
     * window that becomes too small pushes the paper into view, and a window
     * that becomes large again lets it go back. A clamp is never mistaken for
     * an intention: this never commits, so shrinking a window for a minute
     * cannot overwrite where the paper was actually left.
     *
     * It runs on resize, and whenever the layer's own box changes — the anchor
     * is a percentage of the document's height, so the object's authored
     * position moves every time the page reflows. Without that second trigger
     * the first measurement of the page (taken before the fonts land, when the
     * document is a different height) would clamp the object once and keep it
     * there for the rest of the session.
     */
    const reclaim = (): void => {
      const s = state.current;
      if (s.pointerId !== null) return;

      measureLimits(node, "page");
      const x = s.target.x + clamp(s.desired.x - s.target.x, s.minX, s.maxX);
      const y = s.target.y + clamp(s.desired.y - s.target.y, s.minY, s.maxY);
      if (x === s.target.x && y === s.target.y) return;

      /* Placed, not glided. This is a correction, not a gesture, and it must
         not look like the object moved on its own. */
      s.target.x = x;
      s.target.y = y;
      s.drawn.x = x;
      s.drawn.y = y;
      apply();
    };

    reclaim();
    window.addEventListener("resize", reclaim, { passive: true });

    let observer: ResizeObserver | null = null;
    const box = node.offsetParent;
    if (typeof ResizeObserver !== "undefined" && box instanceof Element) {
      observer = new ResizeObserver(reclaim);
      observer.observe(box);
    }

    return () => {
      window.removeEventListener("resize", reclaim);
      observer?.disconnect();
      stopFrames();
    };
    /* Mount only. Everything the effect touches is a ref. */
  }, [ref]);

  return { onPointerDown, onPointerMove, onPointerUp, nudge };
}
