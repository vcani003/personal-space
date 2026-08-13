import { useEffect, useState } from "react";
import type { RefObject } from "react";

/**
 * INTERACTION LIFECYCLE HOOKS
 *
 * Three small ones. None writes state on a gesture, and all clean up after
 * themselves — a foreground layer that leaks a listener leaks it for the whole
 * session, because unlike a modal it is never unmounted.
 */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * A media query as a boolean, LIVE.
 *
 * Subscribed rather than sampled, for the reason spelled out under
 * `useReducedMotion` below: a page that is open while the window is resized, a
 * phone that is rotated, or a preference changed in the OS must all take effect
 * without a reload.
 *
 * Re-renders only when the ANSWER changes, which for a breakpoint means twice
 * during a drag across it rather than once a frame. Nothing continuous should
 * ever be routed through this.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = (): void => {
      setMatches(media.matches);
    };

    /* Re-read on mount: the answer can change between the initial render and
       this effect, and in StrictMode it certainly can. */
    sync();
    media.addEventListener("change", sync);

    return () => {
      media.removeEventListener("change", sync);
    };
  }, [query]);

  return matches;
}

/**
 * The visitor's motion preference, LIVE.
 *
 * A one-shot read at mount is the usual mistake: someone who turns the setting
 * on while the page is open keeps the animation until they reload, which is
 * exactly when they least want to reload. The preference is a subscription.
 *
 * Reduced motion here removes MOVEMENT ONLY. Under it the paper still drags,
 * still holds, still reveals its writing, and the star still gives up its
 * sentence — everything simply arrives instead of travelling. Nothing becomes
 * unreachable and no content disappears.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION_QUERY);
}

/**
 * The custom property the measured narrow anchor is published on.
 *
 * Deliberately NOT `--anchor-narrow-y`, which React owns as an inline style on
 * the same element. Two writers on one property is a bug waiting for a re-render;
 * this is a second name that the stylesheet falls back FROM, so the authored
 * value stays exactly where it was authored and this one simply takes precedence
 * when it exists.
 */
const MEASURED_ANCHOR_PROPERTY = "--anchor-narrow-measured";

/**
 * Publishes the centre of one of the page's own vertical gaps, in document px.
 *
 * WHY THIS EXISTS. The narrow anchor cannot be a percentage of the document:
 * the gap it names is a fixed 220px margin, but the document's height changes
 * with the viewport width and with which font loaded, so the same gap sits
 * anywhere between 22% and 32% depending on the phone. A single number covers
 * two of those and puts the object on the prose at the rest. The measurement in
 * `placement.ts` is the whole argument.
 *
 * WHAT IT DOES. Finds `selector`, takes the element before it, and publishes the
 * midpoint between the bottom of the first and the top of the second — which is
 * where an object centred on the anchor ends up with equal darkness on both
 * sides of it, at every width, in every font.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. It does not check the breakpoint. The
 * property it writes is only READ inside the narrow media query, so the
 * stylesheet decides whether the measurement is used and JavaScript never has to
 * hold an opinion about which composition is on screen. It also never writes
 * anything but a custom property, so it cannot move the page it is measuring.
 *
 * It is allowed to find nothing. A page where the selector does not resolve, or
 * where the gap is too small to leave something in, simply keeps the authored
 * fallback — the property is removed rather than set to something wrong.
 */
export function useMeasuredAnchor(
  ref: RefObject<HTMLElement | null>,
  gap: { readonly selector: string; readonly minimum: number },
): void {
  const { selector, minimum } = gap;

  useEffect(() => {
    const node = ref.current;
    if (node === null) return;

    let published = -1;

    const measure = (): void => {
      const end = document.querySelector(selector);
      const start = end?.previousElementSibling;

      /* No such element, or nothing before it: not an error, just a page this
         measurement does not apply to. */
      if (end == null || start == null) {
        if (published !== -1) {
          published = -1;
          node.style.removeProperty(MEASURED_ANCHOR_PROPERTY);
        }
        return;
      }

      const top = start.getBoundingClientRect().bottom + window.scrollY;
      const bottom = end.getBoundingClientRect().top + window.scrollY;

      if (bottom - top < minimum) {
        if (published !== -1) {
          published = -1;
          node.style.removeProperty(MEASURED_ANCHOR_PROPERTY);
        }
        return;
      }

      /* Rounded, so a sub-pixel reflow cannot produce a write per frame. */
      const centre = Math.round((top + bottom) / 2);
      if (centre === published) return;
      published = centre;
      node.style.setProperty(MEASURED_ANCHOR_PROPERTY, `${centre}px`);
    };

    measure();
    window.addEventListener("resize", measure, { passive: true });

    /* The page reflows when the fonts land, long after this effect runs, and the
       first measurement would otherwise be the one taken against fallback
       metrics and kept for the session. */
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(document.body);
    }

    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [ref, selector, minimum]);
}

/** The custom property this layer's height is published on. */
const PAGE_EXTENT_PROPERTY = "--interaction-page-block-size";

/**
 * Publishes the document's height onto the interaction root.
 *
 * The same problem, and the same solution, as `usePageExtent` in the
 * atmosphere: this layer is absolutely positioned against the initial
 * containing block, so `height: 100%` would be one VIEWPORT rather than one
 * page, and its children are all absolutely positioned, so its intrinsic height
 * is zero. Without a real height, a `y` of 13.5% means 13.5% of the wrong box
 * and the paper and the stars stop agreeing about where anything is.
 *
 * `document.body` is measured rather than `documentElement.scrollHeight`
 * because an out-of-flow layer that measures the document it is inside can
 * only ever grow. The body's content box does not include it.
 *
 * DUPLICATED, KNOWINGLY. The atmosphere has the same hook publishing a
 * differently-named property on its own root. Importing theirs would mean
 * reaching past their public seam for a private helper and then having it
 * publish a property named for a layer this is not. Two ResizeObservers on the
 * body is the smaller cost; lifting one copy into `src/lib` is the design
 * lead's call, not this agent's.
 */
export function usePageExtent(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const node = ref.current;
    if (node === null) return;

    const body = document.body;
    let published = -1;

    const publish = (height: number): void => {
      const next = Math.round(height);
      if (next === published || next <= 0) return;
      published = next;
      node.style.setProperty(PAGE_EXTENT_PROPERTY, `${next}px`);
    };

    publish(body.getBoundingClientRect().height);

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry === undefined) return;
      publish(entry.contentRect.height);
    });

    observer.observe(body);

    return () => {
      observer.disconnect();
    };
  }, [ref]);
}
