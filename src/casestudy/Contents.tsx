import { useCallback } from "react";
import { Meta } from "../components/Meta";
import { useReducedMotion } from "../interaction/hooks";
import { CONTENTS, SECTION_IDS } from "./outline";
import { useActiveSection } from "./useActiveSection";
import styles from "./Contents.module.css";

/**
 * THE CONTENTS PANEL — the thing that makes a long document browsable.
 *
 * Modelled on a documentation sidebar rather than on anything else on this
 * site, and that is deliberate: a case study is a reference someone returns to,
 * jumps around inside, and reads out of order. The homepage's rules do not
 * apply to it, and pretending they do would produce a beautiful document nobody
 * can navigate.
 *
 * ── Three things it must do, in order of how badly it fails without them ────
 *
 * 1. BE REAL LINKS. Every entry is an `<a href="#id">`. Not a button, not a
 *    div with a handler. That is what makes ⌘-click open a second copy, what
 *    puts the anchor in the address bar so a section can be sent to someone,
 *    and what makes the whole panel work before — or without — JavaScript.
 *    The click handler below is an ENHANCEMENT over that, in the same shape as
 *    `router/Link.tsx`, and it defers to the browser for every modified click.
 *
 * 2. SAY WHERE YOU ARE. See `useActiveSection`. `aria-current="location"` is
 *    the correct value here — not `page`, which would claim the section is a
 *    separate page, and not `true`, which says nothing about what kind of
 *    current it is.
 *
 * 3. MOVE FOCUS, NOT JUST SCROLL. Jumping to an anchor scrolls a sighted
 *    reader and does nothing at all for a keyboard or screen-reader one: the
 *    viewport moves and the focus ring stays behind in the panel, so the next
 *    Tab returns to where they started. The handler focuses the destination
 *    heading, which is the whole reason it is worth writing.
 *
 * ── On narrow screens it is a disclosure, not a column ──────────────────────
 *
 * There is no room for a persistent sidebar on a phone, and a contents panel
 * that eats the first screenful means the document opens with a list instead of
 * a sentence. So it collapses to a `<details>` — closed, one line, above the
 * body. `<details>` rather than a custom toggle because the open/closed state,
 * the keyboard behaviour and the announcement come free and correct.
 */

export function Contents() {
  const active = useActiveSection(SECTION_IDS);
  const reducedMotion = useReducedMotion();

  /* Scroll and focus, together. The browser does the first and skips the
     second; doing both by hand is the only way to get them consistent, and it
     also lets the scroll honour the motion preference — `scrollIntoView`
     inherits `scroll-behavior` from CSS otherwise, which cannot be set for one
     page in a single bundled stylesheet without leaking site-wide. */
  const jumpTo = useCallback(
    /* `string`, not `SectionId`. The ids reaching here come from the outline's
       widened view, and narrowing the parameter would only move a cast into the
       call site — the guarantee that this id exists is upheld by the outline
       being the single source of both the panel and the sections, not by this
       signature. */
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = document.getElementById(id);
      if (target === null) return;

      event.preventDefault();

      /* ── THE SMOOTH-SCROLL WATCHDOG ─────────────────────────────────────
         `behavior: "smooth"` is not guaranteed to do anything. Some engines,
         embedded browser views and automation contexts accept the call and
         never move the page — measured here, in the preview browser, where a
         smooth request left `scrollY` at 0 while the identical `"instant"`
         request scrolled 9,438px.

         A contents panel that silently fails to navigate is far worse than one
         that jumps, and the failure is invisible in the environment you happen
         to be developing in. So the smooth scroll is requested, and if the page
         has not moved a frame or two later it is done instantly instead.

         When the target is already at the top, `scrollY` legitimately does not
         change and the fallback fires — into a scroll that is already where it
         is asking to go, which is a no-op. */
      const before = window.scrollY;
      const behavior = reducedMotion ? "instant" : "smooth";
      target.scrollIntoView({ behavior, block: "start" });

      if (behavior === "smooth") {
        window.setTimeout(() => {
          if (window.scrollY === before) {
            target.scrollIntoView({ behavior: "instant", block: "start" });
          }
        }, 200);
      }

      /* `replaceState`, not `pushState`. Reading a document and skipping
         between its parts should not fill the back button with twenty entries
         a reader then has to press their way out of — but the URL should still
         be shareable at any moment. */
      window.history.replaceState(null, "", `#${id}`);

      const heading = target.querySelector<HTMLElement>("[data-section-heading]");
      if (heading === null) return;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      heading.addEventListener(
        "blur",
        () => {
          heading.removeAttribute("tabindex");
        },
        { once: true },
      );
    },
    [reducedMotion],
  );

  const list = (
    <nav className={styles.nav} aria-label="Contents">
      {CONTENTS.map((part) => (
        <div className={styles.part} key={part.number}>
          <Meta as="h2" size="sm" tracking="wide" className={styles.partTitle}>
            <span className={styles.partNumber}>{part.number}</span>
            {part.title}
          </Meta>
          <ul className={styles.entries} role="list">
            {part.entries.map((entry) => (
              <li key={entry.id}>
                <a
                  className={styles.entry}
                  href={`#${entry.id}`}
                  aria-current={active === entry.id ? "location" : undefined}
                  onClick={(event) => {
                    jumpTo(event, entry.id);
                  }}
                >
                  <span className={styles.entryTitle}>{entry.title}</span>
                  {entry.flag === true && (
                    <>
                      {/* The emoji is decoration to a screen reader — "black
                          flag" tells nobody anything — so it is hidden and the
                          note beside it is what gets announced. A visitor
                          hovering it gets the same sentence as a tooltip. */}
                      <span
                        className={styles.flag}
                        aria-hidden="true"
                        title={entry.flagNote}
                      >
                        🚩
                      </span>
                      <span className="visually-hidden">
                        {" "}
                        — needs review: {entry.flagNote}
                      </span>
                    </>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <div className={styles.column}>{list}</div>
      <details className={styles.disclosure}>
        <summary className={styles.summary}>
          <Meta as="span" tracking="wide">
            Contents
          </Meta>
        </summary>
        {list}
      </details>
    </>
  );
}
