# MVP 2 — THE WALL

Architecture. Written before the code, kept beside it.

> **The wall is restrained. The artifacts are personal.**
> **Controlled chaos is authored, never random.**

The homepage stops being `hero / about / journal / footer` and becomes a wall of
things Vero wants to keep and show. The dark, misty, editorial chassis from
MVP 1 is unchanged — tokens, typography, atmosphere, interaction layer and the
Bunny Hop player all stay exactly as they are. What changes is *what is placed
in the world*, and *how placement is expressed*.

Scrapbook **logic**, not scrapbook **styling**. Nothing in this document
introduces tape, pins, corkboard, torn paper, polaroid frames or fake physical
shadows. The wall is the same quiet darkness it always was.

---

## 1. The item union

Five types. A discriminated union on `type`, in `src/wall/types.ts`.

```
memory   a photograph or visual artifact
blurb    text worth keeping
link     an annotated bookmark
charm    a tiny mostly-visual graphic, possibly meaningless
embed    a large functional object (MVP 2: Bunny Hop only)
```

The shared base carries **`id` and `placement`, and nothing else**:

```ts
interface WallItemBase {
  readonly id: WallItemId;
  readonly placement: WallPlacementSet;
}
```

There is deliberately no shared `title`, no `image`, no `href`, no `meta`, no
`variant`. Where two types want the same field they each declare it, because
that is what keeps them free to diverge. This is the same reasoning that shaped
`src/content/types.ts` in MVP 1 and it is the reason no `WallCard` component
exists or can be written comfortably.

Field-level notes worth stating once:

- **`memory`** keeps `caption`, `annotation`, `date` and `location` as four
  separate optional fields rather than one metadata blob. They are separate so
  the renderer can put them in four different places — a date beside the
  photograph rather than under it is the whole point of MVP 1's
  metadata-is-positioned-away principle, carried forward.
- **`blurb.text`** is `readonly string[]`, one entry per paragraph. Most blurbs
  are a single entry. It is an array rather than a string so that a longer
  passage — Vero's About copy, for instance — can become a blurb without a type
  change.
- **`charm.alt`** is optional. Absent or empty means *this carries no meaning*,
  and the renderer marks it `aria-hidden`. A charm with an `href` must have an
  `alt`, because a link needs an accessible name; the dev validator enforces it.
- **`embed.embed`** is a string literal union (`"bunny-hop"`), not a component
  reference. Content data stays plain, serialisable and editable; the dispatcher
  owns the name → component mapping.

---

## 2. Placement

### Normalized, centre-anchored

`x: 62, y: 28` — never `left: 947px`. Both are percentages: `x` of the wall's
inline size, `y` of the wall's block size.

**The anchor is the item's centre, not its top-left.** Rotation happens about
the centre anyway, and a centre anchor means an item does not drift when its
size or its content changes. Implemented as
`translate: -50% -50%` on top of `inset-inline-start` / `inset-block-start`.

The full placement record:

| field      | meaning                                                       |
| ---------- | ------------------------------------------------------------- |
| `x`        | 0–100, centre as a % of the wall's inline size                 |
| `y`        | 0–100, centre as a % of the wall's block size (wide only)      |
| `size`     | optional, inline size as a % of the wall. Omitted = intrinsic  |
| `rotation` | optional, degrees                                              |
| `depth`    | `back` \| `base` \| `front`, default `base`                    |
| `z`        | optional 0–9, ordering *within* a depth band                   |

`depth` maps to the shared depth model's layer tokens
(`--layer-3-content`, `--layer-4-objects`, `--layer-5-foreground`), which are
spaced by 10 — hence `z` being a single digit. The wall sets
`isolation: isolate`, so those numbers are local to the wall: a `front` artifact
is in front of the other artifacts, **not** in front of the interaction layer's
paper fragment, which is genuinely layer 5 of the page. The wall as a whole
occupies layer 3.

### The wall is finite

`Wall` takes a `span` — the wall's height in viewport heights, authored in
`src/content/wall.ts` beside the items it has to contain. Target 2–4. There is
no infinite scroll and no virtualisation; this is a dozen elements.

### Mobile is a different composition, not a scaled one

This is the part the spec is most explicit about, and the architecture makes it
structural rather than aspirational.

