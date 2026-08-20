import { assetUrl } from "../lib/assets";
import { identity, siteName } from "../content/posts";
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
 *
 * ── THE CHARM BESIDE THE HANDLE ─────────────────────────────────────────────
 *
 * A paopu fruit, drawn by her, sitting next to `@starcharm`. It is a charm in
 * the wall's sense — "I saw this tiny thing and wanted to keep it" — but it is
 * NOT a WallItem, and that is deliberate rather than a shortcut: the wall is a
 * coordinate space below this row, and an artifact belonging to the identity
 * cannot be placed inside a surface it sits above. Its position here is a fact
 * about the handle, not a percentage of anything.
 *
 * It is `aria-hidden` and carries no alt text. It says nothing the handle
 * beside it does not already say, and a screen reader announcing "paopu fruit"
 * between a name and a date is noise. If it ever becomes a link it needs a
 * name — the wall's Charm renderer has the same rule and enforces it.
 *
 * The drawing keeps its own colour. Nothing here filters, tints or dims it; it
 * is a piece of her work rather than a piece of the interface.
 */
export function Identity() {
  return (
    <header className={styles.identity}>
      <h1 className={styles.name}>{identity.name}</h1>

      <div className={styles.line}>
        <img
          className={styles.charm}
          src={assetUrl("wall/paopu.png")}
          alt=""
          aria-hidden="true"
          decoding="async"
        />
        <Meta>
          {/* "Personal space" is gone from here — the site's name says it
              below, and the intro explains it. Spelling it out a third time
              was a label restating something that had just introduced
              itself. */}
          {[identity.handle, "2026"].join(META_SEPARATOR)}
        </Meta>
      </div>

      {/* THE SITE'S NAME, AND IT GETS ITS OWN BEAT.

          It was a small line directly under the name, which made it read as a
          subtitle of HER rather than as the name of the place — and it sat so
          close to the identity that it was over before a visitor noticed it.
          Moved below the metadata with real air above it, at the display
          register, it becomes a title card: the last thing in the header and
          the thing that names what you have walked into.

          Still not the `<h1>`. That remains her name, so the page announces
          itself to a screen reader, and appears in a search result, as a
          person. */}
      <p className={styles.site} data-text="display">
        {siteName}
      </p>
    </header>
  );
}
