import styles from "./TextField.module.css";

/* =============================================================================
   SPLITTING THE PAGE'S TEXT — at runtime, from this layer, reversibly
   =============================================================================

   A wave that only draws a ring on top of the page is a decal. For a click to
   disturb the MEDIUM, the medium has to be made of pieces that can move, and on
   a text page the medium is the words. This file turns the page's copy into
   those pieces and — just as importantly — turns it back.

   ── Why this is done here rather than in the components ─────────────────────

   Every line of text on this page lives in `src/components` and `Home.tsx`,
   which this layer does not own. It could have been solved by exporting a
   `<SplitText>` component and threading it through nine files. It should not
   be, for three reasons that would still hold if the ownership boundary went
   away tomorrow:

     1. THE SPLIT IS NOT PART OF THE CONTENT. `Identity.tsx` renders a name. The
        fact that one interaction wants that name in fifteen pieces is a
        property of the interaction, not of the name, and putting it in the
        component makes every future reader of that file think about a wave.
     2. IT MUST NOT EXIST AT ALL UNDER REDUCED MOTION. A component that splits
        at render has to be told the preference, so the preference becomes a
        prop, a context, or worse a global — and the DOM restructuring ships
        into the markup of people who asked for less motion. Doing it here means
        the page's own markup is the reduced-motion markup, and splitting is
        something that happens TO it afterwards, live, when the preference
        allows.
     3. THE SERVER-RENDERED / NO-JS PAGE STAYS CLEAN. Nothing about the document
        the browser first parses knows this feature exists.

   The cost of that choice is honest and is named here: this file reaches into
   markup it does not own using STRUCTURAL SELECTORS (`main article > h3 ~ p`),
   which are a contract with components that are free to change. Two mitigations
   — the table below is the single place that contract lives, and every row is
   allowed to match nothing, so a component reshuffle degrades to "that
   paragraph stopped rippling" rather than to an exception. The long-term hook
   is a `data-` attribute authored on the elements themselves, exactly as
   `Ripple.tsx` already proposes `[data-no-ripple]` for the player; adding it is
   a change in files this agent does not own.

   ── Mutating React's DOM, and why it is safe HERE ───────────────────────────

   React holds a reference to every text node it created. Replacing one behind
   its back is normally a bug: if React later updates that text, it writes to a
   node that is no longer in the document and the change silently does not
   appear. It is safe here because every string this file touches is STATIC —
   authored in `content/posts.ts`, rendered once, never re-rendered. The only
   stateful thing anywhere near it is `ImageEntry`'s missing-file fallback,
   which removes an `<img>` inside a `<div>` this file never enters.

   The restore path is what keeps that from rotting. `restore()` puts back the
   ORIGINAL `Text` node objects — not equivalent copies — so after a round trip
   React's fibers point at the exact nodes they always did, and the DOM is
   character-for-character what it was. That is what makes toggling reduced
   motion mid-session, and React 19's StrictMode double-mount, both non-events.

   ── The three rules the split obeys ─────────────────────────────────────────

   1. WHITESPACE IS NEVER WRAPPED. Spaces stay in the parent as their own text
      nodes, between the pieces. Line breaking happens at those spaces exactly
      as before, and text copied out of the page is byte-identical — a wrapper
      that swallowed its trailing space would silently rewrite what people
      paste.
   2. NOTHING GAINS AN ATTRIBUTE. No `aria-hidden`, no `aria-label`, no `role`,
      no `tabindex`, no `data-`, no inline style until a wave actually moves the
      piece. The accessible name of every element is the concatenation of its
      text, that string is unchanged, and it was checked: 22 named nodes and
      1230 characters of reading order, identical before and after. The
      alternative — `aria-label` on the parent and `aria-hidden` on the pieces,
      as most splitting libraries do — is only valid on elements that support
      naming, which `<p>` does not, and it replaces real text content with an
      announced string. It is not needed at word granularity, which is one of
      the reasons word granularity is the only one here. See the table below.
   3. INTERACTIVE SUBTREES ARE NOT ENTERED. Links most of all: a link's
      underline is drawn by the inline box, and atomic inline-level boxes do not
      receive a propagated `text-decoration` or a parent's `border-block-end`,
      so splitting inside `<a>` would visibly break the one affordance on this
      page that has to look like an affordance. It would also put the link's
      accessible name at the mercy of every screen reader's word heuristics for
      the sake of an effect. Links do not ripple. That is a fine answer.
   ========================================================================== */

