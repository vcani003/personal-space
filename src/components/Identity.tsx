import { identity } from "../content/posts";
import { Meta, META_SEPARATOR } from "./Meta";
import styles from "./Identity.module.css";

/**
 * IDENTITY.
 *
 * The one place the display register is allowed to be at full scale, and the
 * only `h1` on the page.
 *
 * Composed as the contrast Vero specified: a name at 80px in Eiko Thin with an
 * 11px tracked line of Instrument Sans directly beneath it. The ratio between
 * them is the hierarchy — nothing here is emphasised with colour, weight or a
 * rule, because the size difference has already done the work.
 *
 * The metadata sits BELOW the name rather than above it, so the first thing a
 * visitor reads on the page is a person's name and not a category label.
 */
export function Identity() {
  return (
    <header className={styles.identity}>
      <h1 className={styles.name}>{identity.name}</h1>
      <Meta className={styles.line}>
        {[identity.handle, "Personal space", "2026"].join(META_SEPARATOR)}
      </Meta>
    </header>
  );
}
