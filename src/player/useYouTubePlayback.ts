import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { shouldAdoptSample } from "./interpolate";
import type { PlaybackSample, TrackSource } from "./types";
import { PLAYER_STATE, loadYouTubeApi } from "./youtube";
import type { YouTubeDataEvent, YouTubePlayer, YouTubePlayerEvent } from "./youtube";

/* =============================================================================
   THE DRIVER — real playback, written into the sampleRef seam
   =============================================================================

   This is the MVP 2 half of the seam `src/player/types.ts` describes:

     MVP 1   useMockPlayback()    → writes PlaybackSample into a ref
     MVP 2   useYouTubePlayback() → writes PlaybackSample into a ref   ← here

   Nothing above the ref knows which one is running. `useLyricSync` reads the
   ref, the progress bar reads the estimate, and neither imports this file.

   THE TWO TIMING TRAPS, AND WHERE EACH IS ANSWERED

   1. THE THIRTY-SECOND FREEZE. `estimateCurrentTime` refuses to extrapolate
      more than 30 seconds past the last stamp. Seed the ref once and the
      highlight glides for half a minute and then stops dead, with no error and
      no state change to notice. Answered by RESTAMP_INTERVAL_MS below: a plain
      interval re-reads the real player clock every second. A plain interval
      rather than frames on purpose — this is a correction, not an animation,
      and it must keep happening at exactly the same rate whether or not
      anything is being drawn.

   2. LOOPS AND RESTARTS. The estimator clamps at `durationSeconds` and never
      wraps. A restart is therefore expressed as a NEW authoritative sample —
      `currentTimeSeconds: 0`, fresh `updatedAt` — written straight into the ref
      by `seekToStart` below, bypassing the jitter filter because it is a fact
      rather than a reading.

   DEGRADE HONESTLY. Bunny Hop's own principle: a control whose only outcome is
   an error should not exist. Every way this can fail — script blocked, embed
   refused, video unavailable, offline, an API that never answers — lands in
   `fail()`, which produces ONE state: `unavailable`. In it the transport is
   disabled and the video is not rendered at all, so the object goes back to
   being the composed, inert thing it was before playback existed. It never
   shows an error, because a visitor who did not ask for a music player does not
   need to be told one is missing.

   THE UI NEVER RUNS AHEAD OF THE PLAYER. `playing` is set from
   `onStateChange` — the real state of the real player — never optimistically
   from the press. Browsers block autoplay without a user gesture and that
   block is not ours to fight or to hide: if the first press does not produce
   sound, the button goes back to showing PLAY, honestly, and a second press
   (a second gesture) usually succeeds.
   ========================================================================== */

/** How often the real player clock is re-read while it is running. */
const RESTAMP_INTERVAL_MS = 1000;

/**
 * How long the player itself gets to become usable after being constructed.
 *
 * The script can arrive and the player still never fire `onReady` — an embed
 * refused for this domain is the usual reason, and it does not always produce
 * an `onError` either.
 */
const READY_TIMEOUT_MS = 15_000;

export type PlaybackStatus =
  /** Nothing has been requested. Nothing has been sent to YouTube. */
  | "idle"
  /** The script and the player are on their way. */
  | "loading"
  /** There is a real player and it answers. */
  | "ready"
  /** It cannot work here, for any reason. The object goes quiet. */
  | "unavailable";

export interface YouTubePlayback {
  /** The element the iframe is created inside. Must be in the DOM and visible. */
  hostRef: RefObject<HTMLDivElement | null>;
  /** THE SEAM. Everything above playback reads this and nothing else. */
  sampleRef: RefObject<PlaybackSample | null>;
  status: PlaybackStatus;
  /** The player says it is playing or buffering toward playing. */
  playing: boolean;
  /** Play was pressed and we are still waiting for the machinery. */
  pending: boolean;
  /** Bumped on an authoritative position change made while not playing. */
  revision: number;
  /** Play if stopped, pause if not. The only entry point for both. */
  toggle: () => void;
  /** Back to the beginning, playing or not. */
  restart: () => void;
}

