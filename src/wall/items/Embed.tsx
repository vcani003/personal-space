import { Player } from "../../player";
import type { EmbedItem } from "../types";
import styles from "./Embed.module.css";

/**
 * AN EMBED — a large functional object hung on the wall.
 *
 * For MVP 2 there is exactly one, and it is the Bunny Hop player.
 *
 * ── This is a WRAPPER. It does not touch the player. ────────────────────────
 *
 * Nothing in `src/player/**` is modified, imported piecemeal, restyled or
 * re-implemented here. `<Player />` renders itself, sizes itself through its own
 * container query, and keeps its material identity completely — the three-band
 * object with its own radius, its own edge and its own glow. The wall gives it a
 * place to be and gets out of the way. It must never dissolve into its
 * surroundings; it stays readable as an object with its own silhouette.
 *
 * ── The one thing the wall must guarantee ───────────────────────────────────
 *
 * THERE CAN ONLY BE ONE PLAYER. The sticky rail beside the wall mounts the same
 * component, so a `bunny-hop` embed on the wall and the rail both being present
 * would put two of them on the page. `Home.tsx` therefore mounts one or the
 * other, decided by `wallHostsEmbed()` reading the authored content. With no
 * embed on the wall, the player is in the rail.
 *
 * Placing the embed is consequently a real editorial decision, not just another
 * artifact: it moves the player out of the rail and onto the wall, where it
 * scrolls away like everything else and stops being reachable while attention is
 * elsewhere. (The retired `PlayerDock` was a third answer to the same question —
 * see its header.)
 *
 * ── `data-no-ripple` ────────────────────────────────────────────────────────
 *
 * An object floating on the surface is not part of the surface, so touching it
 * does not send a wave across the page. `Ripple.tsx` already honours this
 * attribute; the dock sets it for the same reason.
 */

export function Embed({ item }: { item: EmbedItem }) {
  return (
    <div
      className={styles.embed}
      data-no-ripple=""
      role={item.label ? "group" : undefined}
      aria-label={item.label}
    >
      {object(item)}
    </div>
  );
}

/* Exhaustive over `WallEmbedKind` with no default, so a second embed is a
   compile error until it is handled. */
function object(item: EmbedItem) {
  switch (item.embed) {
    case "bunny-hop":
      return <Player />;
  }
}
