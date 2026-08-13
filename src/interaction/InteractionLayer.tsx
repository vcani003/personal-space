import { useRef } from "react";
import { useMeasuredAnchor, usePageExtent } from "./hooks";
import { PaperFragment } from "./PaperFragment";
import { narrowGap, paperAnchor, starSecrets } from "./placement";
import { RippleField } from "./Ripple";
import { StarSecret } from "./StarSecret";
import type { StyleVars } from "./vars";
import styles from "./InteractionLayer.module.css";

/**
 * THE INTERACTION LAYER — layer 5, in FRONT of the page.
 *
 * Mount it once, after the content:
 *
 *   <Atmosphere />
 *   <Home />
 *   <InteractionLayer />
 *
 * It takes no props. Everything it places is authored in `placement.ts` and
 * everything it can say is in `copy.ts`.
 *
 * ── Why a second root ───────────────────────────────────────────────────────
 *
 * The atmosphere sits at `--layer-behind` because the page's content is
 * in-flow markup that would otherwise paint over it. This layer has the
 * opposite problem and therefore the opposite answer: a foreground object is in
 * front of the page by definition, so it sits at `--layer-5-foreground`. That
 * second root was anticipated in the depth model — see the note at the top of
 * `Atmosphere.module.css`.
 *
 * The cost of being in front is that this layer could swallow the page's
 * clicks, so it does not: the root is `pointer-events: none` and only two
 * things inside it opt back in — the paper, and one 44px hit area over one
 * star. Everything else in here is inert. Reading, selecting and clicking the
 * page work exactly as they did before this file existed.
 *
 * ── What is in here, and what the budget was ───────────────────────────────
 *
 *   ONE draggable object          the paper
 *   ONE press-and-hold            on that same paper
 *   TWO hidden discoveries        the mark beneath the paper; one star
 *   THE SURFACE                   the page is displaced where it is touched
 *
 * The first three are the entire MVP interaction budget, and it is a ceiling
 * rather than a target. Nothing else on this page is interactive, and the reason
 * the paper feels like an object rather than a widget is precisely that it has
 * no company. A second draggable would not double the delight; it would halve
 * it.
 *
 * The surface is not a fourth object and does not spend from that budget: it is
 * attached to the empty space BETWEEN the objects, it can never be aimed at, and
 * it does nothing. It is the one place on the page where the answer to a click
 * is not "something happened" but "you are touching something". See Ripple.tsx.
 */

export function InteractionLayer() {
  const rootRef = useRef<HTMLDivElement>(null);

  usePageExtent(rootRef);

  /* The narrow composition's vertical anchor is measured from the page rather
     than authored, because the gap it names is a fixed margin whose PERCENTAGE
     of the document is different on every phone. Published as a second property
     the stylesheet prefers; the authored value below stays the fallback. */
  useMeasuredAnchor(rootRef, narrowGap);

  /* The paper's two anchors and the mark's are the same four numbers by
     construction: they are published here, once, and both elements inherit
     them. A mark that could drift out from under the paper on some viewport is
     not a secret, it is a bug with a story. */
  const style: StyleVars = {
    "--anchor-wide-x": paperAnchor.wide.x,
    "--anchor-wide-y": paperAnchor.wide.y,
    "--anchor-narrow-x": paperAnchor.narrow.x,
    "--anchor-narrow-y": paperAnchor.narrow.y,
  };

  return (
    <div ref={rootRef} className={styles.root} style={style}>
      {/* THE SURFACE, and FIRST among these children on purpose: same stacking
          context, earlier in paint order, so a crest passes in front of the
          page's text but underneath the paper and the player. Objects float on
          the surface; they are not part of it.

          It lives inside this root rather than in a fixed one of its own
          because the wave it draws displaces the page's WORDS, which are
          anchored to the document — see the header of Ripple.tsx. This root is
          already document-tall, already clipped and already inert, so the two
          halves of one event now share one frame of reference for free.

          It renders nothing at all when no ripple is on screen. */}
      <RippleField />

      {/* DISCOVERY ONE. Rendered BEFORE the paper so the paper covers it,
          and given no transition, no animation and no reveal of any kind —
          it is not shown, it is uncovered. See the stylesheet. */}
      <span className={styles.mark} aria-hidden="true" />

      <PaperFragment />

      {starSecrets.map((secret) => (
        <StarSecret key={secret.id} secret={secret} />
      ))}
    </div>
  );
}
