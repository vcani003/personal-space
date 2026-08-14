import type { ReactNode } from "react";
import { Meta, META_SEPARATOR } from "../../components/Meta";
import { formatPostDate } from "../../lib/date";
import type { MemoryItem } from "../types";
import { WallImage } from "./WallImage";
import styles from "./Memory.module.css";

/**
 * A MEMORY — a photograph or a visual artifact.
 *
 * The substance of the wall. Everything else on it is a caption to these.
 *
 * FOUR PIECES OF TEXT, THREE OF THEM OPTIONAL, AND THEY ARE NOT THE SAME THING:
 *
 *   caption      what this is. A sentence, in reading copy.
 *   annotation   what she has to say about it. An aside — closer to something
 *                written in a margin than to a description.
 *   date         machine ISO in the data, short month + year on screen.
 *   location     where.
 *
 * They are four separate fields precisely so a designer can put them in four
 * different places. Right now they are stacked under the image because that is
 * the least-decided arrangement, not because it is the right one — the
 * visual-design-engineer owns where they actually go, and "under the image" is
 * the arrangement most likely to be wrong.
 *
 * `data-text` is the stable hook for `src/interaction/textSplit.ts`: the value
 * is the typographic REGISTER, which is what that file's amplitude column is
 * already a function of. It goes on the leaf element that owns the text, never
 * on a container that holds another one.
 */

export function Memory({ item }: { item: MemoryItem }) {
  const meta = [
    item.date ? formatPostDate(item.date) : undefined,
    item.location,
  ].filter(Boolean);

  const described =
    item.caption !== undefined ||
    item.annotation !== undefined ||
    meta.length > 0;

  const figure = (
    <figure className={styles.memory}>
      <WallImage
        className={styles.image}
        src={item.src}
        alt={item.alt}
        aspectRatio={item.aspectRatio}
      />
      {described && (
        <figcaption className={styles.caption}>
          {item.caption && <p data-text="body">{item.caption}</p>}
          {item.annotation && (
            <p className={styles.annotation} data-text="body">
              {item.annotation}
            </p>
          )}
          {meta.length > 0 && (
            <Meta size="sm" dim>
              {meta.join(META_SEPARATOR)}
            </Meta>
          )}
        </figcaption>
      )}
    </figure>
  );

  return item.href ? linked(item.href, figure) : figure;
}

/**
 * Most memories are not links. When one is, the whole artifact becomes the
 * target rather than a "view" affordance appearing beneath it — the image's
 * alt text is already the accessible name, so the link needs no words of its
 * own.
 *
 * `external` is inferred here rather than authored, unlike `LinkItem`, because
 * a memory is a photograph first and its destination is incidental.
 */
function linked(href: string, children: ReactNode) {
  const external = /^https?:/i.test(href);
  return (
    <a
      className={styles.link}
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
    >
      {children}
    </a>
  );
}
