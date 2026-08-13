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
 *   TWO draggable objects   a torn scrap of paper in the empty left margin,
 *                           opposite the about prose; and the docked player,
 *                           which can be moved out of the way and settles into
 *                           the nearest corner of the screen when it is let go.
 *                           Pointer Events and pointer capture, so mouse,
 *                           finger and stylus are one code path. Both remember
 *                           where they were left.
 *
 *                           That is the brief's ceiling — "1–2 draggable
 *                           objects" — and it is now spent. They are not the
 *                           same kind of thing, which is the only reason two of
 *                           them do not read as a page full of draggables: the
 *                           paper is whimsy, something to find; the player is
 *                           furniture, something to move when it is in your
 *                           way. Adding a third because dragging works is
 *                           exactly the failure the ceiling exists to prevent.
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

/**
 * THE OTHER MOVABLE OBJECT — and the last one.
 *
 * The docked player is not rendered by this layer: it is mounted separately, in
 * front of everything, because it travels with the viewport rather than living
 * in the page. But picking it up is an interaction, so the gesture lives here
 * with the rest of them, on the same drag engine and the same borrowed frames.
 *
 * `<PlayerDock />` wires these to its element. Nothing else should.
 */
export { useDockDrag } from "./useDockDrag";
export type { DockDrag } from "./useDockDrag";
export { DEFAULT_DOCK_CORNER } from "./dockCorner";
export type { DockCorner } from "./dockCorner";
export { dockDescription, dockLabel } from "./copy";
