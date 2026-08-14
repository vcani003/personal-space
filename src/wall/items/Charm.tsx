import type { CharmItem } from "../types";
import { WallImage } from "./WallImage";
import styles from "./Charm.module.css";

/**
 * A CHARM — a tiny, mostly-visual graphic.
 *
 * The one type that is allowed to mean nothing at all. A small drawn thing, a
 * scrap, a mark. On a personal wall that is a legitimate reason for something to
 * exist, and pretending otherwise is how a wall turns into a portfolio.
 *
 * ── The accessibility rule, which follows from that ─────────────────────────
 *
 * NO ALT MEANS THERE IS NOTHING TO SAY. An empty `alt` already removes an image
 * from the accessibility tree, and `aria-hidden` on the wrapper removes the
 * wrapper with it, so a decorative charm contributes nothing at all to what a
 * screen reader announces. Silence is the correct output. Describing a
 * meaningless graphic is worse than omitting it: it spends a listener's
 * attention on something a sighted visitor gets to ignore.
 *
 * A charm WITH an `href` is different — a link needs an accessible name, so the
 * alt becomes required. `validate.ts` warns in development when one is missing,
 * because the failure is silent otherwise: the browser falls back to announcing
 * the URL.
 *
 * There is no `data-text` here. A charm has no text.
 */

export function Charm({ item }: { item: CharmItem }) {
  const decorative = !item.alt;

  const image = (
    <WallImage
      className={styles.image}
      src={item.src}
      alt={item.alt ?? ""}
      aspectRatio={item.aspectRatio}
      hidden={decorative}
    />
  );

  if (item.href) {
    const external = /^https?:/i.test(item.href);
    return (
      <a
        className={styles.charm}
        href={item.href}
        {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      >
        {image}
      </a>
    );
  }

  return (
    <span
      className={styles.charm}
      aria-hidden={decorative ? "true" : undefined}
    >
      {image}
    </span>
  );
}
