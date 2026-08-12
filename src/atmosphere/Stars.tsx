import type { Depth, StarObject } from "./types";
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
 * from the depth tokens, and every star inside it inherits that distance. Two
 * numbers published on the document element by the rAF loop in `pointer.ts`
 * then move the whole sky, at three different rates, without this component
 * knowing that a pointer exists.
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

function Star({ star }: { star: StarObject }) {
  const style: StyleVars = {
    "--star-x": star.position.x,
    "--star-y": star.position.y,
    "--star-size": star.size,
    "--star-intensity": star.intensity,
    "--star-tone": TONE_VAR[star.tone ?? "mist"],
  };

  /* A per-object parallax override replaces the depth's travel for this star
     alone. No star in the current composition uses it — depth is doing the
     work, which is how it should stay. */
  if (star.behavior?.parallax !== undefined) {
    style["--parallax-travel"] = `${star.behavior.parallax}px`;
  }

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
