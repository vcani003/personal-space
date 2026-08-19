import { Atmosphere } from "./atmosphere";
import { Home } from "./Home";
import { InteractionLayer } from "./interaction";
import { NotFound } from "./projects/NotFound";
import { BunnyHop } from "./projects/BunnyHop";
import { Spatial } from "./projects/Spatial";
import { useRoute, useRouteChangeEffect } from "./router";

/**
 * Mount point. The composition lives in Home.tsx; atmosphere will eventually
 * wrap it rather than being threaded through it — see the architecture note in
 * the shared brief:
 *
 *   <Page>
 *     <Atmosphere>  … background, stars, haze, objects, escaped lyrics
 *     <HomepageContent>
 *
 * Keeping this file empty of layout is what makes that wrapping possible
 * without a rewrite.
 *
 * ── THE DOCK IS GONE FROM HERE ──────────────────────────────────────────────
 *
 * `<PlayerDock />` used to be the fourth thing on this page, pinned to a corner
 * of the viewport. It is superseded by the RAIL: the player is now mounted in
 * `Home.tsx`, inside a `position: sticky` column beside the wall, which keeps it
 * reachable while the page scrolls without it being an object that travels with
 * the window.
 *
 * `src/player/PlayerDock.tsx`, `interaction/useDockDrag.ts` and
 * `interaction/dockCorner.ts` are UNTOUCHED and still exported. A dockable
 * player is a later nice-to-have, and nothing about it was deleted.
 *
 * The "there can only be one player" guard moved with the player rather than
 * being dropped — `Home.tsx` asks `wallHostsEmbed()` before mounting it, so a
 * `bunny-hop` embed authored onto the wall still takes precedence and there is
 * still no way to get two.
 */
export function App() {
  const route = useRoute();

  /* Scroll to top and move focus to the new page's heading. The browser does
     both for free on a real navigation and neither when the DOM is swapped
     underneath you — see `useRouteChangeEffect`. */
  useRouteChangeEffect(route);

  return (
    <>
      {/* The world, and then the page inside it. Atmosphere sits at negative
          z-index and is entirely pointer-transparent, so it never competes
          with content for clicks or for the document's flow. */}
      <Atmosphere />

      {/* THE ATMOSPHERE IS OUTSIDE THE SWITCH, and that is the composition
          decision rather than a convenience. The stars, haze and grain are the
          WORLD; the routes are rooms inside it. Mounting them per-route would
          rebuild the star field on every navigation — a visible flicker, and a
          new random seed for something whose whole premise is that it is a
          fixed place you are moving around in. */}
      {route === "home" && <Home />}
      {route === "spatial" && <Spatial />}
      {route === "bunnyHop" && <BunnyHop />}
      {route === "not-found" && <NotFound />}
      {/* In FRONT of the content, unlike the atmosphere. These are the only
          objects on the page a visitor can actually pick up, so they are the
          one layer that captures pointer events — layer 5 of the depth model,
          which the atmosphere root deliberately left for it. */}
      <InteractionLayer />
    </>
  );
}
