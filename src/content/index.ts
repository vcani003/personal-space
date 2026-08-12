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
export { about, closingLine, identity, postById, posts } from "./posts";
