import { starLabel, starSentence } from "./copy";

/* =============================================================================
   WHERE THE INTERACTIVE OBJECTS SIT — authored against the same page map
   =============================================================================

   Coordinates use the atmosphere's system exactly: `x` is a percentage of the
   VIEWPORT's width, `y` a percentage of the WHOLE DOCUMENT's height, and the
   layer they live in is an absolutely positioned, document-tall box anchored at
   the document origin — the same box the atmosphere uses, so a position here
   and a position in `composition.ts` mean the same thing.

   The page map both files were originally composed against was the measured
   table at the top of `atmosphere/composition.ts`. READ THAT TABLE AS HISTORY.
   MVP 2 replaced the page it describes — `about / 01 Journal / 02 Elsewhere`
   became a single `<Wall>` whose contents are authored in `src/content/wall.ts`
   and change without either file being told. `docs/wall-architecture.md` §8
   says the same thing about the star composition: not broken, but no longer
   composed against anything.

   What survives that, and what does not, is the whole subject of this file:

     A PERCENTAGE OF THE DOCUMENT does not survive it. The document's height is
     now a function of how many artifacts are on the wall.
     A MEASURED GAP does. The page's structural margins are declared in
     `Home.module.css` and do not move when the wall's contents do.

   The narrow anchor is already measured, for a different reason that turned out
   to be the same reason. See below. The wide anchor is not, and the hazard that
   creates is written down at the end of the next section.

   -----------------------------------------------------------------------------
   CLEARANCE — checked against every star, not assumed

   The paper is the only foreground object on the page and the brief's seventh
   review question applies hardest to it: what becomes quieter to make room?
   Nothing can, because the stars are not this agent's file to edit. So the
   paper was placed where it needs nothing to move.

   MEASURED in the rendered page at 1280×900 (document 4675px), against the
   sheet's rotated bounding box — x 168–395, y 537–726:

     about-void       x 109  y 626   →  59px clear of the left edge
     north-west       x 166  y 486   →  51px clear of the top edge
     about-void-low   x 269  y 804   →  78px clear of the bottom edge
     haze-north       its falloff ends at 11.2% of the page; the paper begins
                      at 11.5%, so the scrap sits just under the weather

   The visible torn shape is inset a further few pixels inside that box, so
   every figure above is a floor rather than an estimate.

   RE-MEASURED after the sheet grew to 184×148 — it had been clipping its own
   writing at 168×132, see the note in the stylesheet. Its rotated box at
   1280×900 is now x 185–378, y 555–714, and a sweep of every element in the
   document found NOTHING within 130px of it, in any direction, except the
   docked player. The star composition has moved since the table above was
   written; the paper still needs nothing to move.

   THE ONE THING IT DOES MEET is the player, which is pinned to the viewport
   rather than to the page, so at some scroll positions the paper passes behind
   it. That is not a collision to be designed out — two objects at different
   depths, one fixed and one in the page, passing each other is the depth model
   working — and the paint order is already correct, because `PlayerDock` is
   mounted after this layer in `App.tsx`. It predates the size change.

   RE-MEASURED AGAIN on the wall page, and this is a WARNING rather than a
   result. At 1280×900 the document is now 3106px, so 13.5% puts the sheet's
   rotated box at y 339.7–498.9, x 185.1–378.1. It covers nothing — a sweep of
   every text leaf in the document found the identity line 93px away and nothing
   else within 160px — and it does so by luck: the wall's box begins at y 519.1,
   twenty pixels below the paper's bottom edge. Same at 1440 (identical), and at
   1024 the clearance is 46px.

   THE HAZARD, with the arithmetic, because twenty pixels is not a margin. The
   wall's top edge is at a FIXED distance from the top of the document — it is
   the identity row plus two `--space-2xl` margins, and nothing on the wall can
   move it. The paper's y is a PERCENTAGE of a document the wall makes taller.
   So they converge, and the threshold is exact:

     0.135 · document + 79.6  >  519.1     →     document > 3255px

   The document is 3106px with three prototype artifacts on the wall. ONE MORE
   ARTIFACT OF ANY REAL SIZE PUTS THE PAPER INSIDE THE WALL, and whether it then
   covers writing is up to whatever is authored near the top of the composition.

   THE FIX IS THE ONE THE NARROW ANCHOR ALREADY USES and it is deliberately not
   applied here. The wide page has a real gutter to measure — the identity/nav
   row's bottom edge to the wall's top edge, 272px at 1280 (`row-gap: --space-2xl`
   plus `.wall`'s own `margin-block-start: --space-2xl`), which holds the 159.2px
   sheet with 56px of clear darkness on both sides. Centring the paper in it
   would move it 36px UP from where it sits today and pin it there for ever.

   That is a change to the desktop composition, not a bug fix: this object's wide
   position was composed against the star field — 59px clear of `about-void`,
   51px of `north-west`, 78px of `about-void-low`, and sitting just under
   `haze-north`'s falloff — and moving it 36px changes every one of those numbers
   in a file this agent does not own. It is also 168px at tablet widths, which is
   too small for the wide sheet and would fall back anyway. So it is REPORTED for
   the design lead with the threshold above rather than taken unilaterally. It is
   roughly fifteen lines: `useMeasuredAnchor` needs its property name to become a
   parameter, and `InteractionLayer` needs a second call.

   -----------------------------------------------------------------------------
   NARROW — MOVED TWICE, both times because it was covering her writing

   At 390px every block on the page spans x 8–92%, so there is no left margin to
   leave something in. The FIRST anchor (42%, 21.4%) was chosen against the star
   composition's gap table, which was measured on an older, taller document, and
   it landed inside the about prose: at 390×844 it covered twenty-nine words
   across five lines, at 360×740 twenty-five.

   So the paper moved into the page's own gutter — the 220px band between the end
   of one block and the beginning of the next, which is a structural gap rather
   than a lucky pocket, so it survives the copy being rewritten. That was the
   right move and it is still the right move. What it could not survive was the
   page being RESTRUCTURED: MVP 2 replaced `about / 01 Journal / 02 Elsewhere`
   with a single `<Wall>`, the gutter that anchor named stopped existing, the
   measurement below silently stopped resolving, and the paper fell back to a
   percentage measured against a document that no longer exists. Measured on the
   wall page at 390×844 (document 2200px), the fallback put the sheet's box at
   y 578–718.4, x 80.5–262.7, and the first wall memory's caption begins at
   y 699.5, x 83.9. It covered the words `a flower projection`.

   THE SECOND MOVE. There is exactly one gap left on the narrow page that is
   large enough and is declared rather than emergent, and it is the last one:

     `.wall`'s bottom edge  →  the closing line's top edge

   which is `row-gap: --space-xl` (84px) plus `.closing`'s
   `margin-block-start: --space-2xl` (136px) = 220px, both authored in
   `Home.module.css`. It is the same 220px the old gutter was, so the arithmetic
   below carries over unchanged. Every other candidate was measured and rejected:

     identity → nav        measured 104px at 390                          < minimum
     nav → wall            measured 136px (84 + `--space-lg` 52)          < minimum
     between wall items    authored per item in `src/content/wall.ts`     not stable
     below the closing     measured 396px, and empty — but it exists to
                           let the page scroll out from under the fixed
                           player, which is parked in it                  occupied

   WHAT THIS COSTS, stated rather than buried. On the old page that gutter sat at
   roughly 29% of the document — a third of the way down, found early. On the
   wall page the only gutter big enough is the last one, so on a phone the paper
   is now something a visitor meets at the END of the wall rather than partway
   through it. That is a real loss of discoverability and it is not fixable from
   this file: the fix is an authored empty band in the middle of the narrow wall,
   which is a composition decision in `src/content/wall.ts`. Flagged, not taken.

   -----------------------------------------------------------------------------
   WHY THE NARROW ANCHOR IS MEASURED AND NOT AUTHORED

   `y` is a percentage of the DOCUMENT, and the document's height changes with
   the width, with which font actually loaded, and now with every artifact hung
   on the wall. The gap does not: it is a fixed margin, exactly 220px at every
   narrow width. So the same gap sits at a different percentage on every phone,
   and at a different one again the next time anyone edits `wall.ts`. Measured in
   the running page, against the wall as it stands:

     width   document   the gap's centre, as a % of it
      320px  2290px     76.54%
      360px  2276px     76.39%
      390px  2198px     75.55%
      430px  2183px     75.39%
      540px  2263px     76.25%
      767px  2437px     77.95%

   A 2.6-point spread against 40px of slack — 76.5% happens to thread all six
   today, by 4.2px at the tightest. That is not a margin to build on, and it is
   the smaller problem anyway: the paper's gap sits a fixed ~537px above the
   bottom of the document, so its PERCENTAGE moves wholesale as the wall fills.
   The wall was two-thirds empty when the table above was taken. Double the
   document and every row in it moves about ten points.

   So the narrow anchor is MEASURED from the page at runtime — see `narrowGap`
   below and `useMeasuredAnchor` in `hooks.ts`. The sheet is 176×132 here and
   sits at −2.8°, so the box that has to fit inside those 220px is 140.4px tall,
   which leaves the paper 39.8px of clear darkness above and below it at every
   narrow width, in every font scenario, whatever is on the wall.

   The authored percentage stays as the fallback for a page where the measurement
   cannot be made at all, and it is openly a guess with a short shelf life. 76.5%
   is the widest-clearing value across the table above, verified by removing the
   measured property in the running page and re-reading the sheet's box — 0 words
   covered at any of the six, and clearance above/below of:

      320px  38.8 / 40.7      430px  64.1 / 15.5
      360px  42.1 / 37.5      540px  45.4 / 34.2
      390px  60.8 / 18.7      767px   4.2 / 75.4

   If a future reader finds those numbers no longer true, that is expected and
   costs nothing: the measurement is what actually runs. This is the value for a
   browser that has no `ResizeObserver` and a page whose closing line has moved,
   which is close to nobody.

   Horizontally it stays at 44%. On the wall page the narrow star secret
   (`n-closing`, x 87%, y 92.4%) is the nearest interactive thing to it, and the
   sheet's right edge is at 66.6% — 79px of clear space between them at 390px, so
   the paper can never sit on top of a discovery.
   ========================================================================== */

