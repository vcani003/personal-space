/**
 * ENVIRONMENT MODEL
 *
 * Environmental art on this site is DATA, not markup. Nothing in the
 * atmosphere is hardcoded into a page component: the composition lives in
 * `composition.ts` as a list of objects, and the renderers turn that list into
 * positioned elements. Retuning the sky is editing a table.
 *
 * The shape is deliberately small. It carries only what the environment needs
 * to be *composed with* — identity, depth, position, presence, and the
 * behaviour hooks later phases attach to. It does not carry styling knobs for
 * their own sake.
 */

/**
 * Where an object sits in the six-layer depth model (shared brief).
 *
 * Depth is not only a paint order — it selects the object's parallax travel
 * (`--parallax-far` … `--parallax-foreground` in tokens.css) and, in practice,
 * how bright and how sharp the object is allowed to be. Far things are dim and
 * small. Near things are soft, because a near thing out of the focal plane is
 * how a photograph tells you it is near.
 *
 * `foreground` is defined but unused in Phase 3 — layer 5 is reserved for a
 * single occasional object, and there is no art for it yet.
 */
export type Depth = "far" | "mid" | "near" | "foreground";

/**
 * Which composition an object belongs to.
 *
 * Mobile gets its OWN composition rather than a scaled-down desktop: the
 * narrow page is a single column, so the desktop's left/right empty margins
 * — where most of the stars live — simply do not exist. Objects are authored
 * for one or the other, and CSS hides the set that does not apply. No
 * `matchMedia` listener, no resize handler, no layout thrash.
 */
export type Presence = "wide" | "narrow" | "both";

/** Tonal choices available to an environmental object. Tokens only. */
export type ToneName = "mist" | "silver" | "lavender";

/**
 * Anything placed in the environment.
 *
 * `position` is expressed in percentages of the DOCUMENT, not the viewport —
 * `y` values run 0–100% of the whole ~4200px page. See the note at the top of
 * `composition.ts` for why the environment is anchored to the document.
 */
export interface EnvironmentObject {
  id: string;
  depth: Depth;
  position: { x: string; y: string };
  /** Defaults to `"both"`. */
  presence?: Presence;
  /**
   * Behaviour is DECLARED here and IMPLEMENTED by later phases. Nothing in
   * this object is wired in Phase 3; the fields exist so behaviour is part of
   * the composition data rather than something bolted on later.
   */
  behavior?: {
    /**
     * Overrides the depth's default parallax travel, in px at full pointer
     * extent. Emitted as `--parallax-travel` on the element. Unused by the
     * current composition, and it should stay that way: depth is supposed to
     * be legible as a small number of distances, not as a per-object dial.
     */
    parallax?: number;
    /**
     * Brightens as the pointer approaches. Owned by atmosphere.
     *
     * EXACTLY ONE object in the composition may set this. It is a scarcity
     * rule, not a capability: the loop wires the first one it finds and warns
     * about the rest. See `north-bloom` in composition.ts.
     */
    pointerReactive?: boolean;
    /** Phase 5 — discrete gesture. Owned by the interaction engineer. */
    draggable?: boolean;
    /** Phase 5 — discrete gesture. Owned by the interaction engineer. */
    holdInteraction?: boolean;
  };
}

/**
 * A star.
 *
 * Stars are objects, not wallpaper. There is no generator here and there must
 * never be one: every star is placed by hand against the page composition,
 * and `note` — which is REQUIRED — is where that placement is justified. If a
 * star cannot be given a reason in one line, it should not exist.
 */
export interface StarObject extends EnvironmentObject {
  /**
   * `pinprick`  — a hard, tiny point. Most stars are this.
   * `soft`      — a point with a tight halo. A few.
   * `defocused` — no core at all, just a soft disc. Reads as near and out of
   *               the focal plane; its whole job is to make a sharp pinprick
   *               beside it read as distant.
   * `bloom`     — a point carrying a photographic bloom. ONE on the page.
   */
  kind: "pinprick" | "soft" | "defocused" | "bloom";
  /** Diameter of the core. Sub-3px for anything sharp. */
  size: string;
  /** 0–1. Applied as element opacity, so it stays compositor-cheap. */
  intensity: number;
  /** Defaults to mist. Tonal variety is atmospheric, never graphic. */
  tone?: ToneName;
  /** Why this star exists. Required on purpose. */
  note: string;
}

/**
 * A mass of haze.
 *
 * Haze is the only thing on this page that moves. It occupies the space
 * *between* the stars and the viewer, so it is allowed to veil them.
 */
export interface HazeMass extends EnvironmentObject {
  size: { inline: string; block: string };
  /** 0–1, before drift. Kept low: haze is the field lifting, not a veil. */
  intensity: number;
  /**
   * Which atmosphere token drives the drift. The two rates are deliberately
   * non-harmonic (26s / 44s) and each mass runs its position and its opacity
   * on opposite ones, so nothing ever resynchronises into a visible pulse.
   */
  drift: "slow" | "slowest";
  /** Why this mass exists, and what it is keeping clear of. */
  note: string;
}

/** The whole environment, in one object. */
export interface Composition {
  stars: readonly StarObject[];
  haze: readonly HazeMass[];
}
