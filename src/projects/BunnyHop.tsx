import { Meta } from "../components/Meta";
import { Link } from "../router";
import styles from "./Project.module.css";

/**
 * PROJECT 02 — BUNNY HOP PLAYER.
 *
 * The extension is finished. This page exists because a finished thing nobody
 * can see is, from the outside, indistinguishable from an unfinished one.
 *
 * IT LINKS TO THE SOURCE AND SAYS SO PLAINLY. It is not on the Chrome Web
 * Store, and the page does not imply otherwise — a project page that overstates
 * where something is available is the kind of thing that unravels in one
 * question.
 *
 * As with the Spatial page, everything here is factual: what it does, which
 * decisions shaped it, what is actually built. The narrative voice is left for
 * the site owner rather than invented on her behalf.
 */

const SOURCE_URL = "https://github.com/vcani003/bunny-hop-player";

/** The decisions worth stating, each drawn from what the code actually does. */
const DECISIONS: readonly { readonly claim: string; readonly because: string }[] = [
  {
    claim: "YouTube Music stays the player.",
    because:
      "The extension reads the page's existing video element and clicks its existing controls. Nothing is downloaded, proxied, recorded or extracted — which keeps it on the right side of a line that a lyrics tool could easily wander across.",
  },
  {
    claim: "The lyrics had to survive leaving the tab.",
    because:
      "A lyrics panel you can only see while looking at the music tab is a panel you never look at. Document Picture-in-Picture puts them in a window that stays on top across tabs and applications.",
  },
  {
    claim: "Someone else's markup gets exactly one boundary.",
    because:
      "Every assumption about how YouTube Music's page is built lives in a single adapter. When their markup changes — and it will — one file is wrong instead of the whole extension.",
  },
  {
    claim: "Timing is interpolated, not polled.",
    because:
      "Sampling playback often enough to highlight the right line would be wasteful, and sampling rarely leaves the highlight drifting. Estimating between samples, with correction for stalls and rate changes, keeps it accurate through pause, seek and replay.",
  },
  {
    claim: "A match is ranked, not guessed.",
    because:
      "Searching a public lyric database by title returns covers, live takes and remixes. Lyrics that are subtly the wrong version read as broken in a way that no lyrics does not, so candidates are normalised and ranked before one is chosen.",
  },
  {
    claim: "Two origins, three fields.",
    because:
      "Host access is scoped to the music site and the lyrics database, and the only things that ever leave the browser are a song title, an artist and a duration. No account, no backend, no telemetry.",
  },
];

export function BunnyHop() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Meta tracking="wide" dataText="meta">
          Project 02
        </Meta>
        <h1 className={styles.title} data-route-heading data-text="display">
          Bunny Hop Player
        </h1>
        <p className={styles.standfirst} data-text="body">
          A Chrome extension that shows synchronised lyrics for whatever is
          playing in YouTube Music — in a small window that stays with you when
          you go and do something else.
        </p>

        <p className={styles.open}>
          <a className={styles.openLink} href={SOURCE_URL} target="_blank" rel="noreferrer noopener" data-text="body">
            Read the source
            <span aria-hidden="true"> &#8599;</span>
          </a>
        </p>
      </header>

      <section className={styles.section} aria-labelledby="bunny-decisions">
        <Meta id="bunny-decisions" tracking="wide" dataText="meta">
          Decisions
        </Meta>
        <dl className={styles.decisions}>
          {DECISIONS.map((decision) => (
            <div className={styles.decision} key={decision.claim}>
              <dt className={styles.claim} data-text="body">
                {decision.claim}
              </dt>
              <dd className={styles.because} data-text="body">
                {decision.because}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="bunny-state">
        <Meta id="bunny-state" tracking="wide" dataText="meta">
          Where it is
        </Meta>
        <p className={styles.body} data-text="body">
          Finished, and in use. A Manifest V3 extension in TypeScript and React
          — service worker, content script, side panel and floating window —
          with 164 tests over the parts that are easy to get quietly wrong:
          playback timing, lyric parsing, matching and caching. It runs
          unpacked; it is not on the Chrome Web Store.
        </p>
      </section>

      <p className={styles.back}>
        <Link to="home" className={styles.backLink}>
          <Meta dataText="meta">Back</Meta>
        </Link>
      </p>
    </main>
  );
}
