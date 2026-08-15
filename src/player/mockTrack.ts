import type { MockTrack, TrackSource } from "./types";

/**
 * THE TRACK — real recording, placeholder words.
 *
 * The two halves of this file have completely different standing and it matters
 * that they are not confused:
 *
 * THE RECORDING IS REAL. `Goodnight and Go`, Imogen Heap, played from YouTube
 * through the IFrame API. The video is the official "Imogen Heap - Topic"
 * upload and embedding is permitted for it.
 *
 * THE LYRICS ARE NOT. The text below is filler written for this file. No real
 * song lyrics are committed here and none should be — lyrics are copyrighted,
 * and if the real words are ever shown they come from a licensed runtime
 * source, not from a checked-in string. So the player sings one song and shows
 * the words to another, which is honest scaffolding rather than a bug: the
 * lines exist to exercise the timing core, not to caption the recording.
 *
 * Two lines are intentionally empty. Empty lines are how LRC marks instrumental
 * gaps, and the escaped-lyrics emitter has to skip them — an escaped fragment
 * from an empty line is a blank thing drifting across the page. Keep at least
 * one gap in any replacement fixture so that guard stays exercised.
 *
 * Timings are spaced widely on purpose: the player should feel like it
 * breathes, and it makes the ~30s extrapolation clamp easy to trip over during
 * development rather than in front of a visitor. They cover only the opening
 * minute and a half of a four-minute recording, after which the last line
 * simply stays — again, the honest consequence of a fixture.
 */
export const mockTrack: MockTrack = {
  title: "Goodnight and Go",
  artist: "Imogen Heap",
  durationSeconds: 96,
  lines: [
    { startTimeSeconds: 0, text: "" },
    { startTimeSeconds: 6, text: "First placeholder line" },
    { startTimeSeconds: 13, text: "Second placeholder line, a little longer" },
    { startTimeSeconds: 21, text: "Third placeholder line" },
    { startTimeSeconds: 29, text: "" },
    { startTimeSeconds: 36, text: "Fourth placeholder line" },
    { startTimeSeconds: 44, text: "Fifth placeholder line" },
    { startTimeSeconds: 52, text: "Sixth placeholder line, longer again" },
    { startTimeSeconds: 61, text: "Seventh placeholder line" },
    { startTimeSeconds: 70, text: "Eighth placeholder line" },
    { startTimeSeconds: 79, text: "Ninth placeholder line" },
    { startTimeSeconds: 88, text: "Tenth placeholder line" },
  ],
};

/** Where the sound comes from. Nothing is requested from it until play is pressed. */
export const trackSource: TrackSource = {
  videoId: "pbFtPUW0A-w",
  embedHost: "https://www.youtube-nocookie.com",
};
