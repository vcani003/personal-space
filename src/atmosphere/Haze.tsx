import type { HazeMass } from "./types";
import type { StyleVars } from "./vars";
import styles from "./Haze.module.css";

/**
 * LAYER 2 — mist.
 *
 * Four masses on wide, two on narrow, drifting on non-harmonic 26s and 44s
 * cycles at roughly a third of a pixel per second. It should never be possible
 * to catch one moving; it should only be possible to notice that the page is
 * not quite where you left it.
 *
 * A mass is NOT a radial gradient. Its silhouette is three unequal offset
 * lobes and its internal density comes from a fractal-noise mask, so the fog is
 * blotchy — thin in places, twice the mean in others — before the blur softens
 * it. Which noise field a mass gets is `form` in the composition data. See THE
 * FORMS in Haze.module.css.
 *
 * Each mass is marked `data-ambient` so the intersection observer in
 * `hooks.ts` can pause it while it is scrolled off screen — which, on a
 * 4700px page, is most of the time.
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
            data-form={mass.form ?? "bank"}
            data-presence={mass.presence ?? "both"}
            style={style}
          />
        );
      })}
    </div>
  );
}
