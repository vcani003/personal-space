/**
 * WHERE EACH ROUTE LIVES, relative to the deployment's base path.
 *
 * Its own module, with no imports and no `import.meta.env`, for one reason:
 * THE BUILD READS IT TOO. `vite.config.ts` runs in Node, where `import.meta.env`
 * does not exist, so it cannot import `route.ts` — and duplicating the paths
 * into the build config would create two lists that drift the first time a
 * route is added.
 *
 * Adding a route here gives it a URL, a prerendered entry point, and a
 * compile-time-checked name, in one edit.
 */
export const ROUTE_PATHS = {
  home: "",
  spatial: "projects/spatial",
  bunnyHop: "projects/bunny-hop",
} as const;

export type RouteName = keyof typeof ROUTE_PATHS;