**`placement.narrow` is required.** Not optional, not defaulted, not derived.
The type will not let an author ship a desktop composition and hope. It is
either a narrow placement record or the literal `"absent"`, which removes the
item from small screens entirely — how "fewer charms on mobile" is expressed.

**The narrow model is a different model.** On wide the wall is an absolutely
positioned canvas. On narrow it is a **flow column with authored displacement**:

```ts
interface WallPlacementNarrow {
  x; size?; rotation?; depth?; z?;
  lead?: "tight" | "normal" | "loose";   // vertical rhythm before the item
}
```

There is no `y`. Vertical position comes from document flow; `lead` chooses how
much air precedes the item from the existing space scale.

Why, concretely: at 375px a blurb might be five lines or nine depending on
copy, font loading and wrapping. Authored `y` percentages on a narrow wall
collide, and a collision on a phone is two paragraphs printed on top of each
other. Flow cannot collide. What keeps it a *wall* rather than a card feed is
that `x`, `size` and `rotation` all survive: items sit at different widths, at
different horizontal positions, slightly askew, some bleeding past an edge.
What it loses is overlap, which mobile should mostly not have anyway.

Consequences, stated so they are not rediscovered:

- On narrow, **DOM order is visual order**. On wide it is reading order only.
- Visitor drag offsets are **not applied on narrow** (see §5).
- The wall's height on narrow is emergent, not declared. `span` is ignored.

The breakpoint is `47.9375rem / 48rem` — the same one the atmosphere, the
interaction layer, the player and `Home.module.css` already use. There is not a
third breakpoint and there should not be one.

### How placement reaches CSS

`src/wall/placement.ts` turns a placement record into custom properties on the
item's shell — `--wall-x`, `--wall-inline-size`, `--wall-rotation`,
`--wall-depth`, `--wall-z`, and the `--wall-n*` set for narrow. The stylesheet
picks which set is live in one media query. Nothing about how an item *looks* is
decided in TypeScript; the shell only positions.

---

## 3. Renderer structure

```
<Wall span items>                        the canvas. Height, clipping, isolation.
  <WallItem item offset>                 the placement shell. Position only.
    <Memory | Blurb | Link | Charm | Embed>   the material. Type only.
```

Three responsibilities, three files, no overlap:

- **`Wall`** knows the wall's extent and nothing about item types.
- **`WallItem`** knows placement and dispatches on `type`. It never styles
  content.
- **The five renderers** know their own material and nothing about position.
  None of them may set `position`, `inset`, `z-index`, `rotate` or `translate`.

The `switch` in `WallItem` is exhaustive over the union, so adding a sixth type
is a compile error until it is handled — which is the point of the union.

**Adding a Memory or a Charm requires editing exactly one file:
`src/content/wall.ts`.** `Home.tsx` never mentions item types, ids or counts.

---

## 4. Files

```
src/wall/
  index.ts              public surface
  types.ts              the WallItem union + placement types
  placement.ts          placement record → CSS custom properties
  overrides.ts          visitor positions (personal-space:v2:wallPositions)
  validate.ts           dev-only authoring checks
  Wall.tsx  .module.css
  WallItem.tsx  .module.css
  items/
    Memory.tsx    .module.css
    Blurb.tsx     .module.css
    Link.tsx      .module.css
    Charm.tsx     .module.css
    Embed.tsx     .module.css
    WallImage.tsx           <img> that tolerates a missing file

src/content/
  wall.ts               the authored items + the wall's span
  posts.ts              UNCHANGED. Vero's About copy still lives here.
```

`src/content/wall.ts` imports its type from `src/wall`. Content data importing
the contract of the system that renders it is the right direction; the
alternative puts `placement` inside `src/content/types.ts`, whose own header
correctly says it describes no position or treatment.

---

## 5. Authored position vs visitor position

Two separate concepts, and the separation is absolute.

**Authored placement** lives in `src/content/wall.ts`, is source-controlled, and
is the composition. A visitor drag can never modify it — it is a frozen literal
in a module.

**Visitor overrides** live in `localStorage` and resolve *on top* as an offset:

```
final position = authored anchor + visitor offset
```

