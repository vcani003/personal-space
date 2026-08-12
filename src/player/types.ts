/**
 * PLAYER TYPES — website-local
 *
 * `LyricLine` is copied field-for-field from
 * `bunny-hop-player/src/common/types.ts`, deliberately. It is the load-bearing
 * shape: the timing core the player agent ports (`interpolate.ts`,
 * `useLyricSync`) is written against it, and MVP 2's real lyric bundle exposes
 * `lines: LyricLine[]`, so it slots straight in.
 *
 * `MockTrack` is NOT the extension's `LyricsBundle`. That type has twelve
 * fields, eight of them LRCLIB provenance (provider ids, fetch timestamps,
 * match source) that mean nothing here. Four fields is the whole requirement.
 *
 * The homepage player is mock data only in MVP 1: no network, no lyric search,
 * no YouTube IFrame API.
 */

export interface LyricLine {
  readonly startTimeSeconds: number;
  readonly text: string;
}

export interface MockTrack {
  readonly title: string;
  readonly artist: string;
  readonly durationSeconds: number;
  readonly lines: readonly LyricLine[];
}

/**
 * The MVP 1 → MVP 2 seam.
 *
 * `useLyricSync(lines, sampleRef, offsetSeconds)` reads a ref holding one of
 * these. MVP 1 writes it from a mock clock; MVP 2 writes it from the YouTube
 * IFrame API. Nothing above the ref changes.
 *
 * Two traps the writer must respect, whichever era it belongs to:
 *   - The estimator clamps forward extrapolation at 30 seconds. A sample
 *     seeded once at mount runs smoothly and then silently freezes. Re-stamp
 *     every 1–2 seconds.
 *   - The estimator also clamps at `durationSeconds`. On loop, re-seed with
 *     `currentTimeSeconds: 0` and a fresh `updatedAt` — never modulo inside
 *     the estimator.
 */
export interface PlaybackSample {
  readonly currentTimeSeconds: number;
  readonly durationSeconds: number;
  readonly paused: boolean;
  readonly playbackRate: number;
  /** `Date.now()` at the moment of sampling; corrects for elapsed time. */
  readonly updatedAt: number;
}
