import { Atmosphere } from "./atmosphere";
import { Home } from "./Home";

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
    </>
  );
}
