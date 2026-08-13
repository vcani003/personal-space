import type { Composition, GlowSource, HazeMass, StarObject } from "./types";

/* =============================================================================
   THE ENVIRONMENT — authored, not generated
   =============================================================================

   THE PAGE THIS IS COMPOSED AGAINST

   MEASURED, not estimated. Every figure below came out of the real rendered
   page (headless Chrome, 1280×900, document 4698px tall). Percentages are of
   the WHOLE DOCUMENT; `x` is a percentage of the viewport.

     y            x           what
     2.9– 5.3%    4–64%       identity
     3.1– 3.5%   79–96%       nav
     5.3–11.0%   ── THE LARGE EMPTY BAND, full width ──────────────
    11.0–20.0%   51–88%       about prose            EMPTY 0–51%
    12.0–15.0%   15–29%       the paper fragment's resting box
    20.0–25.8%   ── empty, full width ─────────────────────────────
    25.8–29.8%    4–64%       01 / Journal + entry   EMPTY 64–100%
    29.8–34.5%   ── empty, full width ─────────────────────────────
    34.5–44.3%   51–96%       photograph             EMPTY 0–51%
    44.3–52.0%   ── the quote's silence above ─────────────────────
    52.0–54.5%   36–88%       THE QUOTE
    54.5–62.1%   ── the quote's silence below ─────────────────────
    62.1–64.8%   20–57%       project link           EMPTY 57–100%
    65.0–74.9%   59–88%       drawing slot (space reserved, art pending)
    74.9–80.7%   ── empty, full width ─────────────────────────────
    80.7–81.0%    4–17%       02 / Elsewhere
    82.6–83.2%   20–49%       @starcharm link        EMPTY 49–100%
    83.2–90.9%   ── empty, full width ─────────────────────────────
    90.9–91.6%   36–72%       the closing line
    91.6–100%    ── empty, full width, ~395px ─────────────────────

   RE-MEASURED after the player was undocked from the page. It is now a FIXED
   322×219 object in the viewport's bottom-left corner rather than a section at
   68–75%, so the band that used to be reserved for it is now ordinary page and
   the map above is the one to compose against.

   THE PLAYER STILL HAS A CLAIM, though, and it is a harder one to satisfy. A
   fixed object is at a different document position on every frame of a scroll:
   everything below about 16% of the page passes behind it at some point, so
   "keep this document band clear" is no longer a rule that can be stated.

   What replaces it is a rule about the LEFT COLUMN. The page has no horizontal
   scroll — the atmosphere root is `overflow: clip` precisely so that nothing
   can create one — so an X COORDINATE MEANS THE SAME THING IN BOTH SPACES even
   though a Y COORDINATE DOES NOT. The dock sits at viewport x 2.5–27.6%, and
   that column can be protected at every scroll position even though its band
   cannot. Three things enforce it:

     · Neither light is placed left of x 43%.
     · `haze-descent`, the only new mass below the fold, starts at x 37%.
     · The mottle is damped to about half strength across the left edge — see
       THE HORIZONTAL LENS in Atmosphere.module.css.

   MEASURED, in the dock's own column at a scroll where the new weather is
   directly behind it: the field went from 10.3 to 16.1 out of 255 before the
   lens and sits at 14.7 with it, against a player chassis that means 21.6 and
   peaks at 54.7 with its own edge stroke and outer glow on top. The silhouette
   is thinner than it was and it is not in danger. This is the honest version of
   the old constraint rather than a restatement of it, and the number is written
   down here so the next person can tell whether they have spent it.

   These shift when the content does. They are not fragile: nothing here is
   placed within 1% of anything, and every star sits in a region several
   percent deep. Re-measure if a section is added or a body of copy doubles.

   -----------------------------------------------------------------------------
   WHY THE ENVIRONMENT IS ANCHORED TO THE DOCUMENT, NOT THE VIEWPORT

   A viewport-fixed star field is wallpaper by construction. Its stars have no
   relationship to anything on the page: scroll far enough and one of them will
   sit inside the quote, or on the player's screen, and there is nothing you
   can do about it — the composition changes every frame you scroll. You cannot
   author "almost nothing near the quote" into a layer that does not know where
   the quote is.

   So the whole environment spans the document and scrolls with it. Every star
   keeps a fixed relationship to the composition it was placed against, which
   is the entire premise of "stars are objects, not wallpaper."

   The cost is that scrolling gives no depth cue on its own — at 1:1 the sky
   moves exactly like the text. That cost is paid back three ways: by SIZE,
   by FOCUS (a defocused near star beside a sharp far pinprick), and later by
   pointer parallax, which is a depth cue that does not require the reader to
   scroll to perceive it. Depth here is compositional, not kinetic.

   -----------------------------------------------------------------------------
   WHERE THE EMPTINESS IS, ON PURPOSE

   THE QUOTE (44.3–62.1%). Exactly one star, below it, outside its left edge,
   and the dimmest object on the page. No haze, no light, and the mottle is
   masked down to a tenth of its strength across the whole band. The quote's
   224px of silence above and below is the composition's most expensive
   gesture; anything placed inside it spends that silence to decorate it.

   THE ENDING (83.2–100%). The closing line at 90.9% keeps 376px of clear page
   above it and 395px below, no haze reaches it, no light is near it, and the
   mottle fades out from 92%. The closing line arrives after real silence and is
   meant to be missable. Fog there announces it.

   THE DRAWING SLOT (65–74.9%, x 59–88%). Still reserved and still empty — 465px
   of held space for art that has not arrived. Weather is allowed to touch its
   lower edge, so that whatever eventually lands there has something to emerge
   from, but nothing is placed inside it.

   -----------------------------------------------------------------------------
   WHAT CHANGED IN THIS PASS, AND WHY IT IS ALLOWED TO

   The site owner, on seeing the page: "it would be nice to have a hazier affect
   or a glow in some spots? not like a gradient but something to give more
   character and life to the page (this may be setting into some
   background/wallpapery noise which is ok)."

   Three things in that. LOCALISED — spots, not a wash. NOT A GRADIENT — the
   smooth radial masses were exactly what she was rejecting, so they now have
   irregular silhouettes and noise-masked interiors. And an explicit relaxation
   of the brief's anti-wallpaper constraint, from the only person who can grant
   it: hence THE MOTTLE in Atmosphere.module.css.

   The previous pass ended with two masses of haze in the top third and nothing
   at all below 33%. The trade it made — "the closing line should arrive after
   real silence" — was the right trade for the question being asked then and is
   the wrong one now. So a third and fourth mass are back, and the ending is
   protected by DISTANCE rather than by absence: the lowest mass stops at 82.9%,
   which is 376px clear of the closing line.

   The consequence, restated: atmosphere is still DENSEST in the top third, and
   the page still ends in silence. What changed is that the middle and the lower
   third are no longer empty of everything, and that the darkness itself now has
   grain to it in the places the composition can afford.
   ========================================================================== */