/* CSS Modules is typed as an index signature, so every lookup is
   `string | undefined` under `noUncheckedIndexedAccess`. The class is declared
   in `TextField.module.css` and cannot actually be missing; resolving it once,
   here, keeps the assertion in one place instead of at every use. */
const WORD_CLASS = styles.word ?? "";

interface SplitRow {
  /** A structural selector, resolved against the document once, at mount. */
  readonly selector: string;
  /**
   * Peak displacement in px, before the wave's own falloff — which takes about
   * a third of it back, so the numbers here are roughly 1.5× what is ever seen.
   */
  readonly amplitude: number;
  /** Why this row exists. Required, in the spirit of `composition.ts`. */
  readonly note: string;
}

/* =============================================================================
   ONE GRANULARITY: THE WORD. And the three measurements that decided it.
   =============================================================================

   This started as two tiers — per word for prose, per LETTER for the short
   display lines, on the reasoning that those are a handful of characters each
   and the register where the effect would actually be seen. That is a good
   argument and it is wrong, and it was measured rather than argued about. Three
   independent findings, all in Chrome, all reproducible:

   1. A LETTER SPLIT BREAKS THE ACCESSIBLE TEXT.
      `Accessibility.getFullAXTree` on the split page returned one `StaticText`
      node PER CHARACTER — `S`, `o`, `m`, `e` — and every heading's accessible
      name became `V e r o n i c a  C a n i d o`, because Chrome inserts a space
      between atomic inline boxes when it builds text from contents. A screen
      reader would spell the page out.

      There is an escape, but only for headings: hide the pieces and restore the
      string as an `aria-label`, which puts the computed name back exactly. It
      does NOT work for paragraphs — `aria-label` on a `<p>` is not announced
      when the document body is read — so the quote and the closing line would
      have had to stay per-word regardless.

   2. A LETTER SPLIT LOSES KERNING, AND THE AMOUNT IS NOT COSMETIC.
      Each atomic box is shaped on its own, so no kern pair that straddles a
      boundary applies. Measured against PP Eiko Thin:

        `Veronica Canido`               80px   566.00 → 573.56px   (+1.34%)
        `Notes toward a quieter…`       28px   371.48 → 375.02px   (+0.95%)
        `Some things are only visible…` 56px   617.80 → 619.73px   (+0.31%)

      Setting `font-kerning: none` on the unsplit text reproduced those widths
      to within a tenth of a pixel, which is what identifies kerning as the
      cause rather than something incidental.

   3. THAT WIDTH CHANGE REFLOWS THE PAGE. At a 390px viewport the identity
      heading has 326px to sit in and is 324.61px wide — 1.39px of slack. A
      letter split makes it 328.9px, so it wraps, and the whole page below it
      moves down 47.7px. `text-wrap: balance` was doing exactly what it should;
      there simply was not room.

   A WORD SPLIT HAS NONE OF THAT, and the same measurements say so:

        accessible names, 22 named nodes            IDENTICAL
        reading order, 1230 characters              IDENTICAL
        every block box, both breakpoints           0.0000px change
        `Veronica Canido` at 390px                  324.61 → 324.63px
        copied text, every block                    byte-identical

   Kerning across a SPACE is the only thing a word split can lose, and there
   almost never is any; the worst measured change on the whole page is 0.16px.
   Inside a word — which is where kerning does its work — it is fully intact.

   So: one tier, the word, everywhere including the 80px name. The visual
   difference is real and it is smaller than it sounds. What moves is a line of
   text on a disturbed surface, and at 80px two words swelling apart reads very
   nearly the same as fifteen letters doing it.

   HOW TO GET LETTERS BACK, if a future reader decides the trade is worth
   reopening: the blocker is (3), not (1) — (1) has a known fix for headings.
   The fix for (3) is to pin each word wrapper to its ORIGINAL width in `em`,
   measured before the split, so the line's metrics are exactly preserved and
   only the letters inside drift. That needs `document.fonts.ready` before
   splitting and roughly forty more lines. It was not built, because the payoff
   is a 1% nicer disturbance on two headings.

   AMPLITUDES rise with type size rather than being uniform, because 4px is a
   quarter of a 16px word and a twentieth of an 80px one. The intent is that
   everything moves by about the same FRACTION of itself, so the page reads as
   one surface rather than as prose being shoved around under a calm heading.
   ========================================================================== */

