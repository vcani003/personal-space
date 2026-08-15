import type { WallItem } from "../wall";

/* =============================================================================
   THE WALL — what is on it
   =============================================================================

   THIS IS THE ONLY FILE THAT HAS TO CHANGE TO HANG SOMETHING.

   Not `Home.tsx`, not a component, not a stylesheet. Add an object to the array
   below and it appears at the coordinates you gave it. Remove it and it is
   gone. That is an acceptance criterion of the wall's architecture, not a
   convenience.

   ── Authoring, in one page ──────────────────────────────────────────────────

   Every item needs `id`, `type`, `placement`, and whatever its own type asks
   for. `src/wall/types.ts` documents each of the five.

   PLACEMENT IS NORMALIZED. `x: 62, y: 28` — never pixels.

     x, y        0–100. Percentages of the wall. `x` names the edge `align` says.
     size        0–100. Width as a percentage of the wall. Omit for intrinsic.
     align       left | center | right. Which edge `x` names. Default left.
     rotation    degrees. Small numbers.
     depth       back | base | front. Default base.
     z           0–9. Ordering within a depth band.

   `placement.narrow` IS REQUIRED and it is a DIFFERENT COMPOSITION, not a
   smaller one. It has no `y` — on a phone the wall is a column and vertical
   position comes from the order of this array. Use `lead` for the air before an
   item, and `"absent"` to take an item off small screens entirely. Fewer
   charms, less overlap, less rotation, bigger type.

   DOCUMENT ORDER IS READING ORDER. The order of this array is what a screen
   reader hears, what Tab walks, and what the narrow composition stacks. Visual
   position is free; this is not. Author the array in an order that makes sense
   read aloud — it costs nothing, because position is a separate field.

   `wallSpan` is how tall the wall is, in viewport heights. Two to four. Raise it
   when the wall gets crowded; the whole composition rescales with it, since
   every `y` is a percentage of it.

   ── Two things that will bite ───────────────────────────────────────────────

   1. Image `src` is relative to `public/assets/`, with NO leading slash. It is
      resolved through `assetUrl()` so it survives the GitHub Pages subpath.
      A file that does not exist yet is fine and expected — the composition
      holds its space and draws nothing.
   2. Run the dev server while authoring. `validate.ts` warns in the console
      about duplicate ids, coordinates off the wall, a narrow item that runs off
      the edge, and a charm that is a link with no alt. Every one of those
      failures is otherwise silent.

   ── THE ONE NUMBER THAT MOVES EVERY SIZE ON THIS PAGE ───────────────────────

   `size` IS A PERCENTAGE OF THE WALL, AND THE WALL IS NOT THE PAGE. It is the
   left column of the composition; the rail beside it is a fixed 322px and the
   gap is 52px, so the wall is:

       1440 viewport → 962px
       1280 viewport → 802px
       1024 viewport → 546px   ← the narrowest it EVER is, and it is a cliff
       1023 viewport → 919px   ← the rail relocates; the wall gets the full width
        390 viewport → 326px   ← flow column, `narrow` placements

   1024 is therefore the width every size below is authored against. A
   percentage that reads correctly at 1440 is 57% of itself at 1024, and a
   percentage that is legible at 1024 looks generous at 1440. Every number in
   this file is the compromise between those two, resolved toward 1024 —
   because "slightly bigger than ideal on a large screen" is a taste problem and
   "twelve characters a line" is a broken page.
   ========================================================================== */

/** The wall's height, in viewport heights. Wide composition only — on narrow
 *  the wall is as tall as its contents.
 *
 *  1.6, RAISED FROM 1.5, AND ONLY FOR A MEASURED COLLISION. At 1024×800 the
 *  wall is 546px wide, which makes the link and the blurb roughly 1.5× as tall
 *  as they are at 1440 (more wrapping) inside a wall that is 1200px rather than
 *  1350px (shorter viewport). At span 1.5 those two came within 5px of touching.
 *  1.6 opens that to ~126px and costs the composition nothing else.
 *
 *  IT IS NOT A LICENCE TO SPREAD OUT. The largest gap in the composition below
 *  is ~228px, about a quarter of a viewport — silence, not absence. Going past
 *  ~2.0 with four artifacts starts producing the dead vertical stretches the
 *  brief specifically rules out; the wall would read as unfinished rather than
 *  as spacious.
 *
 *  RAISE THIS BEFORE ENLARGING ANYTHING when the wall gets crowded. The wall
 *  growing is the correct answer to a crowded composition; artifacts growing to
 *  fill emptiness is not. Every `y` below is a percentage of this number, so the
 *  whole composition rescales when it changes. */
export const wallSpan = 1.25;

