import { starLabel, starSentence } from "./copy";

/* =============================================================================
   WHERE THE INTERACTIVE OBJECTS SIT — authored against the same page map
   =============================================================================

   Coordinates use the atmosphere's system exactly: `x` is a percentage of the
   VIEWPORT's width, `y` a percentage of the WHOLE DOCUMENT's height, and the
   layer they live in is an absolutely positioned, document-tall box anchored at
   the document origin — the same box the atmosphere uses, so a position here
   and a position in `composition.ts` mean the same thing.

   The page map that both files are composed against is the measured table at
   the top of `atmosphere/composition.ts`. It is not repeated here; read it
   there. The two regions used below:

     11.1–15.9%   about prose occupies x 51–88%  →  EMPTY at x 0–51%
     48.0–50.5%   the quote occupies x 36–88%    →  one star at x 5.5%, y 53.2%

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

   It sits just under the weather, in the emptiness the about prose creates by
   being pushed right, and it touches nothing.

   -----------------------------------------------------------------------------
   NARROW — MOVED, because it was covering her writing

   At 390px every block on the page spans x 8–92%, so there is no left margin to
   leave something in. The old anchor (42%, 21.4%) was chosen against the star
   composition's gap table, which was measured on an older, taller document —
   and on the page as it is now, 21.4% is inside the about prose. Measured at
   390×844 (document 3617px): the paper's box was y 686.6–861.5 and the about
   copy runs y 662.4–870.5. It covered TWENTY-NINE WORDS across five lines. At
   360×740 (document 3696px) it covered twenty-five.

   Nothing is worth that. The paper moved into the page's own gutter — the empty
   band between the end of the about section and the `01 / Journal` label, which
   is a structural gap rather than a lucky pocket, so it survives the copy being
   rewritten:

     390×844   text ends 933.2, next text begins 1153.2   →  25.80% – 31.88%
     360×740   text ends 977.6, next text begins 1197.6   →  26.45% – 32.40%

   The sheet is 176×132 here and sits at −2.8°, so the box that has to fit inside
   those 220px is 140.4px tall. Which leaves 40px of slack — and that is exactly
   where a percentage stops being good enough.

   -----------------------------------------------------------------------------
   WHY THE NARROW ANCHOR IS MEASURED AND NOT AUTHORED

   `y` is a percentage of the DOCUMENT, and the document's height changes with
   the width and with which font actually loaded. The gap does not: it is a fixed
   margin, exactly 220px at every narrow width. So the same gap sits at a
   different percentage on every phone. Measured in the running page:

     width   the gap's centre, as a % of the document
             PP Eiko present        deployed fallback
      320px  30.71%                 31.85%
      360px  29.43%                 30.02%
      390px  28.84%                 29.26%
      430px  26.41%                 27.67%
      540px  25.68%                 25.68%
      700px  22.61%                 22.61%
      767px  21.95%                 21.95%

   A ten-point spread against 40px of slack: there is no single number that
   works. 29.45% clears the text at 360 and 390 and sits ON the prose at 320,
   430, 540, 700 and 767 — the same bug being fixed here, moved to a different
   phone, and it would come back the first time the copy changed length.

   So the narrow anchor is MEASURED from the page at runtime — see `narrowGap`
   below and `useMeasuredAnchor` in `hooks.ts`. The paper is centred in whatever
   the gap actually is, which is 39.8px of clear darkness above and below it at
   every narrow width, in both font scenarios.

   The authored percentage stays as the fallback for a page where the
   measurement cannot be made at all. It is the value tuned for the two sizes in
   the brief: 0 words covered at both, 61.8/17.8px clearance at 390×844 and
   40.6/38.9px at 360×740.

   Horizontally it sits at 44%, right of `n-about-gap` (the defocused disc at
   x 10%) and clear of `n-quote-approach` (x 88%, y 33.4%).
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
  narrow: { x: "44%", y: "29.45%" },
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
 * `main h2#journal` is the `01 / Journal` label. The id is not decorative: it is
 * what the page's own navigation links to, so it is about as stable as an
 * attribute in someone else's component gets.
 *
 * `minimum` is the smallest gap worth using — the sheet's rotated height plus a
 * little clear darkness on both sides. A gap tighter than this is not a place to
 * leave something, so the fallback is used instead.
 */
export const narrowGap = {
  selector: "main h2#journal",
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
