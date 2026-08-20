import styles from "./TextField.module.css";

/* =============================================================================
   SPLITTING THE PAGE'S TEXT — at runtime, from this layer, reversibly
   =============================================================================

   A wave that only draws a ring on top of the page is a decal. For a click to
   disturb the MEDIUM, the medium has to be made of pieces that can move, and on
   a text page the medium is the words. This file turns the page's copy into
   those pieces and — just as importantly — turns it back.

   ── Why this is done here rather than in the components ─────────────────────

   Every line of text on this page lives in `src/components`, `src/wall` and
   `Home.tsx`, none of which this layer owns. It could have been solved by
   exporting a `<SplitText>` component and threading it through nine files —
   which would now be eleven, and would have to be threaded again for every new
   wall renderer, which is its own argument. It should not
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

   The cost of that choice used to be paid in STRUCTURAL SELECTORS. This file
   reached into markup it does not own with things like `main article > h3 ~ p`,
   which are a contract with components that are free to change — and MVP 2
   changed them. The homepage became `Identity / Navigation / <Wall> / closing
   line`; seven of the nine rows in the table below stopped matching anything,
   nothing threw, and the page's words simply stopped moving. That silence is
   the failure mode structural selectors have, and the mitigation that every row
   may match nothing is what turned a crash into a feature quietly switching
   itself off.

   ── The hook that replaced them ─────────────────────────────────────────────

   The wall authors one, deliberately, for this file — `docs/wall-architecture.md`
   §8. Every text leaf inside a wall renderer carries

       data-text="display" | "body" | "meta"

   which is the typographic REGISTER, and the register is precisely what the
   amplitude column below is already a function of: "everything moves by about
   the same fraction of itself". So three rows of REGISTER replace seven rows of
   STRUCTURE, and the wall can be reordered, recomposed, refilled and restyled
   without this file being told. Adding a sixth item type does not touch it
   either — a new renderer marks its own leaves and is already covered.

   Two rules the renderers guarantee, and which this file is therefore allowed
   to rely on:

     1. `data-text` is always on the LEAF that owns the text, never on a
        container holding another one — so nothing can be split twice. Trusted,
        but not on trust alone: `splitPageText` refuses any element that
        contains or is contained by one it has already taken, because the two
        rows that are NOT part of that contract (`main h1`, `main > p`) live
        outside the wall and could one day be given an ancestor that is.
     2. `data-text` is never inside an `<a>`. This is why a `Link`'s title is
        marked on its wrapping `<h3>`: the row matches, the walker refuses to
        enter the anchor, and the title yields no pieces. That is the intended
        outcome and not an oversight — see rule 3 below.

   Two rows are still structural, and both name things that are OUTSIDE the wall
   and are not artifacts: the page's only `h1`, and its only direct child
   paragraph. They are the smallest structural surface the file can have while
   the identity block and the closing line remain outside the composition, and
   they are still allowed to match nothing.

   ── Mutating React's DOM, and why it is safe HERE ───────────────────────────

   React holds a reference to every text node it created. Replacing one behind
   its back is normally a bug: if React later updates that text, it writes to a
   node that is no longer in the document and the change silently does not
   appear. It is safe here because every string this file touches is STATIC —
   authored in `content/posts.ts` and `content/wall.ts`, both frozen literals in
   a module.

   The wall made that claim worth re-checking rather than inheriting, because it
   introduced a component that DOES re-render around split text: `WallImage`
   swaps its `<img>` for an empty `<div>` when the file is missing, which
   re-renders the whole `Memory` — including the `<p data-text="body">` whose
   text node this file has replaced. It is still safe, and the reason is exact:
   React writes to a text node only when the STRING changes, and `item.caption`
   is a literal in a frozen module, so reconciliation finds the child unchanged
   and touches nothing.

   Tested rather than reasoned about, because that is how the last two mistakes
   in this file were found. Every `<img>` on the wall was pointed at a URL that
   does not exist; the fallback `<div>` replaced it and the caption came through
   the re-render as the same `<p>` node, the same seven `<span>`s, the same 43
   characters, and still displaced 2.6px under a click and returned to zero.

   What WOULD break it is a wall renderer that interpolates state into marked
   text. There is none, and there should not be one.

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
      text, that string is unchanged, and it was checked: on the MVP 1 page, 22
      named nodes and 1230 characters of reading order, identical before and
      after. Re-checked on the wall page by toggling the preference around the
      split — `main.textContent` is 586 characters split and unsplit, and every
      block box on the page is at the same y to four decimal places. The
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
  /** Resolved against the document once, at mount. Prefer `[data-text]`; a
   *  structural selector is a last resort and must be able to match nothing. */
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
  /* --- OUTSIDE THE WALL. Structural, and knowingly so. ---------------------- */
  {
    selector: "main h1",
    amplitude: 8,
    note: "The name. 80px, the page's only h1, and the first thing anyone looks at. Not an artifact and never on the wall, so it has no register to be marked with.",
  },
  {
    selector: "main > p",
    amplitude: 4,
    note: "The closing line. Still the only direct paragraph child of <main> — the wall's own paragraphs are four levels deeper. If it ever becomes a blurb it will match nothing here and be picked up by the body row below at the same amplitude, which is why that is a safe thing for the lead to decide later.",
  },

  /* --- THE WALL. Register, not structure. See the header. ------------------- */
  {
    selector: 'main [data-text="display"]',
    amplitude: 7,
    note: "The display register: a featured blurb, a link's title. Large type surrounded by emptiness — this is where the disturbance is actually seen. A link title holds nothing but an anchor, so it matches and yields no pieces.",
  },
  {
    selector: 'main [data-text="body"]',
    amplitude: 8,
    note: "Reading copy — the intro's paragraphs, a caption, a note. RAISED 4 -> 8, measured rather than guessed: at amplitude 4 the peak displacement on a body word was 2.1px against the heading's 4.3, and 2px of travel on 17px type is invisible. The site owner reported the ripple as not working on the prose; it was working and too small to see. The intro is now most of the page's text, so this row matters more than it did when it only dressed a caption.",
  },
  {
    selector: 'main [data-text="meta"]',
    amplitude: 3.5,
    note: "Metadata. 10–11px tracked Instrument Sans; small type, small travel. MATCHES NOTHING TODAY — <Meta> cannot carry the attribute yet (wall-architecture §9.4), and the row is here so that the day it can, this file needs no edit.",
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
  const claimed: HTMLElement[] = [];

  for (const row of SPLIT_TABLE) {
    for (const element of document.querySelectorAll<HTMLElement>(row.selector)) {
      if (overlaps(claimed, element)) continue;
      claimed.push(element);

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
 * Has this element already been taken, or does it sit on either side of
 * something that has?
 *
 * Splitting the same text twice is the one way this file can produce genuinely
 * wrong output rather than merely less output: the second pass would find the
 * first pass's `<span>`s, wrap each of them again, and register a second
 * particle for the same word at a different amplitude — so the word would be
 * pushed by two waves that disagree, and the restore path would put back a text
 * node whose pieces are no longer siblings.
 *
 * The wall's contract already forbids nesting `data-text` (see the header) and
 * the register rows cannot collide with each other. This guards the case the
 * contract does not cover: `main h1` and `main > p` are outside the wall, and
 * neither the identity block nor the closing line is bound by it. Three lines
 * and one pass over a list that never exceeds a few dozen entries, once, at
 * mount.
 *
 * `contains` returns true for the element itself, so the exact-duplicate case —
 * two rows matching the same element — falls out of the same test.
 */
function overlaps(claimed: readonly HTMLElement[], element: HTMLElement): boolean {
  return claimed.some(
    (other) => other.contains(element) || element.contains(other),
  );
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
