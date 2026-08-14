import type { Offset } from "./overrides";
import { placementAttributes } from "./placement";
import type { WallItem as WallItemData } from "./types";
import { Blurb } from "./items/Blurb";
import { Charm } from "./items/Charm";
import { Embed } from "./items/Embed";
import { Link } from "./items/Link";
import { Memory } from "./items/Memory";
import styles from "./WallItem.module.css";

/**
 * THE PLACEMENT SHELL, AND THE DISPATCHER.
 *
 * Two jobs, and the separation between them is the whole architecture:
 *
 *   THE SHELL      knows where the artifact hangs, how wide it is, how far it
 *                  is turned and how deep it sits. It knows nothing about what
 *                  is inside it.
 *   THE DISPATCH   knows the five types. It knows nothing about position.
 *
 * A RENDERER MUST NEVER SET `position`, `inset`, `z-index`, `rotate` OR
 * `translate`. If one does, placement stops being data and the composition
 * stops being editable from one file. Renderers style material; the shell
 * places it.
 *
 * The `switch` is exhaustive over the union with no `default`, so a sixth type
 * is a compile error until it is handled. That is most of the value of the
 * union being discriminated in the first place.
 *
 * ── The attributes, and why they are a contract ─────────────────────────────
 *
 *   data-wall-item="<type>"   what this is
 *   data-wall-id="<id>"       which one
 *
 * These exist so that other layers can find things on the wall WITHOUT
 * structural selectors. `src/interaction/textSplit.ts` learned that lesson
 * expensively in MVP 1 — it reaches into markup it does not own with selectors
 * like `main article > h3 ~ p`, and restructuring the page silently switches
 * the effect off with no error anywhere. The wall's answer is that every hook
 * anyone might need is authored on the element: these two here, and
 * `data-text="display|body|meta"` inside the renderers.
 */

export interface WallItemProps {
  readonly item: WallItemData;
  /** The visitor's remembered displacement. `{ x: 0, y: 0 }` is the normal case. */
  readonly offset: Offset;
}

export function WallItem({ item, offset }: WallItemProps) {
  const { style, ...attributes } = placementAttributes(item.placement, offset);

  return (
    <div
      className={styles.item}
      style={style}
      data-wall-item={item.type}
      data-wall-id={item.id}
      {...attributes}
    >
      {content(item)}
    </div>
  );
}

function content(item: WallItemData) {
  switch (item.type) {
    case "memory":
      return <Memory item={item} />;
    case "blurb":
      return <Blurb item={item} />;
    case "link":
      return <Link item={item} />;
    case "charm":
      return <Charm item={item} />;
    case "embed":
      return <Embed item={item} />;
  }
}
