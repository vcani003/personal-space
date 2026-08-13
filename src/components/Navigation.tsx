import styles from "./Navigation.module.css";

/**
 * NAVIGATION.
 *
 * Deliberately tiny, and deliberately not a bar. MVP 1 is one page, so these
 * are in-page anchors — real navigation, not decoration, but small enough that
 * it reads as marginalia rather than as an application chrome.
 *
 * It sits at the top right, opposite the identity block, which is most of what
 * makes the opening feel composed rather than stacked.
 *
 * No hover underline slide, no active-state pill, no icon. It is a list of
 * four words.
 */

const LINKS = [
  { href: "#about", label: "About" },
  { href: "#journal", label: "Journal" },
  /* No `Currently` entry. It used to anchor the player's section; the player
     is now permanently docked to the viewport, so a link that scrolled you to
     something already on screen would do nothing a visitor could perceive. */
  { href: "#elsewhere", label: "Elsewhere" },
] as const;

export function Navigation() {
  return (
    <nav className={styles.nav} aria-label="Sections">
      <ul className={styles.list} role="list">
        {LINKS.map((link) => (
          <li key={link.href}>
            <a className={styles.link} href={link.href}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
