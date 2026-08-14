import { Meta } from "../../components/Meta";
import type { LinkItem } from "../types";
import { WallImage } from "./WallImage";
import styles from "./Link.module.css";

/**
 * A LINK — an annotated bookmark.
 *
 * Somewhere else worth going, and why. A blogroll of other people's strange
 * personal sites is very much the point of this type; so is a project.
 *
 * THE ANCHOR IS A REAL `<a href>`. Not a div with a click handler, not a card
 * with a nested button. It opens in a new tab when it leaves the site, it has a
 * real accessible name, it is reachable with a keyboard, and it can be
 * middle-clicked and bookmarked like any link anywhere.
 *
 * `external` is inferred from the protocol rather than authored. `LinkItem` is
 * always somewhere else by definition — the field on MVP 1's `LinkPost` existed
 * so an in-page anchor could stay honest, and this wall has no in-page anchors.
 *
 * ── One `data-text` subtlety, and it is load-bearing ────────────────────────
 *
 * `data-text="display"` is on the `<h3>`, NOT on the `<a>` inside it.
 * `textSplit.ts` refuses to enter links — splitting one breaks the underline
 * (an atomic inline box does not receive a propagated `text-decoration`) and
 * puts the accessible name at the mercy of a screen reader's word heuristics.
 * Marking the heading gives the splitter an element whose only child is opaque,
 * so it yields no pieces and the title simply does not ripple. That is the
 * intended outcome, not an oversight.
 *
 * ── The mark ────────────────────────────────────────────────────────────────
 *
 * The `↗` sits INSIDE the heading and OUTSIDE the anchor, on purpose and in
 * that order. Outside, so it stays off the underline and out of the accessible
 * name — a link announced as "A Placeholder Link north east arrow" is worse
 * than one announced as itself, which is why it is also `aria-hidden`. Inside
 * the heading, so it travels with the title when the type reflows and is never
 * left stranded on its own line.
 *
 * It is not the affordance. The underline is. The mark only says WHERE the link
 * goes, which is a different question from whether it is a link at all — so
 * removing it would cost meaning, not accessibility.
 */

export function Link({ item }: { item: LinkItem }) {
  const external = /^https?:/i.test(item.href);

  return (
    <article className={styles.link}>
      {item.thumbnail && (
        <WallImage className={styles.thumbnail} src={item.thumbnail} alt="" />
      )}

      <h3 className={styles.title} data-text="display">
        <a
          className={styles.anchor}
          href={item.href}
          {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
        >
          {item.title}
        </a>
        <span className={styles.mark} aria-hidden="true">
          ↗
        </span>
      </h3>

      {item.note && (
        <p className={styles.note} data-text="body">
          {item.note}
        </p>
      )}

      {item.domain && (
        <div className={styles.domain}>
          <Meta size="sm" dim>
            {item.domain}
          </Meta>
        </div>
      )}
    </article>
  );
}
