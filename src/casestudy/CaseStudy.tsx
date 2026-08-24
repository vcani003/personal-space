import type { ReactNode } from "react";
import { Meta } from "../components/Meta";
import { type SectionId, titleOf } from "./outline";
import styles from "./CaseStudy.module.css";

/* =============================================================================
   THE CASE STUDY PRIMITIVES
   =============================================================================

   A small, closed set of things a case study is allowed to be made of. Closed
   on purpose: a document format with fifteen block types drifts into a
   different design on every page, and the second case study — the product
   design one — has to be recognisably the same object as this one.

   Every one of them consumes the DOCUMENT REGISTER from tokens.css. None
   writes a colour, a size or a duration.
   ========================================================================== */

/**
 * The shell: a masthead across the top, then the contents panel beside the
 * document.
 *
 * THE MASTHEAD IS A SEPARATE GRID CHILD, spanning both columns, and that is a
 * narrow-screen decision rather than a wide-screen one. The contents panel has
 * to come before the document in the DOM so it lands in the left column without
 * `order` tricks — but on a phone the columns collapse into one, and a document
 * that opens with a contents list instead of its own title is a document whose
 * first screenful says nothing about what it is. Pulling the title out above
 * both fixes the stacking order at source.
 */
export function CaseStudy({ children }: { children: ReactNode }) {
  return <div className={styles.layout}>{children}</div>;
}

/** The title block. One per case study, and it spans the full width. */
export function Masthead({ children }: { children: ReactNode }) {
  return <header className={styles.header}>{children}</header>;
}

/**
 * A part heading — `01 / ORIENTATION`. Purely a divider in the reading column;
 * the contents panel is what makes the parts navigable, so this one does not
 * need to be a link target and deliberately is not.
 */
export function Part({ number, title }: { number: string; title: string }) {
  return (
    <Meta as="h2" tracking="wide" className={styles.part}>
      {number} / {title}
    </Meta>
  );
}

/**
 * A SECTION, and the anchor the contents panel points at.
 *
 * It takes an id and NOT a title: the title comes from `contents.ts`, so the
 * panel and the heading are the same string by construction rather than by
 * somebody remembering. See the header of that file.
 *
 * `scroll-margin-block-start` (in the stylesheet) is what stops a jumped-to
 * heading landing flush against the top edge of the window with its own eyebrow
 * cut off above the fold.
 */