/* -----------------------------------------------------------------------------
   STARS — WIDE (≥768px). Sixteen.
   -----------------------------------------------------------------------------
   Depth census: 10 far, 5 mid, 1 near. Most things are distant and quiet; one
   thing is near, soft and out of focus. One star blooms. That ratio is the
   interaction hierarchy from the brief applied to light.
   -------------------------------------------------------------------------- */

const starsWide: readonly StarObject[] = [
  /* -- Above the name, in the top gutter ----------------------------------- */
  {
    id: "north-lintel",
    kind: "pinprick",
    depth: "far",
    position: { x: "62%", y: "2.3%" },
    size: "2.25px",
    intensity: 0.6,
    tone: "lavender",
    note: "Above the content entirely, in the top gutter between the name's column and the nav's. The first thing on the page is not the name — it is a faint distant point above it.",
  },

  /* -- The large empty band under the name (5.3–11.1%) --------------------- */
  {
    id: "north-bloom",
    kind: "bloom",
    depth: "mid",
    position: { x: "24%", y: "7.4%" },
    size: "3.5px",
    intensity: 0.88,
    behavior: { pointerReactive: true },
    note: "The page's one bloom, and its light source. Centred in the largest empty region, left of centre, inside the first viewport — so the opening atmospheric statement is a single point of light rather than a texture. THE ONLY POINTER-REACTIVE OBJECT ON THE PAGE: it brightens about an eighth of a stop as the pointer comes within 200px. Chosen because it is the one object already asking to be looked at, it is the only one wide enough (96px of bloom) for a 13% opacity change to register at all, and it sits inside the first viewport in the empty band the pointer crosses on the way from the name to the prose — so it is found by accident rather than hunted for. It is still the only object that answers the pointer with anything other than MOVEMENT — every star travels with the pointer at its depth's parallax, and every star is nudged aside when the cursor passes within 140px of it, but this is the one that changes what it looks like.",
  },
  {
    id: "north-companion",
    kind: "pinprick",
    depth: "far",
    position: { x: "33.5%", y: "9.6%" },
    size: "2.25px",
    intensity: 0.66,
    note: "Offset companion to the bloom. A lone point reads as an accident; an unequal pair reads as composed.",
  },
  {
    id: "north-west",
    kind: "soft",
    depth: "mid",
    position: { x: "13%", y: "10.4%" },
    size: "3px",
    intensity: 0.7,
    note: "Low and far left in the same band, below the about prose's left edge. It carries the eye down and left, which is where the page is about to become empty.",
  },

  /* -- The emptiness the about prose creates by sitting right (11.1–21.7%) - */
  {
    id: "about-void",
    kind: "pinprick",
    depth: "far",
    position: { x: "8.5%", y: "13.4%" },
    size: "2.25px",
    intensity: 0.56,
    note: "The about text is pushed to x 51–88% specifically to leave the left empty. This occupies that emptiness without filling it, which is what makes the choice read as deliberate.",
  },
  {
    id: "about-void-low",
    kind: "pinprick",
    depth: "far",
    position: { x: "21%", y: "17.2%" },
    size: "2px",
    intensity: 0.44,
    tone: "lavender",
    note: "The dimmer half of that pair, further in and lower, so the left margin gets a diagonal rather than a column.",
  },

  /* -- Right of the journal entry (21.7–30.4%) ----------------------------- */
  {
    id: "journal-margin",
    kind: "soft",
    depth: "mid",
    position: { x: "86%", y: "23.2%" },
    size: "3.25px",
    intensity: 0.7,
    note: "The journal entry stops at x 64%; this sits out in the margin it leaves, level with the entry's first lines.",
  },
  {
    id: "journal-margin-far",
    kind: "pinprick",
    depth: "far",
    position: { x: "76%", y: "27.4%" },
    size: "2.25px",
    intensity: 0.5,
    note: "Below and inboard of it, in the gap before the photograph, so the pair does not read as two stars stuck to the right edge.",
  },

  /* -- Left of the photograph (30.4–40.3%) --------------------------------- */
  {
    id: "photo-far-west",
    kind: "pinprick",
    depth: "far",
    position: { x: "6%", y: "31.8%" },
    size: "2px",
    intensity: 0.42,
    tone: "lavender",
    note: "At the very edge of the page, dim enough to be uncertain. The horizontal vignette eats most of it, which is the point of putting it there.",
  },
  {
    id: "photo-defocus",
    kind: "defocused",
    depth: "near",
    position: { x: "15%", y: "35.4%" },
    size: "15px",
    intensity: 0.5,
    note: "The only near object on the page: a light outside the focal plane, opposite the photograph. It is what gives a sharp photograph something to be sharp against.",
  },
  {
    id: "photo-pin",
    kind: "pinprick",
    depth: "far",
    position: { x: "29%", y: "39.6%" },
    size: "2.5px",
    intensity: 0.62,
    note: "A hard point beside the defocused disc, and the last object before the quote's silence begins. Sharp next to blurred is the depth cue; neither reads as depth alone.",
  },

  /* -- THE QUOTE (44–56%). ONE. -------------------------------------------- */
  {
    id: "quote-witness",
    kind: "pinprick",
    depth: "far",
    position: { x: "5.5%", y: "53.2%" },
    size: "1.75px",
    intensity: 0.3,
    tone: "lavender",
    note: "The single star allowed anywhere near the quote: below it, far outside its left edge, and the dimmest object on the page. It witnesses the silence instead of filling it.",
  },

  /* -- Right of the project link (58.2–65%) -------------------------------- */
  {
    id: "project-margin",
    kind: "soft",
    depth: "mid",
    position: { x: "84%", y: "63.2%" },
    size: "3px",
    intensity: 0.62,
    note: "Level with the project link, out in the margin it leaves at x 57–100%. Atmosphere restarting after the quote's silence, quietly. MOVED DOWN from 59.8% in the re-measure: the about prose grew, everything below it slid, and the quote's silence now runs to 62.1% — this star was sitting inside it. Nothing may sit inside it.",
  },
  {
    id: "project-margin-far",
    kind: "pinprick",
    depth: "far",
    position: { x: "92%", y: "63.4%" },
    size: "2px",
    intensity: 0.42,
    note: "The last object before the hole. Everything below this until 82% is deliberately empty.",
  },

  /* -- 65–82% IS EMPTY. THE PLAYER AND THE DRAWING SLOT LIVE THERE. -------- */

  /* -- After the player (82–100%) ------------------------------------------ */
  {
    id: "elsewhere-east",
    kind: "defocused",
    depth: "mid",
    position: { x: "89%", y: "87.4%" },
    size: "10px",
    intensity: 0.34,
    tone: "lavender",
    note: "The first object after the hole, 330px clear of the drawing slot's bottom edge and level with the Elsewhere link, which leaves everything right of x 49% empty. Soft and very dim: it reopens the atmosphere without announcing that it had stopped.",
  },
  {
    id: "closing-pin",
    kind: "pinprick",
    depth: "far",
    position: { x: "12%", y: "94.6%" },
    size: "2.25px",
    intensity: 0.46,
    note: "The last object on the page, above and opposite the closing line rather than beside it. The page ends on a point of light and a lot of nothing.",
  },

  /* ===========================================================================
     DENSITY PASS — added after the site owner found the field too sparse:
     "not expecting a full galaxy or night sky but something that feels like
     oh this is in space / personal space (should feel fuller)".

     Sizes and intensities across the whole field were raised ~50% and ~40% in
     the same pass; this block is the count half of that answer, taking the wide
     composition from 16 stars to 31.

     Kept in one block, ordered top to bottom, rather than merged into the
     regional groups above — so it stays obvious what was authored against the
     original composition and what was added to fill it out, and so this can be
     trimmed in one place if it goes too far.

     EVERY ONE sits in a band the map marks as empty. The three protected zones
     are untouched and must stay that way:
       48.0–58.2%   the quote and its silence  (only `quote-witness`, dimmest)
       66.7–80.3%   the player and the drawing slot  (NOTHING, ever)
       ~12–15% at x 15–29%   the paper fragment's resting box
     =========================================================================== */

  /* -- The large empty band (5.3–11.1%) — it was weighted left; these give it
        a right-hand half. --------------------------------------------------- */
  {
    id: "north-east-high",
    kind: "pinprick",
    depth: "far",
    position: { x: "78%", y: "6.2%" },
    size: "2px",
    intensity: 0.42,
    note: "The band runs full width but every original star sat left of centre, so the right half of the page opened with nothing above the nav. This answers the bloom across the gap.",
  },
  {
    id: "north-east",
    kind: "pinprick",
    depth: "far",
    position: { x: "88%", y: "9.4%" },
    size: "2.25px",
    intensity: 0.5,
    note: "Lower and further out, so the right side gets a diagonal rather than a stack.",
  },
  {
    id: "north-mid",
    kind: "pinprick",
    depth: "far",
    position: { x: "52%", y: "10.2%" },
    size: "1.75px",
    intensity: 0.34,
    tone: "lavender",
    note: "Dim, centre-page, closing the distance between the bloom and the eastern pair so the band reads as one field instead of two clusters.",
  },

  /* -- The gap below the about prose (15.9–21.7%) --------------------------- */
  {
    id: "about-gap-east",
    kind: "soft",
    depth: "mid",
    position: { x: "74%", y: "22.4%" },
    size: "3px",
    intensity: 0.6,
    note: "Beneath where the prose ends. A mid-depth soft point here gives the right side something with presence, which it lacked between the nav and the journal margin. MOVED DOWN from 19.1% in the re-measure: the about copy grew to 20% and this was landing behind the last line of it.",
  },
  {
    id: "about-gap-far",
    kind: "pinprick",
    depth: "far",
    position: { x: "41%", y: "20.4%" },
    size: "2px",
    intensity: 0.4,
    note: "Centre-left and dimmer, so the gap is not just an edge-to-edge pair.",
  },

  /* -- The gap below the journal entry (25.7–30.4%) ------------------------- */
  {
    id: "journal-gap-west",
    kind: "pinprick",
    depth: "far",
    position: { x: "12%", y: "27.6%" },
    size: "2.25px",
    intensity: 0.48,
    note: "Far left, in the margin the journal entry leaves when it starts at x 20%.",
  },
  {
    id: "journal-gap-east",
    kind: "pinprick",
    depth: "far",
    position: { x: "69%", y: "29.3%" },
    size: "2px",
    intensity: 0.4,
    tone: "lavender",
    note: "Opposite and lower, just above the photograph's top edge.",
  },

  /* -- The empty left of the photograph (30.4–40.3%) ------------------------ */
  {
    id: "photo-void-low",
    kind: "pinprick",
    depth: "far",
    position: { x: "27%", y: "37.8%" },
    size: "2px",
    intensity: 0.42,
    note: "The photograph occupies x 51–96% and leaves the left half empty for nine percent of the page. Three stars up there and none down here made the lower half of that void read as the field simply stopping.",
  },

  /* -- Approaching the quote's silence (40.3–48%) --------------------------- */
  {
    id: "quote-approach",
    kind: "pinprick",
    depth: "far",
    position: { x: "93%", y: "41.2%" },
    size: "1.75px",
    intensity: 0.3,
    note: "The ONLY addition anywhere near the quote, and deliberately the faintest star on the page: high in the approach, far out at the right edge, and well outside the quote's own x 36–88%. The silence still belongs to the quote — this is the last thing seen before it, not company for it.",
  },

  /* -- Right of the project link (58.2–60.9%) ------------------------------- */
  {
    id: "project-void-east",
    kind: "pinprick",
    depth: "far",
    position: { x: "13%", y: "68.4%" },
    size: "2.25px",
    intensity: 0.5,
    note: "MOVED, and across the page. It sat at x 82% / y 59.4%, which the re-measure put inside the quote's silence. It now occupies the left margin beside the drawing slot — the slot runs x 59–88%, so the whole left half of that ten-percent band is empty and had nothing in it at all.",
  },

  /* -- The last band before the player (60.9–66.7%) ------------------------- */
  {
    id: "pre-player-west",
    kind: "pinprick",
    depth: "far",
    position: { x: "14%", y: "62.8%" },
    size: "2px",
    intensity: 0.44,
    note: "The field thins deliberately as the player approaches, so this is small and low-contrast — the beginning of the fade into the empty band rather than a full stop at its edge.",
  },
  {
    id: "pre-player-east",
    kind: "soft",
    depth: "mid",
    position: { x: "76%", y: "64.6%" },
    size: "3px",
    intensity: 0.58,
    note: "The last object with any real presence before the hole. After this the page goes quiet for fourteen percent of its height.",
  },

  /* -- After the player, before Elsewhere (80.3–86.1%) ---------------------- */
  {
    id: "post-player-west",
    kind: "pinprick",
    depth: "far",
    position: { x: "22%", y: "85.6%" },
    size: "2.25px",
    intensity: 0.46,
    note: "Reopening the field on the left, opposite `elsewhere-east` which reopens it on the right, so the atmosphere returns from both sides rather than one. MOVED DOWN from 83.2%, which the re-measure put directly on the @starcharm link.",
  },
  {
    id: "post-player-east",
    kind: "pinprick",
    depth: "far",
    position: { x: "71%", y: "84.4%" },
    size: "2px",
    intensity: 0.38,
    tone: "lavender",
    note: "Dim, between the two, filling what was a 330px vertical gap with nothing in it.",
  },

  /* -- The run down to the closing line (88.7–96.4%) ------------------------ */
  {
    id: "closing-approach",
    kind: "soft",
    depth: "mid",
    position: { x: "16%", y: "91.2%" },
    size: "3px",
    intensity: 0.52,
    note: "The page's final stretch was one pinprick across eight percent of its height. This gives the descent to the closing line something to pass.",
  },
];

