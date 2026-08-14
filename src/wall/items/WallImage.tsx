import { useState } from "react";
import { assetUrl } from "../../lib/assets";
import type { StyleVars } from "../../lib/vars";

/**
 * AN IMAGE THAT TOLERATES NOT EXISTING YET.
 *
 * Final art arrives gradually, so a missing file is the NORMAL case on this
 * site — and a browser's broken-image icon is the one thing that makes a
 * deliberate empty space look like a bug. On error the `<img>` is dropped and
 * an empty box of the same proportions takes its place: the composition keeps
 * its shape, nothing reflows when the file finally lands, and nothing is drawn
 * to announce the absence.
 *
 * This is the same behaviour `Journal.tsx`'s `ImageEntry` worked out in MVP 1,
 * extracted because three of the five wall renderers need it. It is NOT the
 * beginning of a shared card: it renders one element, sets no frame, no border,
 * no background and no layout, and every caller supplies its own class. If it
 * ever grows a wrapper, that is the moment to delete it and inline it three
 * times instead.
 */

export interface WallImageProps {
  /** Path relative to `public/assets/`, no leading slash. */
  readonly src: string;
  readonly alt: string;
  /** Intrinsic width / height. Reserves the space before the file exists. */
  readonly aspectRatio?: number;
  readonly className?: string;
  /** Decorative art with no alt — the placeholder must be hidden too. */
  readonly hidden?: boolean;
}

export function WallImage({
  src,
  alt,
  aspectRatio,
  className,
  hidden,
}: WallImageProps) {
  const [missing, setMissing] = useState(false);

  const style: StyleVars | undefined =
    aspectRatio === undefined
      ? undefined
      : { "--aspect": String(aspectRatio) };

  if (missing) {
    /* Holds the space, draws nothing, says nothing. There is no image to
       describe, so there is no alt text to keep. */
    return <div className={className} style={style} aria-hidden="true" />;
  }

  return (
    <img
      className={className}
      style={style}
      src={assetUrl(src)}
      alt={alt}
      aria-hidden={hidden ? "true" : undefined}
      loading="lazy"
      decoding="async"
      onError={() => setMissing(true)}
    />
  );
}