const SPLIT_TABLE: readonly SplitRow[] = [
  {
    selector: "main h1",
    amplitude: 8,
    note: "The name. 80px, and the first thing anyone looks at.",
  },
  {
    selector: "main article > h3",
    amplitude: 5.5,
    note: "A journal title. The link titles are also h3 and hold nothing but an anchor, so they match this row and yield no pieces.",
  },
  {
    selector: "main blockquote p",
    amplitude: 7,
    note: "The quote. 56px and surrounded by emptiness — the page's one event.",
  },
  {
    selector: "main h2",
    amplitude: 3.5,
    note: "Section labels. 11px tracked metadata; small type, small travel.",
  },
  {
    selector: "main > p",
    amplitude: 4,
    note: "The closing line. The last thing on the page, and the only italic on the site.",
  },
  {
    selector: "main section > div > p",
    amplitude: 4,
    note: "The about copy.",
  },
  {
    selector: "main article > div > p",
    amplitude: 4,
    note: "Journal prose.",
  },
  {
    selector: "main article > h3 ~ p",
    amplitude: 4,
    note: "A link's description. The sibling combinator is what excludes the metadata line, which sits BEFORE the title.",
  },
  {
    selector: "main figcaption > p",
    amplitude: 4,
    note: "A photograph's caption. Filtered below, because a quote's attribution is also a figcaption paragraph and belongs to the metadata register.",
  },
];

/**
 * Subtrees the walker refuses to enter.
 *
 * Links and controls for the reason in the header. `[role]` and `[tabindex]`
 * catch anything that has been given interactive semantics without being one of
 * these tags — the same defensive list `Ripple.tsx` uses to decide what is not
 * the surface, and for the same reason: a click on one of these means
 * something, and text that means something should not be taken apart.
 */
const OPAQUE =
  'a, button, input, select, textarea, label, summary, [contenteditable], [role], [tabindex], [aria-hidden="true"], .visually-hidden';

/** One movable piece of the page. */
export interface Particle {
  readonly element: HTMLElement;
  /** Peak displacement in px, from its row in the table. */
  readonly amplitude: number;
  /** Centre, in DOCUMENT coordinates. Measured outside the frame loop. */
  x: number;
  y: number;
  /** Current displacement in px. */
  currentX: number;
  currentY: number;
  /** The last string written to `style.translate`; `""` means the property is
   *  absent and the piece is exactly where the page put it. */
  published: string;
}

/** One text node that was taken apart, and everything needed to put it back. */
interface Seam {
  readonly text: Text;
  readonly pieces: readonly ChildNode[];
}

export interface TextField {
  readonly particles: readonly Particle[];
  /** Returns the document to the markup React rendered. Idempotent. */
  restore: () => void;
}

/**
 * Split the page's copy into movable pieces.
 *
 * Runs once, in an effect, after React has committed. Reads the DOM and writes
 * to it; it does not measure anything — positions are cached lazily by the wave
 * engine at the moment they are first needed, so the cost of a resize is zero
 * until somebody clicks.
 */
