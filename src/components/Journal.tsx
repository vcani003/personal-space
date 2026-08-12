import { useState } from "react";
import type {
  DrawingPost,
  ImagePost,
  LinkPost,
  Post,
  QuotePost,
  TextPost,
} from "../content/types";
import { assetUrl } from "../lib/assets";
import { Meta, META_SEPARATOR } from "./Meta";
import styles from "./Journal.module.css";

/**
 * JOURNAL — four kinds, four treatments.
 *
 * There is deliberately no `PostCard` here. Each kind gets its own renderer
 * because each kind wants a different material:
 *
 *   TEXT    prose in a narrow measure, sitting directly on the background.
 *           No container. It does not need one.
 *   IMAGE   a photograph existing in space. Caption and metadata sit outside
 *           the frame, not tucked beneath it like a social-media post.
 *   QUOTE   the display register at scale, surrounded by emptiness. The
 *           negative space IS the treatment; there is nothing else to it.
 *   LINK    metadata-forward. Small label, name in the display register, one
 *           line at most. The only kind that is inherently interactive.
 *
 * If a fifth kind is ever added, resist the urge to generalise these four into
 * a config object. The whole point is that they are allowed to diverge.
 */

/**
 * There is no shared `metaLine()` helper any more, and that is deliberate.
 *
 * One helper printing `label · date` for every kind is how the page ended up
 * with twelve grey whispers and six dates nobody needed. Each renderer now
 * decides what — if anything — its metadata says. Most of them say nothing,
 * because the margin note beside them already did.
 *
 * As a result NO post currently renders a date, and `src/lib/date.ts` is
 * unused. It is kept rather than deleted because an archive page will want it
 * and it already handles the trap that makes this non-trivial — `new Date()`
 * reads a date-only ISO string as UTC and renders the previous month for
 * anyone west of Greenwich.
 */

function TextEntry({ post }: { post: TextPost }) {
  return (
    <article className={styles.text}>
      {post.title && <h3 className={styles.textTitle}>{post.title}</h3>}
      <div className={styles.prose}>
        {post.body.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}

function ImageEntry({ post }: { post: ImagePost }) {
  /**
   * Final art arrives gradually, so a missing file is the normal case for now
   * — and a browser's broken-image icon is the one thing that makes a
   * deliberate empty frame look like a bug. On error the `<img>` is dropped
   * and the frame's own tonal field stands in for it, holding the
   * composition's proportions without announcing an absence.
   */
  const [missing, setMissing] = useState(false);

  return (
    <figure className={styles.image}>
      <div
        className={styles.frame}
        style={
          post.aspectRatio
            ? ({ "--aspect": String(post.aspectRatio) } as React.CSSProperties)
            : undefined
        }
      >
        {!missing && (
          <img
            src={assetUrl(post.src)}
            alt={post.alt}
            loading="lazy"
            decoding="async"
            onError={() => setMissing(true)}
          />
        )}
      </div>
      {/* The caption alone. It does the temporal work a date would have done,
          and does it better — "between three and four in the morning" is a
          time; "FEB 2026" is a filing system. */}
      {post.caption && (
        <figcaption className={styles.imageCaption}>
          <p className={styles.captionText}>{post.caption}</p>
        </figcaption>
      )}
    </figure>
  );
}

/**
 * A drawing floats. No frame, no crop, no fill — putting line art in a box
 * invents an edge the artwork does not have.
 *
 * Space is reserved by aspect ratio so the composition does not reflow when
 * the file finally arrives, but nothing is drawn until then: an empty region
 * of background, not a placeholder rectangle.
 */
function DrawingEntry({ post }: { post: DrawingPost }) {
  const [missing, setMissing] = useState(false);

  return (
    <div
      className={styles.drawing}
      style={
        post.aspectRatio
          ? ({ "--aspect": String(post.aspectRatio) } as React.CSSProperties)
          : undefined
      }
    >
      {!missing && (
        <img
          src={assetUrl(post.src)}
          alt={post.alt}
          loading="lazy"
          decoding="async"
          onError={() => setMissing(true)}
        />
      )}
    </div>
  );
}

function QuoteEntry({ post }: { post: QuotePost }) {
  return (
    <figure className={styles.quote}>
      <blockquote className={styles.quoteText}>
        <p>{post.text}</p>
      </blockquote>
      {(post.attribution || post.source) && (
        <figcaption>
          <Meta size="sm" dim>
            {[post.attribution, post.source?.label]
              .filter(Boolean)
              .join(META_SEPARATOR)}
          </Meta>
        </figcaption>
      )}
    </figure>
  );
}

function LinkEntry({ post }: { post: LinkPost }) {
  const external = post.external;
  return (
    <article className={styles.link}>
      {/* Only when the label says something the section heading did not. */}
      {post.meta.label && <Meta size="sm">{post.meta.label}</Meta>}
      <h3 className={styles.linkTitle}>
        <a
          href={post.href}
          className={styles.linkAnchor}
          {...(external
            ? { target: "_blank", rel: "noreferrer noopener" }
            : {})}
        >
          {post.label}
        </a>
      </h3>
      {post.description && (
        <p className={styles.linkDescription}>{post.description}</p>
      )}
      {/* `meta.tags` is intentionally not rendered. A tech-stack chip list is
          a portfolio tell, and it put a second whisper under an entry that
          already had one above it. The field stays in the type because a
          future page may want it; this page does not. */}
    </article>
  );
}

/** Renders one post in the treatment its kind deserves. */
export function JournalEntry({ post }: { post: Post }) {
  switch (post.kind) {
    case "text":
      return <TextEntry post={post} />;
    case "image":
      return <ImageEntry post={post} />;
    case "drawing":
      return <DrawingEntry post={post} />;
    case "quote":
      return <QuoteEntry post={post} />;
    case "link":
      return <LinkEntry post={post} />;
  }
}
