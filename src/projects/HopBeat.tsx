import { Meta } from "../components/Meta";
import { assetUrl } from "../lib/assets";
import { Link } from "../router";
import styles from "./Project.module.css";

/**
 * PROJECT — HOP//BEAT. A specification and a picture, and it says so.
 *
 * Nothing is built. The page's job is to make that obvious while still being
 * worth reading: what the thing is, why it exists, and what it has to prove
 * before any of the rest matters. A project page that reads like a shipped
 * product and turns out to be a document is the kind of thing that costs
 * trust in an interview.
 */

const IDEA: readonly { readonly claim: string; readonly because: string }[] = [
  {
    claim: "A normal webcam is the controller.",
    because:
      "No mat, no wands, no depth camera — a laptop and the room you are already in. Pose landmarks from the camera decide where your hands are, and hitting a target means physically moving into it.",
  },
  {
    claim: "The music's clock is the only clock.",
    because:
      "Not the renderer, not the camera's frame rate. Those wander, and a rhythm game that judges you against a wandering clock feels broken in a way players can sense but not describe. Pose updates can arrive slower than the screen redraws; the timing never depends on them.",
  },
  {
    claim: "The song is analysed once, not while you play.",
    because:
      "Listening for beats in real time is a fragile thing to stake gameplay on. A track is analysed ahead of time into a map of timestamps, and the game reads the map.",
  },
  {
    claim: "Beats say when. They do not say what.",
    because:
      "Turning detected onsets into movement someone actually enjoys — reachable, readable, not a scramble across the screen — is the real work, and the part worth writing rather than importing.",
  },
  {
    claim: "Not charging for it does not make the music free.",
    because:
      "Rights and monetisation are separate questions. The intended path is an artist supplying audio to analyse and their own upload for playback, with the official player left visible and nothing extracted from it.",
  },
];

export function HopBeat() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Meta tracking="wide" dataText="meta">
          Project — in progress
        </Meta>
        <h1 className={styles.title} data-route-heading data-text="display">
          hop//beat
        </h1>
        <p className={styles.standfirst} data-text="body">
          A rhythm game you play with your body. Music plays, targets arrive on
          beat, and an ordinary webcam turns the room you are standing in into
          the controller.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="hop-look">
        <Meta id="hop-look" tracking="wide" dataText="meta">
          What it should look like
        </Meta>

        <figure className={styles.figure}>
          <img
            className={styles.image}
            src={assetUrl("projects/hop-beat-concept.jpg")}
            alt="Concept sheet for hop//beat in three modes — light, dark and outline. Each shows a hand-drawn figure with bunny ears standing with arms raised, surrounded by four glowing circular targets in the corners of the screen. A sidebar carries the track, a progress bar, score, combo and accuracy. A PERFECT! marker sits beside the target the figure is reaching into."
            width={1600}
            height={1066}
            decoding="async"
          />
          <figcaption className={styles.figcaption} data-text="body">
            Three modes of the same screen. The song shown is illustrative only.
          </figcaption>
        </figure>

        <p className={styles.body} data-text="body">
          Scraggly and hand-drawn rather than a rendered avatar — the figure is
          generated from where your body actually is, so it moves the way you
          do. Four targets in the corners, particles on a good hit, and an
          interface that gets out of the way. Bunny ears, because the name comes
          from somewhere.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="hop-idea">
        <Meta id="hop-idea" tracking="wide" dataText="meta">
          The idea
        </Meta>
        <dl className={styles.decisions}>
          {IDEA.map((entry) => (
            <div className={styles.decision} key={entry.claim}>
              <dt className={styles.claim} data-text="body">
                {entry.claim}
              </dt>
              <dd className={styles.because} data-text="body">
                {entry.because}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="hop-state">
        <Meta id="hop-state" tracking="wide" dataText="meta">
          Where it is
        </Meta>
        <p className={styles.body} data-text="body">
          A specification and this picture. Nothing is built yet, on purpose:
          the first thing to find out is whether a normal webcam can track a
          hand quickly and reliably enough to judge a beat at all. Everything
          else is downstream of that answer, so it gets built first and alone.
        </p>
        <p className={styles.body} data-text="body">
          The name keeps a thread back to Bunny Hop Player — the project that
          restarted the habit of making things for curiosity rather than for a
          CV.
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
