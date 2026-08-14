import type { WallEmbedKind, WallItem } from "./types";

/**
 * THE WALL — MVP 2's homepage.
 *
 * A wall of things worth keeping: photographs, lines of text, bookmarks, small
 * drawn things, and one functional object. Scrapbook LOGIC, not scrapbook
 * STYLING — the dark, misty, editorial chassis from MVP 1 is unchanged, and the
 * personality comes entirely from what is placed on the wall.
 *
 *     The wall is restrained. The artifacts are personal.
 *     Controlled chaos is authored, never random.
 *
 * ── Mount it ────────────────────────────────────────────────────────────────
 *
 *   <Wall items={wallItems} span={wallSpan} />
 *
 * ── Hang something on it ────────────────────────────────────────────────────
 *
 *   Edit `src/content/wall.ts`. That is the entire procedure, and it is an
 *   acceptance criterion: adding a memory or a charm must not require touching
 *   `Home.tsx`, this file, a component or a stylesheet.
 *
 * ── Read before changing anything ───────────────────────────────────────────
 *
 *   docs/wall-architecture.md   the whole design, including the open questions
 *   types.ts                    the union, and why the base holds two fields
 *   overrides.ts                authored position vs visitor position
 *   WallItem.module.css         the responsive strategy, in one media query
 */

export { Wall } from "./Wall";
export type { WallProps } from "./Wall";

export type {
  BlurbItem,
  CharmItem,
  EmbedItem,
  LinkItem,
  MemoryItem,
  WallDepth,
  WallEmbedKind,
  WallItem,
  WallItemId,
  WallItemType,
  WallPlacement,
  WallPlacementNarrow,
  WallPlacementSet,
} from "./types";

/**
 * Remembered positions. Exported for the drag implementation that does not
 * exist yet — `Wall` reads them itself, and nothing else needs to.
 */
export {
  clearWallOffsets,
  readWallOffsets,
  wallOffset,
  writeWallOffset,
  NO_OFFSET,
} from "./overrides";
export type { Offset, WallOffsets } from "./overrides";

/**
 * Does the wall host a particular functional object?
 *
 * THE PLAYER CANNOT BE IN TWO PLACES AT ONCE. The rail beside the wall mounts
 * one copy; a `bunny-hop` embed hangs another ON the wall. `Home.tsx` asks this
 * question and mounts exactly one of them, so the two cannot both appear no
 * matter what is authored — and with no embed on the wall, the player is in the
 * rail, which is where the composition puts it.
 *
 * (This guard used to live in `App.tsx` and used to choose between the wall and
 * `PlayerDock`. The dock is retired — see `src/player/PlayerDock.tsx` — so the
 * question moved to where the player is now mounted. The question itself is
 * unchanged.)
 *
 * A derived answer rather than a flag someone has to remember to set. The
 * content is the single source of truth for where the player lives.
 */
export function wallHostsEmbed(
  items: readonly WallItem[],
  kind: WallEmbedKind,
): boolean {
  return items.some((item) => item.type === "embed" && item.embed === kind);
}
