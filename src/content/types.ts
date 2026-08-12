/**
 * CONTENT TYPES
 *
 * A discriminated union over `kind`. The union exists so each kind can render
 * *differently* — a quote is not a photograph with a border, and a journal
 * entry is not a link with more text. There is deliberately no `Card` type, no
 * shared `title` on the base, and no `variant` field: if two kinds need the
 * same field, they each declare it, because that keeps them free to diverge.
 *
 * `meta` is a separate object rather than fields on the post, because the
 * composition positions metadata *away from* the content block — a date may
 * sit in a different part of the page from the text it belongs to. Keeping it
 * separable means a renderer can take `post.meta` somewhere else entirely
 * without dragging the content with it.
 *
 * Nothing here describes appearance, depth, position or treatment. Where a
 * post sits in the world is composition, not content.
 */

/** Stable identifier. Used for React keys and for localStorage records that
 *  need to refer to a post (a discovered/seen marker, say). Never reuse one. */
export type PostId = string;

export type PostKind = "text" | "image" | "drawing" | "quote" | "link";

/**
 * Metadata, positioned independently of the content it describes.
 * This is the Instrument Sans register: small, quiet, tracked out.
 */
export interface PostMeta {
  /** ISO 8601 (`YYYY-MM-DD`, or `YYYY-MM`, or `YYYY`). Store the machine form;
   *  display formatting is a design decision made at render time. */
  readonly date: string;
  /** Short uppercase-able category, e.g. `JOURNAL`, `CHROME EXTENSION`. */
  readonly label?: string;
  /** Sequence marker for section numbering, e.g. `01`. Authored, not derived,
   *  so reordering the array does not silently renumber the page. */
  readonly index?: string;
  /** Technologies, media, tools — anything that reads as a tracked-out list. */
  readonly tags?: readonly string[];
}

interface PostBase {
  readonly id: PostId;
  readonly meta: PostMeta;
  /** Placeholder content is marked so it can be filtered out of a build, and
   *  so nobody mistakes scaffolding copy for the site owner's writing. */
  readonly placeholder?: true;
}

/**
 * Prose. Sits directly on the background — it does not need a panel.
 * `body` is an array of paragraphs rather than one string so a renderer can
 * treat the opening line differently, or drop everything after the first
 * paragraph on a narrow viewport, without parsing.
 */
export interface TextPost extends PostBase {
  readonly kind: "text";
  /** Optional: some entries are unheaded on purpose. */
  readonly title?: string;
  readonly body: readonly string[];
}

/**
 * A photograph or a scanned drawing. It may simply exist in space.
 *
 * `src` is a path *relative to* `public/assets/` — resolve it through
 * `assetUrl()` from `src/lib/assets.ts` so it survives the GitHub Pages
 * subpath. Do not write a leading slash here.
 */
export interface ImagePost extends PostBase {
  readonly kind: "image";
  readonly src: string;
  /** Required. An empty string is a valid, deliberate answer for art that is
   *  purely atmospheric — but it has to be typed out on purpose. */
  readonly alt: string;
  /** Rendered separately from the image, and may be placed anywhere. */
  readonly caption?: string;
  /** Intrinsic width / height. Lets layout reserve the space before the file
   *  loads — and before the file exists at all, which it often will not. */
  readonly aspectRatio?: number;
}

/**
 * A scanned drawing — pen, pencil, ink. Deliberately NOT an `ImagePost`.
 *
 * A photograph is a rectangle: it has edges, it earns a frame, it can be
 * cropped. A drawing is line art on transparency: it has no edges, and putting
 * it in a filled box invents a boundary the artwork does not have. Routing
 * both through one renderer is how a page ends up card-heavy without anyone
 * deciding it should be.
 *
 * Source art is greyscale + alpha with dark ink strokes, inverted at display
 * time so one file serves any surface — the technique the Bunny Hop extension
 * uses for its bunny art.
 */
export interface DrawingPost extends PostBase {
  readonly kind: "drawing";
  readonly src: string;
  readonly alt: string;
  /** Reserves layout space before the file exists, so the composition does not
   *  reflow when art finally arrives. */
  readonly aspectRatio?: number;
}

/**
 * A quote. The display register at scale; the attribution is a separate field
 * precisely so it can be set far from the quote instead of tucked under it.
 */
export interface QuotePost extends PostBase {
  readonly kind: "quote";
  readonly text: string;
  readonly attribution?: string;
  /** Where it came from. `href` optional — most sources are not linkable. */
  readonly source?: {
    readonly label: string;
    readonly href?: string;
  };
}

/**
 * Somewhere else worth going. A project, a profile, a piece of work.
 * This is the only kind that is inherently interactive, which is reason enough
 * for it to be its own type.
 */
export interface LinkPost extends PostBase {
  readonly kind: "link";
  readonly href: string;
  /** The name of the thing. Display register. */
  readonly label: string;
  /** One line at most. If it needs a paragraph, it is a TextPost. */
  readonly description?: string;
  /** Leaves the site. Drives `target` / `rel` and any affordance the design
   *  chooses; not derived from `href` so an internal anchor stays honest. */
  readonly external: boolean;
}

export type Post =
  | TextPost
  | ImagePost
  | DrawingPost
  | QuotePost
  | LinkPost;

/** Narrowing helper for renderers that handle one kind. */
export function isPostKind<K extends PostKind>(
  post: Post,
  kind: K,
): post is Extract<Post, { kind: K }> {
  return post.kind === kind;
}

/** Site identity. Fixed — see the shared brief. */
export interface SiteIdentity {
  readonly name: string;
  readonly handle: string;
  readonly instagramUrl: string;
}
