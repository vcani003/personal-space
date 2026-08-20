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
export const wallSpan = 0.2;

/* =============================================================================
   THE COMPOSITION — two artifacts, and deliberately unfinished
   =============================================================================

   ONE ITEM: a charm. The photograph moved into the intro above, where the
   prose wraps around it — see `Intro.module.css`. It was two artifacts and it
   held four before that. It held four; the other two
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
      wide: { x: 62, y: 50, size: 5.2, rotation: -9, align: "left" },
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
