import { Player } from "./Player";
import styles from "./PlayerDock.module.css";

/**
 * THE DOCK — the player, always on screen.
 *
 * The player used to sit in the page's flow, in a `02 / Currently` section,
 * surrounded by deliberate emptiness. It was moved here because a music player
 * you have to go and find is not a music player you use: it needs to be
 * reachable while you are reading something else, which is the whole premise
 * of the object ("designed to recede while attention is elsewhere and reward
 * a glance").
 *
 * WHAT THIS COSTS, stated plainly so it is not rediscovered later:
 *
 *   - The player stops being an object situated IN the world and becomes an
 *     object travelling WITH the viewer. That is a real loss — its old
 *     placement, with a drawing opposite it and silence around it, was
 *     composed. Nothing fixed to a viewport can be composed against a page.
 *   - It will occasionally overlap content. That is inherent to anything
 *     pinned to the viewport, and is mitigated here rather than solved: it is
 *     small, it sits in the corner with real margin, and it is on the RIGHT —
 *     which is where the least is happening at the bottom of the viewport for
 *     most of the scroll, and crucially is not where the draggable paper
 *     fragment lives.
 *
 * The compensation is that it keeps its material identity completely. It is
 * still the three-band object — metadata, inset screen, deck — with its own
 * radius, its own edge and its own glow. It is NOT a bar stuck to the bottom
 * of the window: it floats clear of both edges, so it reads as a small object
 * resting in the corner of the screen rather than as browser chrome.
 */
export function PlayerDock() {
  return (
    <div className={styles.dock}>
      <Player />
    </div>
  );
}
