import { Identity } from "./components/Identity";
import { Navigation } from "./components/Navigation";
import { closingLine } from "./content/posts";
import { wallItems, wallSpan } from "./content/wall";
import { Wall } from "./wall";
import styles from "./Home.module.css";

/**
 * THE HOMEPAGE.
 *
 * It used to be `hero / about / journal / footer` on a twelve-column grid, and
 * that file decided where nine specific things sat. It is now four lines,
 * because the composition moved into data:
 *
 *   IDENTITY      the name and the handle. Outside the wall.
 *   NAVIGATION    outside the wall.
 *   THE WALL      everything else, authored in `src/content/wall.ts`.
 *   THE CLOSING   one quiet line, a long way down.
 *
 * THIS FILE MUST NOT GROW. Adding a memory or a charm to the wall means editing
 * `src/content/wall.ts` and nothing else — no import here, no placement class,
 * no conditional. If you find yourself opening this file to put something on
 * the wall, the architecture has been bypassed.
 *
 * ── What left, and where it went ────────────────────────────────────────────
 *
 * `About`, `01 / Journal`, `02 / Elsewhere` and the five journal entries are
 * gone from the composition. NOTHING WAS DELETED: `src/components/About.tsx`,
 * `src/components/Journal.tsx` and every post in `src/content/posts.ts` are
 * still in the repo, unrendered. `posts.ts` holds Vero's own About writing and
 * is the only copy of it — it is the obvious source material for the first real
 * wall items.
 *
 * ── The closing line ────────────────────────────────────────────────────────
 *
 * Still here, still outside the wall, still the smallest text on the page and
 * the only italic on the site. It arrives after the whole wall and a long
 * stretch of empty darkness. Whether it should instead become a `blurb` at the
 * bottom of the wall is a content decision and is flagged in
 * `docs/wall-architecture.md`; keeping it rendering means the words survive
 * either way.
 */

export function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.identity}>
        <Identity />
      </div>

      <div className={styles.nav}>
        <Navigation />
      </div>

      <div className={styles.wall}>
        <Wall items={wallItems} span={wallSpan} />
      </div>

      <p className={styles.closing}>{closingLine}</p>
    </main>
  );
}
