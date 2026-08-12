import type { ElementType, ReactNode } from "react";
import styles from "./Meta.module.css";

/**
 * THE METADATA REGISTER.
 *
 * One of exactly two typographic voices on this site. Small, quiet, tracked
 * out, Instrument Sans. Metadata whispers; content speaks.
 *
 * This exists as a component rather than a class so the register cannot drift:
 * there is one place that decides what "quiet" means, and every label on the
 * page goes through it. If a piece of text does not belong in this register, it
 * belongs in the display register — there is no third option, and no
 * intermediate size exists in the token scale to enable one.
 *
 * Note this is the PAGE's metadata. The player has its own, deliberately
 * subordinate treatment (see tokens.css) so that its labels and the page's
 * labels do not read as the same voice. Do not use this inside the player.
 */

type MetaProps = {
  children: ReactNode;
  /** `sm` is 10px — for the quietest things. Default is 11px. */
  size?: "default" | "sm";
  /** `wide` is for section numbering: `01 / JOURNAL`. */
  tracking?: "default" | "wide";
  /** Dimmer still. For a label that should be almost, but not quite, gone. */
  dim?: boolean;
  as?: ElementType;
  className?: string;
  /** For `aria-labelledby` wiring when this label names a section. */
  id?: string;
};

export function Meta({
  children,
  size = "default",
  tracking = "default",
  dim = false,
  as: Tag = "p",
  className,
  id,
}: MetaProps) {
  return (
    <Tag
      id={id}
      className={[
        styles.meta,
        size === "sm" && styles.sm,
        tracking === "wide" && styles.wide,
        dim && styles.dim,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}

/**
 * The separator between metadata fragments. A middot with real space around it
 * reads as editorial punctuation; a slash reads as a file path. Both appear on
 * this site and they mean different things: `·` joins peers, `/` numbers a
 * section.
 */
export const META_SEPARATOR = " · ";
