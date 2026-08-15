import type { TrackMeta, TrackSource } from "./types";

/**
 * THE TRACK — the recording, and the two words needed to find its lyrics.
 *
 * THIS FILE USED TO CONTAIN TWELVE LINES OF INVENTED PLACEHOLDER TEXT, and the
 * player showed them while a real Imogen Heap recording played underneath. That
 * was described here as "honest scaffolding", which it was, right up until the
 * moment the audio became real — at which point the object was confidently
 * captioning a song with someone else's sentences, and read as broken.
 *
 * The words now come from LRCLIB at runtime (`lyrics.ts`), which is what the
 * old note in `types.ts` said they would have to. NOTHING IN THIS REPOSITORY
 * CONTAINS A LYRIC, and nothing here should ever be allowed to: a title and an
 * artist are facts about a recording, and they are all the lookup needs.
 *
 * Two lines with no text still matter to the code downstream — LRC marks
 * instrumental gaps that way, and `isInstrumentalGap` is the guard that stops
 * the escaped-lyrics emitter drifting a blank fragment across the page. Real
 * sheets carry those gaps, so the guard stays exercised without a fixture.
 */
export const track: TrackMeta = {
  title: "Goodnight and Go",
  artist: "Imogen Heap",
};

/** Where the sound comes from. Nothing is requested from it until play is pressed. */
export const trackSource: TrackSource = {
  videoId: "pbFtPUW0A-w",
  embedHost: "https://www.youtube-nocookie.com",
};
