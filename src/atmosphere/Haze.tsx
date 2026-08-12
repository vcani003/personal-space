import type { HazeMass } from "./types";
import type { StyleVars } from "./vars";
import styles from "./Haze.module.css";

/**
 * LAYER 2 — mist.
 *
 * The only thing on this page that moves. Two masses on wide, one on narrow,
 * drifting on non-harmonic 26s and 44s cycles at roughly a third of a pixel
 * per second. It should never be possible to catch it moving; it should only
 * be possible to notice that the page is not quite where you left it.
 *
 * Each mass is marked `data-ambient` so the intersection observer in
 * `hooks.ts` can pause it while it is scrolled off screen — which, on a
 * 4200px page, is most of the time.
 */

interface HazeProps {
  masses: readonly HazeMass[];
}

export function Haze({ masses }: HazeProps) {
  return (
    <div className={styles.layer}>
      {masses.map((mass) => {
        const style: StyleVars = {
          "--haze-x": mass.position.x,
          "--haze-y": mass.position.y,
          "--haze-inline": mass.size.inline,
          "--haze-block": mass.size.block,
          "--haze-intensity": mass.intensity,
        };

        return (
          <div
            key={mass.id}
            className={styles.mass}
            data-ambient=""
            data-drift={mass.drift}
            data-presence={mass.presence ?? "both"}
            style={style}
          />
        );
      })}
    </div>
  );
}
