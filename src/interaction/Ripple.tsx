import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./hooks";
import type { StyleVars } from "./vars";
import styles from "./Ripple.module.css";

/* =============================================================================
   THE SURFACE — a ring where the page was touched
   =============================================================================

   The page has a surface, and you just touched it. That is the whole idea, and
   it is the reason this is not a click effect: nothing is acknowledging the
   click, nothing is confirming an action, nothing is drawn AT a control. A
   still surface was disturbed at one point and the disturbance spreads out and
   dies. If it ever starts reading as feedback, it has failed.

   It is allowed under the brief's motion rule — "animation either happens ONCE
   in response to something, or breathes slowly enough to become atmosphere" —
   as the cleanest possible example of the first case. One event, one expansion,
   nothing left behind, nothing looping.

   ── What became quieter to make room for it (review question 7) ─────────────

   Nothing was removed, because this is the only thing on the page that is
   triggered by a click on NOTHING. Every other interaction here is attached to
   a specific object — the paper, the star, the dock — and this one is attached
   to the empty space between them, which was previously inert. What pays for it
   instead is its INTENSITY. It is the most-repeated motion on the site by an
   enormous margin: a visitor who reads the page will see it fifty times, so it
   is tuned to survive the fiftieth rather than to impress on the first. Peak
   luminance is around that of `--color-edge` — a hairline rule — and it is gone
   in three quarters of a second.

   The test it was tuned against: click twenty times in a row and ask whether
   you have started to resent it. Anything that passes that test on the twentieth
   click is, by construction, almost too quiet on the first. That is the correct
   side to err on.

   ── Where it renders, and why in FRONT of the content ───────────────────────

   In its own fixed, full-viewport root at `--layer-5-foreground`, mounted by
   `<InteractionLayer />` as a sibling of the interaction root and BEFORE it in
   the DOM. Three consequences, all of them wanted:

     - It is in front of the page's text, so the ring reads as a disturbance of
       the surface you are looking THROUGH rather than of something behind it.
       Water is a surface you look through; a ripple that passed behind the
       words would just be a background effect.
     - It is behind the paper and behind the docked player, because they are
       later in paint order at the same layer. Foreground objects float ON the
       surface, so a ring passes underneath them and comes out the other side.
       That is also a hard guarantee that this can never be drawn on top of the
       one thing on the page you might be trying to press.
     - It is FIXED, not absolute. The other half of this layer is a
       document-tall absolute box because the paper is anchored to a place in
       the PAGE. A ripple is not: it is anchored to the moment you touched the
       glass, and it is over before scrolling is a question. Fixed also means the
       click point is `clientX`/`clientY` with no scroll arithmetic and no
       dependence on the measured page height.

   Nothing here is ever clipped by the layer beneath it and nothing here can be
   clicked: the root and every element inside it are `pointer-events: none`.

   ── Why it does not use `click` ─────────────────────────────────────────────

   Because a drag ends in one. Selecting a paragraph, throwing the paper across
   the page, moving the player to another corner — every one of those finishes
   with a click-ish event at a point the visitor never "touched" in the sense
   that matters here. So this pairs `pointerdown` with `pointerup` itself and
   spawns nothing if the pointer travelled more than a few pixels between them,
   which is the same click-versus-drag discipline the dock already uses and the
   same threshold. A gesture is not a touch.

   ── No second animation loop, and no dependency ─────────────────────────────

   Each ring is a CSS one-shot animation on an element that exists for 800ms.
   There is no rAF here — the page's one loop belongs to the atmosphere — no
   canvas, no WebGL, no library, and no JavaScript running while a ripple is on
   screen. React sees exactly two renders per ripple: one to add it, one to
   remove it, and both are local to this component so nothing else on the page
   re-renders.
   ========================================================================== */

/**
 * How far the pointer may travel between down and up and still be a touch
 * rather than a gesture, in px.
 *
 * The same 6px as `DRAG_THRESHOLD` in `useDraggableObject.ts`, deliberately and
 * for the same reason: below the tremor in a hand holding still, above nothing.
 * The two constants are not shared because they are not the same fact — one is
 * "the object may start moving now", the other is "that was not a click" — and
 * a future tuning of one should not silently retune the other.
 */
const TOUCH_TOLERANCE = 6;

/**
 * How many ripples may exist at once.
 *
 * Three, which is more than a calm visitor will ever produce and few enough
 * that someone drumming on the trackpad gets a surface that looks disturbed
 * rather than a fireworks display. The oldest is dropped rather than the newest
 * refused: the ring under your finger right now is the one you are looking at.
 */
const MAX_CONCURRENT = 3;

/**
 * How long a ripple element lives, in ms.
 *
 * The trailing ring starts 140ms late and runs for 600ms, so the last frame of
 * animation is at 740ms; the rest is margin so that removal can never race the
 * end of the animation and produce a visible cut. See the stylesheet for the
 * duration itself and for why 600ms did not need to become a fourth motion
 * band.
 */
const RIPPLE_LIFETIME_MS = 800;

/**
 * Things that are not the surface.
 *
 * A click on one of these MEANS something — it plays a track, follows a link,
 * picks up a piece of paper — and a click that means something should not also
 * be a stone dropped in a pond. The surface is what is left over.
 *
 * The interactive entries are the standard ones plus the same `[role]` list the
 * dock's own `CONTROL_SELECTOR` carries, so a scrubber added to the player later
 * is covered before it exists.
 *
 * `section[aria-label]` is the PLAYER, and it is the one entry here that is a
 * guess about somebody else's markup. The dock is a plain `<div>` with no
 * attributes at all on a narrow viewport, so there is nothing else stable to
 * match on, and a tap on the player's chassis must not ripple: the player is an
 * object resting on the surface, not part of it. The intended long-term hook is
 * `[data-no-ripple]`, which is listed first and matches nothing today — see the
 * report; adding that one attribute to the dock is a change in `src/player/`,
 * which this agent does not own.
 */
