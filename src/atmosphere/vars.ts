import type { CSSProperties } from "react";

/**
 * A style object that may also carry CSS custom properties.
 *
 * Every per-object value in the atmosphere — position, size, intensity — is
 * handed to CSS as a custom property rather than as a real style declaration.
 * That keeps the styling in the stylesheet where it can be reasoned about as a
 * system, and leaves the data files describing composition rather than paint.
 */
export type StyleVars = CSSProperties & Record<`--${string}`, string | number>;

/** Tonal tokens an environmental object may be tinted with. Tokens only. */
export const TONE_VAR = {
  mist: "var(--tone-mist)",
  silver: "var(--tone-silver)",
  lavender: "var(--tone-lavender-gray)",
} as const;
