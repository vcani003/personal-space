import { useEffect, useRef, useState } from "react";
import type { StarSecretData } from "./placement";
import type { StyleVars } from "./vars";
import styles from "./StarSecret.module.css";

/* =============================================================================
   THE STAR THAT SAYS SOMETHING
   =============================================================================

   One star on the page answers a click with a sentence. Which one, and why that
   one, is argued in `placement.ts`; this file is only the mechanism.

   It is a plain <button> with nothing in it, sitting exactly where the star is,
   44px across so a finger can find it and so a cursor changes shape about 22px
   before it arrives. That cursor change is the ONLY hint the page gives. There
   is no glow, no hover brightening, no scale, no ring, no cursor of our own
   invention and no second affordance of any kind — per the brief's seventh
   question, a hidden object with a surprising interaction does not also need
   every signal that it is one.

   The star itself is not touched. It belongs to the atmosphere, which is
   `pointer-events: none` and `aria-hidden` by design and is not this layer's to
   reach into. This is a hit area laid over the same coordinate, carrying the
   same parallax travel as the depth the star lives at, so the two stay together
   as the field shifts.

   NOT GAMIFIED. Nothing is counted, nothing is unlocked, nothing is stored,
   nothing announces that a thing was found, and finding it a second time is
   exactly like finding it the first. The reward for the discovery is the
   discovery.
   ========================================================================== */

/** How long the sentence stays before it begins to leave. Long enough to read
 *  twice at an unhurried pace. */
const LINGER_MS = 5200;

/** Mirrors --duration-transition-slow. Only used to decide when the words may
 *  leave the DOM — a beat after they have finished fading, so a screen reader
 *  is never handed an empty live region mid-announcement. */
const FADE_MS = 700;

export function StarSecret({ secret }: { secret: StarSecretData }) {
  /** The words exist in the DOM. */
  const [text, setText] = useState("");
  /** The words are on screen. Separate, because fading out takes time and
   *  removing the text at the same moment would make it vanish instead. */
  const [visible, setVisible] = useState(false);

  const hideTimer = useRef<number | null>(null);
  const clearTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
      if (clearTimer.current !== null) window.clearTimeout(clearTimer.current);
    },
    [],
  );

  const reveal = (): void => {
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    if (clearTimer.current !== null) window.clearTimeout(clearTimer.current);

    setText(secret.sentence);
    setVisible(true);

    hideTimer.current = window.setTimeout(() => {
      hideTimer.current = null;
      setVisible(false);
      clearTimer.current = window.setTimeout(() => {
        clearTimer.current = null;
        setText("");
      }, FADE_MS);
    }, LINGER_MS);
  };

  const style: StyleVars = {
    "--secret-x": secret.position.x,
    "--secret-y": secret.position.y,
  };

  return (
    <span
      className={styles.secret}
      style={style}
      data-presence={secret.presence}
      data-side={secret.side}
      data-visible={visible ? "true" : "false"}
    >
      <button
        type="button"
        className={styles.hotspot}
        aria-label={secret.label}
        onClick={reveal}
      />
      {/* A live region that is empty until there is something to say. The
          sentence is visible text and announced text at once — one element, so
          it can never be read twice. */}
      <p className={styles.sentence} aria-live="polite">
        {text}
      </p>
    </span>
  );
}
