import type { GlowSource } from "./types";
import { TONE_VAR, type StyleVars } from "./vars";
import styles from "./Glow.module.css";

/**
 * LAYER 1½ — distant light.
 *
 * Two objects on wide, one on narrow. They sit between the stars and the haze
 * on purpose: a glow is a light source with air in front of it, so the mist has
 * to be allowed to veil it. Painted in front of the stars, veiled by the fog.
 *
 * Data in, positioned elements out, like every other layer here. There is no
 * generator and there must not be one — two lights is the whole budget, and
 * each one's `note` is where it argues for the space it takes.
 *
 * Marked `data-ambient` so the intersection observer in `hooks.ts` stops their
 * breathing while they are scrolled away.
 */

interface GlowProps {
  glows: readonly GlowSource[];
}

export function Glow({ glows }: GlowProps) {
  return (
    <div className={styles.layer}>
      {glows.map((glow) => {
        const style: StyleVars = {
          "--glow-x": glow.position.x,
          "--glow-y": glow.position.y,
          "--glow-radius": glow.radius,
          "--glow-aspect": glow.aspect ?? 1,
          "--glow-intensity": glow.intensity,
          "--glow-tone": TONE_VAR[glow.tone ?? "mist"],
        };

        return (
          <div
            key={glow.id}
            className={styles.source}
            data-ambient=""
            data-depth={glow.depth}
            data-presence={glow.presence ?? "both"}
            style={style}
          />
        );
      })}
    </div>
  );
}
