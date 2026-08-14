import type { WallItem, WallPlacement, WallPlacementNarrow } from "./types";

/* =============================================================================
   AUTHORING CHECKS — development only, and deliberately tiny
   =============================================================================

   The wall's failure modes are silent. An item placed at `y: 140` does not
   throw; it sits below the wall's bottom edge and is simply never seen. A
   duplicated id does not throw; two artifacts share one remembered position and
   move together. A charm that is a link with no alt does not throw; it is a
   link a screen reader announces as its own URL.

   None of that is worth a runtime guard in production, and none of it is worth
   a test suite either. It is worth a console warning while someone is authoring
   the composition, which is the only time any of it can be fixed.

   Stripped from the production bundle: the whole call site is inside
   `import.meta.env.DEV`, which Vite resolves to `false` and the minifier then
   removes along with everything it reaches.
   ========================================================================== */

const inRange = (value: number, max = 100): boolean =>
  Number.isFinite(value) && value >= 0 && value <= max;

/** Depth bands are ten apart in `tokens.css`; a larger `z` leaks into the next. */
const Z_MAX = 9;

export function validateWall(items: readonly WallItem[]): void {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const where = `${item.type} "${item.id}"`;

    if (seen.has(item.id)) {
      problems.push(
        `${where}: duplicate id. Ids key the remembered-position map, so two items sharing one would move together.`,
      );
    }
    seen.add(item.id);

    checkWide(item.placement.wide, where, problems);

    if (item.placement.narrow !== "absent") {
      checkNarrow(item.placement.narrow, where, problems);
    }

    if (item.type === "charm" && item.href && !item.alt) {
      problems.push(
        `${where}: a charm with an href needs an alt — a link has to have an accessible name.`,
      );
    }

    if (item.type === "blurb" && item.text.length === 0) {
      problems.push(`${where}: no text.`);
    }
  }

  if (problems.length > 0) {
    console.warn(
      `THE WALL — ${problems.length} authoring problem(s):\n  ${problems.join("\n  ")}`,
    );
  }
}

function checkWide(
  placement: WallPlacement,
  where: string,
  problems: string[],
): void {
  if (!inRange(placement.x) || !inRange(placement.y)) {
    problems.push(
      `${where}: wide x/y are percentages of the wall, 0–100. Got ${placement.x}, ${placement.y}.`,
    );
  }
  checkShared(placement, `${where} (wide)`, problems);
}

function checkNarrow(
  placement: WallPlacementNarrow,
  where: string,
  problems: string[],
): void {
  if (!inRange(placement.x)) {
    problems.push(
      `${where}: narrow x is a percentage of the wall, 0–100. Got ${placement.x}.`,
    );
  }

  /* On narrow the wall clips horizontally and does not scroll sideways, so an
     item hanging past an edge is content nobody can reach. Only checkable when
     the size is authored; an intrinsic item's width is not known here. */
  const { size } = placement;
  if (size !== undefined) {
    const start = placement.x - size / 2;
    const end = placement.x + size / 2;
    if (start < 0 || end > 100) {
      problems.push(
        `${where}: narrow placement runs off the wall (${start.toFixed(1)}% – ${end.toFixed(1)}%). x is the item's CENTRE, so keep it between ${(size / 2).toFixed(1)} and ${(100 - size / 2).toFixed(1)}.`,
      );
    }
  }

  checkShared(placement, `${where} (narrow)`, problems);
}

function checkShared(
  placement: WallPlacement | WallPlacementNarrow,
  where: string,
  problems: string[],
): void {
  if (placement.size !== undefined && !inRange(placement.size)) {
    problems.push(
      `${where}: size is a percentage of the wall's width, 0–100. Got ${placement.size}.`,
    );
  }

  if (
    placement.z !== undefined &&
    (!Number.isInteger(placement.z) || !inRange(placement.z, Z_MAX))
  ) {
    problems.push(
      `${where}: z orders items inside one depth band and must be an integer 0–${Z_MAX}. Got ${placement.z}. To go deeper or shallower, change depth.`,
    );
  }
}