/* -----------------------------------------------------------------------------
   STARS — NARROW (<768px). Six.
   -----------------------------------------------------------------------------
   Measured the same way (390×844, document 3662px). At this width every block
   on the page spans x 8–92%, so the desktop's left and right margins — where
   almost every wide star lives — simply do not exist. The narrow page's
   emptiness is VERTICAL, and its composition is therefore built out of the
   gaps BETWEEN sections rather than the space beside them:

      4.4– 7.2%   name → nav
      7.7–11.4%   nav → about
     18.4–24.4%   about → journal          ← generous
     43.5–46.6%   photograph → quote
     54.5–60.5%   project → currently      ← generous
     81.5–87.6%   drawing → elsewhere      ← generous
     89.4–95.4%   elsewhere → closing      ← generous

   Six stars into six gaps, alternating left and right so the eye zig-zags
   down the column. Nothing in 43.5–54.5% (the quote) and nothing in
   60.5–81.5% (the player and the drawing slot).

   Two depth layers, far and mid — no near layer — and NO bloom: at 390px a
   96px bloom is a quarter of the screen and stops being atmosphere.
   -------------------------------------------------------------------------- */

const starsNarrow: readonly StarObject[] = [
  {
    id: "n-north",
    kind: "soft",
    depth: "mid",
    position: { x: "78%", y: "5.6%" },
    size: "3px",
    intensity: 0.7,
    note: "In the gap between the wrapped name and the nav. The one small glow mobile gets, standing in for the desktop's bloom.",
  },
  {
    id: "n-north-low",
    kind: "pinprick",
    depth: "far",
    position: { x: "12%", y: "9.7%" },
    size: "2.25px",
    intensity: 0.52,
    note: "Opposite side of the next gap down, so the top of the column reads as a diagonal rather than a list.",
  },
  {
    id: "n-about-gap",
    kind: "defocused",
    depth: "mid",
    position: { x: "10%", y: "21.4%" },
    size: "11px",
    intensity: 0.36,
    note: "The one soft, out-of-focus object on mobile, in the deep gap between the about prose and the journal. Mobile keeps the focus cue and drops everything else.",
  },
  {
    id: "n-quote-approach",
    kind: "pinprick",
    depth: "far",
    position: { x: "88%", y: "33.4%" },
    size: "2px",
    intensity: 0.4,
    note: "DENSITY PASS. The narrow page ran from the about gap at 21.4% to the project at 57.6% with nothing in between — a third of the page. This sits well above the quote (46.6–48.2%) and hard against the right edge, so the quote's silence is untouched.",
  },
  {
    id: "n-project",
    kind: "pinprick",
    depth: "far",
    position: { x: "89%", y: "57.6%" },
    size: "2px",
    intensity: 0.44,
    note: "In the gap after the project link. The last object before the player.",
  },
  {
    id: "n-after-player",
    kind: "pinprick",
    depth: "far",
    position: { x: "11%", y: "84.5%" },
    size: "2.25px",
    intensity: 0.46,
    note: "The first object after the drawing slot clears. Nothing at all between here and 60.5%.",
  },
  {
    id: "n-closing",
    kind: "pinprick",
    depth: "far",
    position: { x: "87%", y: "92.4%" },
    size: "2.25px",
    intensity: 0.44,
    note: "The ending, same idea as wide: one point of light before the closing line, and a lot of nothing.",
  },
];

