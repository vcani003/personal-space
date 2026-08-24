import type { ReactNode } from "react";
import styles from "./Diagram.module.css";

/* =============================================================================
   DIAGRAM PARTS — the pieces every drawing on this page is assembled from
   =============================================================================

   Small on purpose. A diagram built from a shared vocabulary stays consistent
   with the next diagram for free; one drawn freehand each time drifts by the
   third one, and the drift is exactly the thing a reader notices as "these
   pictures came from different places".

   ARROWHEADS ARE DRAWN, NOT MARKERS. SVG `<marker>` needs a `<defs>` entry
   referenced by `url(#id)`, and ids are DOCUMENT-global — eight diagrams on one
   page either share one definition (fragile: delete the first diagram and the
   other seven lose their arrowheads) or collide. A three-point path costs
   nothing and cannot collide with anything.
   ========================================================================== */

/** The scroll frame, the accessible name, and the description. */
export function Diagram({
  title,
  desc,
  viewBox,
  children,
}: {
  /** The accessible name. Say what the diagram IS, briefly. */
  title: string;
  /** What a reader who cannot see it needs — the content, not the layout. */
  desc: string;
  viewBox: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.frame} tabIndex={0} role="group" aria-label={title}>
      <svg
        className={styles.svg}
        viewBox={viewBox}
        role="img"
        aria-label={`${title}. ${desc}`}
      >
        {children}
      </svg>
    </div>
  );
}

/** A labelled box. `lead` marks the one thing a diagram is about. */
export function Box({
  x,
  y,
  w,
  h,
  label,
  sub,
  lead = false,
  ghost = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  lead?: boolean;
  ghost?: boolean;
}) {
  const boxClass = ghost ? styles.boxGhost : lead ? styles.boxLead : styles.box;
  const cx = x + w / 2;
  /* One line sits on the centre; two lines straddle it. Computed rather than
     hand-tuned per box so a box that gains a subtitle does not need moving. */
  const labelY = sub === undefined ? y + h / 2 + 5 : y + h / 2 - 3;

  return (
    <g>
      <rect className={boxClass} x={x} y={y} width={w} height={h} rx={2} />
      <text
        className={ghost ? styles.labelQuiet : styles.label}
        x={cx}
        y={labelY}
        textAnchor="middle"
      >
        {label}
      </text>
      {sub !== undefined && (
        <text className={styles.labelFaint} x={cx} y={y + h / 2 + 13} textAnchor="middle">
          {sub}
        </text>
      )}
    </g>
  );
}

const HEAD = 5;

/** A downward arrow from `y1` to `y2`. */
export function ArrowDown({
  x,
  y1,
  y2,
  soft = false,
}: {
  x: number;
  y1: number;
  y2: number;
  soft?: boolean;
}) {
  return (
    <g>
      <line
        className={soft ? styles.lineSoft : styles.lineStrong}
        x1={x}
        y1={y1}
        x2={x}
        y2={y2 - HEAD}
      />
      <path
        className={soft ? styles.headQuiet : styles.head}
        d={`M ${x - HEAD} ${y2 - HEAD} L ${x + HEAD} ${y2 - HEAD} L ${x} ${y2} Z`}
      />
    </g>
  );
}

/**
 * A horizontal arrow from `x1` to `x2`. Direction is derived, not assumed —
 * a sequence diagram sends messages both ways and mirroring the whole group
 * with a transform flips the arrowhead's geometry along with it.
 */
export function ArrowRight({
  x1,
  x2,
  y,
  soft = false,
}: {
  x1: number;
  x2: number;
  y: number;
  soft?: boolean;
}) {
  const toward = x2 > x1 ? 1 : -1;
  const base = x2 - HEAD * toward;
  return (
    <g>
      <line
        className={soft ? styles.lineSoft : styles.lineStrong}
        x1={x1}
        y1={y}
        x2={base}
        y2={y}
      />
      <path
        className={soft ? styles.headQuiet : styles.head}
        d={`M ${base} ${y - HEAD} L ${base} ${y + HEAD} L ${x2} ${y} Z`}
      />
    </g>
  );
}

/** An elbow: down from a point, across, then an arrowhead into a target. */
export function ArrowElbow({
  x1,
  y1,
  x2,
  y2,
  soft = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  soft?: boolean;
}) {
  const toward = x2 > x1 ? 1 : -1;
  return (
    <g>
      <path
        className={soft ? styles.lineSoft : styles.lineStrong}
        d={`M ${x1} ${y1} V ${y2} H ${x2 - HEAD * toward}`}
      />
      <path
        className={soft ? styles.headQuiet : styles.head}
        d={`M ${x2 - HEAD * toward} ${y2 - HEAD} L ${x2 - HEAD * toward} ${y2 + HEAD} L ${x2} ${y2} Z`}
      />
    </g>
  );
}

/**
 * A dashed boundary with a name on it.
 *
 * `below` moves the name under the box instead of over it, for the case where
 * something crosses the boundary's top edge — arrows entering a zone will run
 * straight through a label sitting above it, and a label with lines through it
 * reads as a mistake rather than as a caption.
 */
export function Zone({
  x,
  y,
  w,
  h,
  label,
  below = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  below?: boolean;
}) {
  return (
    <g>
      <rect className={styles.zone} x={x} y={y} width={w} height={h} rx={3} />
      <text className={styles.zoneLabel} x={x + 10} y={below ? y + h + 16 : y - 7}>
        {label}
      </text>
    </g>
  );
}

/** Free text, at one of the three luminance steps. */
export function Label({
  x,
  y,
  children,
  tone = "quiet",
  anchor = "start",
  mono = false,
}: {
  x: number;
  y: number;
  children: string;
  tone?: "bright" | "quiet" | "faint";
  anchor?: "start" | "middle" | "end";
  mono?: boolean;
}) {
  const cls = mono
    ? styles.labelMono
    : tone === "bright"
      ? styles.label
      : tone === "faint"
        ? styles.labelFaint
        : styles.labelQuiet;
  return (
    <text className={cls} x={x} y={y} textAnchor={anchor}>
      {children}
    </text>
  );
}

export { styles as diagramStyles };
