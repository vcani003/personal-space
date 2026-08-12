import { about } from "../content/posts";
import { Meta } from "./Meta";
import styles from "./About.module.css";

/**
 * ABOUT.
 *
 * Short by design. Two paragraphs, sitting directly on the background with no
 * container, pushed toward the right of the page so that the enormous empty
 * area to its left becomes deliberate rather than accidental.
 *
 * The label sits above and slightly apart, in the metadata register.
 */
export function About() {
  return (
    <section className={styles.about} id="about" aria-labelledby="about-label">
      <Meta as="h2" id="about-label" tracking="wide">
        About
      </Meta>
      <div className={styles.prose}>
        {about.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
