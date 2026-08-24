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
  hopBeat: "projects/hop-beat",
  /* CASE STUDIES sit under the project they are about, not in a folder of
     their own. `projects/neko-dancer/system-design` says what it is from the
     URL alone, and it leaves room for the second study — the product design
     one — beside it rather than forcing a rename when it arrives. */
  nekoSystemDesign: "projects/neko-dancer/system-design",
} as const;

export type RouteName = keyof typeof ROUTE_PATHS;
