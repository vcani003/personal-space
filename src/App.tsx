import { Atmosphere } from "./atmosphere";
import { Home } from "./Home";
import { InteractionLayer } from "./interaction";
import { PlayerDock } from "./player";

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
 */
export function App() {
  return (
    <>
      {/* The world, and then the page inside it. Atmosphere sits at negative
          z-index and is entirely pointer-transparent, so it never competes
          with content for clicks or for the document's flow. */}
      <Atmosphere />
      <Home />
      {/* In FRONT of the content, unlike the atmosphere. These are the only
          objects on the page a visitor can actually pick up, so they are the
          one layer that captures pointer events — layer 5 of the depth model,
          which the atmosphere root deliberately left for it. */}
      <InteractionLayer />
      {/* Pinned to the viewport rather than placed in the page, so it is
          reachable while attention is somewhere else — which is the whole
          premise of this particular object. */}
      <PlayerDock />
    </>
  );
}
