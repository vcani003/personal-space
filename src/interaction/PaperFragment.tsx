import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { paperDescription, paperLabel, paperWriting } from "./copy";
import { useReducedMotion } from "./hooks";
import { PAPER_OBJECT_ID } from "./placement";
import { readOffset, writeOffset } from "./positions";
import { useDraggableObject } from "./useDraggableObject";
import type { StyleVars } from "./vars";
import styles from "./PaperFragment.module.css";

/* =============================================================================
   THE PAPER — the page's one movable object, and the only thing it says
   =============================================================================

   A torn scrap sitting in the emptiness the about prose leaves at the left of
   the page. It is not a control and it is not a card: no handle, no hint, no
   "drag me", no icon, no label anyone can see. It is a foreground object with
   a rotation and a torn edge, and that is the whole affordance — the one
   concession is `cursor: grab`, which is the platform's own vocabulary for
   "this is a physical thing", not a novelty cursor and not a tutorial.

   It carries two of the four interactions in this phase:

     DRAG   — Pointer Events and pointer capture, mouse and touch on one path,
              the position remembered across visits. See useDraggableObject.ts.
     HOLD   — 750ms, with the light on the sheet growing for the whole 750ms so
              the visitor knows something is underway well before it lands.

   And it hides the third: a faint ring on the background beneath it, which is
   revealed by occlusion alone. That mark is rendered by the layer, not by this
   component, precisely so that nothing here can ever animate it into being.

   ── The hold, and why it latches ───────────────────────────────────────────

   Completing the hold does not merely show the writing while a finger is down.
   On a phone the finger is ON the paper, covering most of it. So the reveal
   latches, and starts fading five seconds after the press ends — long enough
   to read one short sentence twice, short enough that the page returns to
   silence on its own. Moving the paper cancels it immediately: a hand that
   picks the note up has stopped reading it.

   ── Keyboard ───────────────────────────────────────────────────────────────

   The paper is a real <button>, so it is in the tab order and takes focus.
     Space (held)  the same gesture, the same 750ms, the same growing light
     Enter         reveals immediately, and hides again — for anyone who cannot
                   hold a key down, which is the point of having it
     Arrows        move the paper, 14px, or 56px with Shift. This is the
                   keyboard's version of dragging, and it is what makes the mark
                   underneath findable without a pointer.
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

/** How long the writing stays after the press ends. */
const REVEAL_LINGER_MS = 5000;

/** Keyboard travel per press, and with Shift held. */
const NUDGE_STEP = 14;
const NUDGE_STEP_LARGE = 56;

export function PaperFragment() {
  const ref = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();

  /* Read once, lazily, at mount — not on every render, and not through an
     effect. A second tab that moves the paper does not reach in and move it
     here: two copies of a physical object fighting over one position is worse
     than each remembering the last one to settle. */
  const [initial] = useState(() => readOffset(PAPER_OBJECT_ID));

  const [holding, setHolding] = useState(false);
  const [revealed, setRevealed] = useState(false);

  /* Mirrors of the two flags, for handlers that run before React has
     re-rendered — a hold that completes and is released in the same tick would
     otherwise never schedule its own fade. */
  const revealedRef = useRef(false);
  const pressing = useRef(false);
  const holdTimer = useRef<number | null>(null);
  const lingerTimer = useRef<number | null>(null);

  const clearHoldTimer = (): void => {
    if (holdTimer.current === null) return;
    window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  const clearLingerTimer = (): void => {
    if (lingerTimer.current === null) return;
    window.clearTimeout(lingerTimer.current);
    lingerTimer.current = null;
  };

  const setReveal = (next: boolean): void => {
    revealedRef.current = next;
    setRevealed(next);
  };

  const startLinger = (): void => {
    clearLingerTimer();
    lingerTimer.current = window.setTimeout(() => {
      lingerTimer.current = null;
      setReveal(false);
    }, REVEAL_LINGER_MS);
  };

  /** A press began. Idempotent, and a no-op while already revealed. */
  const beginHold = (): void => {
    pressing.current = true;
    clearLingerTimer();
    if (revealedRef.current || holdTimer.current !== null) return;

    setHolding(true);
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null;
      setHolding(false);
      setReveal(true);
      /* Released before the timer landed? Start the fade now. */
      if (!pressing.current) startLinger();
    }, HOLD_MS);
  };

  /** The press ended. An incomplete hold aborts cleanly and the light falls. */
  const endHold = (): void => {
    pressing.current = false;
    clearHoldTimer();
    setHolding(false);
    if (revealedRef.current) startLinger();
  };

  /** The paper was picked up. Whatever it was saying, it has stopped. */
  const abandonHold = (): void => {
    pressing.current = false;
    clearHoldTimer();
    clearLingerTimer();
    setHolding(false);
    setReveal(false);
  };

  /* `data-dragging` is written straight onto the element rather than rendered
     as a prop: picking the paper up must not go through React, since it is the
     one state change that happens while a gesture is in flight. `data-holding`
     and `data-revealed` are props because they change between gestures, not
     during one. */
  const drag = useDraggableObject(ref, {
    initial,
    reducedMotion,
    onDragStart: () => {
      abandonHold();
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
      clearLingerTimer();
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
        abandonHold();
        const x = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
        const y = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
        drag.nudge(x, y);
        return;
      }

      case " ": {
        /* Also stops the page scrolling, and stops the synthetic click that a
           button fires on keyup. */
        event.preventDefault();
        if (event.repeat) return;
        beginHold();
        return;
      }

      case "Enter": {
        event.preventDefault();
        if (revealedRef.current) {
          clearLingerTimer();
          setReveal(false);
          return;
        }
        setReveal(true);
        startLinger();
        return;
      }

      default:
        return;
    }
  };

  const onKeyUp = (event: ReactKeyboardEvent<HTMLButtonElement>): void => {
    if (event.key !== " ") return;
    event.preventDefault();
    endHold();
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
          drag.onPointerDown(event);
          beginHold();
        }}
        onPointerMove={drag.onPointerMove}
        onPointerUp={(event) => {
          drag.onPointerUp(event);
          endHold();
        }}
        onPointerCancel={(event) => {
          drag.onPointerUp(event);
          endHold();
        }}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={endHold}
      >
        {/* The sheet, and everything printed on it. It is a separate element
            from the button for one reason: it carries the torn `clip-path`,
            and a clip-path clips the focus outline too. Keeping the clip one
            level in leaves the button's own box unclipped, so a keyboard
            visitor gets a ring they can actually see. */}
        <span className={styles.sheet} aria-hidden="true">
          {/* The light that grows across the sheet for the whole 750ms. It is
              the feedback DURING the hold: something is happening, and it is
              not finished. */}
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