export function splitPageText(): TextField {
  const particles: Particle[] = [];
  const seams: Seam[] = [];
  const claimed = new Set<Element>();

  for (const row of SPLIT_TABLE) {
    for (const element of document.querySelectorAll<HTMLElement>(row.selector)) {
      if (claimed.has(element)) continue;
      if (!eligible(element)) continue;
      claimed.add(element);

      for (const text of textNodesOf(element)) {
        splitTextNode(text, row.amplitude, particles, seams);
      }
    }
  }

  let restored = false;
  return {
    particles,
    restore: () => {
      if (restored) return;
      restored = true;
      for (const seam of seams) restoreSeam(seam);
    },
  };
}

/**
 * The one exception the table cannot express as a selector.
 *
 * `figcaption > p` is a photograph's caption in one place and a quote's
 * attribution in another, and the second is metadata — 10px, dim, deliberately
 * almost gone. Nothing about the two elements differs except what they are
 * inside, so the test is what they are inside. (`figure:not(:has(blockquote))`
 * would say the same thing in the selector; this says it in a sentence.)
 */
function eligible(element: HTMLElement): boolean {
  if (element.closest("figcaption") === null) return true;
  return element.closest("figure")?.querySelector("blockquote") == null;
}

/**
 * Every text node inside `element` that is not inside something opaque.
 *
 * Whitespace-only nodes are skipped — JSX produces them between elements and
 * they are not words. They are also left exactly where they are, which is part
 * of why line breaking is unaffected.
 */
function textNodesOf(element: HTMLElement): Text[] {
  const found: Text[] = [];

  const walk = (node: Node): void => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child as Text;
        if (text.data.trim().length > 0) found.push(text);
        continue;
      }
      if (child instanceof Element && !child.matches(OPAQUE)) walk(child);
    }
  };

  walk(element);
  return found;
}

/**
 * `"Some things"` → `<span>Some</span>` + `" "` + `<span>things</span>`.
 *
 * No `Intl.Segmenter`, no locale awareness, no punctuation splitting: a run of
 * whitespace separates words, and `Vero.` is one piece including its full stop
 * because that is what moves together on a line of type.
 *
 * The capturing group in the split is what keeps the whitespace: it comes back
 * as its own entry and is re-inserted as a plain text node between the pieces,
 * never inside one. That single detail is why selection still spans the
 * paragraph, why copied text has exactly the spaces it always had, and why the
 * browser still has the same set of line-break opportunities it started with.
 */
function splitTextNode(
  text: Text,
  amplitude: number,
  particles: Particle[],
  seams: Seam[],
): void {
  const pieces: ChildNode[] = [];

  for (const part of text.data.split(/(\s+)/)) {
    if (part === "") continue;

    if (part.trim().length === 0) {
      pieces.push(document.createTextNode(part));
      continue;
    }

    const word = document.createElement("span");
    word.className = WORD_CLASS;
    word.textContent = part;
    pieces.push(word);
    particles.push(particle(word, amplitude));
  }

  if (pieces.length === 0) return;

  text.replaceWith(...pieces);
  seams.push({ text, pieces });
}

function particle(element: HTMLElement, amplitude: number): Particle {
  return {
    element,
    amplitude,
    x: 0,
    y: 0,
    currentX: 0,
    currentY: 0,
    published: "",
  };
}

/**
 * Put the original text node back where its pieces are.
 *
 * Defensive about the parent having gone away: if React has since unmounted the
 * paragraph there is nothing to restore into, and that is not an error.
 */
function restoreSeam(seam: Seam): void {
  const first = seam.pieces[0];
  const parent = first?.parentNode;
  if (first === undefined || parent == null) return;

  parent.insertBefore(seam.text, first);
  for (const piece of seam.pieces) piece.remove();
}
