export type { LyricLine, MockTrack, PlaybackSample } from "./types";
export { mockTrack } from "./mockTrack";
export { Player } from "./Player";
/** RETIRED, NOT DELETED, and not mounted anywhere. The player lives in the
 *  sticky rail beside the wall now — see the header of `PlayerDock.tsx`. The
 *  export stays so the component remains reachable, type-checked and one line
 *  away from returning. */
export { PlayerDock } from "./PlayerDock";
