import { Meta } from "../components/Meta";
import { Link } from "../router";
import { SPATIAL_APP_URL } from "./spatialApp";
import styles from "./Project.module.css";

/**
 * PROJECT 01 — SPATIAL. A case study page, not the tool.
 *
 * The tool is a separate application in a separate repository, and this page
 * deliberately does not embed it. Two reasons, and the second is the real one:
 * a dense canvas editor dropped into this page would fight everything the site
 * is — and the value of the project HERE is the reasoning, not the demo.
 *
 * ── THIS IS A SCAFFOLD, AND THE PROSE IS NOT WRITTEN ────────────────────────
 *
 * Everything below is factual: what the project is, which decisions were
 * locked, and what has actually been built. None of it is a narrative, and
 * none of it is in the site owner's voice, because inventing her account of
 * her own project would be worse than an obviously unfinished page.
 *
 * The structure is taken from §24 of the specification, which lists what the
 * case study should be able to show. Each section below is one of those, ready
 * to be written into.
 */

/** The decisions worth stating on a page whose subject is decisions. */
const DECISIONS: readonly { readonly claim: string; readonly because: string }[] = [
  {
    claim: "Position is presentation, not meaning.",
    because:
      "If x and y are the document, then mobile layout, screen readers and publishing all have to reverse-engineer intent from pixels. Geometry lives under a presentation; semantics live on the node.",
  },
  {
    claim: "Mobile is derived, never copied.",
    because:
      "A duplicated mobile canvas turns every desktop edit into a merge conflict. A generated base layout resolves against property-level author overrides, so manual work survives and automatic work regenerates.",
  },
  {
    claim: "Visual grouping and semantic grouping are different things.",
    because:
      "One overloaded group id means selecting two shapes to move them together silently declares a reading-order relationship. Grouping to move is an editor action; grouping to mean is an authored one.",
  },
  {
    claim: "A blocker must lead to its cause.",
    because:
      "Refusing to publish without saying which object is broken — when that object may be off-canvas, hidden or zero-sized — is a dead end. Every diagnostic carries a target and a route to it.",
  },
  {
    claim: "Rendering bends to accessibility, not the other way round.",
    because:
      "A 2D canvas draws pixels and exposes no structure to assistive technology. If an approach cannot produce a coherent keyboard-navigable document, the approach is reconsidered — so the renderer is real elements.",
  },
];

export function Spatial() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Meta tracking="wide" dataText="meta">
          Project 01
        </Meta>
        <h1 className={styles.title} data-route-heading data-text="display">
          Spatial
        </h1>
        <p className={styles.standfirst} data-text="body">
          An infinite canvas for composing freely, where what you arrange on a
          desktop becomes something accessible and responsive without any of it
          being thrown away in translation.
        </p>

        {/* THE LINK OUT, and it goes HERE rather than after the argument.
            A case study about something you can actually open should say so
            before it starts explaining itself. The first version of this page
            described a canvas and offered no way to reach it, and the second
            put the way in below a long list — both are the same dead end §10
            refuses to allow inside the tool itself. */}
        <p className={styles.open}>
          <a className={styles.openLink} href={SPATIAL_APP_URL} data-text="body">
            Open the canvas
            <span aria-hidden="true"> &#8599;</span>
          </a>
        </p>
      </header>

      <section className={styles.section} aria-labelledby="spatial-decisions">
        <Meta id="spatial-decisions" tracking="wide" dataText="meta">
          Decisions
        </Meta>
        <dl className={styles.decisions}>
          {DECISIONS.map((decision) => (
            <div className={styles.decision} key={decision.claim}>
              <dt className={styles.claim} data-text="body">
                {decision.claim}
              </dt>
              <dd className={styles.because} data-text="body">
                {decision.because}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="spatial-state">
        <Meta id="spatial-state" tracking="wide" dataText="meta">
          Where it is
        </Meta>
        <p className={styles.body} data-text="body">
          A canvas that renders, pans, zooms and moves things, built on the
          smallest document schema that exercise could justify — and a geometry
          core that runs and is tested without a browser at all. Persistence,
          history and the responsive planner are next.
        </p>
      </section>

      <p className={styles.back}>
        <Link to="home" className={styles.backLink}>
          <Meta dataText="meta">Back</Meta>
        </Link>
      </p>
    </main>
  );
}
