/**
 * WHERE THE CANVAS ITSELF LIVES.
 *
 * Spatial is a separate application from a separate repository. The deploy
 * workflow builds it and drops it at `/projects/spatial/app` inside this
 * site's output, so in production it is a real directory served by the same
 * host — a plain URL, not a route.
 *
 * IT MUST NOT GO THROUGH THE ROUTER. `Link` intercepts clicks and resolves
 * them against this site's closed route set, which would send anyone who
 * pressed it to the not-found page. The canvas needs a FULL page load: it is
 * a different app, with a different bundle, that takes over the window.
 *
 * In development it is its own dev server on 5174, because nothing has built
 * it into this site's `dist` yet. That is the one place the two environments
 * genuinely differ, so it is stated here rather than discovered later by
 * clicking the link and getting a 404 from the Vite dev server.
 */
export const SPATIAL_APP_URL = import.meta.env.DEV
  ? "http://localhost:5174/"
  : `${import.meta.env.BASE_URL}projects/spatial/app/`;
