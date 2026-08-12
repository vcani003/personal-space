import { mockTrack } from "./mockTrack";
import styles from "./Player.module.css";

/**
 * THE BUNNY HOP WEB PLAYER — Phase 2 static placeholder.
 *
 * This is composition, not function. There is no playback, no timing loop, no
 * lyric sync, no controls that do anything. Phase 6 makes it move; this exists
 * so the page can be judged as a still image with the object in place.
 *
 * What it DOES have to get right, now, is its identity as an object:
 *
 *   - The three-band vertical rhythm — metadata / inset screen / deck. That is
 *     the silhouette, and it is what makes this read as Bunny Hop Player.
 *   - The inset/outset inversion. The chassis is defined by OUTER glow so it
 *     floats; the screen by INNER shadow so it recedes. That pairing is the
 *     object's entire physics; use both or neither.
 *   - One lyric dominating by luminance and scale, never by colour.
 *   - Metadata subordinate to the page's metadata (see tokens.css), so the
 *     player murmurs to itself while the page addresses the visitor.
 *
 * Deliberately NOT carried over from the extension: the layout toggle, the
 * connection/loading/error states, the match tools, the scrolling lyric list,
 * `container-type: size`, and the bunny sprites. See
 * player-integration-notes.md.
 *
 * The bunny emblem is intentionally absent until the real lyric line is live —
 * it belongs beside an ACTIVE lyric, and there isn't one yet.
 */

/* A fixed window into the mock lyrics: previous / active / next. Phase 6
   replaces this constant with the real active index. */
const ACTIVE_INDEX = 6;

export function Player() {
  const previous = mockTrack.lines[ACTIVE_INDEX - 1];
  const active = mockTrack.lines[ACTIVE_INDEX];
  const next = mockTrack.lines[ACTIVE_INDEX + 1];

  return (
    <section className={styles.chassis} aria-label="Music player">
      <p className={styles.meta}>
        {mockTrack.title} — {mockTrack.artist}
      </p>

      <div className={styles.screen}>
        <div className={styles.lines}>
          <p className={styles.line}>{previous?.text}</p>
          <p className={`${styles.line} ${styles.active}`}>{active?.text}</p>
          <p className={styles.line}>{next?.text}</p>
        </div>
      </div>

      <div className={styles.deck}>
        <Transport />
        <div className={styles.progress} role="presentation">
          <span className={styles.progressFill} />
        </div>
      </div>
    </section>
  );
}

/**
 * Transport controls. Inert in Phase 2 — `disabled` rather than fake, because
 * a control whose only outcome is nothing should say so to a screen reader
 * instead of lying about it.
 *
 * Play reads as primary through SIZE alone. No accent colour, no fill.
 */
function Transport() {
  return (
    <div className={styles.transport}>
      <button type="button" className={styles.control} disabled aria-label="Previous track">
        <Icon d="M13 5 7 10l6 5V5Z M6 5h1.4v10H6z" />
      </button>
      <button
        type="button"
        className={`${styles.control} ${styles.primary}`}
        disabled
        aria-label="Play"
      >
        <Icon d="M7 4.5 15.5 10 7 15.5V4.5Z" />
      </button>
      <button type="button" className={styles.control} disabled aria-label="Next track">
        <Icon d="M7 5l6 5-6 5V5Z M12.6 5H14v10h-1.4z" />
      </button>
    </div>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d={d} fill="currentColor" />
    </svg>
  );
}
