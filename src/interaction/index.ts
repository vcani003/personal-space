/**
 * INTERACTION — stub. Owned by the interaction agent.
 *
 * What lands here: draggable objects, press-and-hold, hidden discoveries, and
 * escaped lyrics.
 *
 * Foundation already in place:
 *   - Timing:      `--duration-response*` (120–300ms, visitor-triggered) and
 *                  `--duration-transition*` (250–600ms, state change). Both
 *                  resolve to `0ms` under reduced motion so the state change
 *                  still completes instantly. Nothing is removed.
 *   - Persistence: `src/lib/storage.ts`. Namespaced, versioned, never throws.
 *                  A discovery that cannot be remembered must still be
 *                  discoverable.
 *   - Numbers:     `clamp` / `lerp` / `mapRange` in `src/lib/math.ts`.
 *
 * Use Pointer Events directly. Do not route per-frame pointer data through
 * React state, and do not add a gesture or animation library — the platform
 * covers drag, hold and inertia here.
 *
 * Escaped lyrics attach at `useEffect(..., [activeIndex])` in the component
 * that owns the player. Do not tap the rAF loop and do not fork
 * `useLyricSync`. Four guards are required: negative index, empty (instrumental)
 * line, index moving backwards or to 0 on a loop wrap, and reduced motion.
 * Cap concurrency at 2–3, and seed the emission rule off the line index rather
 * than `Math.random()` so it is repeatable.
 *
 * Scarcity is the design: most elements are still, few are interactive, very
 * few are surprising. No novelty cursor, no counters, no tutorials for
 * secrets. The reward for a discovery is the discovery.
 */

export {};
