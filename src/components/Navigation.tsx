import { useId, useState } from "react";
import { identity } from "../content/posts";
import { Link, type Route, useRoute } from "../router";
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
  /**
   * The route this entry goes to, when there is one.
   *
   * ITS PRESENCE IS WHAT MAKES AN ENTRY A LINK. The rule at the top of this
   * file — a destination that does not exist is not rendered as a link, is
   * not focusable, and cannot be pressed — is now enforced by the type rather
   * than by remembering it: an entry without a `route` has nothing to render
   * an `<a>` from. And because `Route` is a closed union, pointing an entry
   * at a page that does not exist is a compile error.
   */
  readonly route?: Exclude<Route, "not-found">;
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
  { label: "Home", indent: 0, state: "pending", route: "home" },
  /* Archive is gone with Project 3, and for the same reason: a word pointing
     at nothing, saying nothing about when it might. The two work-in-progress
     projects below earn their place by naming what is coming; "Archive" did
     not. */
  {
    label: "Projects",
    indent: 0,
    state: "pending",
    lead: "loose",
    children: [
      /* NAMED, NOT NUMBERED. "Project 1" told a visitor the order they were
         made in, which is the one thing about them nobody needs. A name is
         also what someone would search for or repeat to another person. */
      { label: "Bunny Hop Player", indent: 1, state: "pending", route: "bunnyHop" },
      { label: "Spatial", indent: 1, state: "pending", route: "spatial" },

      /* NOT LINKS, AND SAYING WHY. These have no page, so per the rule at the
         top of this file they render as unfocusable words — but a bare name
         with no destination reads as broken, so each carries its own state in
         the label. That is more honest than a link to nothing and more useful
         than leaving them out: it says what is coming.

         "Project 3" is gone entirely. It was a numbered placeholder for
         something that does not exist and had nothing to say. */
      /* hop//beat has a page now — a spec and a concept sheet — so it is a
         link and sits above the one that does not. Order follows what a
         visitor can actually reach. */
      { label: "hop//beat", indent: 1, state: "pending", route: "hopBeat" },
      { label: "Banh Miow Drink Recipes (wip / migrating)", indent: 1, state: "wip" },
    ],
  },
];

/**
 * THE RAIL'S NAVIGATION.
 *
 * A landmark holding a list of the site's sections. It is a landmark even
 * though it currently contains no links: it is still the answer to "what is on
 * this site", which is what a visitor asks a navigation.
 *
 * =============================================================================
 * ON A PHONE IT COLLAPSES, AND IT IS COLLAPSED TO BUY SPACE
 * =============================================================================
 *
 * Seven entries in the metadata register cost about 160px at the top of a
 * 390px-wide screen — a third of the first view, spent on a list of sections
 * before a single artifact appears. On a wall whose entire premise is the
 * things hanging on it, that is the most expensive thing on the page.
 *
 * WHAT THIS IS NOT: it is not a menu of places to go. Nothing in `SECTIONS` is
 * a link, because there is one page (see the note at the top of this file), so
 * the button does not open a way out of here — it opens a table of contents for
 * a site that mostly does not exist yet. That is worth being clear about,
 * because it decides the shape: a full-screen overlay would be a lot of
 * machinery and a lot of drama in front of seven words nobody can press.
 *
 * SO IT EXPANDS IN PLACE. The list opens above the wall and pushes it down,
 * which is the same thing the list did when it was always open, and closes
 * again. No overlay, no scrim, no trapped focus, no scroll lock, no portal —
 * none of which would have anything to protect.
 *
 * IT IS A `<button>` WITH `aria-expanded`, which is the entire accessibility
 * contract for a disclosure. The list is genuinely removed when closed rather
 * than moved off-screen, so a screen reader hears the same thing the eye sees
 * and cannot tab into a collapsed list.
 *
 * THE WIDE LAYOUT NEVER SEES ANY OF THIS. The rail has room, so the button is
 * `display: none` there and the list is unconditionally open — one branch, in
 * CSS, where the viewport question already lives.
 */
export function Navigation() {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const active = useRoute();

  return (
    <nav className={styles.nav} aria-label="Sections">
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        <Bars />
        {/* The word is for screen readers and nothing else. A visible "MENU"
            beside the glyph would cost most of what collapsing the list saved. */}
        <span className="visually-hidden">Sections</span>
      </button>

      <ul
        id={listId}
        className={styles.list}
        role="list"
        data-open={open ? "" : undefined}
      >
        {SECTIONS.map((entry) => (
          <Entry key={entry.label} entry={entry} active={active} />
        ))}
      </ul>
    </nav>
  );
}

/**
 * Three hairlines. Drawn rather than typed, because "≡" is a mathematical
 * identity sign that screen readers pronounce and fonts disagree about.
 *
 * The middle line is shorter. That is the one liberty taken with an otherwise
 * completely conventional glyph, and it is there because a perfectly regular
 * stack of three reads as a UI control from a component library, which is the
 * one thing this page has avoided being everywhere else.
 */
function Bars() {
  return (
    <svg viewBox="0 0 18 12" aria-hidden="true" focusable="false">
      <path
        d="M0 1h18M0 6h12M0 11h18"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

/**
 * One entry, in one of three renderings — and which one it gets is decided
 * entirely by whether it has somewhere to go and whether you are already
 * there.
 *
 *   the page you are on   a `<span>` with `aria-current="page"`. Not a link:
 *                         there is nowhere to go, and a link to the current
 *                         page is a tab stop that does nothing.
 *   a page that exists    a real `<a href>`, via `Link`.
 *   a page that does not  a `<span>`. Unfocusable, unpressable, and honest —
 *                         see the note at the top of this file.
 *
 * `data-state` is what the stylesheet reads, and it now comes from the ROUTE
 * for the current page rather than from a hardcoded field. The old version had
 * `state: "current"` written against `Home` in the data, which was true only
 * for as long as the site had one page.
 */
function Entry({ entry, active }: { entry: NavEntry; active: Route }) {
  const style: StyleVars = { "--nav-indent": entry.indent };
  const isCurrent = entry.route !== undefined && entry.route === active;
  const state = isCurrent ? "current" : entry.state;

  return (
    <li className={styles.item} data-lead={entry.lead}>
      {entry.route !== undefined && !isCurrent ? (
        <Link to={entry.route} className={styles.entryLink}>
          <span className={styles.label} style={style} data-state={state}>
            {entry.label}
          </span>
        </Link>
      ) : (
        <span
          className={styles.label}
          style={style}
          data-state={state}
          aria-current={isCurrent ? "page" : undefined}
        >
          {entry.label}
        </span>
      )}

      {entry.children !== undefined && (
        <ul className={styles.sublist} role="list">
          {entry.children.map((child) => (
            <Entry key={child.label} entry={child} active={active} />
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