/* =============================================================================
   THE COMPOSITION — four artifacts, three loose zones, one crescendo
   =============================================================================

   FOUR ITEMS. The question this composition answers is not "what goes on the
   wall" but "what does each KIND of artifact look and feel like in this world".
   It is deliberately not full. Do not add a fifth item to balance it, and do not
   enlarge these four to occupy the emptiness — see `wallSpan` above.

   ── The shape of it ─────────────────────────────────────────────────────────

         x →   0        25        50        75      100
     y 8                                 ✦                 charm      50px
     ↓
      30       ┌──────────┐                                memory    221px
               │  PHOTO   │
               └──────────┘
                  caption
     62                        A Placeholder Link ↗        link      462px
                               note
                               example.com
     85     Placeholder text, waiting to be replaced.      blurb     532px
            A blurb is something worth keeping in words…
            (all figures at 1440)

   THREE THINGS ARE AUTHORED HERE AND EACH ONE IS DOING A JOB:

   1. IT GETS BIGGER AS IT DESCENDS. 50 → 221 → 462 → 532px. That single
      progression is what expresses the owner's three zones without any of them
      becoming a section: the top of the wall is sparse because the only thing
      up there is tiny, and the bottom is denser because the two things down
      there are wide. Nothing had to be grouped, boxed or labelled to say it.

   2. NOTHING SHARES AN EDGE. Left edges at x 3 / 14 / 46 / 68. The two closest
      are the blurb (3) and the photograph (14) — 106px apart at 1440, 60px at
      1024, and 700px apart vertically, so they read as two placements rather
      than as a failed alignment. Two items within ~4 points of each other is
      the thing to avoid: too far to be an alignment, too close to be a
      decision.

   3. THE VERTICAL GAPS ARE UNEVEN. At 1440: 114 / 228 / 211px, then 151px of
      silence at the foot. At 1024: 142 / 197 / 126px, then 111px. The link and
      the blurb are the pair — closer to each other than to anything else — and
      that pairing is what "the lower wall may be a little denser" means when it
      is not allowed to become a section.

   ── The honest limit of it ──────────────────────────────────────────────────

   `y` IS A PERCENTAGE AND ITEM HEIGHTS ARE PIXELS, so the vertical rhythm is
   not the same composition at every size. At 1024 the text blocks are ~1.6× as
   tall as at 1440 in a wall that is shorter, so the gaps compress and the lower
   pair reads as a pair. At 1440 everything fits on fewer lines and the three
   gaps come out within 50px of each other — closer to even than authored. At
   that width the composition is carried by lateral position and by the size
   crescendo rather than by clustering, which is why both of those are as
   emphatic as they are. There is no `y` value that fixes it; it would want a
   `size` that can be authored per breakpoint, which the placement model
   deliberately does not have.

   ── On narrow it is a different composition, and here is its rhythm ──────────

   Order is memory → charm → blurb → link, and the leads are 0 / tight / loose /
   tight. Same idea as the wide wall — a thing, then a breath, then the writing
   in a pair — reached the only way a column can reach it. The charm rejoins the
   photograph there; see its own note for why.

   ── The stale `x` values, and what replaced them ────────────────────────────

   `blurb.x` had been pushed 33 → 48 → 12 and `memory.x` 74 → 65 to dodge a
   player docked to a fixed corner of the VIEWPORT. That object no longer
   exists — the player is in the rail, in the page, and it can never cover the
   wall. Every one of those numbers was a workaround for a constraint that is
   gone, and all four have been re-authored from the composition instead. The
   whole width of the wall is available again, which is why anything is on the
   right half of it at all.

   ── The one rule this composition follows ───────────────────────────────────

   OBJECTS ARE ASKEW. TEXT IS LEVEL.

   The photograph and the charm are things, hung by a person, so they are turned
   a degree or two. The blurb and the link are writing, so they sit straight —
   a rotated paragraph of hairline serif is harder to read and reads as styling
   rather than as placement. Rotation is how the wall says "someone put this
   here"; it is not a texture to apply to everything.

   ── What is real and what is not ────────────────────────────────────────────

   REAL      the memory. Her photograph, her caption, kept in its own colour.
   PLACEHOLDER   the blurb, the link and the charm — every string marked below.
                 Neutral on purpose: inventing a favourite website or a
                 sentimental line on her behalf would put words in her mouth
                 that are much harder to notice and remove than obvious ones.
   ========================================================================== */

