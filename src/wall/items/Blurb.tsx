import { Meta } from "../../components/Meta";
import type { BlurbItem } from "../types";
import styles from "./Blurb.module.css";

/**
 * A BLURB — text worth keeping.
 *
 * A lyric, a line from a book, a thought, something someone said. It sits
 * directly on the darkness; it does not need a panel and it will not be given
 * one.
 *
 * `figure` + `blockquote` + `figcaption` rather than a bare paragraph, because
 * a blurb is quoted material with an optional source, and that is exactly the
 * markup the platform already has for quoted material with an optional source.
 * It also means the source can be positioned anywhere by CSS without ceasing to
 * be attached to what it names.
 *
 * EMPHASIS IS THE ONLY DIAL, and it is three words rather than a size:
 *
 *   whisper   almost gone. Something noticed rather than read.
 *   normal    reading copy.
 *   feature   the display register at scale, with emptiness around it.
 *
 * It is published as `data-emphasis` so the stylesheet decides what each one
 * means. `feature` is the only value that changes the typographic register, and
 * therefore the only one that changes `data-text` — a featured blurb moves at
 * display amplitude when the page is touched because it IS display type.
 */

export function Blurb({ item }: { item: BlurbItem }) {
  const emphasis = item.emphasis ?? "normal";
  const register = emphasis === "feature" ? "display" : "body";

  return (
    <figure className={styles.blurb} data-emphasis={emphasis}>
      <blockquote className={styles.text}>
        {item.text.map((paragraph, index) => (
          <p key={index} data-text={register}>
            {paragraph}
          </p>
        ))}
      </blockquote>
      {item.source && (
        <figcaption className={styles.source}>
          <Meta size="sm" dim dataText="meta">
            {item.source}
          </Meta>
        </figcaption>
      )}
    </figure>
  );
}
