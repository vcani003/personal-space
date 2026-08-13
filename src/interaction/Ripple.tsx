import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./hooks";
import type { StyleVars } from "./vars";
import { emitWave, mountWaveField, waveRadius, WAVE_START_FRACTION } from "./wave";
import styles from "./Ripple.module.css";

/* =============================================================================
   THE SURFACE — the page is displaced where it was touched
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

   ── The correction this file has been through ───────────────────────────────

   It used to be two soft rings and nothing else, and the site owner's reading of
   it was exact: it looked like an overlay. It was one. Water displaces what is
   floating in it — the disturbance IS the movement of the medium, not a shape
   passing in front of it.

   So the event now has two halves, and this component owns the gesture that
   starts both:

     THE WAVE   `wave.ts` — an expanding annulus that pushes the page's own
                words outward along its radius and settles them back exactly
                where they were. This is the effect.
     THE CREST  the ring below — one, dimmer than it was, its scale derived from
                the wave's own radius and duration so that the luminous band and
                the moving words are the same thing seen twice. This is support.

   The two are bound together in code rather than by eye: the constants come from
   `wave.ts` and are published to CSS as `--wave-radius` and
   `--ripple-scale-from` at the moment a ripple is rendered, which is also the
   moment its wave is emitted.

   ── What became quieter to make room for it (review question 7) ─────────────

   The ring itself, in three ways — the wake is deleted, the peak alpha went from
   0.13 to 0.085, and the easing is gone. See the header of `Ripple.module.css`.
   Beyond that, nothing else on the page had to give anything up, because the
   whole event still only happens in response to a click on NOTHING: every other
   interaction here is attached to a specific object — the paper, the star, the
   dock — and this one is attached to the empty space between them.

   What pays for it instead is INTENSITY. This is the most-repeated motion on the
   site by an enormous margin: a visitor who reads the page will see it fifty
   times, so it is tuned to survive the fiftieth rather than to impress on the
   first. Displacement peaks at a few pixels, and only within about a hand's
   width of the click.

   The test it was tuned against: click twenty times in a row and ask whether
   you have started to resent it. Anything that passes that test on the twentieth
   click is, by construction, almost too quiet on the first. That is the correct
   side to err on.

   ── Where it renders, and why in FRONT of the content ───────────────────────

   Inside the interaction layer's own document-tall root at
   `--layer-5-foreground`, FIRST among its children on purpose. Three
   consequences, all of them wanted:

     - It is in front of the page's text, so the crest reads as a disturbance of
       the surface you are looking THROUGH rather than of something behind it.
       Water is a surface you look through; a ripple that passed behind the
       words would just be a background effect.
     - It is behind the paper and behind the docked player, because they are
       later in paint order. Foreground objects float ON the surface, so a ring
       passes underneath them and comes out the other side. That is also a hard
       guarantee that this can never be drawn on top of the one thing on the page
       you might be trying to press.
     - It is DOCUMENT-anchored. It used to be a separate fixed, viewport-sized
       root, which was right when the ring was alone — a ripple was over before
       scrolling was a question. It is wrong now: the words the wave moves live
       in the page, so a scroll during a wave would slide the crest away from the
       displacement it is drawing. Both halves are anchored to the same place.

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

   The ring is a CSS one-shot animation on an element that exists for 800ms:
   nothing in JavaScript touches it while it is on screen. The wave does need
   frames, and it borrows the atmosphere's single rAF loop through
   `holdPointerFrames()` and `subscribePointerFrame()`, exactly as dragging does,
   and releases both on the frame every piece reaches rest. There is no second
   loop, no canvas, no WebGL, no library and no new dependency. React sees
   exactly two renders per ripple: one to add it, one to remove it, and both are
   local to this component so nothing else on the page re-renders.
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
 * The ring animates for 600ms — `--duration-transition-slow`, the top of the
 * brief's TRANSITION band, and the same 600ms the wave itself travels for. The
 * rest is margin so that removal can never race the end of the animation and
 * produce a visible cut.
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
  /** DOCUMENT coordinates of the moment of contact — the same frame of
   *  reference the wave uses, so the crest and the displacement stay together
   *  if the page is scrolled while they are alive. */
  readonly x: number;
  readonly y: number;
}

export function RippleField() {
  const reducedMotion = useReducedMotion();
  const [ripples, setRipples] = useState<readonly Ripple[]>([]);

  const nextId = useRef(0);
  const timers = useRef(new Set<number>());

  /* THE PAGE'S TEXT IS SPLIT HERE, and only here, and only when motion is
     allowed. Mounting is what breaks the copy into movable pieces; the teardown
     puts every original text node back, so turning the preference on mid-session
     un-splits the document rather than merely freezing it. Under reduced motion
     this effect does nothing at all and the markup is exactly what React
     rendered. */
  useEffect(() => {
    if (reducedMotion) return;
    return mountWaveField();
  }, [reducedMotion]);

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
    /** Viewport coordinates, for the travel test only. */
    let originX = 0;
    let originY = 0;
    /** The same point in the document, for the wave and the crest. */
    let originDocX = 0;
    let originDocY = 0;

    const spawn = (x: number, y: number): void => {
      /* The disturbance first, the drawing of it second. `emitWave` runs
         synchronously here, in the event handler, because the one thing it may
         have to do — re-measure every piece of text after a resize — is a layout
         read, and a layout read belongs in an event and never in a frame. */
      emitWave(x, y);

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
      /* Converted once, HERE, rather than on release: this is where the page was
         touched, and if it scrolls under a held pointer that fact does not
         change. */
      originDocX = event.clientX + window.scrollX;
      originDocY = event.clientY + window.scrollY;
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
      spawn(originDocX, originDocY);
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

  /* THE ONLY PLACE THE TWO HALVES ARE BOUND TOGETHER. Both numbers come from
     `wave.ts`, so the drawn crest cannot drift away from the wave it is drawing:
     the box is sized in CSS so that the gradient's peak lands on `--wave-radius`
     at scale 1, and the animation starts from the same fraction the wave starts
     from. Read at render, which is the same moment the wave was emitted, so a
     resized window needs no listener here. */
  const field: StyleVars = {
    "--wave-radius": `${waveRadius()}px`,
    "--ripple-scale-from": WAVE_START_FRACTION,
  };

  return (
    <div className={styles.field} style={field} aria-hidden="true">
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
          </span>
        );
      })}
    </div>
  );
}
