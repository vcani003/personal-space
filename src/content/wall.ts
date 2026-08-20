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
 *  0.55, DOWN FROM 0.8, BECAUSE THE PLACEHOLDERS ARE GONE. The wall held four
 *  artifacts; two of them were a blurb and a link written to demonstrate what
 *  a blurb and a link look like, and they have been taken down until there is
 *  something real to hang there.
 *
 *  Every `y` below is a percentage of this number, so lowering it pulls the
 *  remaining two together rather than leaving them adrift at either end of a
 *  surface sized for a composition that no longer exists.
 *
 *  RAISE IT AGAIN WHEN REAL ARTIFACTS ARRIVE. The wall growing is the correct
 *  answer to a crowded composition; artifacts growing to fill emptiness is
 *  not. */
export const wallSpan = 0.55;

/* =============================================================================
   THE COMPOSITION — two artifacts, and deliberately unfinished
   =============================================================================

   TWO ITEMS: a photograph, and a charm beside it. It held four; the other two
   were a blurb and a link written to show what a blurb and a link look like,
   and placeholder copy on a personal site reads worse than empty space —
   it tells a visitor the room is not finished AND wastes their attention
   proving it.

   WHAT IS LEFT IS REAL. The photograph is hers and the charm is decoration.
   The wall is quiet now, and that is the honest state of it.

   ── The shape of it ─────────────────────────────────────────────────────────

         x →   0        25        50        75      100
     y 38       ┌──────────┐                         memory    221px
                │  PHOTO   │
                └──────────┘
                   caption
     70                                ✦              charm      50px

   The two do not share an edge and are not aligned: left edges at x 14 and
   x 72, and different heights. That is the same rule the fuller composition
   followed, and it is what keeps two things from reading as a row.

   ── ADDING THE NEXT ONE ─────────────────────────────────────────────────────

   Raise `wallSpan` first, then place it. `size` is a percentage of the WALL,
   not the page — see the note above about 1024 being the width every size is
   authored against. And run the composition through the validator: it warns
   about duplicate ids, coordinates off the wall, and a narrow item that runs
   off the edge, every one of which is otherwise silent.
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
      wide: { x: 14, y: 38, size: 20, rotation: -1.8, align: "left" },
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
      wide: { x: 72, y: 70, size: 5.2, rotation: -9, align: "left" },
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


];
