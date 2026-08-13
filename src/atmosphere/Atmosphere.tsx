import { useRef } from "react";
import { composition as defaultComposition } from "./composition";
import { Glow } from "./Glow";
import { Haze } from "./Haze";
import {
  useAmbientVisibility,
  useDepthBandGuard,
  usePageExtent,
  usePointerField,
} from "./hooks";
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
 *   layer 0  the deep tonal field, plus a horizontal vignette; then THE MOTTLE
 *            — two scales of fractal noise making the darkness unevenly dark,
 *            shaped vertically so it keeps out of the quote's silence and the
 *            page's ending. Static, on purpose.
 *   layer 1  thirty-one stars on wide, seven on narrow, individually placed
 *   layer 1½ two distant lights on wide, one on narrow — a resolvable core and
 *            an inverse-square tail, painted over the stars and under the fog
 *            so the mist veils them
 *   layer 2  four masses of haze on wide, two on narrow, drifting. Each one is
 *            an irregular silhouette with a noise-masked interior rather than a
 *            radial falloff. Then film grain over all of it.
 *   motion   the page's ONE rAF loop, publishing an interpolated pointer
 *            signal that every depth reads at its own travel — and that every
 *            individual star then reads at its own distance within that depth,
 *            its own direction and its own beat. See pointer.ts, variance.ts.
 *            The same loop also displaces individual stars away from a cursor
 *            that passes close to them, which is a different thing from
 *            parallax and is explained where it is implemented.
 *
 * WHAT IS DELIBERATELY NOT HERE
 *   No scroll-driven motion: the composition is authored against the document
 *   and must not slide as the page scrolls. No entrance animation — the world
 *   does not arrive, it is simply already there when the page is. No twinkle,
 *   no pulse, no loop aimed at the reader. Exactly one object answers the
 *   pointer with anything other than movement, and it is the bloom.
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
  useAmbientVisibility(
    rootRef,
    composition.haze.length + composition.glows.length,
  );
  usePointerField(rootRef);
  useDepthBandGuard(rootRef);

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true">
      <div className={styles.field} />
      <div className={styles.mottle} />
      <Stars stars={composition.stars} />
      <Glow glows={composition.glows} />
      <Haze masses={composition.haze} />
      <div className={styles.grain} />
    </div>
  );
}
