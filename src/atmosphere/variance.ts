import { clamp } from "../lib/math";
import type { Depth } from "./types";

/* =============================================================================
   PER-OBJECT MOVEMENT VARIANCE — why the sky is not three sheets of glass
   =============================================================================

   THE PROBLEM THIS SOLVES

   Depth alone gives every star in a band the SAME travel along the SAME vector.
   Three depths then produce three rigid planes sliding over one another, which
   is not what a sky looks like. Real distances are continuous; a band is a
   convenience for authoring, not a claim that ten objects are equidistant.

   So each object gets three small deviations of its own:

     travel   a multiplier on its depth's travel. Two `far` stars end up at
              slightly DIFFERENT far distances.
     skew     a small rotation of its travel vector. This matters at least as
              much as magnitude — a shared direction is most of what makes a
              field read as one sheet. It is also physically honest: parallax
              is only uniform under an orthographic projection, and a real lens
              is not one.
     lag      how much of the SLOWER pointer channel the object follows, so the
              field settles unevenly instead of arriving all at once. It
              changes nothing at rest: both channels converge on the same
              target, so the authored composition is untouched once the pointer
              stops.

   -----------------------------------------------------------------------------
   WHY THE VALUES ARE DERIVED FROM THE `id` AND NOT TYPED INTO composition.ts

   `Math.random()` is out of the question — it would change on every reload and
   break the promise at the top of composition.ts that the environment is
   authored rather than generated.

   Hand-authoring 38 multipliers was the alternative and it was rejected, on the
   file's own terms. Every field in composition.ts is defensible: a position is
   defended by the `note` next to it, an intensity by where it sits in the
   field. A hand-typed `1.14` on `north-east` could not be defended by anything
   — it carries no compositional intent, because the whole point of variance is
   that it correlates with nothing you can see. Putting undefendable numbers in
   the same table as defendable ones is what would actually erode the promise.
   They would also all shift the day someone reorders the file.

   So: a pure function of the object's `id`. Same id, same movement, forever.
   Stable across reloads, stable across edits to OTHER objects, and inspectable
   three ways — the resolved table is printed below, the function is exported
   and callable, and every star carries its own resolved values as inline
   custom properties visible in DevTools:

     --star-parallax  --star-skew-cos  --star-skew-sin  --star-lag

   And when an object DOES have a compositional reason to sit at a specific
   distance, `behavior.parallax` in composition.ts overrides the derived
   multiplier and is defended by its `note` like everything else. Derivation is
   the default, not a ceiling.

   -----------------------------------------------------------------------------
   THE RESOLVED FIELD, at the constants below. Regenerate by calling
   `starVarianceTable(composition.stars)` and printing it.

     FAR — base 6px, band 4.44 … 7.56px
       north-east-high       ×0.760   4.56px   +14.3°   lag 0.52
       project-void-east     ×0.779   4.67px    -7.9°   lag 0.35
       about-gap-far         ×0.781   4.68px    -7.6°   lag 0.37
       north-companion       ×0.798   4.79px   -12.3°   lag 0.38
       quote-witness         ×0.800   4.80px    +6.9°   lag 0.13
       post-player-west      ×0.809   4.85px    +7.5°   lag 0.53
       photo-pin             ×0.903   5.42px    -3.8°   lag 0.04
       north-lintel          ×0.912   5.47px    -7.1°   lag 0.07
       photo-far-west        ×0.919   5.51px    +1.6°   lag 0.18
       about-void-low        ×0.922   5.53px    +4.1°   lag 0.54
       north-mid             ×0.929   5.57px    -7.1°   lag 0.04
       journal-gap-east      ×0.940   5.64px    +9.5°   lag 0.48
       journal-gap-west      ×0.946   5.67px   +13.8°   lag 0.49
       north-east            ×1.034   6.20px    +3.9°   lag 0.50
       project-margin-far    ×1.073   6.44px    +6.2°   lag 0.15
       quote-approach        ×1.085   6.51px   +14.0°   lag 0.23
       about-void            ×1.206   7.24px   +13.7°   lag 0.22
       journal-margin-far    ×1.206   7.24px   +13.9°   lag 0.18
       closing-pin           ×1.227   7.36px    +5.5°   lag 0.25
       pre-player-west       ×1.240   7.44px   -12.9°   lag 0.05
       photo-void-low        ×1.241   7.44px    -4.7°   lag 0.17
       post-player-east      ×1.248   7.49px    +9.7°   lag 0.23

     MID — base 12px, band 9.84 … 14.16px
       closing-approach      ×0.884  10.60px    +3.1°   lag 0.44
       project-margin        ×0.914  10.97px    -3.6°   lag 0.23
       pre-player-east       ×0.951  11.42px    +9.1°   lag 0.11
       north-west            ×0.964  11.57px   -15.6°   lag 0.48
       journal-margin        ×0.972  11.67px    -8.1°   lag 0.29
       north-bloom           ×1.015  12.18px    -4.1°   lag 0.10
       about-gap-east        ×1.129  13.55px    -4.8°   lag 0.39
       elsewhere-east        ×1.144  13.73px   -12.8°   lag 0.39

     NEAR — base 18px, band 16.20 … 19.80px
       photo-defocus         ×0.927  16.69px   -10.9°   lag 0.33

     NARROW
       n-after-player   far  ×0.827   4.96px    -9.9°   lag 0.05
       n-project        far  ×1.000   6.00px   +10.9°   lag 0.03
       n-closing        far  ×1.174   7.04px   +14.2°   lag 0.26
       n-quote-approach far  ×1.245   7.47px    -4.4°   lag 0.31
       n-north-low      far  ×1.249   7.49px    -1.4°   lag 0.06
       n-north          mid  ×0.926  11.12px    +9.3°   lag 0.23
       n-about-gap      mid  ×0.942  11.30px    +9.9°   lag 0.46

   Read down the FAR column: travel runs 4.56 → 7.49px, a 1.64× range, and the
   direction fans across 27°. That is what stops it reading as a sheet. The
   realised far band tops out at 7.49px and the realised mid band starts at
   10.60px, so the two never come within 3.1px of each other in practice.
   ========================================================================== */

