import type { DockCorner } from "./dockCorner";

/* =============================================================================
   PLACEHOLDER COPY — EVERY WORD AN INTERACTION CAN SAY
   =============================================================================

   ⚠ PLACEHOLDER. NOT AUTHORED BY THE SITE OWNER. ⚠

   Written by an agent as scaffolding, in the register the site uses: lowercase,
   quiet, unhurried, first person, no exclamation. Replace all of it.

   Everything a visitor can read as the RESULT of an interaction lives in this
   one file so it can be found and rewritten without touching behaviour. If a
   future interaction says something, its words come here too.

   Most of these strings are read by assistive technology only. They are the one
   place these features are allowed to explain themselves: the visual design
   carries no instructions, but a keyboard or screen-reader visitor cannot infer
   a gesture from a rotation and a torn edge, or from a cursor changing shape.
   Keep them short and in the same voice.
   ========================================================================== */

/** Revealed on the paper by pressing and holding it. PLACEHOLDER. */
export const paperWriting = "i keep meaning to write this down properly.";

/** Revealed beside one faint star when it is clicked. PLACEHOLDER. */
export const starSentence = "you found the quiet one.";

/* -----------------------------------------------------------------------------
   ACCESSIBLE NAMES AND DESCRIPTIONS — never rendered visually
   -------------------------------------------------------------------------- */

/** The paper's accessible name. PLACEHOLDER. */
export const paperLabel = "a scrap of paper";

/** How the paper is operated without a pointer. PLACEHOLDER. */
export const paperDescription =
  "hold to read what is written on it. arrow keys move it.";

/** The hidden star's accessible name. Deliberately not "reveal a message" —
 *  the surprise is the reward, for everyone. PLACEHOLDER. */
export const starLabel = "a faint star";

/* -----------------------------------------------------------------------------
   THE DOCKED PLAYER — also never rendered visually
   -----------------------------------------------------------------------------
   The player can be picked up and dropped into any corner of the screen. With a
   pointer the only hint is the cursor, which is where the affordance belongs;
   these three strings are the same hint by the only other route there is.
   -------------------------------------------------------------------------- */

/** The accessible name of the movable dock — not of the player inside it,
 *  which names itself. PLACEHOLDER. */
export const dockLabel = "the player";

/** How the player is moved without a pointer. PLACEHOLDER. */
export const dockDescription =
  "arrow keys move it to another corner of the screen.";

/** Announced after a keyboard move, and only then. PLACEHOLDER. */
export const dockCornerSpoken: Record<DockCorner, string> = {
  "top-start": "the player is in the top left corner.",
  "top-end": "the player is in the top right corner.",
  "bottom-start": "the player is in the bottom left corner.",
  "bottom-end": "the player is in the bottom right corner.",
};
