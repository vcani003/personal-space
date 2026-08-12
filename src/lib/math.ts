/**
 * Small pure numeric helpers. No state, no DOM, no framework.
 *
 * Kept deliberately thin: these are the four operations parallax, drag and
 * easing all need. Anything more specific (spring solvers, seeded noise,
 * easing curves) belongs to the system that needs it, not here.
 */

/** Constrain `value` to [`min`, `max`]. */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/** Linear interpolation. `t` is not clamped — overshoot is sometimes wanted. */
export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/** Where `value` sits between `from` and `to`, as 0–1. Degenerate range → 0. */
export function inverseLerp(from: number, to: number, value: number): number {
  if (from === to) return 0;
  return (value - from) / (to - from);
}

/** Remap `value` from one range to another, clamped to the output range. */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  const t = clamp(inverseLerp(inMin, inMax, value), 0, 1);
  return lerp(outMin, outMax, t);
}
