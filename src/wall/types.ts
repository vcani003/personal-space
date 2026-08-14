/**
 * THE WALL — data contract
 *
 * A wall of things worth keeping. Five types, a discriminated union on `type`,
 * and the union exists so each type can render *differently*. A memory is not a
 * blurb with a picture; a charm is not a memory that means nothing.
 *
 * ── The rule that shapes everything here ────────────────────────────────────
 *
 * THE SHARED BASE CARRIES `id` AND `placement`. NOTHING ELSE.
 *
 * No shared `title`, no shared `image`, no shared `href`, no shared `meta`, no
 * `variant`, no `size` outside placement. Where two types want the same field
 * they each declare it, which is what keeps them free to diverge later. This is
 * the same decision `src/content/types.ts` made for MVP 1 and it is the reason
 * a universal `WallCard` is awkward to write — deliberately.
 *
 * If you find yourself wanting to hoist a field into the base, the question to
 * ask first is whether the two types that want it would ever want it to look or
 * behave differently. On this site the answer has always been yes.
 *
 * ── What is NOT here ────────────────────────────────────────────────────────
 *
 * No appearance. No colour, no font, no treatment, no material, no animation.
 * `placement` describes WHERE and HOW BIG, because on a wall that is
 * composition rather than styling; it does not describe what anything looks
 * like. That belongs to the renderers and their modules.
 */

/** Stable identifier. Used for React keys, for the visitor-position map, and as
 *  the handle a future visual editor would address an item by. Never reuse one,
 *  and never renumber them — a stored position is keyed on this string. */
export type WallItemId = string;

export type WallItemType = "memory" | "blurb" | "link" | "charm" | "embed";

/* -------------------------------------------------------------------------- */
/* Placement                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Which of the wall's three depth bands an item sits in.
 *
 * These are LOCAL to the wall — the wall isolates itself, so a `front` artifact
 * is in front of the other artifacts, not in front of the page's actual
 * foreground layer (the paper fragment, the player). See `WallItem.module.css`.
 */
export type WallDepth = "back" | "base" | "front";

/**
 * THE WIDE COMPOSITION — free placement on a canvas.
 *
 * Normalized, never pixels. `x: 62, y: 28` survives a resize, a font swap and a
 * different display; `left: 947px` survives one screen.
 *
 * THE ANCHOR IS THE ITEM'S CENTRE, not its top-left corner. Rotation happens
 * about the centre anyway, and a centre anchor means an item does not drift
 * sideways when its size changes or its caption grows a line.
 */
/**
 * Which edge of the item `x` refers to.
 *
 * The wall was centre-anchored throughout, which is right for objects that are
 * scattered and wrong for anything meant to line up: two centred items of
 * different widths at the same `x` do NOT share an edge, so a rail is
 * impossible to author. With an anchor, `x` means the item's left edge, its
 * right edge, or its centre — and a column of left-anchored items agrees down
 * one side however wide each one is.
 *
 * `left` is the working default because most of this wall is writing, and
 * writing reads down a left edge.
 */
export type WallAlign = "left" | "center" | "right";

export interface WallPlacement {
  /** 0–100. The item's ANCHORED EDGE, as a percentage of the wall's inline
   *  size — which edge that is depends on `align`. */
  readonly x: number;
  /** 0–100. The item's centre, as a percentage of the wall's block size. */
  readonly y: number;
  /** Which edge `x` names. Default `left`. */
  readonly align?: WallAlign;
  /**
   * 0–100. Inline size as a percentage of the wall's inline size.
   * Omitted means intrinsic — the item is as wide as its own content wants to
   * be, bounded by whatever its renderer's module says.
   */
  readonly size?: number;
  /** Degrees. Small numbers. The wall is restrained; the artifacts are personal. */
  readonly rotation?: number;
  /** Default `base`. */
  readonly depth?: WallDepth;
  /** 0–9. Ordering WITHIN a depth band. The bands are ten apart, which is where
   *  the single digit comes from; a larger number leaks into the next band. */
  readonly z?: number;
}

/**
 * THE NARROW COMPOSITION — a different composition, not a scaled one.
 *
 * Note what is missing: `y`. On narrow the wall is a flow column, so vertical
 * position comes from document order and `lead` chooses how much air precedes
 * an item.
 *
 * WHY, concretely. At 375px a blurb might be five lines or nine, depending on
 * the copy, on which font actually loaded, and on where the words happen to
 * wrap. Authored `y` percentages on a narrow wall eventually collide, and a
 * collision on a phone is two paragraphs printed on top of each other. Flow
 * cannot collide.
 *
 * What keeps it a WALL rather than a card feed is that everything else
 * survives: items sit at different widths, at different horizontal positions,
 * slightly askew, some running past an edge. What it gives up is overlap, which
 * a phone should mostly not have anyway.
 */
export interface WallPlacementNarrow {
  /** 0–100. The item's ANCHORED EDGE, as a percentage of the wall's inline
   *  size. See `align`. */
  readonly x: number;
  /** Which edge `x` names. Default `left`. */
  readonly align?: WallAlign;
  /** 0–100. Percentage of the wall's inline size. Omitted means intrinsic. */
  readonly size?: number;
  readonly rotation?: number;
  readonly depth?: WallDepth;
  readonly z?: number;
  /** Vertical air before this item, from the site's own space scale.
   *  Default `normal`. */
  readonly lead?: "tight" | "normal" | "loose";
}