/* -----------------------------------------------------------------------------
   HAZE — four masses on wide, two on narrow.
   -----------------------------------------------------------------------------
   The weather, and the only thing on the page that moves — at roughly a third
   of a pixel per second.

   A MASS IS NOT A RADIAL FALLOFF ANY MORE. `form` picks one of three authored
   fractal-noise fields (see THE FORMS in Haze.module.css); the silhouette is
   three unequal offset lobes and the interior varies in density by a factor of
   three across the mass. That is the change the site owner's "not like a
   gradient" is asking for, and it is why the mass count could go up without the
   page simply getting brighter: two of the four new/kept masses are DIMMER than
   the pair they replace, and they carry their presence in structure instead.

   THE THIRD AND FOURTH MASSES ARE THE RESTORATION OF SOMETHING THAT WAS CUT.
   The previous pass removed a low mass on the grounds that "the closing line
   should arrive after real silence". That is still true, and it is still
   honoured — `haze-descent` stops at 82.9%, and the closing line is at 90.9%,
   376px below the last thing that touches it. What was wrong was concluding
   from "the ending must be silent" that the entire bottom two-thirds must be.
   -------------------------------------------------------------------------- */

const haze: readonly HazeMass[] = [
  {
    id: "haze-north",
    depth: "far",
    position: { x: "27%", y: "8.4%" },
    size: { inline: "60vw", block: "460px" },
    intensity: 0.44,
    presence: "wide",
    form: "bank",
    drift: "slowest",
    note: "Weather in the empty band under the name — its visible falloff lands at 3.5–13.3%, which is that band plus a little. It sits IN FRONT of the bloom star (layer 2 over layer 1), so the brightest point on the page is seen through atmosphere, and that is what makes it read as far away rather than as a dot. `bank`, because the opening should feel like weather lying across the page rather than a cloud hanging in it.",
  },
  {
    id: "haze-journal-margin",
    depth: "far",
    position: { x: "88%", y: "27.5%" },
    size: { inline: "34vw", block: "560px" },
    intensity: 0.3,
    presence: "wide",
    form: "column",
    drift: "slow",
    note: "The right margin beside the journal entry, which occupies x 71–105% and so never crosses the entry's text at x 20–64%. Its lower edge grazes the photograph's top corner, giving the photograph something to emerge from. `column` — the only tall narrow mass on the page, and the form exists because a wide one squeezed into a 435px margin reads as a mistake rather than as fog.",
  },
  {
    id: "haze-photo-void",
    depth: "far",
    position: { x: "26%", y: "39.5%" },
    size: { inline: "40vw", block: "380px" },
    intensity: 0.22,
    presence: "wide",
    form: "low",
    drift: "slow",
    note: "NEW. The photograph occupies x 51–96% for ten percent of the page and leaves the entire left half empty; this fills that void with the dimmest mass on the page rather than with another star. It also gives `photo-defocus` — the one near, out-of-focus object in the composition — something to be out of focus IN, which is what a defocused light needs to read as near rather than as a smudge. Stops at 43.5%, clear of the quote's silence at 44.3%.",
  },
  {
    id: "haze-descent",
    depth: "far",
    position: { x: "63%", y: "78%" },
    size: { inline: "52vw", block: "460px" },
    intensity: 0.34,
    presence: "wide",
    form: "low",
    drift: "slowest",
    note: "NEW, and the mass that was cut in the previous pass, put back somewhere else. It spans 73.1–82.9% and x 37–89%: it laps the drawing slot's bottom edge (so future art there emerges from weather), it fills the 74.9–80.7% dead band, and it stays right of x 37% so it never sits in the column the docked player occupies. It STOPS 376px above the closing line. The page still ends in silence — it just no longer goes quiet a third of the way from the end.",
  },
  {
    id: "haze-north-narrow",
    depth: "far",
    position: { x: "34%", y: "5.6%" },
    size: { inline: "82vw", block: "320px" },
    intensity: 0.4,
    presence: "narrow",
    form: "bank",
    drift: "slowest",
    note: "Mobile's opening mass, and its own placement rather than the desktop one rescaled — the narrow page's top gap is at a different fraction and a third of the height. Low, wide and shallow, so it reads as weather at the top of the column.",
  },
  {
    id: "haze-descent-narrow",
    depth: "far",
    position: { x: "58%", y: "78%" },
    size: { inline: "88vw", block: "300px" },
    intensity: 0.3,
    presence: "narrow",
    form: "low",
    drift: "slow",
    note: "NEW. Mobile's second and last mass, in the gap between the drawing slot (ends 74.1%) and the Elsewhere link (81.2%). Spans 73.9–82.2% and stops 217px above the closing line at 88.2%. Two masses is the whole mobile budget: the narrow page pays the most for a large blur and gets a shorter radius as well as a smaller count.",
  },
];

