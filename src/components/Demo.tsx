import { useEffect, useState } from "react";
import { assetUrl } from "../lib/assets";
import { Meta } from "./Meta";
import styles from "./Demo.module.css";

/**
 * A DEMO RECORDING on a project page.
 *
 * ── SELF-HOSTED, NOT EMBEDDED ───────────────────────────────────────────────
 *
 * A YouTube embed would bring Google's player chrome, its cookies and its
 * branding onto a page whose entire character is restraint — and this site
 * would then be embedding YouTube twice, for two unrelated reasons. A short
 * silent capture is a few megabytes; there is nothing here a third party is
 * needed for.
 *
 * ── IT IS A MOVING SCREENSHOT, NOT A VIDEO TO SIT THROUGH ───────────────────
 *
 * Muted, looping, no controls, no sound track at all — `import-video.sh`
 * strips the audio rather than muting it. That is the right register for
 * twenty seconds of interface: you glance at it, you understand, you read on.
 * `playsInline` because iOS otherwise takes a video full-screen the moment it
 * plays, which for a loop is a hijacking.
 *
 * ── UNDER REDUCED MOTION IT DOES NOT MOVE ───────────────────────────────────
 *
 * Autoplaying video is exactly what `prefers-reduced-motion` is asking about,
 * and the rest of this site honours it everywhere. So that branch gets the
 * poster frame and real controls instead: nothing moves until it is asked to.
 * This is the one place the site needs the preference in JavaScript rather
 * than CSS — you cannot decline to autoplay from a stylesheet.
 *
 * ── THE CAPTION IS NOT OPTIONAL ─────────────────────────────────────────────
 *
 * A silent recording with no text is invisible to anyone who cannot watch it,
 * and to anyone whose connection has not delivered it yet. The caption says
 * what happens, so the page still makes sense with the video removed
 * entirely — which is also how it reads before the file exists.
 */

export interface DemoSource {
  /** Path under `public/assets/`, e.g. `demos/bunny-hop.mp4`. */
  readonly src: string;
  /** Poster frame, same folder. Shown before playback and under reduced motion. */
  readonly poster: string;
  /** What the recording shows. Required — see above. */
  readonly caption: string;
  /** Intrinsic size, so the box is held open before the file arrives. */
  readonly width: number;
  readonly height: number;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const onChange = (event: MediaQueryListEvent): void => {
      setReduced(event.matches);
    };
    query.addEventListener("change", onChange);
    return () => {
      query.removeEventListener("change", onChange);
    };
  }, []);

  return reduced;
}

export function Demo({ demo }: { demo: DemoSource }) {
  const reduced = usePrefersReducedMotion();

  return (
    <figure className={styles.demo}>
      <video
        className={styles.video}
        /* `width`/`height` reserve the right box from the first paint, so the
           page does not jump when the file lands. CSS still sizes it. */
        width={demo.width}
        height={demo.height}
        poster={assetUrl(demo.poster)}
        muted
        playsInline
        loop={!reduced}
        autoPlay={!reduced}
        controls={reduced}
        /* Only the poster and the metadata until it is on screen. A demo far
           down a page should not cost a visitor several megabytes they never
           scrolled to. */
        preload="metadata"
      >
        <source src={assetUrl(demo.src)} type="video/mp4" />
      </video>

      <figcaption className={styles.caption}>
        <Meta size="sm" dim dataText="meta">
          {demo.caption}
        </Meta>
      </figcaption>
    </figure>
  );
}
