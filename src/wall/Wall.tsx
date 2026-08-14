import { useEffect, useState } from "react";
import type { StyleVars } from "../lib/vars";
import { readWallOffsets, wallOffset } from "./overrides";
import type { WallItem as WallItemData } from "./types";
import { validateWall } from "./validate";
import { WallItem } from "./WallItem";
import styles from "./Wall.module.css";

/**
 * THE WALL.
 *
 * A wall of things worth keeping. It knows two things and nothing else: how
 * tall it is, and that it contains artifacts. It has never heard of a memory or
 * a charm — `WallItem` dispatches, and the five renderers own their material.
 *
 * That split is what makes the acceptance criterion true: HANGING A NEW
 * ARTIFACT MEANS EDITING `src/content/wall.ts` AND NOTHING ELSE. Not this file,
 * not `Home.tsx`, not a stylesheet.
 *
 * ── The wall is finite ──────────────────────────────────────────────────────
 *
 * `span` is its height in viewport heights. Two to four. There is no infinite
 * scroll, no pagination, no virtualisation and no lazy list — this is a dozen
 * absolutely positioned elements and the browser has been good at those since
 * 1997. `span` is authored next to the items in `src/content/wall.ts`, because
 * it is a property of the composition rather than of the component: a wall that
 * grows a row of artifacts needs to grow.
 *
 * On narrow the wall is a flow column and `span` is ignored — its height is
 * whatever its contents come to. See `WallItem.module.css`.
 *
 * ── Document order is reading order ─────────────────────────────────────────
 *
 * Visual position is free; the DOM is not. Items render in array order, so the
 * array IS the reading order for a screen reader, for tab focus and for
 * anything that turns off CSS. Authoring the array in an order that makes sense
 * read aloud is part of composing the wall, and it costs nothing — position is
 * a separate field.
 *
 * ── Remembered positions ────────────────────────────────────────────────────
 *
 * Read once, here, at mount. They resolve as a displacement on top of the
 * authored anchor and can never write back to it. If storage is unavailable, or
 * full, or holding something malformed, every offset is zero and the wall is
 * exactly the wall that was hung. See `overrides.ts`.
 *
 * A `useState` initialiser rather than an effect: the offsets are known before
 * first paint, so nothing flashes into place. They are not subscribed to,
 * because nothing but a drag can change them and a drag will already be holding
 * the element it is moving.
 */

export interface WallProps {
  readonly items: readonly WallItemData[];
  /** The wall's height in viewport heights. Target 2–4. */
  readonly span: number;
}

export function Wall({ items, span }: WallProps) {
  const [offsets] = useState(readWallOffsets);

  /* Authoring mistakes on this wall are silent — an item at y: 140 is simply
     never seen. Development only; the whole branch leaves the bundle. */
  useEffect(() => {
    if (import.meta.env.DEV) validateWall(items);
  }, [items]);

  const style: StyleVars = { "--wall-span": span };

  return (
    <div className={styles.wall} style={style} data-wall="">
      {items.map((item) => (
        <WallItem key={item.id} item={item} offset={wallOffset(offsets, item.id)} />
      ))}
    </div>
  );
}
