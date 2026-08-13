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

   …and one derived amplitude:

     push     how far this object is displaced by the LOCAL repulsion in
              pointer.ts — a different thing from parallax, described under
              DEPTH_PUSH below. It is not an independent random channel: it is
              the depth's push amplitude times the SAME travel multiplier, so an
              object that sits a little nearer within its band both travels
              further and reacts a little harder. One distance, two consequences.

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

   and each carries its resolved push amplitude as `data-push`, which is what
   the pointer loop reads when it measures the field.

   And when an object DOES have a compositional reason to sit at a specific
   distance, `behavior.parallax` in composition.ts overrides the derived
   multiplier and is defended by its `note` like everything else. Derivation is
   the default, not a ceiling.

   -----------------------------------------------------------------------------
   THE RESOLVED FIELD, at the constants below. Regenerate by calling
   `starVarianceTable(composition.stars)` and printing it.

   `push` is the amplitude constant; `peak` is what it actually reaches on
   screen, since the falloff tops out at 0.697 (see DEPTH_PUSH).

     FAR — base 10px, band 7.40 … 12.60px
       north-east-high       ×0.760   7.60px   +14.3°   lag 0.52   push 2.74 → 1.90
       project-void-east     ×0.779   7.79px    -7.9°   lag 0.35   push 2.80 → 1.95
       about-gap-far         ×0.781   7.81px    -7.6°   lag 0.37   push 2.81 → 1.96
       north-companion       ×0.798   7.98px   -12.3°   lag 0.38   push 2.87 → 2.00
       quote-witness         ×0.800   8.00px    +6.9°   lag 0.13   push 2.88 → 2.00
       post-player-west      ×0.809   8.09px    +7.5°   lag 0.53   push 2.91 → 2.03
       photo-pin             ×0.903   9.03px    -3.8°   lag 0.04   push 3.25 → 2.26
       north-lintel          ×0.912   9.12px    -7.1°   lag 0.07   push 3.28 → 2.28
       photo-far-west        ×0.919   9.19px    +1.6°   lag 0.18   push 3.31 → 2.30
       about-void-low        ×0.922   9.22px    +4.1°   lag 0.54   push 3.32 → 2.31
       north-mid             ×0.929   9.29px    -7.1°   lag 0.04   push 3.34 → 2.33
       journal-gap-east      ×0.940   9.40px    +9.5°   lag 0.48   push 3.39 → 2.36
       journal-gap-west      ×0.946   9.46px   +13.8°   lag 0.49   push 3.40 → 2.37
       north-east            ×1.034  10.34px    +3.9°   lag 0.50   push 3.72 → 2.59
       project-margin-far    ×1.073  10.73px    +6.2°   lag 0.15   push 3.86 → 2.69
       quote-approach        ×1.085  10.85px   +14.0°   lag 0.23   push 3.90 → 2.72
       about-void            ×1.206  12.06px   +13.7°   lag 0.22   push 4.34 → 3.02
       journal-margin-far    ×1.206  12.06px   +13.9°   lag 0.18   push 4.34 → 3.02
       closing-pin           ×1.227  12.27px    +5.5°   lag 0.25   push 4.42 → 3.07
       pre-player-west       ×1.240  12.40px   -12.9°   lag 0.05   push 4.46 → 3.11
       photo-void-low        ×1.241  12.41px    -4.7°   lag 0.17   push 4.47 → 3.11
       post-player-east      ×1.248  12.48px    +9.7°   lag 0.23   push 4.49 → 3.12

     MID — base 18px, band 14.76 … 21.24px
       closing-approach      ×0.884  15.91px    +3.1°   lag 0.44   push 4.77 → 3.32
       project-margin        ×0.914  16.45px    -3.6°   lag 0.23   push 4.94 → 3.43
       pre-player-east       ×0.951  17.12px    +9.1°   lag 0.11   push 5.14 → 3.57
       north-west            ×0.964  17.36px   -15.6°   lag 0.48   push 5.21 → 3.62
       journal-margin        ×0.972  17.50px    -8.1°   lag 0.29   push 5.25 → 3.65
       north-bloom           ×1.015  18.27px    -4.1°   lag 0.10   push 5.48 → 3.81
       about-gap-east        ×1.129  20.32px    -4.8°   lag 0.39   push 6.10 → 4.24
       elsewhere-east        ×1.144  20.60px   -12.8°   lag 0.39   push 6.18 → 4.30

     NEAR — base 26px, band 23.40 … 28.60px
       photo-defocus         ×0.927  24.11px   -10.9°   lag 0.33   push 6.68 → 4.64

     NARROW
       n-after-player   far  ×0.827   8.27px    -9.9°   lag 0.05   push 2.98 → 2.07
       n-project        far  ×1.000  10.00px   +10.9°   lag 0.03   push 3.60 → 2.50
       n-closing        far  ×1.174  11.74px   +14.2°   lag 0.26   push 4.22 → 2.94
       n-quote-approach far  ×1.245  12.45px    -4.4°   lag 0.31   push 4.48 → 3.12
       n-north-low      far  ×1.249  12.49px    -1.4°   lag 0.06   push 4.49 → 3.13
       n-north          mid  ×0.926  16.68px    +9.3°   lag 0.23   push 5.00 → 3.48
       n-about-gap      mid  ×0.942  16.95px    +9.9°   lag 0.46   push 5.08 → 3.54

   (The narrow set never runs the push maths on a phone — the field is off on a
   coarse pointer entirely. These amplitudes only apply to a narrow window on a
   desktop, which is a real case and not worth a second table.)

   Read down the FAR column: travel runs 7.60 → 12.49px, a 1.64× range, and the
   direction fans across 27°. That is what stops it reading as a sheet. The
   realised far band tops out at 12.49px and the realised mid band starts at
   15.91px, so the two never come within 3.4px of each other in practice.
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

     --parallax-far  10px →  --parallax-middle 18px   ratio 1.80
     --parallax-middle   →  --parallax-near     26px  ratio 1.44
     --parallax-near     →  --parallax-foreground 34  ratio 1.31

   For a shared spread `s` across a pair, non-overlap requires s < (r−1)/(r+1):
   0.286 for far→mid, 0.182 for mid→near, 0.133 for near→foreground. Stated the
   other way, for the ASYMMETRIC spreads below the requirement is
   r > (1 + s_lower) / (1 − s_upper): 1.537, 1.311 and 1.222 respectively, all
   of which the ladder above clears.

   Hence the asymmetry below. FAR gets the widest spread because it has the most
   room AND needs it most — it holds 22 of the 31 wide stars, so it is the band
   whose rigidity was visible. NEAR and FOREGROUND hold at most one object each
   and the tokens leave them the least headroom, so they take the least.

   THE LADDER WAS RAISED, 6/12/18/26 → 10/18/26/34, because `far` at 6px still
   read as nearly static. Raising `far` ALONE would have shrunk its allowable
   spread — the whole point of the inequality above — and the spread is not the
   thing to spend: it is what makes 22 stars stop looking like one sheet. So the
   entire ladder moved and the spreads below are unchanged. The ratios tightened
   (2.00/1.50/1.44 → 1.80/1.44/1.31) and every one of them is still clear of its
   minimum by a margin, which `assertDepthBands` re-checks against the live
   tokens at runtime.

   THE RESULTING BANDS, in px of travel at full pointer extent:

     far          7.40 … 12.60       gap to mid   2.16px
     mid         14.76 … 21.24       gap to near  2.16px
     near        23.40 … 28.60       gap to fg    2.00px
     foreground  30.60 … 37.40

   Those are the ALLOWED bands. What is actually authored is narrower — the
   realised far band tops out at 12.49px against a realised mid floor of
   15.91px, a 3.4px gap.

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
   LOCAL REPULSION — WHICH IS NOT PARALLAX, AND THE DIFFERENCE IS THE DESIGN
   -----------------------------------------------------------------------------
   Everything above describes PARALLAX: one global viewpoint shift, applied to
   every object at once, scaled by depth. Every star moves the same way at the
   same time because the viewer is what moved.

   This is the other thing. Each star reacts to ITS OWN distance and direction
   from the cursor and is displaced AWAY from it. Nothing global happens; a star
   forty pixels from the pointer moves and its neighbour four hundred pixels
   away does not know anything occurred. Parallax is the world seen from a new
   angle. This is the world being disturbed in one small place.

   The two are ADDITIVE. A star's offset is its parallax offset plus its push
   offset, composed in `translate` in Stars.module.css. See `pointer.ts` for the
   radius, the falloff and the per-frame cost.

   THE AMPLITUDES, in px, before the star's own travel multiplier:

     far 3.6   mid 5.4   near 7.2   foreground 9.0

   NEAR REACTS MORE THAN FAR, for the same reason it travels further: a
   disturbance close to the viewer subtends a larger angle. Getting this
   backwards would have the effect fighting the depth model instead of
   reinforcing it, which is the main way a repulsion field turns into a particle
   toy.

   THE AMPLITUDE IS NOT THE DISPLACEMENT. The falloff peaks at 0.697 (it is a
   smoothstep in distance times a soft core that goes to zero AT the cursor —
   see pointer.ts), so `far` at 3.6 actually reaches about 2.5px, and 1.9–3.1px
   once the per-object multiplier is applied. A `far` pinprick is 2–2.25px
   across: it moves a little more than its own width, once, as the cursor
   passes, and drifts back. That is the "wait, did that move?" the brief asks
   for. At twice this it would be a toy, and it would be describable.

   These are DELIBERATELY far smaller than the parallax travel of the same
   depth — roughly a quarter of it. Push must never be the loudest thing the
   field does, or the depth ladder stops being what the eye reads.
   -------------------------------------------------------------------------- */

export const DEPTH_PUSH: Readonly<Record<Depth, number>> = {
  far: 3.6,
  mid: 5.4,
  near: 7.2,
  foreground: 9,
};

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
  /**
   * Local-repulsion amplitude in px, before the falloff. Its realised peak is
   * about 0.697 of this. Not a separate random channel — `DEPTH_PUSH` for the
   * object's depth, times the same `travel` multiplier.
   */
  push: number;
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
    /* Reuses `travel` rather than hashing a fourth channel. The multiplier is
       this object's position WITHIN its depth band, and a thing that is a
       little nearer should both travel and react a little more; two
       independent numbers would be two unrelated claims about one distance. */
    push: DEPTH_PUSH[depth] * travel,
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
