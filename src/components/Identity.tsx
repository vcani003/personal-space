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
        {/* THE HANDLE IS A LINK, WHICH IT HAD STOPPED BEING.
            `@starcharm` used to be rendered by `Elsewhere`, an anchor at the
            top right of the page. That was removed and the handle moved into
            this metadata line as plain TEXT — so the site went on printing an
            Instagram handle that could not be pressed, which reads as a
            username rather than a way to reach her.

            Underlined, like the link in the prose and unlike the navigation.
            The rule there is that a destination is distinguished by luminance
            alone, which works when a link is the only thing on its line. Here
            they sit inside a row of small print beside a year, and a handle
            that looks exactly like the date next to it is not discoverable. */}
        <Meta>
          <a className={styles.link} href={identity.instagramUrl} target="_blank" rel="noreferrer noopener">
            {identity.handle}
          </a>
          {META_SEPARATOR}
          <a className={styles.link} href={identity.githubUrl} target="_blank" rel="noreferrer noopener">
            github
          </a>
          {META_SEPARATOR}
          2026
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
