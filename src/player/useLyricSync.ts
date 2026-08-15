import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { holdPointerFrames, subscribePointerFrame } from "../atmosphere";
import { estimateCurrentTime, findActiveLineIndex, isInstrumentalGap } from "./interpolate";
import type { LyricLine, PlaybackSample } from "./types";

/* =============================================================================
   LYRIC SYNC — ported from Bunny Hop Player, on this page's ONE rAF loop
   =============================================================================

   Source: `bunny-hop-player/src/ui/hooks/useLyricSync.ts`. The hook's contract
   is unchanged and is the MVP 1 → MVP 2 seam:

     useLyricSync(lines, sampleRef, offsetSeconds)

   Whoever fills `sampleRef` is free to change — a mock clock, the YouTube
   IFrame API, a licensed lyric provider's transport later — and nothing above
   the ref moves. React state is touched ONLY when the active line index
   actually changes, so every other frame is free and the emitter for escaped
   lyrics can hang off `activeIndex` as an already-debounced signal.

   THE ONE THING THE PORT HAD TO CHANGE: the extension calls
   `requestAnimationFrame` itself. This page has exactly one rAF loop and it
   belongs to `atmosphere/pointer.ts`. So the hook BORROWS frames instead —
   `holdPointerFrames()` keeps the shared loop awake, `subscribePointerFrame()`
   delivers its frames — which is the sanctioned seam and the same one the drag
   engine and the wavefront use.

   WHEN IT HOLDS, AND WHY THAT MATTERS. Only while the position is actually
   moving. A paused player holds nothing and the shared loop goes back to
   sleep — the whole reason that loop idles is that a loop running to publish an
   unchanged number is a battery cost with no output, and a lyric estimate is
   the same kind of number. While a song IS playing the loop runs continuously,
   which is a real cost honestly incurred: something is genuinely happening.

   `live` and `revision` are the two facts the borrowed-frames version needs
   that the self-driving version did not:

     live       the position is advancing. Frames are held while true.
     revision   bumped by the driver on a DISCRETE change that moves the
                position without playing — a restart, a seek. Without it a seek
                made while paused would not be reflected until the next time
                something else happened to run the loop.
   ========================================================================== */

export interface LyricSync {
  /** Index into `lines`, or -1 before the first line. */
  activeIndex: number;
  /** True during a long gap between lines, or before the first one. */
  instrumental: boolean;
  /** Live position in seconds, offset-adjusted. Read inside frames, not render. */
  timeRef: RefObject<number>;
}

export interface LyricSyncDrive {
  /** The position is advancing right now. */
  live: boolean;
  /** Bumped whenever the driver writes an authoritative position while not live. */
  revision: number;
}

export function useLyricSync(
  lines: readonly LyricLine[],
  sampleRef: RefObject<PlaybackSample | null>,
  offsetSeconds: number,
  drive: LyricSyncDrive,
): LyricSync {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [instrumental, setInstrumental] = useState(false);

  const timeRef = useRef(0);
  const linesRef = useRef(lines);
  const offsetRef = useRef(offsetSeconds);
  const lastIndexRef = useRef(-1);
  const lastInstrumentalRef = useRef(false);

  linesRef.current = lines;
  offsetRef.current = offsetSeconds;

  const { live, revision } = drive;

  useEffect(() => {
    const tick = (): void => {
      // A positive offset means "show the lyrics later", i.e. treat playback as
      // being earlier than it is.
      const time = estimateCurrentTime(sampleRef.current, Date.now()) - offsetRef.current;
      timeRef.current = time;

      const currentLines = linesRef.current;
      const index = findActiveLineIndex(currentLines, time);
      if (index !== lastIndexRef.current) {
        lastIndexRef.current = index;
        setActiveIndex(index);
      }

      const gap = isInstrumentalGap(currentLines, index, time);
      if (gap !== lastInstrumentalRef.current) {
        lastInstrumentalRef.current = gap;
        setInstrumental(gap);
      }
    };

    /* Once, immediately, whatever the reason this effect is running. That is
       what settles the highlight after a pause, after a seek made while paused,
       and on the first commit — none of which are followed by a frame. */
    tick();

    if (!live) return;

    const release = holdPointerFrames();
    const unsubscribe = subscribePointerFrame(tick);

    return () => {
      unsubscribe();
      release();
    };
  }, [sampleRef, live, revision]);

  // Deliberately no "reset on new lyrics" effect — the extension's reasoning
  // carries over: the tick recomputes the index from scratch, so a stale index
  // can never outlive one frame, and every read of `lines[activeIndex]` is
  // already guarded.

  return { activeIndex, instrumental, timeRef };
}

/**
 * Drives a per-frame value straight into the DOM, bypassing React.
 *
 * Ported for the progress bar, which changes on every frame of playback and
 * would otherwise cost sixty renders a second to move a hairline by a pixel
 * every 0.9 seconds. Same borrowed frames, same rule: apply once on the effect,
 * then only while `live`.
 *
 * The callback runs INSIDE a frame. Do not read layout in it and do not set
 * state in it.
 */
export function useFrameBinding(
  apply: (time: number) => void,
  timeRef: RefObject<number>,
  drive: LyricSyncDrive,
): void {
  const applyRef = useRef(apply);
  applyRef.current = apply;

  const { live, revision } = drive;

  useEffect(() => {
    const tick = (): void => {
      applyRef.current(timeRef.current);
    };

    tick();
    if (!live) return;

    const release = holdPointerFrames();
    const unsubscribe = subscribePointerFrame(tick);

    return () => {
      unsubscribe();
      release();
    };
  }, [timeRef, live, revision]);
}
