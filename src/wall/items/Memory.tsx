import { useState, type ReactNode } from "react";
import { Meta, META_SEPARATOR } from "../../components/Meta";
import { formatPostDate } from "../../lib/date";
import type { StyleVars } from "../../lib/vars";
import type { MemoryItem } from "../types";
import { WallImage } from "./WallImage";
import styles from "./Memory.module.css";

/**
 * A MEMORY — a photograph or a visual artifact.
 *
 * The substance of the wall. Everything else on it is a caption to these.
 *
 * FOUR PIECES OF TEXT, THREE OF THEM OPTIONAL, AND THEY ARE NOT THE SAME THING:
 *
 *   caption      what this is. A sentence, in reading copy.
 *   annotation   what she has to say about it. An aside — closer to something
 *                written in a margin than to a description.
 *   date         machine ISO in the data, short month + year on screen.
 *   location     where.
 *
 * They are four separate fields precisely so a designer can put them in four
 * different places. Right now they are stacked under the image because that is
 * the least-decided arrangement, not because it is the right one — the
 * visual-design-engineer owns where they actually go, and "under the image" is
 * the arrangement most likely to be wrong.
 *
 * `data-text` is the stable hook for `src/interaction/textSplit.ts`: the value
 * is the typographic REGISTER, which is what that file's amplitude column is
 * already a function of. It goes on the leaf element that owns the text, never
 * on a container that holds another one.
 */

export function Memory({ item }: { item: MemoryItem }) {
  const meta = [
    item.date ? formatPostDate(item.date) : undefined,
    item.location,
  ].filter(Boolean);

  const described =
    item.caption !== undefined ||
    item.annotation !== undefined ||
    meta.length > 0;

  /* THE SAME RATIO, PUBLISHED A SECOND TIME, and it is not redundant.
     `WallImage` sets `--aspect` on the picture so it can hold its own box open
     before the file loads. A custom property set on the picture is invisible to
     the CAPTION beside it — and the caption's job during the swell is to move
     down by exactly half the picture's growth, which it cannot compute without
     knowing the ratio. Publishing it on their shared parent is what puts the
     number where both children can read it.
     The fallback is 3:2 in both places, written as `3 / 2` there because
     `aspect-ratio` takes a ratio and as `1.5` in the swell arithmetic because
     `calc()` takes a number. */
  const ratio: StyleVars | undefined =
    item.aspectRatio === undefined
      ? undefined
      : { "--aspect": String(item.aspectRatio) };

  const picture = (
    <WallImage
      eager
      className={styles.image}
      src={item.src}
      alt={item.alt}
      aspectRatio={item.aspectRatio}
    />
  );

  const figure = (
    <figure className={styles.memory} style={ratio}>
      {item.href ? picture : <Trigger>{picture}</Trigger>}
      {described && (
        <figcaption className={styles.caption}>
          {item.caption && <p data-text="body">{item.caption}</p>}
          {item.annotation && (
            <p className={styles.annotation} data-text="body">
              {item.annotation}
            </p>
          )}
          {meta.length > 0 && (
            <Meta size="sm" dim dataText="meta">
              {meta.join(META_SEPARATOR)}
            </Meta>
          )}
        </figcaption>
      )}
    </figure>
  );

  return item.href ? linked(item.href, figure) : figure;
}

/**
 * THE PICTURE, MADE PRESSABLE — the phone's answer to hover.
 *
 * On a touch screen the swell does not exist: `:hover` latches after a tap and
 * would leave a photograph stuck open until you pressed something else, which
 * is why the hover rules are gated behind `(hover: hover)`. Without a
 * replacement, the thumbnail this component now renders on a phone would be a
 * photograph nobody could see — small with no way out of being small.
 *
 * SO THE PICTURE IS A TOGGLE BUTTON, AT EVERY WIDTH RATHER THAN ONLY ON PHONES.
 * A viewport is not a fact about this component and the markup must not change
 * shape underneath the layout — CSS decides how far it opens (`--expand-lift`),
 * this decides only that it can be opened. What that buys on a desktop is a
 * keyboard path to the expansion, which previously existed only for the
 * memories that happen to be authored with an `href`.
 *
 * NOT WHEN IT IS A LINK. A button inside an anchor is invalid, and a linked
 * photograph already has an answer to being tapped — it goes somewhere. The
 * expansion is what a picture does when it has nowhere to send you.
 *
 * IT HAS NO `aria-label`, AND THAT IS THE ACCESSIBLE CHOICE RATHER THAN AN
 * OMISSION. A button takes its name from its contents, and its contents are an
 * image with alt text — so the name is already "a dark room where enormous red
 * and magenta flowers…, toggle button": the subject first, the mechanism
 * second, which is the right order for a control whose entire purpose is that
 * photograph. Adding `aria-label` would have overridden that with a second copy
 * of the same sentence, leaving the image announced underneath it. `aria-pressed`
 * carries the state, so nothing has to infer it from the size on screen.
 */
function Trigger({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      className={styles.trigger}
      aria-pressed={expanded}
      onClick={() => {
        setExpanded((value) => !value);
      }}
    >
      {children}
    </button>
  );
}

/**
 * Most memories are not links. When one is, the whole artifact becomes the
 * target rather than a "view" affordance appearing beneath it — the image's
 * alt text is already the accessible name, so the link needs no words of its
 * own.
 *
 * `external` is inferred here rather than authored, unlike `LinkItem`, because
 * a memory is a photograph first and its destination is incidental.
 */
function linked(href: string, children: ReactNode) {
  const external = /^https?:/i.test(href);
  return (
    <a
      className={styles.link}
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
    >
      {children}
    </a>
  );
}
