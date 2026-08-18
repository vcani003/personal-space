import type { ReactNode } from "react";
import { type Route, hrefFor } from "./route";
import { navigate } from "./useRoute";

/**
 * An internal link.
 *
 * IT IS A REAL `<a href>` FIRST, and the JavaScript is an enhancement on top.
 * That ordering is the whole design: the href is what makes middle-click open
 * a tab, ⌘-click open a background tab, right-click offer "copy link
 * address", the status bar show a destination on hover, and a crawler see a
 * page. A `<div onClick>` router link silently takes all of that away.
 *
 * SO THE HANDLER DEFERS TO THE BROWSER whenever the browser would do
 * something more interesting than an in-app navigation:
 *
 *   modifier held   the visitor asked for a new tab or window
 *   not left button middle-click is "open in tab", right-click is the menu
 *   defaultPrevented something upstream already handled it
 *
 * In every one of those cases the click is left alone and the `href` does
 * exactly what it says.
 */
export function Link({
  to,
  className,
  children,
}: {
  to: Exclude<Route, "not-found">;
  className?: string;
  children: ReactNode;
}) {
  const href = hrefFor(to);

  return (
    <a
      className={className}
      href={href}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}
