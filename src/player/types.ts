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
 * THE LYRICS ARE STILL MOCK. Playback is now real — see `useYouTubePlayback` —
 * but the words in `mockTrack.ts` remain invented placeholder text. Real lyrics
 * are copyrighted and none are committed here; they would come from a licensed
 * runtime source, which is a later milestone and not this one.
 */

export interface LyricLine {
  readonly startTimeSeconds: number;
  readonly text: string;
}

export interface MockTrack {
  readonly title: string;
  readonly artist: string;
  /**
   * The FIXTURE's duration, not the recording's. Once a real player exists the
   * authoritative duration is whatever it reports, and that is what lands in
   * `PlaybackSample.durationSeconds` and drives the progress bar. This number
   * describes the placeholder lyric timings and nothing else.
   */
  readonly durationSeconds: number;
  readonly lines: readonly LyricLine[];
}

/**
 * Where the audio actually comes from.
 *
 * Separate from `MockTrack` on purpose: the words and the recording are two
 * different things with two different provenances, and the day real lyrics
 * arrive from a licensed provider this field must not have to move.
 */
export interface TrackSource {
  /** The YouTube video id. */
  readonly videoId: string;
  /**
   * The embed host. `youtube-nocookie.com` is the strictly better of the two
   * available hosts for the same embed and is what we pass; see the header of
   * `youtube.ts` for what still reaches `youtube.com` regardless.
   */
  readonly embedHost: string;
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