/**
 * Both compositions. `narrow` IS REQUIRED, and that is the point.
 *
 * Optional narrow placement is how a site ends up with a proportionally shrunk
 * desktop composition on a phone: the field is skipped, a default is derived,
 * and nobody ever looks. Requiring it means the author has to answer the
 * question — even if the answer is `"absent"`, which removes the item from
 * small screens entirely. That is how "fewer charms on mobile" is expressed.
 */
export interface WallPlacementSet {
  readonly wide: WallPlacement;
  readonly narrow: WallPlacementNarrow | "absent";
}

interface WallItemBase {
  readonly id: WallItemId;
  readonly placement: WallPlacementSet;
}

/* -------------------------------------------------------------------------- */
/* The five types                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A PHOTOGRAPH OR VISUAL ARTIFACT. The wall's main substance.
 *
 * `caption`, `annotation`, `date` and `location` are four separate optional
 * fields rather than one metadata object, because the renderer is supposed to
 * be able to put them in four different places. A date beside a photograph
 * instead of tucked under it is the whole of MVP 1's
 * metadata-is-positioned-away principle, carried forward.
 *
 *   caption      what this is. A sentence.
 *   annotation   what she wants to say about it. An aside, not a description.
 */
export interface MemoryItem extends WallItemBase {
  readonly type: "memory";
  /** Path relative to `public/assets/`, no leading slash. Resolved through
   *  `assetUrl()` so it survives the GitHub Pages subpath. */
  readonly src: string;
  /** Required. `""` is a valid, deliberate answer for something purely
   *  atmospheric — but it has to be typed out on purpose. */
  readonly alt: string;
  readonly caption?: string;
  readonly annotation?: string;
  /** ISO 8601: `YYYY-MM-DD`, `YYYY-MM` or `YYYY`. Machine form; display
   *  formatting happens at render time. */
  readonly date?: string;
  readonly location?: string;
  /** Makes the whole memory a link. Most memories are not links. */
  readonly href?: string;
  /** Reserves the space before the file arrives — and before it exists at all,
   *  which it often will not. Composition tolerates missing assets. */
  readonly aspectRatio?: number;
}

/**
 * TEXT WORTH KEEPING. A lyric, a line from a book, a thought, a fragment.
 *
 * `text` is one entry per paragraph. Most blurbs are a single entry; it is an
 * array so a longer passage can become a blurb without a type change.
 *
 * `emphasis` is the only place a wall item names its own weight, and it is
 * three words rather than a size because size is the renderer's business:
 *
 *   whisper   almost gone. Something noticed rather than read.
 *   normal    reading copy.
 *   feature   the display register at scale, with emptiness around it.
 */
export interface BlurbItem extends WallItemBase {
  readonly type: "blurb";
  readonly text: readonly string[];
  /** Where it came from. A song, a person, a book. Rendered apart from the text. */
  readonly source?: string;
  /** Default `normal`. */
  readonly emphasis?: "whisper" | "normal" | "feature";
}

/**
 * AN ANNOTATED BOOKMARK. Somewhere else worth going, and why.
 *
 * The only type that is inherently interactive, which is reason enough for it
 * to be its own type. A blogroll of other people's weird personal sites is very
 * much the point.
 */
export interface LinkItem extends WallItemBase {
  readonly type: "link";
  readonly title: string;
  readonly href: string;
  /** One line at most. If it needs a paragraph, it is a blurb sitting beside a
   *  link. */
  readonly note?: string;
  /** Path relative to `public/assets/`. Optional; most links have none. */
  readonly thumbnail?: string;
  /** Authored, not derived from `href`, so it can read as she'd write it. */
  readonly domain?: string;
}

/**
 * A TINY, MOSTLY-VISUAL GRAPHIC. A sticker in the loosest possible sense.
 *
 * A charm MAY CARRY NO MEANING AT ALL, and that is a legitimate reason for one
 * to exist on a personal wall. When it doesn't, `alt` is absent and the
 * renderer marks it `aria-hidden` — a screen reader is told nothing, because
 * there is nothing.
 *
 * A charm with an `href` MUST have an `alt`: a link needs an accessible name.
 * `validate.ts` checks this in development.
 */
export interface CharmItem extends WallItemBase {
  readonly type: "charm";
  readonly src: string;
  /** Absent or empty = decorative. Present = it means something. */
  readonly alt?: string;
  readonly href?: string;
  readonly aspectRatio?: number;
}

/**
 * Which functional object an `embed` hosts.
 *
 * A string literal union rather than a component reference, so content data
 * stays plain, serialisable and editable by something that is not a bundler.
 * The name → component mapping lives in `items/Embed.tsx`.
 */
export type WallEmbedKind = "bunny-hop";

/**
 * A LARGE FUNCTIONAL OBJECT hung on the wall.
 *
 * For MVP 2 the only one is Bunny Hop. Placing it makes the wall the player's
 * home and retires the docked player — `App.tsx` mounts one or the other, never
 * both. See `wallHostsEmbed()`.
 */
export interface EmbedItem extends WallItemBase {
  readonly type: "embed";
  readonly embed: WallEmbedKind;
  /** Accessible name for the region, when the object needs one. */
  readonly label?: string;
}

export type WallItem =
  | MemoryItem
  | BlurbItem
  | LinkItem
  | CharmItem
  | EmbedItem;
