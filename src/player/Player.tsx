import { useRef, useState } from "react";
import { mockTrack, trackSource } from "./mockTrack";
import { useFrameBinding, useLyricSync } from "./useLyricSync";
import { useYouTubePlayback } from "./useYouTubePlayback";
import styles from "./Player.module.css";

/**
 * THE BUNNY HOP WEB PLAYER — and, below it, the thing making the sound.
 *
 * The transport is real now. Pressing play loads the YouTube IFrame API,
 * creates a player, and starts writing `PlaybackSample` into the ref that
 * `useLyricSync` reads — the seam described in `types.ts`, unchanged from the
 * side that consumes it. Nothing else about the object moved: three bands,
 * inset screen, outset chassis, one lyric leading on luminance and scale, and
 * metadata that murmurs rather than addresses.
 *
 * WHAT IS RENDERED, AND IN WHAT ORDER
 *
 *   1. The player. Exactly the object it already was.
 *   2. The video, BELOW it, once there is one.
 *
 * A fragment rather than a wrapper, so the two are siblings inside the rail's
 * `.railPlayer` and stack in normal flow at the rail's own width. That is the
 * only reason this can be a second object in the rail without editing
 * `Home.tsx` or `Home.module.css`, neither of which this agent owns.
 *
 * THE VIDEO IS A NEIGHBOUR, NOT A FOURTH BAND. It gets no chassis, no radius,
 * no border and no glow — that vocabulary belongs to the player alone and is
 * the whole reason the player reads as an object. A video is its own material:
 * a rectangle of moving image, dimmed to near-monochrome so it sits inside this
 * page's weather, and openable to full colour by whoever wants to look at it.
 * See Player.module.css for the mask.
 *
 * IT DOES NOT EXIST UNTIL PLAY IS PRESSED. Not hidden — absent. A 322×181
 * rectangle of nothing sitting in the rail before anyone has asked for music
 * would be dead weight on a composition whose most expensive material is empty
 * darkness, and, more importantly, an iframe that exists is an iframe that has
 * already talked to Google. Nothing is requested from YouTube until the first
 * press.
 *
 * THE PHONE SHOWS ONE LYRIC LINE, NOT THREE. Unchanged, and still CSS's
 * decision — see the dense block at the bottom of Player.module.css. All three
 * lines are always rendered; a viewport is not a fact about this component.
 *
 * The bunny emblem is still intentionally absent. It belongs beside an ACTIVE
 * lyric, and the active lyric here is placeholder text against a real
 * recording — which is honest scaffolding, but not something to decorate.
 */

/**
 * The window the screen shows before anything has ever played.
 *
 * NOT a fallback for "index unknown". It is the object at rest, and it has to
 * be authored rather than derived: the fixture's first line starts at t = 0 and
 * is one of the deliberate instrumental blanks, so a resting player that simply
 * asked the timing core what was playing would show an empty screen to a
 * visitor who has not pressed anything. Once there is a real player, the real
 * index takes over and this constant is never read again.
 */
const RESTING_INDEX = 6;

/**
 * Lyric offset, in seconds. Positive means "show the lyrics later".
 *
 * Zero, and there is nothing to tune until the lyrics are real: the fixture's
 * timings are invented, so any offset would be calibrating placeholder text
 * against a recording it was never written for. The parameter exists because
 * the licensed-lyrics milestone will need it.
 */
const LYRIC_OFFSET_SECONDS = 0;

/** Where the progress bar's 0…1 position is published. Written per frame. */
const PROGRESS_VAR = "--player-progress";

