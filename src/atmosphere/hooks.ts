import { useEffect } from "react";
import type { RefObject } from "react";
import { mountPointerField } from "./pointer";
import { assertDepthBands } from "./variance";

/**
 * ATMOSPHERE LIFECYCLE HOOKS
 *
 * Observers and one rAF loop, all of which exist to avoid doing work rather
 * than to do it. None of them writes React state: leaks and rerenders are the
 * two failure modes of an always-on background layer, and both are invisible
 * until the page has been open for ten minutes.
 */

/** The custom property the atmosphere root's height is published on. */
const PAGE_EXTENT_PROPERTY = "--atmosphere-page-block-size";

/**
 * Publishes the document's height onto the atmosphere root.
 *
 * The atmosphere spans the DOCUMENT (see composition.ts), which means it needs
 * a real height in order for percentage positions to mean anything. It cannot
 * get one from CSS: the root is absolutely positioned, so its containing block
 * is the initial containing block — `height: 100%` there is one VIEWPORT, not
 * one page — and its own children are all absolutely positioned, so its
 * intrinsic height is zero.
 *
 * `document.body` is measured rather than `documentElement.scrollHeight`
 * because the atmosphere root is itself part of the document's scrollable
 * overflow. Feeding that measurement back into its own height means the value
 * can grow but can never shrink, and the page slowly acquires dead scroll
 * space every time the viewport gets shorter. `body` is measured on its
 * content box, and the root — being out of flow — does not contribute to it.
 *
 * This is the only DOM measurement in the atmosphere, it happens on resize,
 * and the result is cached in a custom property. Nothing measures during a
 * frame.
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

/**
 * Pauses ambient animation that is scrolled off screen.
 *
 * On a 4200px page, most of the atmosphere is outside the viewport most of the
 * time. Every element marked `data-ambient` gets `data-onscreen="false"` while
 * it is out of view, and the stylesheet pauses its animation. The observer
 * writes an attribute directly on the element — no state, no rerender, no
 * reconciliation for something the reader cannot see.
 *
 * `count` re-runs the effect if the composition itself changes; the observed
 * elements are found by query rather than by ref list because the renderers
 * own their own markup.
 */
export function useAmbientVisibility(
  ref: RefObject<HTMLElement | null>,
  count: number,
): void {
  useEffect(() => {
    const node = ref.current;
    if (node === null || typeof IntersectionObserver === "undefined") return;

    const targets = node.querySelectorAll<HTMLElement>("[data-ambient]");
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!(entry.target instanceof HTMLElement)) continue;
          entry.target.dataset.onscreen = entry.isIntersecting ? "true" : "false";
        }
      },
      /* Generous margin: haze must already be drifting by the time it is
         scrolled into view, never start moving as it arrives. */
      { rootMargin: "40% 0px" },
    );

    for (const target of targets) observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [ref, count]);
}

/**
 * Development-only: check the depth bands still read as distances.
 *
 * Each object's parallax travel is its depth's token times a per-object
 * multiplier (see variance.ts), and the width of that multiplier is calibrated
 * against the four `--parallax-*` tokens as they currently stand. Those tokens
 * belong to the design lead. If one moves far enough, a `far` object could
 * start travelling further than a `mid` one, the depths would stop reading as
 * depths, and nothing on screen would say so — the field would simply look
 * slightly wrong. Four computed values, read once after mount, make that loud.
 *
 * Compiled out of production. Not in a frame, not on resize: the tokens are
 * static, so once is enough.
 */
export function useDepthBandGuard(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const node = ref.current;
    if (node === null) return;
    assertDepthBands(node);
  }, [ref]);
}

/**
 * Starts the page's single pointer loop and hands it the one reactive object.
 *
 * The reactive object is found by query rather than by ref, for the same
 * reason the ambient observer is: the renderers own their own markup, and the
 * composition — not this hook — decides which object it is. A star opts in
 * with `behavior.pointerReactive` in `composition.ts`.
 *
 * EXACTLY ONE. If the composition declares more, the first in document order
 * is wired and the rest are ignored, loudly in development. That is not a
 * limitation to be worked around later — the shared brief's interaction
 * hierarchy is a scarcity rule, and the difference between "wait, did that
 * move?" and "this website has a mouse effect" is entirely a question of how
 * many things answer the pointer.
 */
export function usePointerField(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const node = ref.current;
    const reactive =
      node?.querySelectorAll<HTMLElement>("[data-reactive]") ?? null;

    if (import.meta.env.DEV && reactive !== null && reactive.length > 1) {
      console.warn(
        `[atmosphere] ${reactive.length} objects declare pointerReactive. Exactly one may. Wiring the first and ignoring the rest.`,
      );
    }

    return mountPointerField({ reactive: reactive?.[0] ?? null });
  }, [ref]);
}
