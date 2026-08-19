/**
 * =============================================================================
 * ROUTES — a closed set, resolved against the deployment's base path
 * =============================================================================
 *
 * WHY THIS IS 60 LINES AND NOT A DEPENDENCY. The site has exactly two runtime
 * dependencies, react and react-dom, and that is a deliberate property rather
 * than an accident of not needing anything yet. A router library exists to
 * solve nested layouts, loaders, code-split boundaries, param parsing and
 * transitions. This site has a handful of flat pages and no data loading, so
 * every one of those features would be paid for and unused.
 *
 * THE ROUTE SET IS CLOSED, and that is the important design choice. `Route` is
 * a union, not a string — so a link to a page that does not exist is a
 * compile error rather than a 404 discovered by a visitor. It is the same
 * reasoning `Navigation.tsx` already uses when it refuses to render a link to
 * a section that has not been built.
 *
 * ── THE BASE PATH IS THE WHOLE COMPLICATION ─────────────────────────────────
 *
 * Under a GitHub Pages project page the site is served from `/<repo>/`, so the
 * browser's `location.pathname` is `/personal-space/projects/spatial` while
 * the route is `projects/spatial`. Every path that enters this module gets the
 * base stripped, and every path that leaves it gets the base added back. Do
 * that in one place or do it wrong in several — the same reasoning as
 * `lib/assets.ts`, which solves this for asset URLs.
 *
 * `import.meta.env.BASE_URL` is Vite's resolved `base` and always ends in "/".
 * ========================================================================== */

import { ROUTE_PATHS, type RouteName } from "./paths";

/** Every real destination, plus the state the router falls into. */
export type Route = RouteName | "not-found";

/** The path each route lives at, relative to the base. `home` is the root.
 *  Declared in `paths.ts` because the BUILD reads the same list — see there. */
const PATHS = ROUTE_PATHS;

/** Strips the deployment's base prefix and any surrounding slashes. */
function toRelative(pathname: string): string {
  const base = import.meta.env.BASE_URL;
  const withoutBase = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  return withoutBase.replace(/^\/+|\/+$/g, "");
}

/** The route for a browser pathname. Anything unrecognised is `not-found`. */
export function routeFromPath(pathname: string): Route {
  const relative = toRelative(pathname);
  /* Matched against the same table the build prerenders from, so a route
     cannot exist in one and not the other. */
  for (const [name, path] of Object.entries(PATHS)) {
    if (relative === path) return name as Route;
  }
  return "not-found";
}

/**
 * The href for a route — always absolute from the server root, so it is
 * correct in a `<a href>` regardless of the page it is rendered on.
 *
 * `not-found` has no path of its own: it is a state the router arrives at,
 * never a destination anything links to, so asking for its href is a
 * programming error rather than a value worth inventing.
 */
export function hrefFor(route: Exclude<Route, "not-found">): string {
  return `${import.meta.env.BASE_URL}${PATHS[route]}`;
}

/**
 * THE DOCUMENT TITLE PER ROUTE.
 *
 * A single-page app changes the DOM and nothing else, so without this every
 * page in the site shares one tab title, one bookmark name and one entry in
 * the browser's history menu — and a screen reader announces the same title
 * on every navigation. The title is part of what a page IS, not decoration.
 *
 * The name comes last so the page identifies itself before it identifies the
 * site: a truncated tab reading "Spatial" is useful, one reading "Veronica
 * Ca…" three times over is not.
 */
const SITE_NAME = "Veronica Canido";

const TITLES: Record<Route, string> = {
  home: SITE_NAME,
  spatial: `Spatial — ${SITE_NAME}`,
  bunnyHop: `Bunny Hop Player — ${SITE_NAME}`,
  "not-found": `Not found — ${SITE_NAME}`,
};

export const titleFor = (route: Route): string => TITLES[route];
