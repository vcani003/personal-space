import { Meta } from "../components/Meta";
import { assetUrl } from "../lib/assets";
import { Link } from "../router";
import styles from "./Project.module.css";

/**
 * PROJECT — HOP//BEAT. A playable prototype now, and it says exactly how much.
 *
 * This page was a specification and a picture, and its whole job was making
 * that obvious: a project page that reads like a shipped product and turns out
 * to be a document is the kind of thing that costs trust in an interview.
 *
 * There is a build now, so the same rule points the other way and is if
 * anything more dangerous. A link labelled "play the game" that opens a
 * tracking prototype with no music and no score is the same broken promise
 * made in the opposite direction — and this time the person has already
 * granted camera permission before finding out. So the link is here, near the
 * top where it is useful, and what it opens is named on the line beneath it.
 */

const PLAY_URL = "https://vcani003.github.io/hop-beat/";
const SOURCE_URL = "https://github.com/vcani003/hop-beat";

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

        <p className={styles.open}>
          <a
            className={styles.openLink}
            href={PLAY_URL}
            target="_blank"
            rel="noreferrer noopener"
            data-text="body"
          >
            Try it in your browser
            <span aria-hidden="true"> &#8599;</span>
          </a>
        </p>

        {/* WHAT IT COSTS AND WHAT IT IS, before the click rather than after.
            This asks for a camera, and the first load fetches a tracking model
            — two things worth knowing while the choice is still yours. And it
            is the input prototype, not the game in the sentence above it. */}
        <p className={styles.note} data-text="body">
          Needs a webcam, and the first load downloads a tracking model. This is
          the input half: four targets and your body, with no music, no score
          and none of the art below.
        </p>

        <p className={styles.secondary}>
          <a
            className={styles.secondaryLink}
            href={SOURCE_URL}
            target="_blank"
            rel="noreferrer noopener"
            data-text="body"
          >
            Read the source
            <span aria-hidden="true"> &#8599;</span>
          </a>
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
          The first thing to find out was whether a normal webcam can track a
          hand quickly and reliably enough to judge a beat at all. Everything
          else was downstream of that answer, so it got built first and alone:
          camera, pose landmarks, four zones, and the moment a wrist crosses
          into one. That part answers yes, and it is what the link above opens.
        </p>
        <p className={styles.body} data-text="body">
          What is not there yet is the game — the clock, the judgment window,
          the scoring, the art. The engine consumes zone events and has never
          known where they come from, which is the boundary that lets the input
          half and the rhythm half be built and replaced independently.
        </p>
        <p className={styles.body} data-text="body">
          The name keeps a thread back to Bunny Hop Player: hop is the movement,
          beat is the game, and the slashes are there because they looked right.
        </p>
      </section>

      <p className={styles.back}>
        <Link to="home" className={styles.backLink}>
          {/* `as="span"` because this sits inside a `<p>` and inside an `<a>`.
              `Meta` renders a `<p>` by default, which made every project page
              emit `<p><a><p>…</p></a></p>` — invalid HTML, and React logged a
              hydration error for it on each one. The register is unchanged;
              only the element is. */}
          <Meta as="span" dataText="meta">
            Back
          </Meta>
        </Link>
      </p>
    </main>
  );
}