export const wallItems: readonly WallItem[] = [
  /* ---------------------------------------------------------------------------
     MEMORY — real content. Handle with care.
     -----------------------------------------------------------------------------
     KEEP IT RED. No grayscale, no tint, no duotone, no desaturation, no blur.
     A saturated photograph is the one thing on this page that did not come from
     the palette, and that contrast is the entire reason it is worth hanging.
     Harmonising it would remove what made it worth saving.

     SIZE — 23%, RE-AUTHORED UP FROM 16.5%, AND THE ARTIFACT DID NOT GET BIGGER.
     16.5% of the old full-width wall was 220px, which is the size this
     photograph was composed and judged at. The wall then became a column and the
     same percentage rendered it at 158px, and at 1024 at 90px — a thumbnail. 23%
     restores it to 221px at 1440, 184px at 1280 and 126px at 1024. The number
     went up so that the object could stay the size it already was.

     It is STILL an artifact and not a hero: 221px inside a 962px surface, 295px
     tall, with ~550px of empty wall to its right and its caption the only thing
     that reaches into it. It is legible because it is the only colour for a
     thousand pixels in any direction, not because it is big.

     126px AT 1024 IS THE HONEST WEAK POINT and it is why the hover expansion
     exists — see `WallItem.module.css`. Pointing at it takes it to 170px. That
     is a mitigation, not a fix; the real fix would be a placement model that can
     express a minimum absolute size, which is the lead's call.

     PLACED LEFT, NOT RIGHT. `x: 65, align: right` was written to keep the photo
     out from behind a docked player that no longer exists. Left-anchored at 14
     it starts inside the wall rather than hanging off its right edge, its caption
     overhangs into open surface, and it stays ~600px clear of the player in the
     rail — which matters, because a saturated photograph next to the one
     deliberately-lit object on the page makes them compete.

     The caption is hers, verbatim, and sits indented below the photograph and
     overhanging its right edge — an annotation written next to a picture rather
     than a label printed under one.
     ------------------------------------------------------------------------ */
  {
    type: "memory",
    id: "tokyo-flowers",
    src: "wall/tokyo-flowers.jpg",
    alt: "A dark room where enormous red and magenta flowers are projected across the ceiling and reflected in a mirrored floor. A young woman sits among other visitors, looking up into the light.",
    caption: "a flower projection room somewhere in tokyo",
    aspectRatio: 0.75,
    placement: {
      wide: { x: 14, y: 16, size: 20, rotation: -1.8, align: "left" },
      /* THE PHONE IS WHERE THIS PHOTOGRAPH IS MOST LEGIBLE, and that is on
         purpose rather than by accident. 70% of a 326px wall is 228px on a 390px
         screen — 58% of the display, against 23% of the wall on a desktop. There
         is no hover on a touch screen, so the narrow composition has to answer
         the legibility question by itself, and it does it with base size. */
      narrow: { x: 24, size: 70, rotation: -1.8, align: "left" },
    },
  },

  /* ---------------------------------------------------------------------------
     CHARM — PLACEHOLDER GRAPHIC. Replace the file, or point `src` elsewhere.
     -----------------------------------------------------------------------------
     Tiny, silent, and not interactive. No caption, no date, no metadata, no
     link — a charm is allowed to mean nothing, which is why it has no `alt` and
     is marked `aria-hidden` by the renderer.

     IT IS ALONE AT THE TOP OF THE WALL, and that is the whole of the upper zone.
     It used to sit just off the photograph's corner, which was right when the
     two shared a region; the wireframe separates them, so the charm's job
     changed. It is now the first thing on the surface — the beginning of a
     collection, and the reason the empty upper wall reads as deliberate rather
     than as a layout that failed to fill. A genuinely empty upper third would
     look broken. One small mark makes it look chosen.

     Do not add a second thing up there to keep it company. That is the zone the
     brief says not to fill.

     SIZE — 5.2%, up from 3.2%, for the same reason as the photograph: 3.2% of a
     962px wall is 31px and of a 546px wall is 17px, which is not a charm, it is
     a speck. 5.2% gives 50 / 42 / 28px. The note this file has always carried
     says "about 43px"; 50 at the widest is the closest a single percentage gets
     to that across a wall that halves in width. A charm large enough to hold the
     eye has stopped being a charm and become decoration.

     It expands on hover along with the photograph — see `WallItem.module.css`.
     At 28px a line drawing is a smudge, and a charm you cannot resolve at all is
     not quiet, it is broken.

     SECOND IN THE ARRAY, WHICH IS FREE. A decorative charm is `aria-hidden` and
     has no tab stop, so its position in the document costs a screen reader
     nothing and is available to be spent on the narrow composition — where it is
     the small beat between the photograph and the writing.
     ------------------------------------------------------------------------ */
  {
    type: "charm",
    id: "charm-placeholder",
    src: "wall/charm-placeholder.svg",
    aspectRatio: 1,
    placement: {
      wide: { x: 68, y: 5, size: 5.2, rotation: -9, align: "left" },
      /* THE PHONE PUTS IT BACK BESIDE THE PHOTOGRAPH, and that is not an
         inconsistency with the wide composition, it is what "mobile is a
         different composition" means. A column has no lateral emptiness, so a
         42px mark alone with 136px of air above and below it does not read as
         sparseness — it reads as an orphan. Tucked just inside the photograph's
         right edge, on a `tight` lead, it reads as arranged, which is the thing
         the wide wall gets from the empty surface around it. */
      narrow: { x: 78, size: 13, rotation: -9, align: "left", lead: "tight" },
    },
  },

  /* ---------------------------------------------------------------------------
     BLURB — PLACEHOLDER COPY. Replace the strings, keep the shape.
     -----------------------------------------------------------------------------
     `normal` of the three registers, chosen for the prototype because it is the
     one that has to work: reading copy sitting directly on the darkness with no
     container at all. `feature` would have put a second giant serif statement on
     a page that already has the name at 80px and would have taught nothing —
     the scale contrast BETWEEN blurbs is the point of the type, and a prototype
     with one blurb cannot demonstrate it by shouting.

     `whisper` and `feature` are both still implemented in Blurb.module.css.

     SIZE — 58%, UP FROM 26%, AND THIS IS THE MOST URGENT OF THE FOUR. 26% of the
     column wall was 142px at 1024: about twelve characters a line, which is not
     reading copy, it is a torn strip. 58% gives 558 / 465 / 317px.

     `Blurb.module.css` caps the text at `min(--measure, 100%)`, so at 1440 the
     line is 532px (56ch) and not 558 — the type system takes the last 26px back
     on its own, which is exactly what that token is for. The authored number
     only has to be generous enough that the CAP is what decides the measure on a
     wide screen and the WALL is what decides it on a narrow one.

     LEFT MARGIN, LOWEST THING ON THE WALL. `x: 12` was a dodge around the old
     docked player. At 3 the blurb hangs off the wall's own left edge, which is
     where writing goes and where the eye is already returning after the link
     above it steps right. It is also the widest thing in the composition, which
     is what makes the bottom of the wall the dense end.
     ------------------------------------------------------------------------ */
  {
    type: "blurb",
    id: "blurb-placeholder",
    text: [
      "Placeholder text, waiting to be replaced. A blurb is something worth keeping in words — a lyric, a line out of a book, a sentence someone said that stayed.",
    ],
    source: "Placeholder",
    emphasis: "normal",
    placement: {
      wide: { x: 3, y: 72, size: 58, align: "left" },
      narrow: { x: 3, size: 94, align: "left", lead: "loose" },
    },
  },

  /* ---------------------------------------------------------------------------
     LINK — PLACEHOLDER. Replace title, href, note and domain together.
     -----------------------------------------------------------------------------
     An annotated bookmark, not a preview card: no thumbnail, no panel, no
     rounded rectangle, no fetched title. A name in the display register, a mark
     that says it goes somewhere, one line about why, and the address underneath
     in the metadata register.

     `thumbnail` exists on the type and is deliberately unused here. A link that
     leads with a picture is a memory that happens to be clickable, and it is
     rendered as such in Link.tsx only if someone authors one.

     SIZE — 48%, UP FROM 24%, AND THE REASON IS "COMPACT". At 24% the link was
     131px at 1024, which put a 28px display title on four lines and its note on
     six: a tall thin stack, the least compact shape available. 48% gives
     462 / 385 / 262px, so the title is one line at 1440 and two at 1024 and the
     whole artifact is wider than it is tall. A saved piece of the internet is a
     short wide thing.

     PLACED RIGHT, WHICH IS WHY THE COMPOSITION HAS TWO SIDES. It is the only
     item whose left edge is past the middle of the wall. Under the photograph on
     the left and above the blurb on the left, it makes the eye step out and back
     — and it is what stops the lower half being a single left-aligned column,
     which is what a feed looks like.

     LAST IN THE ARRAY. It is the only focusable thing on the wall, so it is the
     last tab stop before the closing line, and on narrow it is the last thing
     read. Both are correct: a bookmark is where you leave from.
     ------------------------------------------------------------------------ */
  {
    type: "link",
    id: "link-placeholder",
    title: "A Placeholder Link",
    href: "https://example.com",
    note: "Placeholder note — one line about why this is worth going to.",
    domain: "example.com",
    placement: {
      wide: { x: 46, y: 46, size: 48, align: "left" },
      narrow: { x: 12, size: 84, align: "left", lead: "tight" },
    },
  },
];
