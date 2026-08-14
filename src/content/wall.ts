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

     x, y        0–100. The item's CENTRE, as a percentage of the wall.
     size        0–100. Width as a percentage of the wall. Omit for intrinsic.
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
   ========================================================================== */

/** The wall's height, in viewport heights. Wide composition only — on narrow
 *  the wall is as tall as its contents.
 *
 *  TWO, not three. Four artifacts across three viewport heights is not
 *  spaciousness, it is a page someone forgot to finish — the gaps stop reading
 *  as silence and start reading as absence. Two gives roughly one artifact per
 *  450px of scroll, which is sparse on purpose and still has a rhythm.
 *
 *  RAISE THIS BEFORE ENLARGING ANYTHING. The wall growing is the correct answer
 *  to a crowded composition; artifacts growing to fill emptiness is not. Every
 *  `y` below is a percentage of this number, so the whole composition rescales
 *  when it changes. */
export const wallSpan = 2;

/* =============================================================================
   THE PROTOTYPE COMPOSITION — one of each of four types
   =============================================================================

   FOUR ITEMS. The question this composition answers is not "what goes on the
   wall" but "what does each KIND of artifact look and feel like in this world".
   It is deliberately not full. Do not add a fifth item to balance it, and do
   not enlarge these four to occupy the emptiness — see `wallSpan` above.

   No `embed`. The Bunny Hop player stays docked to the viewport; a wall-hosted
   version is deferred. `items/Embed.tsx` is unused, not dead — leave it.

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

     KEEP IT SMALL. 16.5% of the wall is about 220px on a wide screen — an
     artifact, not a hero and not a gallery card. It is legible because it is the
     only colour for a thousand pixels in any direction, not because it is big.

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
      wide: { x: 62, y: 12, size: 16.5, rotation: -1.8 },
      narrow: { x: 46, size: 62, rotation: -1.8 },
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
      /* x 33 → 48, because of the docked player rather than the composition.
         At 33 the blurb's left edge sat at 319px against the dock's right edge
         of 354px, so for the whole scroll range where this passed the bottom
         of the viewport, 35px of every line was behind the player and it read
         "…eholder text, waiting to be replaced."

         42 fixed it at 1440 and NOT at 1024, which is the interesting part: the
         dock is a FIXED 354px wide at every viewport, and `x` is a percentage
         of a wall that is 1336px at 1440 and 920px at 1024. A percentage cannot
         express "clear of a fixed object", so the same authored number clears
         on a large screen and collides on a small one. 48 clears at both, with
         20px to spare at 1024.

         This is a placement constraint the wall model cannot currently state:
         the bottom-left ~354×240 of the VIEWPORT is permanently spent, and
         every item scrolls through it. Until it can, wide `x` for anything
         text-bearing wants to stay right of ~48. The alternatives are docking
         the player bottom-right, or reserving the column — both are the lead's
         call, not an authoring workaround. */
      wide: { x: 48, y: 52, size: 26 },
      narrow: { x: 50, size: 92, lead: "loose" },
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
     ------------------------------------------------------------------------ */
  {
    type: "link",
    id: "link-placeholder",
    title: "A Placeholder Link",
    href: "https://example.com",
    note: "Placeholder note — one line about why this is worth going to.",
    domain: "example.com",
    placement: {
      wide: { x: 70, y: 80, size: 24 },
      narrow: { x: 52, size: 84, lead: "loose" },
    },
  },

  /* ---------------------------------------------------------------------------
     CHARM — PLACEHOLDER GRAPHIC. Replace the file, or point `src` elsewhere.
     -----------------------------------------------------------------------------
     Tiny, silent, and not interactive. No caption, no date, no metadata, no
     link — a charm is allowed to mean nothing, which is why it has no `alt` and
     is marked `aria-hidden` by the renderer.

     It is placed just off the photograph's lower-left corner rather than out in
     open space, because that is what makes the wall read as one person's
     arrangement instead of four objects distributed evenly across a canvas.
     About 43px wide. It should stay roughly that small; a charm that competes
     for attention has become decoration.
     ------------------------------------------------------------------------ */
  {
    type: "charm",
    id: "charm-placeholder",
    src: "wall/charm-placeholder.svg",
    aspectRatio: 1,
    placement: {
      wide: { x: 50.5, y: 22.5, size: 3.2, rotation: -9 },
      narrow: { x: 30, size: 13, rotation: -9, lead: "loose" },
    },
  },
];
