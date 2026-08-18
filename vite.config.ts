import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { type Plugin, defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { ROUTE_PATHS } from "./src/router/paths.js";

/**
 * The GitHub Pages base path.
 *
 * A project page is served from `https://<user>.github.io/<repo>/`, so every
 * URL the build emits needs that prefix. This is the ONLY place it is decided.
 * It is never hardcoded: the deploy workflow passes the repository's own name
 * in `BASE_PATH`, so renaming the repo — or forking it — needs no code change.
 *
 * Everything downstream reads it rather than repeating it:
 *   - bundled JS/CSS/asset URLs   → Vite rewrites them
 *   - `url(/assets/…)` in CSS     → Vite rebases public paths at build time
 *   - runtime paths in TypeScript → `assetUrl()` in src/lib/assets.ts, via
 *                                   `import.meta.env.BASE_URL`
 *
 * Unset (local dev, `npm run build` on a laptop) it is `/`, which is also the
 * correct value for a user/organisation page or a custom domain.
 */
function resolveBase(): string {
  const raw = process.env.BASE_PATH?.trim();
  if (raw === undefined || raw === "" || raw === "/") return "/";
  return `/${raw.replace(/^\/+|\/+$/g, "")}/`;
}

/**
 * THE SPA FALLBACK, and why a static host needs one.
 *
 * GitHub Pages serves files. A visitor who opens `/personal-space/projects/spatial`
 * directly — from a bookmark, a shared link, or a reload after navigating —
 * asks for a FILE at that path, and there is no such file. Pages answers 404
 * and the app never boots to see the route it would have handled perfectly.
 *
 * The fix Pages provides is `404.html`: it is served, with the original URL
 * intact, for any path that does not resolve. So `404.html` is a byte-for-byte
 * copy of `index.html` — the same app, the same hashed asset URLs — and it
 * boots, reads `location.pathname`, and renders the route. The visitor sees
 * the page they asked for and never learns a 404 was involved.
 *
 * IT IS COPIED AT BUILD TIME RATHER THAN COMMITTED, because `index.html`
 * references hashed bundle filenames that change on every build. A committed
 * copy would be a file that is correct exactly once.
 *
 * `writeBundle` rather than `closeBundle`: it runs after the files are on
 * disk, and unlike `closeBundle` it does not also fire for the dev server.
 */
function spaFallback(): Plugin {
  return {
    name: "spa-fallback-404",
    apply: "build",
    writeBundle(options) {
      const dir = options.dir ?? resolve("dist");
      const shell = resolve(dir, "index.html");

      copyFileSync(shell, resolve(dir, "404.html"));

      /* AND A REAL PAGE AT EVERY KNOWN ROUTE.
         The 404 fallback alone renders correctly but is SERVED WITH A 404
         STATUS — measured on the live site: /projects/spatial redirected to
         /projects/spatial/ and came back 404 with the app inside it. A human
         sees the right page; a crawler, a link preview and anything checking
         status codes see a dead URL.

         The route set is closed and tiny, so each one gets its own
         `index.html` — the same shell, at a path the host can actually
         resolve. The 404 fallback stays for genuinely unknown paths, which is
         the only thing it should ever have been answering. */
      for (const path of Object.values<string>(ROUTE_PATHS)) {
        if (path === "") continue;
        const routeDir = resolve(dir, path);
        mkdirSync(routeDir, { recursive: true });
        copyFileSync(shell, resolve(routeDir, "index.html"));
      }
    },
  };
}

export default defineConfig({
  base: resolveBase(),
  plugins: [react(), spaFallback()],
});
