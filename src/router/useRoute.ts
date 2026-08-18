import { useEffect, useSyncExternalStore } from "react";
import { type Route, routeFromPath, titleFor } from "./route";

/**
 * THE CURRENT ROUTE, and the one function that changes it.
 *
 * `useSyncExternalStore` rather than `useState` + an effect, because the
 * browser's history IS an external store and this is precisely the case that
 * hook exists for: it subscribes, reads a snapshot, and cannot tear during a
 * concurrent render the way a state mirror of an external value can.
 *
 * TWO EVENTS, NOT ONE. `popstate` fires for the back and forward buttons but
 * NOT for `pushState` — the browser deliberately does not notify you about
 * your own navigation. So `navigate` dispatches its own event, and both feed
 * the same subscription. Miss that and every in-app link appears to do
 * nothing until the visitor presses back.
 */

const NAVIGATED = "personal-space:navigated";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  window.addEventListener(NAVIGATED, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(NAVIGATED, onChange);
  };
}

const snapshot = (): string => window.location.pathname;

/* The server snapshot. There is no SSR here, but `useSyncExternalStore`
   requires it and returning the root is the honest answer for a build that
   only ever runs in a browser. */
const serverSnapshot = (): string => "/";

export function useRoute(): Route {
  const pathname = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return routeFromPath(pathname);
}

/**
 * Moves to a new path without a reload.
 *
 * Exported separately from the hook because it is not stateful — anything
 * that can produce an href can navigate, including code that is nowhere near
 * a component.
 */
export function navigate(href: string): void {
  if (href === window.location.pathname) return;
  window.history.pushState(null, "", href);
  window.dispatchEvent(new Event(NAVIGATED));
}

/**
 * Restores the browser behaviour a single-page app takes away: a new page
 * starts at the top, and it announces itself.
 *
 * WITHOUT THIS, following a link from half-way down the wall lands you
 * half-way down the next page, and a screen reader is told nothing happened
 * at all — the DOM changed but focus and the scroll position did not, which
 * is the classic SPA accessibility failure. Scrolling is the visible half;
 * moving focus to the new page's heading is the half that actually matters.
 */
export function useRouteChangeEffect(route: Route): void {
  useEffect(() => {
    document.title = titleFor(route);
    window.scrollTo({ top: 0, behavior: "instant" });

    /* The heading is the page's identity, so it is what focus should land
       on. `tabIndex = -1` makes a heading programmatically focusable without
       adding it to the tab order; it is removed on blur so the page is not
       left with a permanently odd element in it. */
    const heading = document.querySelector<HTMLElement>("[data-route-heading]");
    if (heading === null) return;

    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    const clear = () => {
      heading.removeAttribute("tabindex");
    };
    heading.addEventListener("blur", clear, { once: true });
    return () => {
      heading.removeEventListener("blur", clear);
    };
  }, [route]);
}