/* -----------------------------------------------------------------------------
   DISTANT LIGHT — two on wide, one on narrow. That is the entire budget.
   -----------------------------------------------------------------------------
   "One or two soft glows that read as light sources at a distance, not as
   blobs." Two, then, and the scarcity is the point: a third would make these a
   motif rather than events.

   Both are placed where the page had NOTHING — not near the bloom, not near the
   quote, not in the left column the docked player occupies. They are lit
   objects and they need somewhere unclaimed to be lit in.
   -------------------------------------------------------------------------- */

const glows: readonly GlowSource[] = [
  {
    id: "glow-north-east",
    depth: "mid",
    position: { x: "67%", y: "8.9%" },
    radius: "300px",
    aspect: 1.16,
    intensity: 0.5,
    presence: "wide",
    note: "The opening band runs full width and every object of any weight in it — the bloom, its companion, the north-west soft point, the haze mass — is left of centre. The right half opened with two dim pinpricks and nothing else. This answers the bloom across the gap, and it answers it in a DIFFERENT KIND OF LIGHT: the bloom is a sharp point that happens to be surrounded by glare, this is a source you cannot quite resolve. Sharp against diffuse is the same depth cue the stars use, at the scale of the whole first viewport. It is inside the first screen on purpose — the request was for the page to have more character, and character that only appears after scrolling is not an answer.",
  },
  {
    id: "glow-descent",
    depth: "far",
    position: { x: "71%", y: "77.5%" },
    radius: "340px",
    aspect: 1.2,
    intensity: 0.3,
    tone: "lavender",
    presence: "wide",
    note: "Inside `haze-descent`, slightly above and right of its core, so it reads as a light WITH fog in front of it rather than as a second cloud. Far depth, lavender rather than mist, and 0.3 against the north light's 0.5 — the page's last light should be its faintest and its furthest. Sits at x 43–99%, which keeps the whole thing out of the left column the docked player floats in. Stops at 83.9%, seven percent clear of the closing line.",
  },
  {
    id: "glow-descent-narrow",
    depth: "far",
    position: { x: "62%", y: "77.5%" },
    radius: "190px",
    aspect: 1.15,
    intensity: 0.28,
    tone: "lavender",
    presence: "narrow",
    note: "Mobile gets ONE light and this is it — the lower one, not the opening one. The narrow page's opening is already the name at full width with a mass of haze behind it, and there is no empty right half at 390px to answer anything across. Down here there is a genuine gap, and one distant light in it is the whole of mobile's share of this pass.",
  },
];

export const composition: Composition = {
  stars: [
    ...starsWide.map((star) => ({ ...star, presence: "wide" as const })),
    ...starsNarrow.map((star) => ({ ...star, presence: "narrow" as const })),
  ],
  haze,
  glows,
};
