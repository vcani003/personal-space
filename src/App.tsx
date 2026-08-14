import { Atmosphere } from "./atmosphere";
import { wallItems } from "./content/wall";
import { Home } from "./Home";
import { InteractionLayer } from "./interaction";
import { PlayerDock } from "./player";
import { wallHostsEmbed } from "./wall";

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
  /**
   * THE PLAYER CANNOT BE IN TWO PLACES AT ONCE.
   *
   * `PlayerDock` pins one copy to the viewport; a `bunny-hop` embed hangs
   * another on the wall. Rendering both would put two players on the page, with
   * two sets of transport controls and two tab stops for the same object.
   *
   * So the authored content decides, and there is no flag to keep in sync: if
   * the wall hosts the player, the dock does not mount. With no embed on the
   * wall — which is the state today — this is exactly the MVP 1 behaviour.
   *
   * Placing the embed is a real editorial decision rather than just another
   * artifact. It puts the player back into the world it belongs to, and gives
   * up its being reachable while attention is elsewhere. The trade is written
   * up in `PlayerDock.tsx`.
   */
  const playerIsOnTheWall = wallHostsEmbed(wallItems, "bunny-hop");

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
      {!playerIsOnTheWall && <PlayerDock />}
    </>
  );
}