/* -----------------------------------------------------------------------------
   HOW WIDE THE SPREAD IS ALLOWED TO BE — this is a constraint, not a taste
   -----------------------------------------------------------------------------
   Depth has to stay LEGIBLE. If a `far` star's multiplier pushes its travel
   past a `mid` star's, the bands stop reading as distances and the variance has
   bought motion by spending depth. So the bands must not overlap:

     travel(depth) × (1 + spread)  <  travel(next) × (1 − spread(next))

   Which means the spread a band can afford is set by its RATIO to its
   neighbour, and the tokens do not space the bands evenly:

     --parallax-far  6px  →  --parallax-middle 12px   ratio 2.00
     --parallax-middle   →  --parallax-near     18px  ratio 1.50
     --parallax-near     →  --parallax-foreground 26  ratio 1.44

   For a shared spread `s` across a pair, non-overlap requires s < (r−1)/(r+1):
   0.333 for far→mid, 0.200 for mid→near, 0.182 for near→foreground.

   Hence the asymmetry below. FAR gets the widest spread because it has the most
   room AND needs it most — it holds 22 of the 31 wide stars, so it is the band
   whose rigidity was visible. NEAR and FOREGROUND hold at most one object each
   and the tokens leave them the least headroom, so they take the least.

   THE RESULTING BANDS, in px of travel at full pointer extent:

     far          4.44 … 7.56        gap to mid   2.28px
     mid          9.84 … 14.16       gap to near  2.04px
     near        16.20 … 19.80       gap to fg    3.60px
     foreground  23.40 … 28.60

   THESE NUMBERS ARE COUPLED TO tokens.css. The tokens belong to the design
   lead; if they move, re-check the inequality above. `assertDepthBands` does
   exactly that against the live computed values, in development only.
   -------------------------------------------------------------------------- */

export const DEPTH_TRAVEL_SPREAD: Readonly<Record<Depth, number>> = {
  far: 0.26,
  mid: 0.18,
  near: 0.1,
  foreground: 0.1,
};

/**
 * Maximum rotation of an object's travel vector, in radians. ~16°.
 *
 * Uniform across depths, because rotation preserves length and therefore
 * cannot disturb the band separation above — skew is the free lever, which is
 * convenient, since direction is the larger half of why a field reads rigid.
 *
 * At 16° a star travelling 6px picks up 1.7px across the main axis, and two
 * neighbours skewed opposite ways diverge by 32°. Enough to see the field
 * deform; not enough for any single star to look like it is drifting.
 */
export const SKEW_MAX_RADIANS = 0.28;

/**
 * Maximum share of the slower pointer channel an object may follow, 0…1.
 *
 * 0 is the standard ~140ms settle; 1 would be the slow channel's ~286ms. The
 * ceiling of 0.55 puts the slowest object at roughly 220ms — still inside the
 * RESPONSE band (120–300ms) from the shared brief, so no object ever lags far
 * enough to look like it is catching up.
 */
export const LAG_MAX = 0.55;

/* -----------------------------------------------------------------------------
   THE DERIVATION
   -------------------------------------------------------------------------- */

/**
 * FNV-1a, 32-bit. Chosen because it is eight lines, has no state, and is
 * identical in every JavaScript engine — the value must be the same on the
 * site owner's laptop, in CI and in a screenshot taken next year.
 */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    h ^= text.charCodeAt(index);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * A stable 0…1 for one object and one channel.
 *
 * The channel suffix is what keeps the three deviations independent: hashing
 * `"north-east#skew"` and `"north-east#lag"` gives two uncorrelated values,
 * where slicing bit ranges out of a single hash would not reliably.
 */
function unitFor(id: string, channel: string): number {
  return hash(`${id}#${channel}`) / 0x1_0000_0000;
}

