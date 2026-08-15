import type { LyricLine, PlaybackSample } from "./types";

/* =============================================================================
   THE TIMING CORE — ported from Bunny Hop Player
   =============================================================================

   Source: `bunny-hop-player/src/common/playback/interpolate.ts`. Ported rather
   than reinvented, per player-integration-notes §1: it is the one subsystem of
   the extension worth taking verbatim, and having two timing models on one page
   would be two things to keep in agreement.

   WHAT CHANGED IN THE PORT, and why each change is not a second timing model:

   1. `PlaybackSample` is the WEBSITE's flat shape (`src/player/types.ts`), not
      the extension's `{ state, receivedAtMs }` pair. The extension nests the
      state because the sample arrives over `chrome.runtime` messaging from a
      different document; here the sample is stamped by the same document that
      reads it, so there is nothing to nest.

   2. `createSample` is NOT ported, and its absence is the point. Its whole job
      was subtracting the observed message latency, because `performance.now()`
      means something different in the sender's document than in the receiver's.
      There is no transport here — `useYouTubePlayback` reads the YouTube player
      and writes the ref in the same tick — so the latency is zero by
      construction and a function to correct it would only be a place for a bug.

   3. The clock is `Date.now()` throughout, matching what `PlaybackSample`
      already documented. A backwards system-clock jump produces a negative
      elapsed time, which `Math.max(0, …)` already floors; a forwards jump is
      capped by MAX_EXTRAPOLATION_SECONDS below and corrected within a second by
      the driver's re-stamp.

   Everything else — the clamps, the binary search, the jitter tolerance and the
   reasoning in the comments — is the extension's, unchanged.
   ========================================================================== */

/**
 * How far ahead of the last authoritative reading we are willing to guess.
 *
 * THE TRAP THIS IS THE OTHER HALF OF. A driver that seeds the sample once and
 * lets interpolation run advances smoothly for thirty seconds and then silently
 * freezes: no error, no state change, a highlight that simply stops. The clamp
 * is correct — exceeding it means the source of truth has stopped answering,
 * not that the song is long, and a position that stops moving is far less wrong
 * than one that marches confidently to the end of a track that is not playing.
 *
 * The obligation it creates belongs to whoever writes the ref: re-stamp every
 * one to two seconds from the real player clock. See RESTAMP_INTERVAL_MS in
 * `useYouTubePlayback.ts`.
 */
export const MAX_EXTRAPOLATION_SECONDS = 30;

/**
 * Largest backward correction treated as source jitter rather than a seek.
 *
 * YouTube's `getCurrentTime()` is not a perfectly monotonic reading — it can
 * come back a little behind where we had extrapolated to. Snapping back for
 * that makes the lyric highlight flip between two lines around a boundary.
 */
export const JITTER_TOLERANCE_SECONDS = 1.2;

/**
 * Estimates the current playback position.
 *
 * While paused the reported time is authoritative. While playing, elapsed real
 * time is scaled by the playback rate and added to the last reported time, then
 * clamped to the track duration.
 *
 * ON LOOPING AND TRACK CHANGES: this clamps at `durationSeconds` and does not
 * wrap. A restart is expressed by writing a NEW sample with
 * `currentTimeSeconds: 0` and a fresh `updatedAt`; there is deliberately no
 * modulo in here, because an estimator that wraps cannot tell the difference
 * between "the track looped" and "the driver has stopped answering".
 */
export function estimateCurrentTime(
  sample: PlaybackSample | null,
  nowMs: number,
): number {
  if (sample === null) return 0;
  if (sample.paused) return Math.max(0, sample.currentTimeSeconds);

  const elapsedSeconds = Math.min(
    Math.max(0, (nowMs - sample.updatedAt) / 1000),
    MAX_EXTRAPOLATION_SECONDS,
  );
  const estimated = sample.currentTimeSeconds + elapsedSeconds * sample.playbackRate;
  const upperBound =
    sample.durationSeconds > 0 ? sample.durationSeconds : Number.POSITIVE_INFINITY;
  return Math.min(Math.max(estimated, 0), upperBound);
}

/**
 * Whether an incoming reading should replace the current one.
 *
 * Forward corrections and pause-state changes always win. A small BACKWARD step
 * while playing is treated as quantisation noise and ignored, so the local
 * estimate stays smooth and monotonic. A real seek moves further than the
 * tolerance and is adopted immediately.
 *
 * An authoritative re-seed (a restart, a track change) does not go through
 * here at all — the driver writes those straight into the ref, because they are
 * facts rather than readings.
 */
export function shouldAdoptSample(
  previous: PlaybackSample | null,
  next: PlaybackSample,
  nowMs: number,
  toleranceSeconds = JITTER_TOLERANCE_SECONDS,
): boolean {
  if (previous === null) return true;

  if (previous.paused !== next.paused) return true;
  if (previous.playbackRate !== next.playbackRate) return true;
  if (previous.durationSeconds !== next.durationSeconds) return true;
  if (next.paused) return true;

  const estimated = estimateCurrentTime(previous, nowMs);
  const backwardBy = estimated - next.currentTimeSeconds;
  return !(backwardBy > 0 && backwardBy < toleranceSeconds);
}

/**
 * Index of the lyric line that should be highlighted at `time`, or -1 when
 * playback is still before the first line.
 *
 * Binary search keeps this cheap enough to call every animation frame. Lines
 * are assumed sorted. When several share a timestamp the last of the group
 * wins, so a fixture with duplicate stamps settles on one stable highlight
 * rather than flickering between them.
 */
export function findActiveLineIndex(
  lines: readonly { readonly startTimeSeconds: number }[],
  time: number,
): number {
  let low = 0;
  let high = lines.length - 1;
  let found = -1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const line = lines[mid];
    if (line !== undefined && line.startTimeSeconds <= time) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found;
}

/**
 * True when the gap around the active line is long enough to be an instrumental
 * break worth showing as one. Also covers the intro before the first line.
 *
 * Kept even though nothing renders differently for it today: it is what the
 * escaped-lyrics emitter's second guard will read (an escaped fragment from an
 * empty line is a blank thing drifting across the page), and re-deriving it
 * later would be the second timing model this file exists to prevent.
 */
export function isInstrumentalGap(
  lines: readonly LyricLine[],
  activeIndex: number,
  time: number,
  minGapSeconds = 6,
): boolean {
  if (lines.length === 0) return false;

  if (activeIndex < 0) {
    const first = lines[0];
    return first !== undefined && first.startTimeSeconds - time >= minGapSeconds;
  }

  const active = lines[activeIndex];
  if (active === undefined) return false;
  // An empty line in an LRC file is itself an explicit instrumental marker.
  if (active.text.trim() === "") return true;

  const next = lines[activeIndex + 1];
  if (next === undefined) return false;
  return next.startTimeSeconds - time >= minGapSeconds;
}
