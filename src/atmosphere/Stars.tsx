import type { Depth, StarObject } from "./types";
import { starVariance } from "./variance";
import { TONE_VAR, type StyleVars } from "./vars";
import styles from "./Stars.module.css";

/**
 * LAYER 1 — very distant light.
 *
 * Data in, positioned elements out. There is no generator here: this component
 * cannot invent a star, only place one it was given. That is the point — the
 * composition is authored in `composition.ts` and this file is the printer.
 *
 * Stars are grouped by depth rather than rendered flat, because depth is the
 * unit parallax moves in: each group carries one `--parallax-travel` resolved
 * from the depth tokens, and every star inside it inherits that distance. Four
 * numbers published on the document element by the rAF loop in `pointer.ts`
 * then move the whole sky without this component knowing a pointer exists.
 *
 * A DEPTH IS NOT A DISTANCE, THOUGH — it is a band of them. Left at the group's
 * travel alone, every star in a band moves by the identical amount along the
 * identical vector, and the band slides as one rigid plane; three of those read
 * as three sheets of glass rather than as a sky of separate objects. So each
 * star also carries its own multiplier, its own small rotation and its own
 * settle rate, resolved from its `id` by `variance.ts`. Four numbers per star,
 * written once at render, consumed entirely in CSS. Nothing per-star runs in a
 * frame and there is still exactly one rAF loop on the page.
 */

/* Painted far to near. Foreground is part of the model and unused: layer 5 is
   reserved for a single occasional object and there is no art for one yet. */
const DEPTH_ORDER: readonly Depth[] = ["far", "mid", "near", "foreground"];

interface StarsProps {
  stars: readonly StarObject[];
}

export function Stars({ stars }: StarsProps) {
  return (
    <div className={styles.layer}>
      {DEPTH_ORDER.map((depth) => {
        const members = stars.filter((star) => star.depth === depth);
        if (members.length === 0) return null;

        return (
          <div key={depth} className={styles.depth} data-depth={depth}>
            {members.map((star) => (
              <Star key={star.id} star={star} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* Enough precision to be smooth, few enough digits to keep the inline style
   readable when someone inspects a star to see why it moves the way it does. */
function round(value: number, places: number): number {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
}

function Star({ star }: { star: StarObject }) {
  /* Pure and deterministic — same id, same movement, every reload. The values
     are emitted rather than derived in CSS precisely so they are visible on the
     element in DevTools; see the table at the top of variance.ts. */
  const variance = starVariance(star.id, star.depth, star.behavior?.parallax);

  const style: StyleVars = {
    "--star-x": star.position.x,
    "--star-y": star.position.y,
    "--star-size": star.size,
    "--star-intensity": star.intensity,
    "--star-tone": TONE_VAR[star.tone ?? "mist"],

    /* Its own distance within its depth band, its own direction, its own beat.
       The rotation arrives pre-resolved as a cosine and a sine rather than as
       an angle: CSS could do the trigonometry itself, but the angle never
       changes, and this keeps the per-frame expression down to multiplies. */
    "--star-parallax": round(variance.travel, 3),
    "--star-skew-cos": round(Math.cos(variance.skew), 4),
    "--star-skew-sin": round(Math.sin(variance.skew), 4),
    "--star-lag": round(variance.lag, 3),
  };

  return (
    <span
      className={styles.star}
      data-kind={star.kind}
      data-presence={star.presence ?? "both"}
      /* The attribute is the contract between the composition data and the
         pointer loop, which finds its one reactive object by query. Emitted
         only when true, so `[data-reactive]` matches exactly the stars that
         opted in — `data-reactive="false"` would still match. */
      data-reactive={star.behavior?.pointerReactive === true ? "" : undefined}
      style={style}
    />
  );
}
