import { Demo, type DemoSource } from "../components/Demo";
import { Meta } from "../components/Meta";
import { Link } from "../router";
import styles from "./Project.module.css";

/**
 * PROJECT 02 — BUNNY HOP PLAYER.
 *
 * The extension is finished. This page exists because a finished thing nobody
 * can see is, from the outside, indistinguishable from an unfinished one.
 *
 * TWO DESTINATIONS, AND THE INSTALL COMES FIRST. It is published on the Chrome
 * Web Store, so most people arriving here want to use it rather than read it.
 * The source is the second link, for the smaller number who want the other
 * thing.
 *
 * An earlier version of this page said it was NOT on the store. That was
 * inferred from there being no store URL in the repository — absence of
 * evidence read as evidence of absence — and it understated the single
 * strongest fact about the project. Worth remembering that being wrong in the
 * modest direction is still being wrong.
 *
 * As with the Spatial page, everything here is factual: what it does, which
 * decisions shaped it, what is actually built. The narrative voice is left for
 * the site owner rather than invented on her behalf.
 */

/**
 * THE DEMO RECORDING, or `null` until there is one.
 *
 * Everything is ready for it: `scripts/import-video.sh` encodes, strips the
 * container metadata and pulls a poster frame; `<Demo>` handles autoplay,
 * reduced motion and the caption. Adding it is this constant and nothing else.
 *
 *   ./scripts/import-video.sh ~/Desktop/recording.mov bunny-hop
 *
 *   const DEMO: DemoSource | null = {
 *     src: "demos/bunny-hop.mp4",
 *     poster: "demos/bunny-hop.jpg",
 *     width: 1280,
 *     height: 800,
 *     caption: "…what the recording shows…",
 *   };
 *
 * NULL RATHER THAN A PLACEHOLDER FILE. A page that renders a broken video is
 * worse than one that renders no video, and the section below simply does not
 * exist until there is something to put in it.
 */
const DEMO: DemoSource | null = null;

const STORE_URL =
  "https://chromewebstore.google.com/detail/olndcfciliijffieflkaflpajehhnhap";
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
    claim: "Timing is interpolated, not polled.",
    because:
      "Sampling playback often enough to highlight the right line would be wasteful, and sampling rarely leaves the highlight drifting. Estimating between samples, with correction for stalls and rate changes, keeps it accurate through pause, seek and replay.",
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
          <a className={styles.openLink} href={STORE_URL} target="_blank" rel="noreferrer noopener" data-text="body">
            Install from the Chrome Web Store
            <span aria-hidden="true"> &#8599;</span>
          </a>
        </p>

        <p className={styles.secondary}>
          <a className={styles.secondaryLink} href={SOURCE_URL} target="_blank" rel="noreferrer noopener" data-text="body">
            Read the source
            <span aria-hidden="true"> &#8599;</span>
          </a>
        </p>
      </header>

      {DEMO !== null && (
        <section className={styles.section} aria-labelledby="bunny-demo">
          <Meta id="bunny-demo" tracking="wide" dataText="meta">
            What it looks like
          </Meta>
          <Demo demo={DEMO} />
        </section>
      )}

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
          playback timing, lyric parsing, matching and caching. Published on the
          Chrome Web Store.
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