const NOT_THE_SURFACE = [
  "[data-no-ripple]",
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "summary",
  "[contenteditable]",
  '[role="button"]',
  '[role="link"]',
  '[role="slider"]',
  '[role="group"]',
  '[tabindex]:not([tabindex="-1"])',
  "section[aria-label]",
].join(",");

interface Ripple {
  readonly id: number;
  /** Viewport coordinates of the moment of contact. */
  readonly x: number;
  readonly y: number;
}

export function RippleField() {
  const reducedMotion = useReducedMotion();
  const [ripples, setRipples] = useState<readonly Ripple[]>([]);

  const nextId = useRef(0);
  const timers = useRef(new Set<number>());

  /* Every timer this component has ever started is cancelled on unmount, and on
     the way into reduced motion — a pending removal firing into a component
     that has stopped rendering ripples is harmless, but a leaked timer is a
     leak whether or not anyone notices it. */
  useEffect(
    () => () => {
      for (const timer of timers.current) window.clearTimeout(timer);
      timers.current.clear();
    },
    [],
  );

  useEffect(() => {
    /* GATED IN JS, LIVE, and not merely styled away: a ripple is decoration and
       expansion is its entire content, so under reduced motion there is nothing
       to degrade to and the honest answer is that it does not happen. Turning
       the preference on mid-session tears down the listeners; turning it off
       brings them back, without a reload. */
    if (reducedMotion) {
      setRipples([]);
      return;
    }

    /** The primary pointer currently down on the surface, if there is one. */
    let pointerId: number | null = null;
    let originX = 0;
    let originY = 0;

    const spawn = (x: number, y: number): void => {
      const id = nextId.current++;
      /* Capped by construction rather than by a check: the slice is the cap. */
      setRipples((current) => [...current, { id, x, y }].slice(-MAX_CONCURRENT));

      const timer = window.setTimeout(() => {
        timers.current.delete(timer);
        setRipples((current) => current.filter((ripple) => ripple.id !== id));
      }, RIPPLE_LIFETIME_MS);
      timers.current.add(timer);
    };

    const onPointerDown = (event: PointerEvent): void => {
      /* A second finger means a pinch or a two-handed something, not a tap, and
         it also drops any primary press already in flight. */
      if (!event.isPrimary) {
        pointerId = null;
        return;
      }
      /* Right and middle click are not touches. Touch and pen report 0. */
      if (event.button !== 0) return;
      /* Clicks on a classic scrollbar are dispatched to the root element and
         would otherwise ripple at the very edge of the window, half clipped, on
         every scroll-by-dragging. `clientWidth` excludes the scrollbar, which is
         exactly the distinction being made. */
      const root = document.documentElement;
      if (event.clientX >= root.clientWidth) return;
      if (event.clientY >= root.clientHeight) return;
      if (
        event.target instanceof Element &&
        event.target.closest(NOT_THE_SURFACE) !== null
      ) {
        return;
      }

      pointerId = event.pointerId;
      originX = event.clientX;
      originY = event.clientY;
    };

    const onPointerUp = (event: PointerEvent): void => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;

      /* The gesture test. A drag, a fling, a swipe and a text selection all
         leave here; only a press that stayed put is a touch. */
      const travel = Math.hypot(
        event.clientX - originX,
        event.clientY - originY,
      );
      if (travel > TOUCH_TOLERANCE) return;

      /* Drawn where contact was MADE, not where it was released — within 6px of
         each other by definition, and the first one is the true one. */
      spawn(originX, originY);
    };

    const onPointerCancel = (event: PointerEvent): void => {
      /* The system took the pointer: a scroll began under a thumb, a long press
         opened a context menu, a call arrived. Nothing was touched. */
      if (event.pointerId === pointerId) pointerId = null;
    };

    /* On the window, in the BUBBLE phase, passive. Bubbling means anything that
       stops propagation on a pointer event has also, correctly, stopped this;
       passive means this can never be blamed for a janky scroll, and nothing in
       here has any reason to call `preventDefault`. */
    const options = { passive: true } as const;
    window.addEventListener("pointerdown", onPointerDown, options);
    window.addEventListener("pointerup", onPointerUp, options);
    window.addEventListener("pointercancel", onPointerCancel, options);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [reducedMotion]);

  /* Nothing in the tree at all when there is nothing happening, which is most
     of the time. The root only exists while a ripple does. */
  if (ripples.length === 0) return null;

  return (
    <div className={styles.field} aria-hidden="true">
      {ripples.map((ripple) => {
        const style: StyleVars = {
          "--ripple-x": `${ripple.x}px`,
          "--ripple-y": `${ripple.y}px`,
        };
        /* The id is monotonic and never reused, so React can never recycle a
           node whose animation has already played — a reused key would show the
           second ripple as a ring that does not expand. */
        return (
          <span key={ripple.id} className={styles.ripple} style={style}>
            <span className={styles.ring} />
            <span className={`${styles.ring} ${styles.trailing}`} />
          </span>
        );
      })}
    </div>
  );
}
