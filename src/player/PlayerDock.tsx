import { useRef } from "react";
import { dockDescription, dockLabel, useDockDrag } from "../interaction";
import { Player } from "./Player";
import styles from "./PlayerDock.module.css";

/** Referenced by `aria-describedby`; declared once so the two cannot drift. */
const DESCRIPTION_ID = "player-dock-operation";

/**
 * =============================================================================
 * RETIRED, NOT DELETED. THIS COMPONENT IS NOT MOUNTED.
 * =============================================================================
 *
 * WHAT REPLACED IT: the RAIL. `Home.tsx` now mounts `<Player />` inside a
 * `position: sticky` column beside the wall (see `.rail` in `Home.module.css`).
 *
 * WHY: the requirement this file was built to satisfy — "a music player you
 * have to go and find is not a music player you use" — is satisfied by sticky
 * too. The player stays beside you while the wall scrolls. What sticky does NOT
 * do is the part the site owner replaced: it does not travel with the viewport,
 * it cannot cover the wall's content, and it stops at the end of the
 * composition instead of following you to the bottom of the page. In exchange
 * the player is COMPOSED against the page again, which is exactly the loss the
 * long note below says docking cost.
 *
 * WHAT IS KEPT, and is still complete and still compiles:
 *
 *   src/player/PlayerDock.tsx      this file
 *   src/player/PlayerDock.module.css   the four corners, the margins, the
 *                                      breakpoints
 *   src/interaction/useDockDrag.ts     the gesture, the settle, the keyboard
 *   src/interaction/dockCorner.ts      the corner model and its persistence
 *   personal-space:v1:playerDock       the stored corner. NOT cleared.
 *
 * A dockable player is a later nice-to-have the site owner named explicitly, so
 * bringing it back is `<PlayerDock />` in `App.tsx` plus removing the rail's
 * `.railPlayer` block from `Home.tsx` — the two must never both mount, because
 * that is two players.
 *
 * ONE THING CHANGED UNDER THIS FILE WHILE IT WAS RETIRED. `<Player />` is no
 * longer a single element: it renders the object AND, once playback has been
 * requested, a 16:9 video beneath it. Docked, that would attach a 181px-tall
 * moving image to a floating corner object — which is not what a dock is for.
 * Whoever revives this has a decision to make first, and it is a real one:
 * either the dock renders the player without its video, or the dock is not the
 * right home for a player that now has a picture.
 *
 * Everything below this line is the original note and is still accurate about
 * how the dock behaves when it is mounted.
 * =============================================================================
 *
 * THE DOCK — the player, always on screen, and movable.
 *
 * The player used to sit in the page's flow, in a `02 / Currently` section,
 * surrounded by deliberate emptiness. It was moved here because a music player
 * you have to go and find is not a music player you use: it needs to be
 * reachable while you are reading something else, which is the whole premise
 * of the object ("designed to recede while attention is elsewhere and reward
 * a glance").
 *
 * WHAT THIS COSTS, stated plainly so it is not rediscovered later:
 *
 *   - The player stops being an object situated IN the world and becomes an
 *     object travelling WITH the viewer. That is a real loss — its old
 *     placement, with a drawing opposite it and silence around it, was
 *     composed. Nothing fixed to a viewport can be composed against a page.
 *   - It will occasionally overlap content. That is inherent to anything
 *     pinned to the viewport, and is mitigated here rather than solved: it is
 *     small, it sits in a corner with real margin, and its default corner was
 *     chosen by measuring what each side hides.
 *
 * The compensation is that it keeps its material identity completely. It is
 * still the three-band object — metadata, inset screen, deck — with its own
 * radius, its own edge and its own glow. It is NOT a bar stuck to the bottom
 * of the window: it floats clear of both edges, so it reads as a small object
 * resting in the corner of the screen rather than as browser chrome.
 *
 * =============================================================================
 * AND IT CAN BE PICKED UP
 * =============================================================================
 *
 * Because "it will occasionally overlap content" is only acceptable if the
 * visitor can do something about it. The dock is draggable and settles into
 * whichever corner it was let go nearest to; the corner is remembered. The
 * behaviour lives in `interaction/useDockDrag.ts`, on the same drag engine and
 * the same borrowed animation frames as the paper fragment — this file only
 * wires it to an element.
 *
 * There is no drag handle, no grab dot, no "move me" hint and no instructional
 * text. The cursor is the entire visual affordance, which is the platform's own
 * vocabulary for a physical thing rather than an invented one. The keyboard
 * gets the only explicit explanation on the page, and it is invisible.
 *
 * TAB ORDER, checked rather than assumed: the dock takes one stop, before the
 * transport buttons it contains. Arrow keys are answered only when the dock
 * itself has focus, so nothing here can intercept a key meant for a control
 * inside it, and there is no focus trap — Tab moves straight on through.
 */
export function PlayerDock() {
  const ref = useRef<HTMLDivElement>(null);
  const dock = useDockDrag(ref);

  return (
    <div
      ref={ref}
      className={styles.dock}
      /* The player is an object floating ON the surface, not part of it, so
         touching it does not ripple. Declared here rather than inferred from
         markup: the ripple layer's fallback is a guess at this component's
         internals, and this attribute is what makes that guess deletable. */
      data-no-ripple=""
      /* Both are absent, not false, when this viewport does not offer the
         gesture: the corner rules and `touch-action: none` must not exist at a
         width where the dock spans the screen and the page needs to scroll
         under a thumb. See DRAGGABLE_VIEWPORT in useDockDrag.ts. */
      data-corner={dock.enabled ? dock.corner : undefined}
      data-draggable={dock.enabled ? "true" : undefined}
      tabIndex={dock.enabled ? 0 : undefined}
      role={dock.enabled ? "group" : undefined}
      aria-label={dock.enabled ? dockLabel : undefined}
      aria-describedby={dock.enabled ? DESCRIPTION_ID : undefined}
      onPointerDown={dock.onPointerDown}
      onPointerMove={dock.onPointerMove}
      onPointerUp={dock.onPointerUp}
      onPointerCancel={dock.onPointerCancel}
      onClickCapture={dock.onClickCapture}
      onKeyDown={dock.onKeyDown}
    >
      <Player />

      {/* The one place this interaction explains itself, and it is invisible.
          A gesture cannot be inferred from a cursor by someone not using one. */}
      {dock.enabled && (
        <p id={DESCRIPTION_ID} className="visually-hidden">
          {dockDescription}
        </p>
      )}

      {/* Where it went, for a visitor who cannot see it go. Written only by a
          keyboard move — announcing a drag to the person performing it would
          narrate their own hand. */}
      <p className="visually-hidden" aria-live="polite">
        {dock.announcement}
      </p>
    </div>
  );
}
