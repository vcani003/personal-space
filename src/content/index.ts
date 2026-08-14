/**
 * Static content. No fetching, no CMS, no build step beyond TypeScript.
 * Import from here rather than reaching into the individual files.
 */
export type {
  ImagePost,
  LinkPost,
  Post,
  PostId,
  PostKind,
  PostMeta,
  QuotePost,
  SiteIdentity,
  TextPost,
} from "./types";
export { isPostKind } from "./types";

/**
 * MVP 1's posts. `about`, the journal entries and the five post renderers left
 * the homepage composition when the wall arrived — but nothing was deleted, and
 * `about` in particular is Vero's own writing and the only copy of it. It is the
 * obvious source material for the first real wall items.
 */
export { about, closingLine, identity, postById, posts } from "./posts";

/** MVP 2's wall. The only file that has to change to hang something. */
export { wallItems, wallSpan } from "./wall";
