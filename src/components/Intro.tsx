import { assetUrl } from "../lib/assets";
import { intro, work } from "../content/posts";
import { Meta } from "./Meta";
import styles from "./Intro.module.css";

/**
 * WHO THIS IS — and, underneath it, what she does.
 *
 * TWO BEATS, NOT ONE PARAGRAPH. The personal part stays personal, and the
 * professional part gets its own short section beneath it. Merged, they
 * produce the About Me that reads like a LinkedIn summary — which for a site
 * whose whole premise is a letter would be the wrong voice in the first
 * paragraph a visitor reads.
 *
 * The separation is a heading, not a rule or a box: it is a change of subject,
 * and a change of subject is what a heading is for.
 *
 * ── IT IS A READING COLUMN, INSIDE A PAGE THAT IS NOT ───────────────────────
 *
 * The wall below places things by coordinate; this is prose, and prose has a
 * measure. Sitting it in a bounded column under the identity is what lets the
 * two coexist without the page having to decide it is one or the other.
 *
 * `data-text="body"` is the click-ripple's hook — the same as every other
 * sentence on the site, so the wave passes through these words too.
 */
export function Intro() {
  return (
    <section className={styles.intro} aria-labelledby="intro-work">
      <div className={styles.personal}>
        {/* THE PHOTOGRAPH SITS IN THE PROSE, and the words run around it.

            It used to hang on the wall below, placed by coordinate like every
            other artifact. Floated here it belongs to the paragraph instead —
            the text wraps rather than stopping for it, so the picture reads as
            part of what she is saying rather than as an exhibit beneath it.

            `float` is the only thing in CSS that makes text flow AROUND a box
            rather than beside or behind it. A grid column would put the words
            in a narrower column next to the image; a float lets a line that
            clears the picture run full width again, which is what makes it
            look set rather than arranged. */}
        <figure className={styles.figure}>
          <img
            className={styles.photo}
            src={assetUrl("wall/tokyo-flowers.jpg")}
            alt="A dark room where enormous red and magenta flowers are projected across the ceiling and reflected in a mirrored floor. A young woman sits among other visitors, looking up into the light."
            width={760}
            height={1013}
            decoding="async"
          />
          <figcaption className={styles.figcaption} data-text="body">
            a flower projection room somewhere in tokyo
          </figcaption>
        </figure>

        {intro.map((paragraph) => (
          <p className={styles.paragraph} key={paragraph} data-text="body">
            {paragraph}
          </p>
        ))}
      </div>

      <div className={styles.work}>
        {/* Lower case, in the metadata register. A heading here in the display
            face would announce a section; this is closer to a margin note that
            happens to name what follows. */}
        <Meta id="intro-work" as="h2" tracking="wide" dataText="meta">
          {work.heading}
        </Meta>

        {work.paragraphs.map((paragraph) => (
          <p className={styles.paragraph} key={paragraph} data-text="body">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
