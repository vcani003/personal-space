import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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

export default defineConfig({
  base: resolveBase(),
  plugins: [react()],
});