export function Player() {
  const playback = useYouTubePlayback(trackSource);
  const drive = { live: playback.playing, revision: playback.revision };

  const { activeIndex, timeRef } = useLyricSync(
    mockTrack.lines,
    playback.sampleRef,
    LYRIC_OFFSET_SECONDS,
    drive,
  );

  const progressRef = useRef<HTMLSpanElement>(null);
  const publishedProgress = useRef("");

  /* The progress bar never renders. It is one custom property written straight
     onto the element from inside the shared loop's frame — a hairline crossing
     ~300px in four minutes moves one pixel per second, and sixty React renders
     a second to achieve that would be absurd. */
  useFrameBinding(
    (time) => {
      const node = progressRef.current;
      if (node === null) return;
      const duration = playback.sampleRef.current?.durationSeconds ?? 0;
      const fraction = duration > 0 ? Math.min(Math.max(time / duration, 0), 1) : 0;
      const next = fraction.toFixed(4);
      if (next === publishedProgress.current) return;
      publishedProgress.current = next;
      node.style.setProperty(PROGRESS_VAR, next);
    },
    timeRef,
    drive,
  );

  /* The screen follows real time only once there is a real player to follow.
     Before that, and if playback turns out to be impossible here, it holds the
     authored resting window instead of reporting the position of nothing. */
  const index = playback.status === "ready" ? activeIndex : RESTING_INDEX;
  const previous = mockTrack.lines[index - 1];
  const active = mockTrack.lines[index];
  const next = mockTrack.lines[index + 1];

  const videoExists = playback.status === "loading" || playback.status === "ready";

  return (
    <>
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
          <Transport
            playing={playback.playing || playback.pending}
            available={playback.status !== "unavailable"}
            seekable={playback.status === "ready"}
            onToggle={playback.toggle}
            onRestart={playback.restart}
          />
          <div className={styles.progress} role="presentation">
            <span className={styles.progressFill} ref={progressRef} />
          </div>
        </div>

        {playback.status === "unavailable" && (
          /* The object stays composed and says nothing on screen — a visitor who
             did not ask for music does not need to be told it is missing. But
             someone who pressed play and heard nothing does, and for a screen
             reader the disabled controls alone are not an explanation. */
          <p className="visually-hidden" role="status">
            Playback is unavailable.
          </p>
        )}
      </section>

      {videoExists && <Video playback={playback} />}
    </>
  );
}

/**
 * THE VIDEO, and the mask over it.
 *
 * Dimmed by default: desaturated and darkened until it reads as weather rather
 * than as a music video embedded in a page. Clicking it takes the mask off and
 * the colour arrives — which is the same thing the photographs on the wall do,
 * and the reason this page can hold a moving image at all without becoming a
 * different kind of website.
 *
 * THE CONTROL IS THE SURFACE ITSELF. No chip, no bar, no icon, no label, no
 * "click to expand" — the mask IS the button, covering the whole rectangle, and
 * the only affordance is the cursor plus the dimming lifting slightly under the
 * pointer. That lift is also the preview: it shows you what pressing does
 * before you press it. It is reversible in the obvious way — click again and
 * the mist comes back.
 *
 * The mask stays over the exposed video, transparent, still catching clicks.
 * That is deliberate: it keeps YouTube's own controls out of the way and keeps
 * this site's transport the single place playback is operated, so the object
 * below the video never disagrees with the picture above it.
 */
function Video({ playback }: { playback: ReturnType<typeof useYouTubePlayback> }) {
  const [exposed, setExposed] = useState(false);
  const ready = playback.status === "ready";

  return (
    <div
      className={styles.video}
      data-ready={ready ? "" : undefined}
      data-exposed={exposed ? "" : undefined}
    >
      <div className={styles.videoHost} ref={playback.hostRef} />
      {ready && (
        <button
          type="button"
          className={styles.videoMask}
          aria-pressed={!exposed}
          aria-label="Dim the music video"
          onClick={() => {
            setExposed((value) => !value);
          }}
        />
      )}
    </div>
  );
}

interface TransportProps {
  playing: boolean;
  available: boolean;
  seekable: boolean;
  onToggle: () => void;
  onRestart: () => void;
}

/**
 * Transport controls.
 *
 * PREVIOUS RESTARTS THE TRACK. There is one song, so "previous track" has no
 * destination — but restarting the current one is what every player does when
 * previous is pressed part-way through, so the control keeps a real and
 * unsurprising meaning instead of being decoration. It is disabled until there
 * is a player to seek, because before that it would have nothing to restart.
 *
 * NEXT IS DISABLED, PERMANENTLY, and that is the honest answer rather than a
 * missing feature. There is no next track. It could have been made to restart
 * too, which would be a lie about what it does, or removed, which would take a
 * band out of the object's silhouette for the sake of a rule about controls
 * that error — and a control that accurately reports having nowhere to go is
 * not a control that errors.
 *
 * PLAY READS AS PRIMARY THROUGH SIZE ALONE. No accent colour, no fill.
 */
function Transport({ playing, available, seekable, onToggle, onRestart }: TransportProps) {
  return (
    <div className={styles.transport}>
      <button
        type="button"
        className={styles.control}
        disabled={!seekable}
        aria-label="Restart track"
        onClick={onRestart}
      >
        <Icon d="M13 5 7 10l6 5V5Z M6 5h1.4v10H6z" />
      </button>
      <button
        type="button"
        className={`${styles.control} ${styles.primary}`}
        disabled={!available}
        aria-label={playing ? "Pause" : "Play"}
        onClick={onToggle}
      >
        {playing ? (
          <Icon d="M6.9 4.6h2.2v10.8H6.9Z M10.9 4.6h2.2v10.8h-2.2Z" />
        ) : (
          <Icon d="M7 4.5 15.5 10 7 15.5V4.5Z" />
        )}
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