export interface Anchor {
  /** Percentage of the viewport's inline size. */
  readonly x: string;
  /** Percentage of the document's block size. */
  readonly y: string;
}

/**
 * The paper's authored resting place — and the mark beneath it, which is the
 * same coordinate by definition. One object, two anchors, chosen per breakpoint
 * in CSS rather than by a media-query listener in JS.
 *
 * This is where the paper is BEFORE anyone touches it, and where it returns to
 * if storage is unavailable, full, or holding something that fails validation.
 */
export const paperAnchor = {
  wide: { x: "22%", y: "13.5%" },
  narrow: { x: "44%", y: "76.5%" },
} as const satisfies Record<string, Anchor>;

/** Identifies the paper's saved offset inside the stored position map. */
export const PAPER_OBJECT_ID = "paper";

/**
 * THE NARROW ANCHOR, MEASURED. The reasoning is in the header; this is the
 * contract.
 *
 * The paper is centred in the empty band between the end of a block and the
 * beginning of the next one — the page's own gutter, which is a structural fact
 * rather than a lucky pocket, so it survives the copy being rewritten.
 *
 * `selector` names the element the gap ENDS at, and the gap begins at whatever
 * element precedes it. This is a structural selector reaching into markup this
 * layer does not own, exactly like the table in `textSplit.ts`, and it carries
 * the same two mitigations: it lives in one place, and it is allowed to match
 * nothing — a page where it does not resolve falls back to the authored
 * percentage above rather than throwing or placing the object nowhere.
 *
 * `main > p` is the CLOSING LINE, and the gap is therefore the one between the
 * bottom of the wall and the top of the last words on the page. It is the same
 * claim `textSplit.ts` makes with the same selector, and it is true for the same
 * reason: the closing line is the only direct paragraph child of `<main>`, while
 * every paragraph on the wall is four levels deeper inside it. `Home.tsx` is
 * four elements long and the architecture says loudly that it must not grow, so
 * this is about as stable as a structural selector can be — and if the lead ever
 * does turn the closing line into a `blurb`, the selector stops matching AND the
 * gap stops existing, so falling back is the correct answer rather than a
 * degradation.
 *
 * This deliberately does NOT use `[data-wall]`, which would be the more
 * fashionable hook: the wall root is an only child, so it has no previous
 * sibling, and the gap wanted is the one AFTER it. Naming the element the gap
 * ENDS at is what the hook is built around.
 *
 * `minimum` is the smallest gap worth using — the sheet's rotated height (140.4px)
 * plus a little clear darkness on both sides. A gap tighter than this is not a
 * place to leave something, so the fallback is used instead. It is also what
 * rejects the 136px nav → wall gap if this selector is ever re-pointed at it by
 * someone reading only the code.
 */