What is stored is a **displacement in CSS pixels**, never an absolute
coordinate. This is the same decision `src/interaction/positions.ts` made in
MVP 1 and for the same reason: the anchor is a percentage of a box whose size
changes with the window, the fonts and the breakpoint, so a coordinate saved on
a 1600px desktop lands somewhere arbitrary on a phone. An offset means "you
moved it a bit from where it was left", which survives all of that, and the
empty state is exactly `{ x: 0, y: 0 }`.

Resolution: `Wall` reads the whole offset map once at mount and publishes
`--wall-offset-x` / `--wall-offset-y` on each shell, folded into the same
`translate` that does the centre anchoring. A drag implementation can write
those two properties directly on the element per frame and persist once on
release — the identical shape the paper fragment already uses.

**Overrides apply on the wide composition only.** On narrow they are zeroed in
CSS. A vertical offset inside a flow column pushes an item into its neighbour,
touch-dragging fights scrolling, and a stored offset from a desktop session
should not damage the phone view.

### Storage

New keys are `personal-space:v2:*`. **The v1 keys are left completely alone.**

`personal-space:v1:objectPositions` and `personal-space:v1:playerDock` belong to
the paper fragment and the docked player, both of which still exist and still
work. Nothing is migrated, because nothing moved: v2 is a *new* namespace for a
*new* system, not a new version of an old one.

`src/lib/storage.ts` therefore had to learn that more than one version can be
live at once:

- `SCHEMA_VERSION` stays `"v1"` and is still the default for every existing call
  site — those files were not touched.
- `LIVE_VERSIONS` lists every version this build reads or writes.
- `scoped("v2")` returns the same `read` / `readResult` / `write` / `remove`
  bound to a different version segment.
- `purgeOtherVersions()` was a latent trap: it deleted every
  `personal-space:*` key outside the single current prefix, which would have
  swept the wall's positions the moment anyone called it. It now preserves every
  version in `LIVE_VERSIONS`. (It is still called from nowhere.)

Every failure path is unchanged and still silent: storage disabled, quota full,
malformed JSON, unknown ids in the map. The wall falls back to the authored
composition and says nothing.

---

## 6. Migration from the MVP 1 homepage

| MVP 1                             | MVP 2                                              |
| --------------------------------- | -------------------------------------------------- |
| `Identity`                        | stays, outside the Wall                             |
| `Navigation`                      | stays, outside the Wall — **see the open question** |
| `About` section                   | leaves the composition. Component left dormant      |
| `01 / Journal` label + 4 entries  | replaced by the Wall                                |
| `02 / Elsewhere` label + entry    | replaced by the Wall                                |
| closing line                      | still rendered, after the Wall                      |
| `JournalEntry` + 5 post renderers | dormant. Not deleted                                |
| `PlayerDock`                      | stays, *unless* the wall hosts the embed (§7)       |

`Home.tsx` becomes roughly twenty lines: identity, navigation, `<Wall />`, the
closing line. The twelve-column grid survives only for the opening row, which is
still a composed pair.

**Nothing is deleted.** `src/components/About.tsx`, `src/components/Journal.tsx`
and every post in `src/content/posts.ts` — including Vero's own About writing —
remain in the repo, unrendered. They are the obvious source material for the
first real wall items, and `posts.ts` is the only copy of her words.

---

## 7. What stays outside the Wall

- **`Identity`** — the name and the handle. The page's `h1`, and the one thing
  that is not an artifact.
- **`Navigation`**.
- **The closing line** (`Maybe it's kismet.`) — for now. It may want to become a
  `blurb` at the bottom of the wall instead; that is a content decision.
- **`src/atmosphere/**`** — stars, haze, grain, mottle, parallax. The wall hangs
  *in* the atmosphere; it does not contain it.
- **`src/interaction/**`** — the paper fragment, the star secret, the ripple.
- **`PlayerDock`**, conditionally. The player cannot be in two places at once,
  so `App.tsx` now mounts the dock only when the wall does *not* host a
  `bunny-hop` embed:

  ```tsx
  {!wallHostsEmbed(wallItems, "bunny-hop") && <PlayerDock />}
  ```

  With no embed authored, today's behaviour is byte-identical. Adding the embed
  item to `src/content/wall.ts` moves the player into the wall and retires the
  dock, in one edit, with no chance of two players. `src/player/**` internals are
  untouched; `Embed` is a wrapper.

---

## 8. The `textSplit` hazard, and the hook that fixes it

