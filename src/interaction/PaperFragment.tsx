import { useEffect, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import { paperDescription, paperLabel, paperWriting } from "./copy";
import { useMediaQuery, useReducedMotion } from "./hooks";
import { PAPER_OBJECT_ID } from "./placement";
import { readOffset, writeOffset } from "./positions";
import { useDraggableObject } from "./useDraggableObject";
import type { StyleVars } from "./vars";
import styles from "./PaperFragment.module.css";

/* =============================================================================
   THE PAPER — the page's one movable object, and the only thing it says
   =============================================================================

   A torn scrap sitting in the emptiness the about prose leaves at the left of
   the page. It is not a control and it is not a card: no handle, no hint text,
   no "drag me", no icon, no label anyone can see. It is a foreground object
   with a rotation, a torn edge, and a little light resting on it.

   It carries two of the four interactions in this phase:

     DRAG   — Pointer Events and pointer capture, mouse and touch on one path,
              the position remembered across visits. See useDraggableObject.ts.
     REVEAL — the writing surfaces, and STAYS. Press and hold on the wide
              composition; a tap on the narrow one. See both notes below.

   And it hides the third: a faint ring on the background beneath it, revealed
   by occlusion alone. That mark is rendered by the layer, not by this
   component, precisely so that nothing here can ever animate it into being.

   ── The one hint, and why there is exactly one ─────────────────────────────

   The sheet catches a little more light than anything near it: a soft pool in
   the field beneath it and a sheen on its upper-left corner, both from the
   direction the page's own light comes from. That is the whole advertisement.

   It is deliberately NOT a hover response, NOT a pulse and NOT a ring. It never
   changes state, so it can never be read as a control waiting to be pressed —
   it is a property of the material, true at rest, visible from across the empty
   region, and it is what makes the eye come back to the object a second time.

   Design-review question 7 applies hard here, so the accounting is explicit.
   `cursor: grab` is the pointer's affordance and exists only when the pointer is
   already on the object; the light is the eye's affordance and exists before the
   pointer is anywhere near. They never speak at the same moment, and NEITHER of
   them reacts to hover. Nothing was added on top: there is still no hover
   brightening, no lift, no scale, no outline, no tooltip, no custom cursor. The
   one thing that changes when the paper is pressed is that same light rising —
   the hint and the payoff are the same light, which is why they do not read as
   two features.

   ── The reveal LATCHES, and time is the only thing that takes it away ───────

   Completing the gesture does not merely show the writing while a finger is
   down. It surfaces and stays, because a secret that has to be maintained is a
   chore, and on a phone the finger is ON the paper, covering most of it.

   It then fades on its own after REVEAL_IDLE_MS of no contact — see that
   constant for the number and the reasoning. Every kind of contact restarts
   that clock rather than dismissing the writing: pressing it, dragging it,
   focusing it, or the pointer merely passing over it. Picking the paper up used
   to cancel the reveal; it no longer does, because a lit note carried across
   the page is a nicer object than one that goes dark the moment it is touched —
   and dragging is how the mark underneath is found, so the two discoveries no
   longer cancel each other out.

   ── Two gestures, one per composition ──────────────────────────────────────

   WIDE: press and hold, 750ms, with the light growing for the whole 750ms so
   the visitor knows something is underway well before it lands.

   NARROW: a tap. On a phone there is no cursor to change shape, so the hold has
   no advertisement at all and would be found only by accident; the sheet is
   also small enough that a fingertip covers the feedback that is meant to tell
   you the gesture is working. A tap is what a person does to something they
   have noticed. The hold is not lost — it is still the gesture on every
   composition with room for it, including touch tablets — and the keyboard
   path keeps it at every width.

   ── Keyboard, at every width ────────────────────────────────────────────────

   The paper is a real <button>, so it is in the tab order and takes focus.
     Space (held)  the same 750ms and the same growing light as a pointer hold
     Enter         reveals immediately, and hides again — for anyone who cannot
                   hold a key down, which is the point of having it
     Arrows        move the paper, 14px, or 56px with Shift. This is the
                   keyboard's version of dragging, and it is what makes the mark
                   underneath findable without a pointer.
   Focus alone restarts the idle clock, so the writing cannot expire under
   someone who is reading it with the keyboard.

   Assistive technology activates a button with a synthetic click that carries
   no pointer at all — VoiceOver's double tap does exactly this — so a click
   with `detail === 0` reveals too. It is the same route as Enter by another
   name, and it can never fire from a real tap or the end of a drag, both of
   which carry a click count.
   ========================================================================== */

/**
 * How long the press must last, in milliseconds.
 *
 * 750ms — the middle of the brief's 600–900ms band. Under 600 it fires while
 * someone is merely clicking; over 900 it feels broken before it feels
 * deliberate.
 *
 * This constant is the single source of truth and is published to CSS as
 * `--hold-duration`, so the light on the sheet finishes growing at the exact
 * instant the timer fires. It is not a motion token because it is not a motion
 * value — it is an input threshold, and it does NOT collapse under reduced
 * motion, which would turn a deliberate gesture into a hair trigger. If it ever
 * earns a token, `--duration-hold` is the name, and this constant should then
 * be the only thing that has to move.
 */
const HOLD_MS = 750;

/**
 * How long the writing stays after the last contact with the paper.
 *
 * TEN SECONDS, and the number is a reading measurement rather than a feel.
 * The line is one short sentence — 43 characters, about nine words — which is
 * roughly 1.5s at an unhurried pace. Ten seconds is therefore five or six
 * passes over it: enough to read it, disbelieve it, and read it again, which is
 * what people actually do with something that was not there a moment ago.
 *
 * The ceiling is what makes it a secret rather than a state. If the writing
 * simply stayed, the paper would be a thing that has been opened, and the page
 * would carry that fact for the rest of the visit. Ten seconds is short enough
 * that someone who scrolls away and comes back finds a blank scrap again and
 * can be surprised by it a second time — and short enough that it is gone
 * before it starts competing with the prose beside it.
 *
 * It was 5s, measured from the release of the press, which was too short to be
 * a lingering and too long to be feedback.
 */
const REVEAL_IDLE_MS = 10_000;

/**
 * The narrow composition. The same 48rem breakpoint every stylesheet in this
 * project uses, expressed once here because JS has to agree with CSS about
 * which page it is on.
 */
const NARROW_QUERY = "(max-width: 47.9375rem)";

/** Keyboard travel per press, and with Shift held. */
const NUDGE_STEP = 14;
const NUDGE_STEP_LARGE = 56;

export function PaperFragment() {
  const ref = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  /* Live, like the motion preference: a window dragged across the breakpoint
     changes which gesture the paper answers to, without a reload. */
  const narrow = useMediaQuery(NARROW_QUERY);

  /* Read once, lazily, at mount — not on every render, and not through an
     effect. A second tab that moves the paper does not reach in and move it
     here: two copies of a physical object fighting over one position is worse
     than each remembering the last one to settle. */
  const [initial] = useState(() => readOffset(PAPER_OBJECT_ID));

  const [holding, setHolding] = useState(false);
  const [revealed, setRevealed] = useState(false);

  /* Mirrors of the state, for handlers that run before React has re-rendered —
     a hold that completes and is released in the same tick would otherwise
     never schedule its own fade. */
  const revealedRef = useRef(false);
  const pressing = useRef(false);
  /** This gesture became a drag. Reset on every pointerdown. */
  const dragged = useRef(false);
  const holdTimer = useRef<number | null>(null);
  const idleTimer = useRef<number | null>(null);

  const clearHoldTimer = (): void => {
    if (holdTimer.current === null) return;
    window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  const clearIdleTimer = (): void => {
    if (idleTimer.current === null) return;
    window.clearTimeout(idleTimer.current);
    idleTimer.current = null;
  };

  const setReveal = (next: boolean): void => {
    revealedRef.current = next;
    setRevealed(next);
  };

  /**
   * The paper was touched, in whatever sense. Start the clock over.
   *
   * This is the ONLY thing that ever hides the writing, and it is the one place
   * the timeout is armed — every handler below funnels into it rather than
   * managing a timer of its own, so there can never be two clocks running
   * against one another.
   *
   * A press stops the clock entirely instead of restarting it: a finger that is
   * still down has not finished, and the ten seconds should be measured from
   * when it lifts.
   */
  const restartIdle = (): void => {
    clearIdleTimer();
    if (!revealedRef.current || pressing.current) return;
    idleTimer.current = window.setTimeout(() => {
      idleTimer.current = null;
      setReveal(false);
    }, REVEAL_IDLE_MS);
  };

  /** Contact began. Nothing has been decided yet — this is only a press. */
  const beginPress = (): void => {
    pressing.current = true;
    clearIdleTimer();
  };

  /** Start the 750ms ramp. A no-op while the writing is already up: there is
   *  nothing left to reveal, and re-running the light would read as a reset. */
  const armHold = (): void => {
    if (revealedRef.current || holdTimer.current !== null) return;
    setHolding(true);
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null;
      setHolding(false);
      setReveal(true);
      /* Released before the timer landed? The clock starts now. */
      restartIdle();
    }, HOLD_MS);
  };

  /** An in-flight ramp is abandoned; anything already revealed is left alone. */
  const cancelHold = (): void => {
    clearHoldTimer();
    setHolding(false);
  };

  /** Contact ended. An incomplete hold aborts cleanly and the light falls. */
  const endPress = (): void => {
    pressing.current = false;
    cancelHold();
    restartIdle();
  };

  /** The writing surfaces immediately. The tap, the Enter key and an assistive
   *  activation all arrive here. */
  const reveal = (): void => {
    cancelHold();
    setReveal(true);
    restartIdle();
  };

  /* `data-dragging` is written straight onto the element rather than rendered
     as a prop: picking the paper up must not go through React, since it is the
     one state change that happens while a gesture is in flight. `data-holding`
     and `data-revealed` are props because they change between gestures, not
     during one. */
  const drag = useDraggableObject(ref, {
    initial,
    reducedMotion,
    /* On the narrow composition the stylesheet gives the vertical axis to the
       page's scroller (`touch-action: pan-y`), so the drag must not read it
       either — see the option's own note. Horizontal alone is still enough to
       slide the paper off the mark it is sitting on. */
    dragAxis: narrow ? "inline" : "both",
    onDragStart: () => {
      dragged.current = true;
      /* A drag is not a hold — but it IS contact, so the writing stays and its
         clock simply waits for the paper to be put down. */
      cancelHold();
      clearIdleTimer();
      if (ref.current !== null) ref.current.dataset.dragging = "true";
    },
    onDragEnd: () => {
      if (ref.current !== null) ref.current.dataset.dragging = "false";
    },
    onCommit: (offset) => {
      writeOffset(PAPER_OBJECT_ID, offset);
    },
  });

  useEffect(
    () => () => {
      clearHoldTimer();
      clearIdleTimer();
    },
    [],
  );

  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>): void => {
    const step = event.shiftKey ? NUDGE_STEP_LARGE : NUDGE_STEP;

    switch (event.key) {
      case "ArrowLeft":
      case "ArrowRight":
      case "ArrowUp":
      case "ArrowDown": {
        /* Arrow keys scroll a page by default, and this one is a long way
           down it. */
        event.preventDefault();
        cancelHold();
        const x = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
        const y = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
        drag.nudge(x, y);
        restartIdle();
        return;
      }

      case " ": {
        /* Also stops the page scrolling, and stops the synthetic click that a
           button fires on keyup. */
        event.preventDefault();
        if (event.repeat) return;
        beginPress();
        armHold();
        return;
      }

      case "Enter": {
        event.preventDefault();
        if (revealedRef.current) {
          clearIdleTimer();
          setReveal(false);
          return;
        }
        reveal();
        return;
      }

      default:
        return;
    }
  };

  const onKeyUp = (event: ReactKeyboardEvent<HTMLButtonElement>): void => {
    if (event.key !== " ") return;
    event.preventDefault();
    endPress();
  };

  const style: StyleVars = {
    /* Seeded so the first paint is already at the remembered position; the drag
       engine owns these two properties from mount onward. */
    "--object-dx": `${initial.x}px`,
    "--object-dy": `${initial.y}px`,
    "--hold-duration": `${HOLD_MS}ms`,
  };

  return (
    <>
      <button
        ref={ref}
        type="button"
        className={styles.paper}
        style={style}
        data-holding={holding ? "true" : "false"}
        data-revealed={revealed ? "true" : "false"}
        aria-label={paperLabel}
        aria-describedby="paper-operation"
        onPointerDown={(event) => {
          /* Right- and middle-click are not gestures, and starting a hold on
             one would arm a timer that no pointerup ever disarms — the context
             menu takes the pointer and the writing would stay up. */
          if (event.button !== 0) return;
          dragged.current = false;
          drag.onPointerDown(event);
          beginPress();
          /* The narrow composition decides on release instead: see the note at
             the top of the file. */
          if (!narrow) armHold();
        }}
        onPointerMove={drag.onPointerMove}
        onPointerUp={(event) => {
          drag.onPointerUp(event);
          /* A tap is a press that never became a drag. A thumb that started a
             scroll here arrives at pointercancel instead and reveals nothing. */
          if (narrow && !dragged.current) reveal();
          endPress();
        }}
        onPointerCancel={(event) => {
          drag.onPointerUp(event);
          endPress();
        }}
        /* Contact without pressing. Refs only — the pointer passing over the
           paper must not re-render it, and must not change how it looks. */
        onPointerEnter={restartIdle}
        onPointerLeave={restartIdle}
        onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
          /* Assistive activation only: a real tap and the click at the end of a
             drag both carry a click count. */
          if (event.detail === 0) reveal();
        }}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onFocus={restartIdle}
        onBlur={endPress}
      >
        {/* The sheet, and everything printed on it. It is a separate element
            from the button for one reason: it carries the torn `clip-path`,
            and a clip-path clips the focus outline too. Keeping the clip one
            level in leaves the button's own box unclipped, so a keyboard
            visitor gets a ring they can actually see. */}
        <span className={styles.sheet} aria-hidden="true">
          {/* The light that grows across the sheet for the whole 750ms. It is
              the feedback DURING the hold: something is happening, and it is
              not finished. At rest it is the sheen the sheet already carries —
              the hint and the payoff are one light. */}
          <span className={styles.light} />
          {/* Paper is a material, not a rectangle. The page's grain sits below
              the content layer, so this object — which is above it — would
              otherwise be the only smooth surface in the world. */}
          <span className={styles.tooth} />
          {/* Visual only. The button's accessible name is its label, so this
              text would never be announced from here; the live region below is
              what speaks. */}
          <span className={styles.writing}>{paperWriting}</span>
        </span>
      </button>

      {/* Announced when — and only when — the writing appears. Emptied again on
          the way out, so nothing is read twice and nothing lingers in the
          accessibility tree that is not on the screen. */}
      <p className="visually-hidden" aria-live="polite">
        {revealed ? paperWriting : ""}
      </p>

      {/* The one place this interaction explains itself, and it is invisible.
          A gesture cannot be inferred from a torn edge without a pointer. */}
      <p id="paper-operation" className="visually-hidden">
        {paperDescription}
      </p>
    </>
  );
}