export const narrowGap = {
  selector: "main > p",
  minimum: 190,
} as const;

/* -----------------------------------------------------------------------------
   THE HIDDEN STAR
   -----------------------------------------------------------------------------
   ONE star answers a click, and it is `quote-witness` — x 5.5%, y 53.2%, a
   1.25px pinprick at intensity 0.2, the DIMMEST object on the page, alone below
   the quote and outside its left edge. Its note in composition.ts says it
   "witnesses the silence instead of filling it".

   It was chosen over the bloom, which is brighter, larger, and already the
   page's one pointer-reactive object — making it the secret too would spend
   two effects on one star and advertise the secret with the reaction. It was
   chosen over the closer, easier stars because a secret that is stumbled on
   immediately is not one.

   The sentence it reveals refers to the star itself. That is the whole reward:
   the visitor learns that the faintest thing on the page knew it was faint.

   THE ONLY HINT IS THE CURSOR. No glow, no hover brightening, no scale, no
   custom cursor — the hit area is a plain button, so a pointer passing within
   22px turns into a hand, and that is the entire advertisement. Keyboard
   visitors get a focus ring instead, which is the same hint by another route.

   NARROW gets `n-closing` — x 87%, y 92.4%, the last object on the mobile page,
   "one point of light before the closing line, and a lot of nothing". Same
   idea, same sentence, and the two are mutually exclusive: each is display:none
   at the other's width, so a hidden button is never a phantom tab stop.
   -------------------------------------------------------------------------- */

export interface StarSecretData {
  /** The star's id in `atmosphere/composition.ts`. Kept identical so the two
   *  files can be diffed by eye if the composition ever moves. */
  readonly id: string;
  /** Which composition this star belongs to. Mirrors the atmosphere's
   *  breakpoint at 48rem. */
  readonly presence: "wide" | "narrow";
  readonly position: Anchor;
  /** Which side of the star the sentence unfolds toward. `end` for a star near
   *  the right edge, so the line never runs off the page. */
  readonly side: "start" | "end";
  readonly label: string;
  readonly sentence: string;
}

export const starSecrets: readonly StarSecretData[] = [
  {
    id: "quote-witness",
    presence: "wide",
    position: { x: "5.5%", y: "53.2%" },
    side: "start",
    label: starLabel,
    sentence: starSentence,
  },
  {
    id: "n-closing",
    presence: "narrow",
    position: { x: "87%", y: "92.4%" },
    side: "end",
    label: starLabel,
    sentence: starSentence,
  },
];
