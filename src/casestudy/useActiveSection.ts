import { useEffect, useState } from "react";

/**
 * WHICH SECTION THE READER IS LOOKING AT.
 *
 * The contents panel is only browsable if it tells you where you are, and a
 * panel that highlights the wrong entry is worse than one that highlights
 * nothing — it actively lies about your position in a long document.
 *
 * ── Why an IntersectionObserver and not a scroll handler ────────────────────
 *
 * A scroll handler runs on the main thread on every scroll event and then has
 * to measure, which forces layout at exactly the moment the browser is busiest.
 * The observer is told once what to watch and reports asynchronously, off the
 * critical path. This page also carries an animated atmosphere behind it, so
 * spending main-thread time per scroll frame is not free.
 *
 * ── The band, and why the margins are asymmetric ────────────────────────────
 *
 *   rootMargin: -14% 0px -72% 0px
 *
 * shrinks the viewport, for the purposes of the observer only, to a horizontal
 * BAND across the upper third of the screen — from 14% down to 28% of the way
 * down. A section is "current" when its box crosses that band, which is where a
 * reader's eye actually is: not at the very top edge (you are reading the thing
 * that just arrived, not the thing leaving) and not the middle (the heading has
 * long since gone by).
 *
 * A section TALLER than the band contains it entirely and therefore never
 * intersects it after the first crossing — which is why this keeps a map of
 * everything currently visible rather than reacting to one entry at a time, and
 * why it holds the last answer when the band is empty. Holding is correct: if
 * nothing is crossing the band, the reader is still inside whatever last did.
 *
 * @param ids Section element ids, IN DOCUMENT ORDER. The order is what breaks
 *   the tie when two sections cross the band at once — the first one down the
 *   page wins, which is the one the reader has scrolled to.
 */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return;

    /* Not `useState`: this is bookkeeping for the observer, it changes many
       times per scroll, and re-rendering on each change would defeat the point
       of using an observer at all. Only the DERIVED answer is state. */
    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }

        const first = ids.find((id) => visible.has(id));
        /* `undefined` means the band is empty — a tall section is spanning it.
           Keep the previous answer rather than clearing to null and making the
           panel's highlight blink out mid-section. */
        if (first !== undefined) setActive(first);
      },
      { rootMargin: "-14% 0px -72% 0px", threshold: 0 },
    );

    for (const element of elements) observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [ids]);

  return active;
}