export function Section({
  id,
  children,
  flagged = false,
}: {
  id: SectionId;
  children: ReactNode;
  /** Draws the same 🚩 the contents panel shows, so the mark is findable from
      inside the document as well as from the panel. */
  flagged?: boolean;
}) {
  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-heading`}>
      <h3
        id={`${id}-heading`}
        className={styles.heading}
        data-section-heading
        tabIndex={-1}
      >
        {titleOf(id)}
        {flagged && (
          <span className={styles.headingFlag} aria-hidden="true">
            {" "}
            🚩
          </span>
        )}
      </h3>
      {children}
    </section>
  );
}

/** Reading copy. */
export function P({ children }: { children: ReactNode }) {
  return <p className={styles.p}>{children}</p>;
}

/** The one larger paragraph that opens a section. At most one per section. */
export function Lead({ children }: { children: ReactNode }) {
  return <p className={styles.lead}>{children}</p>;
}

/** An unordered list of short statements. */
export function List({ children }: { children: ReactNode }) {
  return <ul className={styles.list}>{children}</ul>;
}

/** A numbered sequence where the order is the meaning. */
export function Steps({ children }: { children: ReactNode }) {
  return <ol className={styles.steps}>{children}</ol>;
}

export function Item({ children }: { children: ReactNode }) {
  return <li className={styles.item}>{children}</li>;
}

/** Inline code — an identifier, a message name, a field. */
export function C({ children }: { children: ReactNode }) {
  return <code className={styles.code}>{children}</code>;
}

/** A block of code or a shape. `label` names what it is. */
export function Pre({ children, label }: { children: string; label?: string }) {
  return (
    <figure className={styles.preWrap}>
      {label !== undefined && (
        <Meta as="figcaption" size="sm" className={styles.preLabel}>
          {label}
        </Meta>
      )}
      {/* `tabindex` on a scrollable region: a code block that scrolls
          horizontally must be reachable by keyboard, or its right-hand half is
          mouse-only. Safari and Firefox do not do this automatically. */}
      <pre className={styles.pre} tabIndex={0} role="group" aria-label={label}>
        <code>{children}</code>
      </pre>
    </figure>
  );
}

/**
 * A DECISION — the claim and the reason under it.
 *
 * Borrowed in spirit from the `<dl>` on the project pages, and for the same
 * reason: a claim and its justification are structurally a pair, and a screen
 * reader should hear them as one.
 */
export function Decision({
  claim,
  children,
}: {
  claim: ReactNode;
  children: ReactNode;
}) {
  return (
    <dl className={styles.decision}>
      <dt className={styles.claim}>{claim}</dt>
      <dd className={styles.because}>{children}</dd>
    </dl>
  );
}

/**
 * PLAIN TERMS — the jargon, explained where it is used.
 *
 * House rule, and it is not a stylistic one: a term someone cannot define is a
 * term they nod at. This site's readers include people who do not build
 * distributed systems for a living, and every one of "authoritative clock",
 * "drift", "preflight" and "input authority" is a word that quietly loses them.
 *
 * Set apart rather than in parentheses so it can be skipped by anyone who
 * already knows, which is the other half of doing this well.
 */
export function Plain({ term, children }: { term: string; children: ReactNode }) {
  return (
    <aside className={styles.plain}>
      <Meta as="span" size="sm" className={styles.plainLabel}>
        In plain terms
      </Meta>
      <p className={styles.plainBody}>
        <strong className={styles.plainTerm}>{term}</strong> — {children}
      </p>
    </aside>
  );
}

/**
 * WHAT ACTUALLY HAPPENED — the outcome, beside the prediction that preceded it.
 *
 * This is the device the whole document is built on. Each constraint is written
 * FORWARD, in the voice it was reasoned in before anything was built, and then
 * one of these says what building it turned up. Neither half is edited to make
 * the other look better: where a prediction was wrong, it stays on the page and
 * the note says so.
 *
 * That pairing is the thing a reader cannot get anywhere else. A plan alone is
 * a guess; a write-up of a finished system alone is a tidy story with the
 * mistakes removed. The two together are evidence of how someone actually
 * works.
 *
 * Kept SHORT on purpose — two or three sentences. The moment one of these grows
 * into its own argument it stops being a footnote on the prediction and starts
 * competing with it, and the forward voice is what gives the page its shape.
 */
export function Actually({ children }: { children: ReactNode }) {
  return (
    <aside className={styles.actually}>
      <Meta as="span" size="sm" className={styles.actuallyLabel}>
        What actually happened
      </Meta>
      <div className={styles.actuallyBody}>{children}</div>
    </aside>
  );
}

/**
 * A REVIEW BLOCK — an open question addressed to Vero, inside the document.
 *
 * The contents panel's 🚩 gets you here; this is what you find. It states the
 * conflict, quotes both sides, and says what it is blocking, because "needs
 * review" without those three things is a note that never gets actioned.
 *
 * It is visually the loudest thing in the document ON PURPOSE and it is
 * TEMPORARY. Each of these is deleted when its question is answered — they are
 * working annotations on a draft, not a permanent feature of the page, and none
 * of them should survive to whatever version goes out to readers.
 */
export function Review({ children }: { children: ReactNode }) {
  return (
    <aside className={styles.review}>
      <Meta as="p" tracking="wide" className={styles.reviewLabel}>
        <span aria-hidden="true">🚩 </span>Needs your call
      </Meta>
      <div className={styles.reviewBody}>{children}</div>
    </aside>
  );
}

/**
 * A FIGURE. Wraps a diagram or an image with its caption.
 *
 * The caption is not optional here, unlike on the project pages. A diagram of a
 * system is not self-evident the way a screenshot is: the caption says what the
 * reader is meant to take from it, and a diagram whose point has to be inferred
 * is a diagram that will be inferred wrongly.
 */
export function Figure({
  caption,
  children,
}: {
  caption: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className={styles.figure}>
      <div className={styles.figureBody}>{children}</div>
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
}

/**
 * A PICTURE THAT DOES NOT EXIST YET.
 *
 * Deliberately drawn as an empty frame with a note in it rather than left out,
 * because an absent figure is invisible and an obviously-missing one is a task.
 * `what` says what should go here and, where it matters, where to get it.
 *
 * These are placeholders in a draft. Every one is either replaced with a real
 * asset or the section is rewritten not to need it before this page is
 * finished.
 */
export function PicturePlaceholder({
  what,
  source,
}: {
  what: string;
  /** Where the image comes from — a screen to capture, a file to export. */
  source?: string;
}) {
  return (
    <div className={styles.placeholder} role="img" aria-label={`Placeholder: ${what}`}>
      <Meta as="span" size="sm" tracking="wide" className={styles.placeholderLabel}>
        Pic placeholder
      </Meta>
      <p className={styles.placeholderWhat}>{what}</p>
      {source !== undefined && (
        <p className={styles.placeholderSource}>{source}</p>
      )}
    </div>
  );
}

/**
 * A TABLE. Wrapped in its own scroll container, because a table is the one
 * block that cannot be made narrower without becoming unreadable, and a table
 * that widens the PAGE breaks every other line's measure.
 */
export function Table({
  caption,
  head,
  children,
}: {
  caption?: string;
  head: readonly string[];
  children: ReactNode;
}) {
  return (
    <div className={styles.tableWrap} tabIndex={0} role="group" aria-label={caption}>
      <table className={styles.table}>
        {caption !== undefined && (
          <caption className={styles.tableCaption}>{caption}</caption>
        )}
        <thead>
          <tr>
            {head.map((cell) => (
              <th key={cell} scope="col">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
