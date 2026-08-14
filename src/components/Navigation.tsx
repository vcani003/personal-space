import { identity } from "../content/posts";
import styles from "./Navigation.module.css";

/**
 * NAVIGATION.
 *
 * Deliberately tiny, and deliberately not a bar. Small enough that it reads as
 * marginalia rather than as application chrome.
 *
 * It sits at the top right, opposite the identity block, which is most of what
 * makes the opening feel composed rather than stacked.
 *
 * No hover underline slide, no active-state pill, no icon. It is a list of
 * four words.
 */

/*
 * `#about`, `#journal` and `#elsewhere` used to live here. All three targets
 * left the page when it became a wall, so all three were dead anchors — and
 * being the first three tab stops on the site, they were three no-ops in a row
 * for anyone arriving by keyboard.
 *
 * They are not replaced by in-page anchors. A wall has no sections to point at;
 * inventing anchor regions so the navigation has something to do would be
 * building the old page's information architecture back on top of the new one.
 *
 * So the navigation now holds only destinations that exist. Today that is one:
 * her Instagram. When themes, projects, resume or dance are real, they join
 * this list and nothing else changes.
 *
 * The single remaining item is deliberately NOT styled as a solitary special
 * case — it is the same list, at the same size, in the same place. A list of
 * one that looks like a list is a list that can grow.
 */
const LINKS = [
  { href: identity.instagramUrl, label: identity.handle, external: true },
] as const;

export function Navigation() {
  return (
    <nav className={styles.nav} aria-label="Elsewhere">
      <ul className={styles.list} role="list">
        {LINKS.map((link) => (
          <li key={link.href}>
            <a
              className={styles.link}
              href={link.href}
              {...(link.external
                ? { target: "_blank", rel: "noreferrer noopener" }
                : {})}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
