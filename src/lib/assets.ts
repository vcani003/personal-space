/**
 * ASSET PATHS
 *
 * Files in `public/assets/` are copied verbatim into the build and are *not*
 * hashed or rewritten by the bundler. Under a GitHub Pages project page the
 * site is served from `/<repo>/`, so a hardcoded `/assets/…` in JavaScript
 * 404s in production while working perfectly in dev. This is the single place
 * that difference is handled.
 *
 *   assetUrl("photography/window.jpg")
 *     dev  → /assets/photography/window.jpg
 *     prod → /personal-space/assets/photography/window.jpg
 *
 * `import.meta.env.BASE_URL` is Vite's resolved `base` and always ends in "/".
 *
 * CSS does not need this helper: Vite rebases root-absolute `url(/assets/…)`
 * during the build. TypeScript cannot be rebased, so it does.
 *
 * Art that is part of the *interface* rather than the *content* — an SVG
 * emblem, say — belongs in `src/` and should be imported directly so it gets
 * hashed and inlined. This helper is for content assets that arrive gradually
 * and are referenced by string.
 */

const ASSET_ROOT = "assets/";

/**
 * @param path Path relative to `public/assets/`, without a leading slash.
 */
export function assetUrl(path: string): string {
  const clean = path.replace(/^\/+/, "");
  return `${import.meta.env.BASE_URL}${ASSET_ROOT}${clean}`;
}
