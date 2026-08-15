export type { LyricLine, MockTrack, PlaybackSample, TrackSource } from "./types";
export { mockTrack, trackSource } from "./mockTrack";
export { Player } from "./Player";
/** RETIRED, NOT DELETED, and not mounted anywhere. The player lives in the
 *  sticky rail beside the wall now — see the header of `PlayerDock.tsx`. The
 *  export stays so the component remains reachable, type-checked and one line
 *  away from returning. */
export { PlayerDock } from "./PlayerDock";

/**
 * THE TIMING CORE, and the seam it reads.
 *
 * Exported because the escaped-lyrics emitter is the next thing to be built on
 * top of it and it must not derive its own timing: `activeIndex` from
 * `useLyricSync` is already debounced to the moment the line actually changes,
 * and `isInstrumentalGap` is the guard that stops a blank fragment drifting
 * across the page. Ported from Bunny Hop Player — see the header of
 * `interpolate.ts` for what changed and why none of it is a second model.
 */
export { useFrameBinding, useLyricSync } from "./useLyricSync";
export type { LyricSync, LyricSyncDrive } from "./useLyricSync";
export {
  JITTER_TOLERANCE_SECONDS,
  MAX_EXTRAPOLATION_SECONDS,
  estimateCurrentTime,
  findActiveLineIndex,
  isInstrumentalGap,
  shouldAdoptSample,
} from "./interpolate";
export { useYouTubePlayback } from "./useYouTubePlayback";
export type { PlaybackStatus, YouTubePlayback } from "./useYouTubePlayback";
