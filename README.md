# Personal Space

The personal website of **Veronica Canido** (`@starcharm`).

One page. React + Vite + TypeScript, plain CSS with custom properties and CSS
Modules. No backend, no router, no CMS, no state library, no CSS framework, no
UI kit. Deployed to GitHub Pages via GitHub Actions.

---

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-checks, then builds to dist/
npm run preview  # serves dist/ locally
```

`npm run build` runs `tsc -b` first, so a type error fails the build.

### Fonts on a fresh clone

The site uses two faces. One of them is not in the repository — see
[Typefaces](#typefaces). A fresh clone renders correctly with a fallback serif;
to see the intended display face locally, copy the trial files in:

```bash
cp "/path/to/PP Eiko-Free For Personal Use v2.0/PPEiko-Thin.otf" \
   "/path/to/PP Eiko-Free For Personal Use v2.0/PPEiko-Medium.otf" \
   "/path/to/PP Eiko-Free For Personal Use v2.0/PPEiko-LightItalic.otf" \
   public/assets/fonts/
```

They are gitignored and will stay that way.

---

## Layout

```
src/
  atmosphere/   depth layers, stars, haze, grain, parallax   (stub)
  interaction/  drag, hold, discoveries, escaped lyrics      (stub)
  player/       Bunny Hop placeholder + mock track data
  content/      static TypeScript content, typed per post kind
  components/   page content components                      (stub)
  styles/       fonts.css, tokens.css, base.css
  lib/          storage, math, asset paths
public/
  assets/       atmosphere foreground drawings photography
                profile journal music fonts
```

Composition tolerates missing assets. Final art arrives gradually and nothing
should break, or look broken, while a file is absent.

### The three global stylesheets

Imported once, in this order, from `src/main.tsx`:

| File         | Holds                                              |
| ------------ | -------------------------------------------------- |
| `fonts.css`  | `@font-face` only                                  |
| `tokens.css` | every custom property                              |
| `base.css`   | reset and document defaults                        |

Everything else is a CSS Module colocated with its component. **No component
writes a raw colour, duration, size or z-index.** If a value is missing, the
token set is incomplete — add the token.

### Content

`src/content/types.ts` is a discriminated union over `kind`: `text`, `image`,
`quote`, `link`. The union exists so each kind can render *differently*; there
is intentionally no universal card type. `meta` (date, label, index, tags) is a
separate object so it can be positioned away from the content it describes.

The entries currently in `src/content/posts.ts` are marked `placeholder: true`
and are scaffolding, not writing.

### Storage

`src/lib/storage.ts`. Keys are namespaced and versioned: `personal-space:v1:*`.
Reads take a type guard and return a fallback on *any* failure — storage
disabled, quota full, malformed JSON, corrupt value. Nothing in the module
throws. Use `read()` normally; `readResult()` when "never stored" and "stored
but corrupt" need different behaviour.

### Assets

Files in `public/assets/` are copied verbatim and are not rewritten by the
bundler, so they need the deployment base path applied by hand:

- **From CSS** — write a root-absolute `url(/assets/…)`. Vite rebases it at
  build time. Do not use relative paths.
- **From TypeScript** — use `assetUrl("photography/window.jpg")` from
  `src/lib/assets.ts`.

Interface art (an inline SVG emblem, say) belongs in `src/` and should be
imported directly so it gets hashed.

---

## Typefaces

Two faces, both self-hosted. **There are no third-party font requests at
runtime and there must never be one** — no `fonts.googleapis.com` link tag.

### Instrument Sans — the metadata register

SIL Open Font License 1.1. Committed to the repository, together with its
licence text at `public/assets/fonts/InstrumentSans-OFL.txt`. The OFL requires
that file to travel with the fonts; do not delete it. Variable (weight 400–700,
width 75–100%), split latin / latin-ext, upright only.

### PP Eiko — the display register

> **Trial licence. Free for personal use only. Read this before deploying.**

The files at `/Users/vero/Desktop/code/PP Eiko-Free For Personal Use v2.0/` are
a Pangram Pangram *Free For Personal Use* trial, held while the site owner
evaluates the face.

- The `.otf` files are **gitignored and never committed**
  (`public/assets/fonts/PPEiko*`).
- The site is **never deployed with Eiko bundled** until a licence is
  purchased. Because the files are gitignored, CI has no way to publish them —
  the protection is structural, not a matter of remembering.
- They are loaded as `.otf` directly. No conversion, no subsetting, no
  redistribution in any other form.
- A fallback stack (`Didot`, `Bodoni 72`, `Playfair Display`,
  `Iowan Old Style`, Georgia, serif) is declared so a fresh clone, CI and every
  production build render correctly rather than breaking. The deployed site
  currently shows that fallback. **That is expected, not a bug.**
- Swapping in a licensed woff2 later means editing the three `src:` lines in
  `src/styles/fonts.css`. Nothing outside that file changes.

---

## Deploying

`.github/workflows/deploy.yml` builds on every push to `main` and publishes to
GitHub Pages. **It has never been run.** Creating the repository and enabling
Pages is the site owner's decision.

To enable it, once:

1. Push the repository to GitHub with `main` as the default branch.
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**.

The build's base path is derived from the repository name inside the workflow
and read in exactly one place, `vite.config.ts`:

```
BASE_PATH="${GITHUB_REPOSITORY#*/}"   →   base: "/<repo>/"
```

It is never hardcoded, so renaming or forking the repository needs no code
change. Unset — which is the case for every local build — it is `/`, which is
also correct for a user page or a custom domain.

To reproduce a Pages build locally:

```bash
BASE_PATH=personal-space npm run build && npm run preview
```

---

## Accessibility

`prefers-reduced-motion` is handled in three places, because one is not enough:

1. **Ambient** — `base.css` switches off CSS `animation` globally, so anything
   added later is covered by default. An element may opt out with
   `data-motion="essential"`; that should be close to never used.
2. **Discrete** — the `--duration-response-*` and `--duration-transition-*`
   tokens resolve to `0ms` in `tokens.css`. State changes still complete,
   instantly. Reduced motion never removes content, and nothing waiting on
   `transitionend` hangs.
3. **JavaScript** — parallax and escaped lyrics subscribe to the preference at
   runtime. A media query cannot stop a `requestAnimationFrame` loop.

Keyboard focus is never removed; `:focus-visible` styling lives in `base.css`.