`src/interaction/textSplit.ts` selects the page's paragraphs by **structural**
selectors tied to MVP 1's markup — `main article > h3 ~ p`,
`main section > div > p`, `main figcaption > p`. Restructuring the homepage
silently breaks the click-ripple's text displacement: every row is allowed to
match nothing, so nothing throws, the words simply stop moving.

The wall exposes a stable, non-structural hook so the fix is one edit in a file
this agent does not own.

### The contract

Every text-bearing element inside a wall renderer carries:

```html
data-text="display" | "body" | "meta"
```

The value is the **typographic register**, which is exactly what `textSplit`'s
amplitude column is already a function of — its own table says amplitudes rise
with type size "so everything moves by about the same fraction of itself". The
register *is* that fraction.

Seven of `SPLIT_TABLE`'s nine rows can therefore be replaced by three that
never break again:

```ts
{ selector: '[data-text="display"]', amplitude: 7,   note: "Wall display register." }
{ selector: '[data-text="body"]',    amplitude: 4,   note: "Wall reading copy." }
{ selector: '[data-text="meta"]',    amplitude: 3.5, note: "Wall metadata." }
```

Two existing rows still earn their place, because they name things that are
outside the wall and are not going anywhere:

- `main h1` — the identity block, amplitude 8.
- `main > p` — the closing line, amplitude 4. Still the only direct paragraph
  child of `<main>`; the wall's own paragraphs are several levels deeper.

The other seven (`main article > h3`, `main blockquote p`, `main h2`,
`main section > div > p`, `main article > div > p`, `main article > h3 ~ p`,
`main figcaption > p`) now match nothing and should be deleted rather than
left to rot. Note that `main blockquote p` and `main figcaption > p` would
*accidentally* still match inside `Blurb` and `Memory` — at the wrong
amplitudes, and with the `eligible()` figcaption exception applying to markup it
was not written for. They are the rows most worth removing deliberately.

Two rules the renderers obey, and any future renderer must:

1. **`data-text` goes on the leaf element that owns the text.** Never on a
   container that holds another `data-text`. The splitter walks descendants, so
   a nested pair would split the inner text twice.
2. **Never inside an `<a>`.** `textSplit` refuses to enter links (splitting them
   breaks the underline and the accessible name), so an anchor's own text is
   marked on its wrapping `<h3>`, which yields no pieces and is intended.

Also carried, for the same "hook, not a guess" reason:

- `data-wall-item="<type>"` and `data-wall-id="<id>"` on every shell — a stable
  handle for a drag implementation, and the seam a future visual editor would
  use.
- `data-no-ripple` on the embed shell, which `Ripple.tsx` already honours.

### Two other MVP 1 couplings the restructure breaks

Reported, not fixed, because they are other agents' files:

- **`src/interaction/placement.ts`** — `narrowGap.selector` is
  `main h2#journal`. That heading no longer exists, so the paper fragment's
  narrow anchor falls back to its authored percentage, which was tuned against
  the old document. The paper may land on wall content on a phone. Needs a new
  measured gap, or a wall-authored one.
- **`src/atmosphere/composition.ts`** — every star position was composed against
  a measured table of where the old page's blocks sat. The page's contents have
  moved; the stars have not. The composition is not *broken*, but it is no
  longer composed against anything.

---

## 9. Open questions for the lead

1. **What does `Navigation` point at?** Its three anchors (`#about`,
   `#journal`, `#elsewhere`) no longer exist. Clicking them now does nothing.
   Options: retire the nav to a single external link; give the wall two or three
   authored anchor regions; or add an optional `anchor` field to
   `WallItemBase`. Deliberately not guessed — it is a content decision and the
   spec said Navigation stays.
2. **Does the wall bleed past the page gutters?** It is currently the width of
   the page's content box. A wall that runs to the viewport edges is a different
   and defensible composition.
3. **Should the closing line become a blurb?**
4. **`Meta` cannot carry `data-text`.** Wall metadata is therefore unmarked and
   does not ripple. One optional passthrough prop on `src/components/Meta.tsx`
   fixes it; that file belongs to the design lead.

---

## 10. Deliberately not built

No canvas, no physics, no layout engine, no collision solver, no drag, no visual
editor, no infinite scroll, no virtualisation, no animation, no new dependency,
no state library, no context. Placement is data, position is CSS, and the whole
system is a dozen elements with custom properties on them.
