import { useEffect, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";
import { dockCornerSpoken } from "./copy";
import {
  cornerDelta,
  cornerParts,
  measureSpans,
  nearestCorner,
  readDockCorner,
  toCorner,
  writeDockCorner,
  NO_SPANS,
} from "./dockCorner";
import type { DockCorner, DockSpans } from "./dockCorner";
import { useMediaQuery, useReducedMotion } from "./hooks";
import { NO_OFFSET } from "./positions";
import { useDraggableObject } from "./useDraggableObject";

/* =============================================================================
   PICKING UP THE PLAYER
   =============================================================================

   The player is docked to the viewport, which means it is occasionally in the
   way — of the closing line, of a journal entry, of whatever a visitor is
   actually reading. So it can be picked up and moved, and when it is let go it
   settles into the nearest corner instead of staying where it was dropped. It
   is out of the way by default, movable when it is not, and it puts itself
   somewhere sensible afterwards rather than leaving a small mess on the screen.

   IT IS THE SECOND DRAGGABLE OBJECT ON THIS PAGE AND THE LAST ONE. The budget
   in the shared brief is one to two, and this is two: the paper, which is
   whimsy, and the player, which is furniture. They earn their places
   differently — the paper is a thing to discover, this is a thing to get out of
   your way — and that is the only reason two draggables do not read as a page
   full of draggables. There is no third.

   ── The whole model ────────────────────────────────────────────────────────

   The corner is the position; the px offset only exists while something is
   moving. See the header of `dockCorner.ts` for why that is worth the swap
   below. The lifecycle of one gesture:

     pointerdown   not on a control, and only if this viewport is draggable at
                   all. Spans are measured here — the dock is at rest, so this
                   is the one moment they are measurable.
     pointermove   past 6px it is a drag, and the shared drag engine has it.
     pointerup     the nearest corner is chosen from where it was released, and
                   the engine is retargeted to the offset that reaches it. The
                   glide is the paper's settle at the paper's rate: exponential
                   approach, no overshoot, no bounce, no spring.
     settle        the anchor is swapped to the new corner and the offset is
                   zeroed IN THE SAME FRAME, which is a visual no-op — and the
                   corner is written to storage.

   ── Reduced motion ─────────────────────────────────────────────────────────

   Every step above still happens; the glide collapses to a placement. The dock
   still drags under the finger, still chooses a corner, still remembers it.
   Nothing is removed and nothing becomes unreachable.
   ========================================================================== */

/**
 * Where the dock can be dragged at all. MIRRORS PlayerDock.module.css — the two
 * breakpoints in that file are `max-width: 47.9375rem` and `max-height: 26rem`,
 * and this is their complement. If either moves, this moves.
 *
 * WHY NARROW IS EXCLUDED, since "it is smaller" is not a reason:
 *
 *   1. There are no corners there. The dock spans the full width minus 8px, so
 *      three of the four corners are the same place as one of the other two.
 *      Corner affinity has nothing to be affine to.
 *   2. Dragging costs `touch-action: none`, and on a phone the dock is a
 *      full-width band across the bottom of the screen — exactly where thumbs
 *      scroll. Buying a gesture nobody asked for with the page's scrolling in
 *      the region most likely to be touched is a bad trade, and the brief is
 *      explicit that a drag must never fight page scroll.
 *   3. The reason to move the player is that it is covering something. At that
 *      width moving it 8px covers something else.
 *
 * SHORT VIEWPORTS are excluded for a different reason: below 26rem tall the
 * dock is not fixed at all, it scrolls away with the page, so it has no corner
 * of the viewport to belong to.
 *
 * Note that this is a question about the VIEWPORT, not about the input device.
 * A tablet in landscape is wide enough, and drags with a finger through exactly
 * the same code path as a mouse.
 */
const DRAGGABLE_VIEWPORT = "(min-width: 48rem) and (min-height: 26.0625rem)";

/**
 * Things inside the dock that are not the dock.
 *
 * A press that lands on one of these never starts a drag — which is the whole
 * answer to "a click on a control must not start a drag", and half the answer
 * to the reverse. It is also how a future scrubber survives: a slider that
 * moved the player instead of the playhead would be maddening, and it is listed
 * here before it exists so that it never has to be debugged.
 */
const CONTROL_SELECTOR =
  'button, a[href], input, select, textarea, [role="button"], [role="slider"], [data-no-drag]';

export interface DockDrag {
  /** Whether this viewport offers the gesture at all. When false the dock is a
   *  plain fixed element with no attributes, no tab stop and no handlers. */
  readonly enabled: boolean;
  /** The corner the dock is anchored to. Drives `data-corner` in CSS. */
  readonly corner: DockCorner;
  /**
   * Screen-reader only, and set only by a KEYBOARD move: a visitor who dragged
   * it watched it happen and does not need to be told.
   *
   * Empty until the first one, and then it stays — it is a statement of where
   * the player currently is, which remains true, rather than an event that has
   * finished happening.
   */
  readonly announcement: string;
  readonly onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  readonly onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  readonly onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  /** A gesture taken away mid-drag — the system took the pointer, or a phone
   *  call arrived. It ends where it is and settles from there. */
  readonly onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  readonly onClickCapture: (event: ReactMouseEvent<HTMLElement>) => void;
  readonly onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
}

export function useDockDrag(ref: RefObject<HTMLElement | null>): DockDrag {
  const reducedMotion = useReducedMotion();
  const enabled = useMediaQuery(DRAGGABLE_VIEWPORT);

  /* Read once, lazily, at mount. A second tab that moves the player does not
     reach in and move it here: one object in two windows fighting over one
     corner is worse than each remembering the last one to settle. */
  const [corner, setCorner] = useState(readDockCorner);
  const [announcement, setAnnouncement] = useState("");

  const state = useRef({
    /** Mirrors `corner` for handlers that run between renders. */
    corner,
    /** Last valid measurement. Only ever taken at rest. */
    spans: NO_SPANS as DockSpans,
    /** The corner a settle in flight is heading for, or null at rest. */
    pending: null as DockCorner | null,
    /** This gesture moved the dock, so the click that follows it is not a
     *  click on anything. */
    dragged: false,
  });

  /** Spans are only meaningful when the drag offset is zero. Mid-settle the
   *  last measurement is kept, which is right: the viewport has not changed. */
  const refreshSpans = (): void => {
    const node = ref.current;
    const s = state.current;
    if (node === null || s.pending !== null) return;
    s.spans = measureSpans(node, s.corner);
  };

  /**
   * Send the dock to a corner.
   *
   * Called with the CURRENT corner too — after a drag that ends up back where
   * it started — and that is not a no-op: the offset is wherever the finger
   * left it, and the delta of zero is what brings it home.
   */
  const settleTo = (next: DockCorner): void => {
    const s = state.current;
    s.pending = next;
    drag.moveTo(cornerDelta(s.corner, next, s.spans), "glide");
  };

  /**
   * It has arrived. Re-anchor and zero the offset together.
   *
   * Both writes are DOM writes made inside the same frame the engine drew its
   * last one in, so the browser paints the swap and the reset at once and the
   * dock does not move by a pixel. `data-corner` is set imperatively for that
   * reason, and through React state as well so the two never disagree — the
   * re-render writes the value that is already there.
   */
  const arrive = (): void => {
    const s = state.current;
    const next = s.pending;
    if (next === null) return;
    s.pending = null;

    const moved = next !== s.corner;
    if (moved) {
      const node = ref.current;
      s.corner = next;
      if (node !== null) node.dataset.corner = next;
    }

    /* Unconditional: after a drag that came back to the same corner there is
       still an offset to give up, and it is the last thing standing between the
       dock and its resting invariant of exactly zero. */
    drag.moveTo(NO_OFFSET, "instant");

    if (moved) {
      setCorner(next);
      writeDockCorner(next);
    }
  };

  const drag = useDraggableObject(ref, {
    initial: NO_OFFSET,
    reducedMotion,
    /* This object is anchored to a corner of the viewport, not to a point in
       the page. Its unattended corrections are CSS's job. */
    correction: "owner",
    onDragStart: () => {
      const s = state.current;
      s.dragged = true;
      /* Straight onto the element: picking the dock up is the one state change
         that happens while a gesture is in flight, and it must not wait for a
         render. */
      if (ref.current !== null) ref.current.dataset.dragging = "true";
    },
    onDragEnd: () => {
      const node = ref.current;
      if (node === null) return;
      node.dataset.dragging = "false";
      /* Measured from where the dock IS, which lags the pointer by design —
         the corner it looked nearest to is the corner it goes to. */
      settleTo(nearestCorner(node));
    },
    onSettle: arrive,
  });

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>): void => {
    const s = state.current;
    /* Any press on the dock clears the flag, including one on a control, so a
       suppressed click can only ever be the one belonging to the drag that
       just happened. */
    s.dragged = false;
    if (!enabled) return;
    if (event.button !== 0) return;
    if (
      event.target instanceof Element &&
      event.target.closest(CONTROL_SELECTOR) !== null
    ) {
      return;
    }
    refreshSpans();
    drag.onPointerDown(event);
  };

  /**
   * A drag that ended over a control must not also press it.
   *
   * With pointer capture held this cannot happen — the click is dispatched to
   * the capturing element — but capture is allowed to fail (see the try/catch
   * in the engine), and this is six lines against a play button that gets
   * pressed because somebody moved the player.
   *
   * `detail > 0` keeps it to clicks that came from a pointer. A button
   * activated with Enter or Space reports 0 and is never touched by this.
   */
  const onClickCapture = (event: ReactMouseEvent<HTMLElement>): void => {
    const s = state.current;
    if (s.dragged && event.detail > 0) {
      event.preventDefault();
      event.stopPropagation();
    }
    s.dragged = false;
  };

  /**
   * Arrow keys move the dock between corners.
   *
   * Discrete, not a nudge in pixels — the dock's vocabulary is four corners, so
   * that is what the keyboard says. Left/right choose the inline side,
   * up/down the block side, and pressing toward a corner it is already in does
   * nothing and says nothing.
   *
   * ONLY WHEN THE DOCK ITSELF HAS FOCUS. The player's own transport buttons are
   * inside it and their keydowns bubble through here; a `target !== currentTarget`
   * test is what keeps this from ever answering for them.
   */
  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>): void => {
    if (!enabled) return;
    if (event.target !== event.currentTarget) return;

    const s = state.current;
    const from = s.pending ?? s.corner;
    const parts = cornerParts(from);
    let next: DockCorner;

    switch (event.key) {
      case "ArrowLeft":
        next = toCorner({ ...parts, inline: "start" });
        break;
      case "ArrowRight":
        next = toCorner({ ...parts, inline: "end" });
        break;
      case "ArrowUp":
        next = toCorner({ ...parts, block: "top" });
        break;
      case "ArrowDown":
        next = toCorner({ ...parts, block: "bottom" });
        break;
      default:
        return;
    }

    /* Arrow keys scroll a page by default, and the dock is on top of one. */
    event.preventDefault();
    if (next === from) return;

    refreshSpans();
    settleTo(next);
    setAnnouncement(dockCornerSpoken[next]);
  };

  /* One measurement at mount, so the first gesture already knows the geometry,
     and one whenever the viewport crosses the draggable breakpoint. */
  useEffect(() => {
    if (!enabled) {
      /* The dock has just lost its corners — narrowed, or shortened until it
         scrolls with the page. CSS has already re-anchored it; this drops any
         settle still in flight and makes sure no stale offset is left behind to
         push it off the edge of a screen that no longer has room for it. */
      const s = state.current;
      s.pending = null;
      drag.moveTo(NO_OFFSET, "instant");
      return;
    }
    refreshSpans();
    /* Deliberately only `enabled`. Everything else this effect touches is a
       ref or a function recreated every render that closes over refs. */
  }, [enabled]);

  return {
    enabled,
    corner,
    announcement,
    onPointerDown,
    onPointerMove: drag.onPointerMove,
    onPointerUp: drag.onPointerUp,
    onPointerCancel: drag.onPointerUp,
    onClickCapture,
    onKeyDown,
  };
}
