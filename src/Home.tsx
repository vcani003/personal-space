import { Navigation } from "./components/Navigation";
import { Identity } from "./components/Identity";
import { Intro } from "./components/Intro";
import { closingLine } from "./content/posts";
import { wallItems, wallSpan } from "./content/wall";
import { Player } from "./player";
import { Wall, wallHostsEmbed } from "./wall";
import styles from "./Home.module.css";

/**
 * THE HOMEPAGE.
 *
 * Three zones, and that is the whole file:
 *
 *   IDENTITY        the name and the metadata line beneath it.
 *   COMPOSITION     the WALL on the left, a floating RAIL beside it holding the
 *                   navigation and the Bunny Hop player.
 *   THE CLOSING     one quiet line, a long way down.
 *
 * THIS FILE MUST NOT GROW, and the rail did not make it grow much: it holds
 * three named regions and one guard. Adding a memory or a charm to the wall
 * still means editing `src/content/wall.ts` and nothing else — no import here,
 * no placement class, no conditional. If you find yourself opening this file to
 * put something on the wall, the architecture has been bypassed.
 *
 * ── The rail, and what it replaced ──────────────────────────────────────────
 *
 * The player used to be `PlayerDock` — fixed to a corner of the viewport and
 * draggable between the four. It now lives in the rail instead. The rail is
 * `position: sticky`, so the player is still reachable while the wall scrolls,
 * which was the whole reason the dock existed; what it gives up is travelling
 * with the viewport, and what it gains is being COMPOSED against the page again
 * rather than floating over it.
 *
 * NOTHING WAS DELETED. `PlayerDock`, `useDockDrag` and `dockCorner` are intact
 * and unmounted — see the header of `src/player/PlayerDock.tsx`. A dockable
 * player is a later nice-to-have, not a retired idea.
 *
 * ── The player cannot be in two places at once ──────────────────────────────
 *
 * A `bunny-hop` embed authored onto the wall would put a second player on the
 * page, with two sets of transport controls for one object. So the authored
 * content decides and there is no flag to keep in sync: if the wall hosts the
 * player, the rail does not. This is the same guard `App.tsx` used to hold for
 * the dock, moved to where the player is now mounted.
 *
 * No `surface: "wall" | "rail"` field was added to the wall's item union. It is
 * sanctioned by the spec and it is not needed: the rail is a place in the page,
 * not an artifact on the wall, so mounting `<Player />` here directly is both
 * simpler and one fewer thing for an author to get wrong.
 *
 * ── What left the composition, and where it went ────────────────────────────
 *
 * `About`, `01 / Journal`, `02 / Elsewhere` and the five journal entries left
 * when the page became a wall. NOTHING WAS DELETED: `src/components/About.tsx`,
 * `src/components/Journal.tsx` and every post in `src/content/posts.ts` are
 * still in the repo, unrendered. `posts.ts` holds Vero's own About writing and
 * is the only copy of it — it is the obvious source material for the first real
 * wall items.
 *
 * ── Two selectors in other people's files depend on this shape ──────────────
 *
 * `interaction/textSplit.ts` splits `main h1` and `main > p`, and
 * `interaction/placement.ts` measures the gap that ENDS at `main > p`. Both
 * still resolve: the identity block is still the page's only `h1`, and the
 * closing line below is still the only direct paragraph child of `<main>` —
 * every other paragraph on this page, including the player's, is several levels
 * deeper. Verified after the restructure. If a fourth region is ever added here,
 * check it is not a bare `<p>`.
 */

export function Home() {
  const playerIsOnTheWall = wallHostsEmbed(wallItems, "bunny-hop");

  return (
    <main className={styles.page}>
      <div className={styles.identity}>
        <Identity />
      </div>

      {/* `@starcharm` used to sit here, opposite the name. Removed at Vero's
          request — the handle is already in the metadata line directly under
          the name, so this was the same word twice in the same view, and the
          paopu now sits beside that one. `Elsewhere` remains exported from
          Navigation.tsx for whenever there is somewhere to point. */}

      {/* THE RAIL HOLDS ONLY THE PLAYER NOW. Document order still meets the
          navigation before the wall — it moved UP the page rather than down,
          so the reading order the rail was arranged to protect is now simply
          the order things appear in. Visual position is free. Reading order is
          not, and this is the rare change that costs nothing to keep. */}
      {/* WHO SHE IS, before anything she has made. The wall below is a room;
          this is the sentence you say when someone walks into it. */}
      <div className={styles.introBlock}>
        <Intro />
      </div>

      {/* THE NAVIGATION SITS IN THE HEADER ROW, level with the name, and no
          longer at the top of the rail. It is placed to the rail's own column
          width, so its left edge still lines up with the player beneath it —
          the two read as one right-hand margin, they simply no longer travel
          together. See `.topNav`. */}
      <div className={styles.topNav}>
        <Navigation />
      </div>

      <div className={styles.composition}>
        <div className={styles.rail}>
          {!playerIsOnTheWall && (
            /* `data-no-ripple`: an object floating ON the surface is not part of
               the surface, so touching it does not send a wave across the page.
               `Ripple.tsx` already honours this; the dock declared it for the
               same reason and the wall's `Embed` shell still does. */
            <div className={styles.railPlayer} data-no-ripple="">
              <Player />
            </div>
          )}
        </div>

        <div className={styles.wall}>
          <Wall items={wallItems} span={wallSpan} />
        </div>
      </div>

      <p className={styles.closing}>{closingLine}</p>
    </main>
  );
}
