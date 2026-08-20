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
      "No mat, no wands, no depth camera — a laptop and the room you are already in. MediaPipe's pose landmarker reads body position straight from the camera in the browser, and hitting a target means physically moving a wrist into it. Everything renders through PixiJS on the GPU, because the drawing cannot be what makes the input late.",
  },
  {
    claim: "The latency gets measured, not guessed.",
    because:
      "Between you moving and the game seeing it, four delays stack up: the camera's exposure and transfer, MediaPipe's inference, the browser's frame scheduling, and the display itself. Together they are tens of milliseconds — enough to sit outside a 80ms window and make correct play read as early. So the game measures that offset per device during calibration and subtracts it before judging, with the audio's own clock as the reference rather than the renderer or the camera, both of which drift.",
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
            Three modes of the same screen. The track is blurred — it stood in
            for a real song while sketching, and it is not licensed for
            anything here.
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
          The name keeps a thread back to Bunny Hop Player: hop is the movement,
          beat is the game, and the slashes are there because they looked right.
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
