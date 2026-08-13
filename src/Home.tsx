import { About } from "./components/About";
import { Identity } from "./components/Identity";
import { JournalEntry } from "./components/Journal";
import { Meta } from "./components/Meta";
import { Navigation } from "./components/Navigation";
import { closingLine, postById } from "./content/posts";
import styles from "./Home.module.css";

/**
 * THE HOMEPAGE COMPOSITION.
 *
 * This file decides WHERE things sit. Component files decide what they look
 * like internally. Keeping placement in one place is what makes the
 * composition legible enough to iterate on — the alternative is hunting
 * through nine CSS modules to work out why the page feels lopsided.
 *
 * The page is a single 12-column grid. Every direct child names its own
 * columns, and CSS Grid's auto-placement puts two items on the same row
 * whenever the second one starts after the first one ends. That is the whole
 * mechanism behind the asymmetry: no nested wrappers, no absolute positioning,
 * no manual row numbers to keep in sync when content changes.
 *
 * The information architecture stays strictly ordered — identity, about,
 * journal, currently, elsewhere, ending — while the visual system breaks the
 * grid freely. Controlled chaos is a property of the composition, never of the
 * document.
 *
 * Phase 2 is STATIC. There is no atmosphere, no parallax, no interaction and
 * no motion beyond a colour transition on links. If this page is not
 * convincing as a frozen screenshot, no amount of Phase 3 will save it.
 */

/** Pulled by id rather than mapped in array order, because placement is a
 *  composition decision and the content file should not encode layout. */
const notes = postById("rooms");
const photograph = postById("four-am");
const quote = postById("stillness");
const project = postById("bunny-hop-player");
const drawing = postById("drawing");
const elsewhere = postById("instagram");

export function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.identity}>
        <Identity />
      </div>

      <div className={styles.nav}>
        <Navigation />
      </div>

      <About />

      {/* -- 01 / Journal ------------------------------------------------- */}

      <Meta
        as="h2"
        id="journal"
        tracking="wide"
        className={styles.sectionLabel}
      >
        01 / Journal
      </Meta>

      {notes && (
        <div className={styles.entryNotes}>
          <JournalEntry post={notes} />
        </div>
      )}

      {/* Sits on the same row as the note, dropped well below its top edge.
          The offset is what stops the pair reading as a two-column layout. */}
      {photograph && (
        <div className={styles.entryPhotograph}>
          <JournalEntry post={photograph} />
        </div>
      )}

      {quote && (
        <div className={styles.entryQuote}>
          <JournalEntry post={quote} />
        </div>
      )}

      {project && (
        <div className={styles.entryProject}>
          <JournalEntry post={project} />
        </div>
      )}

      {/* -- 02 / Currently ----------------------------------------------- */}

      {/*
        The `02 / Currently` section used to live here, holding the player.

        It was removed when the player became permanently docked to the
        viewport (see PlayerDock, mounted in App.tsx). A section heading whose
        only job was to introduce an object that is now always on screen is a
        label pointing at something the visitor is already looking at. The
        drawing stays — it belongs to the journal, not to the player — and
        Elsewhere moves up to 02.
      */}

      {drawing && (
        <div className={styles.entryDrawing}>
          <JournalEntry post={drawing} />
        </div>
      )}

      {/* -- 02 / Elsewhere ----------------------------------------------- */}

      <Meta
        as="h2"
        id="elsewhere"
        tracking="wide"
        className={styles.sectionLabel}
      >
        02 / Elsewhere
      </Meta>

      {elsewhere && (
        <div className={styles.entryElsewhere}>
          <JournalEntry post={elsewhere} />
        </div>
      )}

      {/*
        No footer, no colophon, no sign-off — there was one, and it restated
        the identity block verbatim.

        What ends the page instead is a single quiet line, arriving after a
        long stretch of empty darkness. It is the smallest text on the page and
        the only italic on the site.
      */}
      <p className={styles.closing}>{closingLine}</p>
    </main>
  );
}