export function useYouTubePlayback(source: TrackSource): YouTubePlayback {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sampleRef = useRef<PlaybackSample | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const intervalRef = useRef<number | null>(null);
  const readyTimerRef = useRef<number | null>(null);
  const aliveRef = useRef(true);
  /** Whether the visitor currently wants sound. Read on `onReady`. */
  const wantsPlayRef = useRef(false);

  /** Flipped once, by the first press. This is what mounts the iframe host. */
  const [requested, setRequested] = useState(false);
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [playing, setPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);

  const statusRef = useRef(status);
  statusRef.current = status;

  /* ---------------------------------------------------------------------------
     STAMPING — the only place the seam is written
     ------------------------------------------------------------------------ */

  /**
     Read the player and write the sample.

     `authoritative` marks a reading we CAUSED — a seek, a restart, the moment
     of pausing — which must be adopted whatever the jitter filter thinks.
     Ordinary one-second corrections go through `shouldAdoptSample`, so a
     reading that comes back slightly behind our own extrapolation is treated as
     quantisation noise instead of snapping the lyric highlight backwards.
   */
  const stamp = useCallback(
    (authoritative: { currentTimeSeconds?: number } | null = null): void => {
      const player = playerRef.current;
      if (player === null) return;

      let next: PlaybackSample;
      try {
        const state = player.getPlayerState();
        const rate = player.getPlaybackRate();
        next = {
          currentTimeSeconds:
            authoritative?.currentTimeSeconds ?? Math.max(0, player.getCurrentTime()),
          durationSeconds: Math.max(0, player.getDuration()),
          /* BUFFERING counts as paused HERE even though the button shows a
             pause glyph for it. Two different questions: the button answers
             "what will pressing this do", the sample answers "is the position
             advancing". During a stall it is not, and letting the estimate run
             through a stall is how a highlight ends up seconds ahead of the
             song. */
          paused: state !== PLAYER_STATE.PLAYING,
          playbackRate: Number.isFinite(rate) && rate > 0 ? rate : 1,
          updatedAt: Date.now(),
        };
      } catch {
        /* The player can be mid-teardown, or the iframe gone. A reading we
           cannot take is not an error state — the last sample simply stands,
           and the estimator's 30s clamp stops it running away. */
        return;
      }

      if (authoritative !== null || shouldAdoptSample(sampleRef.current, next, next.updatedAt)) {
        sampleRef.current = next;
      }
    },
    [],
  );

  const stopInterval = useCallback((): void => {
    if (intervalRef.current === null) return;
    window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const startInterval = useCallback((): void => {
    stopInterval();
    intervalRef.current = window.setInterval(() => {
      stamp();
    }, RESTAMP_INTERVAL_MS);
  }, [stamp, stopInterval]);

  /* ---------------------------------------------------------------------------
     FAILURE — one path, one state
     ------------------------------------------------------------------------ */

  const teardownPlayer = useCallback((): void => {
    stopInterval();
    if (readyTimerRef.current !== null) {
      window.clearTimeout(readyTimerRef.current);
      readyTimerRef.current = null;
    }
    const player = playerRef.current;
    playerRef.current = null;
    if (player === null) return;
    try {
      player.destroy();
    } catch {
      /* Destroying an already-destroyed player is not worth a broken unmount. */
    }
  }, [stopInterval]);

  const fail = useCallback((): void => {
    teardownPlayer();
    sampleRef.current = null;
    wantsPlayRef.current = false;
    if (!aliveRef.current) return;
    statusRef.current = "unavailable";
    setStatus("unavailable");
    setPlaying(false);
    setPending(false);
  }, [teardownPlayer]);

  /* ---------------------------------------------------------------------------
     CREATION — in an effect, so the host is guaranteed to be in the DOM
     -----------------------------------------------------------------------------
     Not in the click handler. The iframe needs a mounted, rendered container
     and the press is what renders it, so construction has to wait for the
     commit that the press causes. `requested` only ever goes false → true, so
     this effect's cleanup runs at unmount and not on any state change in
     between — which is what makes it safe for the cleanup to destroy.
     ------------------------------------------------------------------------ */

  useEffect(() => {
    aliveRef.current = true;
    if (!requested) {
      return () => {
        aliveRef.current = false;
      };
    }

    let cancelled = false;
    statusRef.current = "loading";
    setStatus("loading");

    loadYouTubeApi()
      .then((api) => {
        const host = hostRef.current;
        if (cancelled || !aliveRef.current || host === null) return;

        /* A div React does not know about. `new YT.Player(element)` REPLACES
           the element it is given with an iframe; handing it a React-rendered
           node would leave React holding a reference to something no longer in
           the tree and throw on unmount. React owns `host`; this child is
           created and destroyed entirely outside it. */
        const target = document.createElement("div");
        host.appendChild(target);

        readyTimerRef.current = window.setTimeout(fail, READY_TIMEOUT_MS);

        playerRef.current = new api.Player(target, {
          videoId: source.videoId,
          host: source.embedHost,
          width: "100%",
          height: "100%",
          playerVars: {
            /* Playing inline rather than taking over an iOS screen. */
            playsinline: 1,
            /* Related videos, when they appear, at least come from this
               channel rather than from the whole of YouTube. */
            rel: 0,
            /* NO SECOND SET OF CONTROLS. A documented embed parameter for hosts
               that provide their own transport, which is exactly this: play,
               pause and restart all live in the object above the video. Leaving
               them on put a full YouTube control bar under our mask — visible,
               dimmed, and unusable, because the mask takes the clicks — which
               is a worse answer on every axis than not drawing it. */
            controls: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: YouTubePlayerEvent) => {
              if (readyTimerRef.current !== null) {
                window.clearTimeout(readyTimerRef.current);
                readyTimerRef.current = null;
              }
              if (cancelled || !aliveRef.current) return;

              statusRef.current = "ready";
              setStatus("ready");
              stamp({ currentTimeSeconds: 0 });
              startInterval();

              /* Out of the tab order, because with `controls: 0` there is
                 nothing inside it to operate and everything it could have done
                 is on the buttons above. A tab stop that lands on an empty
                 embed and does nothing is noise in the one route through this
                 page that has no cursor to explain it. */
              try {
                event.target.getIframe().tabIndex = -1;
              } catch {
                /* No iframe to reach means nothing to keep out of the way. */
              }

              if (wantsPlayRef.current) event.target.playVideo();
            },
            onStateChange: (event: YouTubeDataEvent) => {
              if (!aliveRef.current) return;
              const state = event.data;

              if (state === PLAYER_STATE.ENDED) {
                /* Stopped at the end. NOT looped: the next press restarts from
                   zero through `seekToStart`, which re-seeds the sample rather
                   than asking the estimator to wrap. */
                wantsPlayRef.current = false;
                stamp({});
                setPlaying(false);
                setPending(false);
                setRevision((value) => value + 1);
                return;
              }

              stamp(state === PLAYER_STATE.PAUSED ? {} : null);
              setPlaying(
                state === PLAYER_STATE.PLAYING || state === PLAYER_STATE.BUFFERING,
              );
              /* The wait is over the moment the player says ANYTHING, whatever
                 it says. If a blocked autoplay leaves it sitting at UNSTARTED,
                 the button goes back to showing PLAY rather than pretending
                 something is still coming. */
              setPending(false);
              if (state === PLAYER_STATE.PAUSED) setRevision((value) => value + 1);
            },
            onError: () => {
              /* Every error code lands here on purpose. 2 (bad parameter),
                 5 (HTML5 failure), 100 (gone or private) and 101/150 (embedding
                 refused) are different causes with one honest outcome: this
                 page cannot play this song. */
              fail();
            },
          },
        });
      })
      .catch(() => {
        if (cancelled || !aliveRef.current) return;
        fail();
      });

    return () => {
      cancelled = true;
      aliveRef.current = false;
      teardownPlayer();
      sampleRef.current = null;
    };
  }, [requested, source.videoId, source.embedHost, fail, stamp, startInterval, teardownPlayer]);

  /* ---------------------------------------------------------------------------
     TRANSPORT
     ------------------------------------------------------------------------ */

  /** The authoritative re-seed. The only place `currentTimeSeconds: 0` is written. */
  const seekToStart = useCallback(
    (player: YouTubePlayer): void => {
      player.seekTo(0, true);
      stamp({ currentTimeSeconds: 0 });
      setRevision((value) => value + 1);
    },
    [stamp],
  );

  const toggle = useCallback((): void => {
    if (statusRef.current === "unavailable") return;

    const player = playerRef.current;
    if (player === null) {
      /* Nothing exists yet. THIS PRESS IS THE GESTURE that both loads the
         script and, once there is something to ask, asks it to play. Pressing
         again while it loads cancels the request rather than queueing a second
         one. */
      wantsPlayRef.current = !wantsPlayRef.current;
      setPending(wantsPlayRef.current);
      if (wantsPlayRef.current) setRequested(true);
      return;
    }

    const state = player.getPlayerState();
    if (state === PLAYER_STATE.PLAYING || state === PLAYER_STATE.BUFFERING) {
      wantsPlayRef.current = false;
      setPending(false);
      player.pauseVideo();
      return;
    }

    if (state === PLAYER_STATE.ENDED) seekToStart(player);
    wantsPlayRef.current = true;
    setPending(true);
    player.playVideo();
  }, [seekToStart]);

  const restart = useCallback((): void => {
    const player = playerRef.current;
    if (player === null || statusRef.current !== "ready") return;
    seekToStart(player);
  }, [seekToStart]);

  return {
    hostRef,
    sampleRef,
    status,
    playing,
    pending,
    revision,
    toggle,
    restart,
  };
}
