import { identity } from "../content/posts";
import type { StyleVars } from "../lib/vars";
import styles from "./Navigation.module.css";

/* =============================================================================
   NAVIGATION — two of them, and they are not the same thing
   =============================================================================

   `Navigation`  the site's own sections, in the floating rail.
   `Elsewhere`   the one link off this site, opposite the name.

   They were one component until the rail existed, and splitting them is the
   honest result of the wireframe: `@starcharm` still sits at the top right of
   the identity row, and the sections list is a separate object beside the wall.
   Same file, same register, same stylesheet — they are both navigation, they
   are just pointed in opposite directions.

   ── NOTHING IN `Navigation` IS A LINK, AND THAT IS THE POINT ────────────────

   There is one page. `Home` is it. `Archive`, `About`, `Projects` and the three
   projects are pages that do not exist yet, and there is no router to send
   anyone to them.

   The previous version of this file had already learned this lesson the hard
   way — `#about`, `#journal` and `#elsewhere` outlived the sections they
   pointed at and became three no-op tab stops at the very front of the keyboard
   order. So a destination that does not exist is not rendered as a link, is not
   focusable, and cannot be pressed. It is a word.

   That is not a placeholder waiting to be "wired up": it is what an honest
   table of contents looks like before the contents exist. When a page becomes
   real, its entry gains an `href` and nothing else in this file moves.

   `Home` carries `aria-current="page"` — a global attribute, valid on any
   element — so the one thing a screen reader needs to know about this list
   (which of these am I looking at) is stated rather than implied by colour.

   ── INDENTATION IS DATA ─────────────────────────────────────────────────────

   The wireframe's list is not flush: `About` and the three projects sit in from
   the left, `Home` / `Archive` / `Projects` sit at the margin. That irregularity
   is authored per entry as an integer and published as `--nav-indent`; the
   stylesheet multiplies it by one step. Retuning the whole shape is one value in
   `Navigation.module.css`, and nothing here decides how far a step is.

   `Projects` nests a real `<ul>` rather than relying on the indentation to
   convey the relationship, because indentation is a visual convention and a
   nested list is a structural fact. The three projects are heard as belonging to
   it whether or not the indentation renders.
   ========================================================================== */

interface NavEntry {
  readonly label: string;
  /** Steps in from the rail's left edge. 0 is flush. Authored, not derived. */
  readonly indent: number;
  /**
   * `current`  this page. Not a link because you are already here.
   * `pending`  a real intended destination that does not exist yet.
   * `wip`      named as work in progress by the site owner. One step quieter
   *            than `pending`, so the distinction she drew survives without a
   *            badge, a label or a second colour.
   */
  readonly state: "current" | "pending" | "wip";
  /** Extra air before this entry — how the list gets its groups. */
  readonly lead?: "normal" | "loose";
  readonly children?: readonly NavEntry[];
}

const SECTIONS: readonly NavEntry[] = [
  { label: "Home", indent: 0, state: "current" },
  { label: "Archive", indent: 0, state: "wip" },
  { label: "About", indent: 1, state: "pending", lead: "loose" },
  {
    label: "Projects",
    indent: 0,
    state: "pending",
    lead: "loose",
    children: [
      { label: "Project 1", indent: 1, state: "pending" },
      { label: "Project 2", indent: 1, state: "pending" },
      { label: "Project 3", indent: 1, state: "pending" },
    ],
  },
];

/**
 * THE RAIL'S NAVIGATION.
 *
 * A landmark holding a list of the site's sections. It is a landmark even
 * though it currently contains no links: it is still the answer to "what is on
 * this site", which is what a visitor asks a navigation.
 */
export function Navigation() {
  return (
    <nav className={styles.nav} aria-label="Sections">
      <ul className={styles.list} role="list">
        {SECTIONS.map((entry) => (
          <Entry key={entry.label} entry={entry} />
        ))}
      </ul>
    </nav>
  );
}

function Entry({ entry }: { entry: NavEntry }) {
  const style: StyleVars = { "--nav-indent": entry.indent };

  return (
    <li className={styles.item} data-lead={entry.lead}>
      <span
        className={styles.label}
        style={style}
        data-state={entry.state}
        aria-current={entry.state === "current" ? "page" : undefined}
      >
        {entry.label}
      </span>

      {entry.children !== undefined && (
        <ul className={styles.sublist} role="list">
          {entry.children.map((child) => (
            <Entry key={child.label} entry={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * OFF THIS SITE. One destination, and it is real.
 *
 * Unchanged from the version that lived at the top right of the page before the
 * rail existed, including the reasoning: it is a list of one that looks like a
 * list, so it is a list that can grow. When themes, resume or dance become real
 * external links they join it and nothing else changes.
 */
export function Elsewhere() {
  return (
    <nav className={styles.nav} aria-label="Elsewhere">
      <ul className={styles.inline} role="list">
        <li>
          <a
            className={styles.link}
            href={identity.instagramUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            {identity.handle}
          </a>
        </li>
      </ul>
    </nav>
  );
}
