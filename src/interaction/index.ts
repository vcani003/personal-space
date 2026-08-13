/**
 * INTERACTION — the few things on this page that answer back.
 *
 * Mount once, AFTER the page content, as its sibling:
 *
 *   <Atmosphere />
 *   <Home />
 *   <InteractionLayer />
 *
 * No props. Nothing to configure, nothing to wire, no context. What it places
 * is authored in `placement.ts`; every word it can say is in `copy.ts` and is
 * PLACEHOLDER until the site owner replaces it.
 *
 * =============================================================================
 * WHAT IS HERE — the whole MVP 1 interaction budget, and it is a ceiling
 * =============================================================================
 *
 *   ONE draggable object    a torn scrap of paper in the empty left margin,
 *                           opposite the about prose. Pointer Events and
 *                           pointer capture, so mouse, finger and stylus are
 *                           one code path. Position remembered across visits.
 *
 *   ONE press-and-hold      750ms on that same paper. Light grows across the
 *                           sheet for the whole 750ms, then faint writing
 *                           surfaces. Releasing early aborts it cleanly.
 *
 *   TWO hidden discoveries  a ring on the background beneath the paper, which
 *                           was always there and is uncovered rather than
 *                           revealed; and one specific faint star that answers
 *                           a click with one sentence.
 *
 * Four objects react on this entire page. Everything else is still, which is
 * the only reason these register at all:
 *
 *     MOST elements    still or atmospheric
 *     SOME             subtle pointer response      ← the atmosphere's parallax
 *     FEW              directly interactive         ← the paper
 *     VERY FEW         surprising                   ← the mark, the star
 *
 * =============================================================================
 * WHAT IS DELIBERATELY NOT HERE
 * =============================================================================
 *
 * No second draggable, no counters, no achievements, no "you found it", no
 * progress indicator, no tutorial, no hint after a delay, no collectible set,
 * no particle anything, no custom cursor, no spring physics, no gesture
 * library, no new dependency of any kind. Escaped lyrics are not built: they
 * are timed against lyrics, and real synchronised lyrics arrive in a later
 * MVP — building them now would mean building the timing twice.
 *
 * =============================================================================
 * THE ONE RULE THIS LAYER LIVES UNDER
 * =============================================================================
 *
 * The page has exactly one `requestAnimationFrame` loop and it belongs to the
 * atmosphere. Nothing here starts another. Dragging borrows the shared loop
 * through `holdPointerFrames()` and `subscribePointerFrame()` and releases both
 * the instant the object stops moving; parallax on these objects is read
 * straight from `--pointer-x` / `--pointer-y` in CSS, which costs nothing at
 * all. See the header of `atmosphere/index.ts` for the division of labour:
 * atmosphere owns the continuous signal, interaction owns discrete gestures.
 *
 * Reduced motion removes MOVEMENT ONLY, live, via `useReducedMotion` rather
 * than a one-shot read. Under it the paper still drags, the hold still fires at
 * the same threshold, the writing still appears and the star still speaks —
 * everything simply arrives instead of travelling. Nothing becomes unreachable
 * and no content is withheld.
 *
 * Keyboard reaches all of it: the paper takes focus and is moved with the arrow
 * keys, held with Space, toggled with Enter; the star's hit area is a plain
 * button with an accessible name and a live region for what it says.
 */

export { InteractionLayer } from "./InteractionLayer";
export { paperAnchor, starSecrets, PAPER_OBJECT_ID } from "./placement";
export type { Anchor, StarSecretData } from "./placement";
