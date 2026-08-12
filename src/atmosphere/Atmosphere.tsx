import { useRef } from "react";
import { composition as defaultComposition } from "./composition";
import { Haze } from "./Haze";
import { useAmbientVisibility, usePageExtent, usePointerField } from "./hooks";
import { Stars } from "./Stars";
import type { Composition } from "./types";
import styles from "./Atmosphere.module.css";

/**
 * THE ATMOSPHERE.
 *
 * Mount it once, as a sibling of the page content:
 *
 *   <Atmosphere />
 *   <Home />
 *
 * Order in the tree does not matter — the atmosphere sits behind the page by
 * z-index, not by document order — but keeping it first reads the way the
 * depth model does.
 *
 * WHAT IS HERE
 *   layer 0  the deep tonal field, plus a horizontal vignette
 *   layer 1  sixteen stars on wide, six on narrow, individually placed
 *   layer 2  two masses of haze, drifting; then film grain over all of it
 *   motion   the page's ONE rAF loop, publishing an interpolated pointer
 *            signal that every depth reads at its own travel. See pointer.ts.
 *
 * WHAT IS DELIBERATELY NOT HERE
 *   No scroll-driven motion: the composition is authored against the document
 *   and must not slide as the page scrolls. No entrance animation — the world
 *   does not arrive, it is simply already there when the page is. No twinkle,
 *   no pulse, no loop aimed at the reader. Exactly one object answers the
 *   pointer with anything other than parallax, and it is the bloom.
 *
 * The whole thing is inert to input: `aria-hidden`, `pointer-events: none`,
 * no tab stops, no text. The pointer is observed at the window, never hit-
 * tested against the atmosphere, so content at layer 3 stays readable and
 * clickable and the player at its own stacking level keeps its silhouette.
 */

export interface AtmosphereProps {
  /**
   * Override the authored environment. The default composition lives in
   * `composition.ts` and is the thing to edit — this exists so a variant can
   * be tried without forking the component.
   */
  composition?: Composition;
}

export function Atmosphere({
  composition = defaultComposition,
}: AtmosphereProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  usePageExtent(rootRef);
  useAmbientVisibility(rootRef, composition.haze.length);
  usePointerField(rootRef);

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true">
      <div className={styles.field} />
      <Stars stars={composition.stars} />
      <Haze masses={composition.haze} />
      <div className={styles.grain} />
    </div>
  );
}