/** The same, remapped to −1…1. */
function signedFor(id: string, channel: string): number {
  return unitFor(id, channel) * 2 - 1;
}

/** How one object deviates from the plain behaviour of its depth. */
export interface StarVariance {
  /** Multiplier on the depth's travel token. 1 is exactly the band default. */
  travel: number;
  /** Rotation of the travel vector, in radians. */
  skew: number;
  /** 0…1 share of the slower pointer channel. 0 is the standard settle. */
  lag: number;
}

/**
 * Resolve one object's movement character.
 *
 * Pure, cheap, and called once per object per render — never in a frame. The
 * result leaves as four numbers on the element and the rest is CSS.
 *
 * `override` is `behavior.parallax` from the composition: an authored
 * multiplier that replaces the derived one. It is CLAMPED to the band's spread
 * rather than trusted, because an override wide enough to cross into the next
 * band would quietly cost the page its depth legibility, and that is not a
 * trade any single star should be able to make on its own.
 */
export function starVariance(
  id: string,
  depth: Depth,
  override?: number,
): StarVariance {
  const spread = DEPTH_TRAVEL_SPREAD[depth];

  const derived = 1 + spread * signedFor(id, "travel");
  const travel =
    override === undefined ? derived : clamp(override, 1 - spread, 1 + spread);

  if (import.meta.env.DEV && override !== undefined && travel !== override) {
    console.warn(
      `[atmosphere] "${id}" declares behavior.parallax ${override}, which is outside what the ${depth} band can carry without overlapping its neighbour. Clamped to ${travel.toFixed(3)}.`,
    );
  }

  return {
    travel,
    skew: SKEW_MAX_RADIANS * signedFor(id, "skew"),
    lag: LAG_MAX * unitFor(id, "lag"),
  };
}

/* -----------------------------------------------------------------------------
   INSPECTION
   -------------------------------------------------------------------------- */

/** One resolved row, for reading the field as a table. */
export interface VarianceRow extends StarVariance {
  id: string;
  depth: Depth;
  /** `skew` in degrees, because radians are not a thing anyone can picture. */
  skewDegrees: number;
}

/**
 * Resolve a whole composition, sorted by depth then by travel.
 *
 * This is the answer to "derived values are less legible than authored ones":
 * they are legible on demand. Print it and you have the table at the top of
 * this file. Nothing calls this at runtime.
 */
export function starVarianceTable(
  objects: readonly {
    id: string;
    depth: Depth;
    behavior?: { parallax?: number };
  }[],
): VarianceRow[] {
  const order: Depth[] = ["far", "mid", "near", "foreground"];

  return objects
    .map((object) => {
      const variance = starVariance(object.id, object.depth, object.behavior?.parallax);
      return {
        id: object.id,
        depth: object.depth,
        ...variance,
        skewDegrees: (variance.skew * 180) / Math.PI,
      };
    })
    .sort(
      (a, b) =>
        order.indexOf(a.depth) - order.indexOf(b.depth) || a.travel - b.travel,
    );
}

/**
 * Development guard: check the live depth tokens still leave the bands
 * separated once the spreads above are applied.
 *
 * The spreads are calibrated against `--parallax-far` … `--parallax-foreground`
 * as they stand in tokens.css, and those tokens belong to the design lead. If
 * one of them moves, the bands can silently start to overlap and the page loses
 * the depth cue the variance was supposed to be decorating. Reading four
 * computed values once, after mount, is a cheap way for that to be loud instead
 * of silent.
 *
 * Never runs in production. Never runs in a frame.
 */
export function assertDepthBands(element: Element): void {
  if (!import.meta.env.DEV) return;

  const computed = getComputedStyle(element);
  const token: Record<Depth, string> = {
    far: "--parallax-far",
    mid: "--parallax-middle",
    near: "--parallax-near",
    foreground: "--parallax-foreground",
  };
  const order: Depth[] = ["far", "mid", "near", "foreground"];

  const travel = order.map((depth) =>
    Number.parseFloat(computed.getPropertyValue(token[depth])),
  );

  /* Under `prefers-reduced-motion` every token is 0px and nothing moves at all,
     so there are no bands to keep apart. */
  if (travel.some((value) => !Number.isFinite(value)) || travel[0] === 0) return;

  for (let index = 0; index < order.length - 1; index += 1) {
    const lower = order[index]!;
    const upper = order[index + 1]!;
    const highest = travel[index]! * (1 + DEPTH_TRAVEL_SPREAD[lower]);
    const lowest = travel[index + 1]! * (1 - DEPTH_TRAVEL_SPREAD[upper]);

    if (highest >= lowest) {
      console.warn(
        `[atmosphere] Depth bands overlap: a "${lower}" object can travel ${highest.toFixed(2)}px while a "${upper}" object travels only ${lowest.toFixed(2)}px. Depth stops reading as distance. Narrow DEPTH_TRAVEL_SPREAD in variance.ts, or widen the gap between the parallax tokens.`,
      );
    }
  }
}
