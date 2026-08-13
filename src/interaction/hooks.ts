import { useEffect, useState } from "react";
import type { RefObject } from "react";

/**
 * INTERACTION LIFECYCLE HOOKS
 *
 * Two small ones. Neither writes state on a gesture, and both clean up after
 * themselves — a foreground layer that leaks a listener leaks it for the whole
 * session, because unlike a modal it is never unmounted.
 */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

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
  const [reduced, setReduced] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia(REDUCED_MOTION_QUERY).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = (): void => {
      setReduced(query.matches);
    };

    /* Re-read on mount: the preference can change between the initial render
       and this effect, and in StrictMode it certainly can. */
    sync();
    query.addEventListener("change", sync);

    return () => {
      query.removeEventListener("change", sync);
    };
  }, []);

  return reduced;
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
