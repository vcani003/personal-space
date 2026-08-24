/* =============================================================================
   THE OUTLINE — one array, and everything else reads it
   =============================================================================

   THIS FILE IS THE CASE STUDY'S TABLE OF CONTENTS AND ITS SECTION HEADINGS AT
   THE SAME TIME. That is the point of it existing.

   The obvious way to build a page with a contents panel is to write the panel
   as one list and the sections as another, and they agree until the first time
   somebody renames a heading. Then the panel says one thing, the document says
   another, and the anchor still works so nothing warns you. So the outline is
   declared once, here, and:

     - `<Contents>` renders it as the browsable panel;
     - `<Section id="…">` looks its own heading text up from it;
     - `SectionId` is a union of the ids in it, so a section the outline does
       not know about, or a link to an anchor that does not exist, is a
       COMPILE ERROR rather than a dead link discovered by a reader.

   ── The flags ───────────────────────────────────────────────────────────────

   `flag: true` puts 🚩 beside an entry in the panel. It means: *Vero has to
   decide or verify this before the section can be finished*, and it is not
   decoration. Three of them exist. If a fourth is ever added, one of the
   existing three should be resolved first — a panel with flags everywhere is a
   panel with no flags, and the whole value of the mark is that the eye lands on
   it immediately.

   Each flag also has a matching `<Review>` block in the document itself, so a
   reader who arrives from the panel finds the actual question and not just a
   mark. `flagNote` is the one-line version, used as the panel entry's `title`
   and read out to assistive technology.
   ========================================================================== */

export type Entry = {
  readonly id: string;
  readonly title: string;
  /** Puts 🚩 in the contents panel. Reserved for "this needs Vero". */
  readonly flag?: true;
  /** Required whenever `flag` is set — the tooltip and screen-reader text. */
  readonly flagNote?: string;
};

export type Part = {
  readonly number: string;
  readonly title: string;
  readonly entries: readonly Entry[];
};

/* Declared `as const` and then re-exported through the `Part[]` type below.
   Two names for one array, and both are load-bearing:

     - the LITERAL is what `SectionId` is derived from. Widen it and every id
       becomes `string`, and the compile-time guarantee that a section and a
       contents entry refer to the same anchor is gone.
     - the WIDENED view is what the panel renders from. Reading `entry.flag`
       off the literal is an error on every entry that does not happen to
       declare one, because their literal types have no such property. */
const OUTLINE = [
  {
    number: "01",
    title: "Orientation",
    entries: [
      { id: "premise", title: "The premise" },
      { id: "standing", title: "How to read this" },
      { id: "problem", title: "The problem" },
      { id: "goals", title: "Experiences to support" },
    ],
  },
  {
    number: "02",
    title: "Constraints",
    entries: [
      { id: "media", title: "YouTube is the media player" },
      { id: "chart", title: "A chart is not a BPM" },
      { id: "client", title: "Gameplay stays on the client" },
      { id: "lanes", title: "Gameplay lanes" },
      { id: "authority", title: "Share the experience, not the input" },
    ],
  },
  {
    number: "03",
    title: "Multiplayer",
    entries: [
      { id: "room", title: "The room" },
      { id: "start", title: "Starting a round together" },
      { id: "sync", title: "Staying in sync" },
      { id: "avatars", title: "Avatars" },
      { id: "scores", title: "Scores, and how much to trust them" },
    ],
  },
  {
    number: "04",
    title: "Data",
    entries: [
      { id: "persistence", title: "What persists, what is temporary" },
      { id: "versioning", title: "Editing a chart people have played" },
    ],
  },
  {
    number: "05",
    title: "When it breaks",
    entries: [
      {
        id: "failure",
        title: "Failure states are part of the design",
        flag: true,
        flagNote:
          "Reconnection is the last undecided row in the table — can someone who drops mid-song rejoin, spectate, or only come back for the next one?",
      },
    ],
  },
  {
    number: "06",
    title: "Sequencing",
    entries: [
      { id: "local-first", title: "Local play comes first" },
      { id: "order", title: "The build order" },
    ],
  },
  {
    number: "07",
    title: "Reflection",
    entries: [
      { id: "principles", title: "Technical principles" },
      { id: "questions", title: "Open questions" },
      { id: "learning", title: "What I want to learn" },
    ],
  },
] as const satisfies readonly Part[];

/** The panel's view: same array, uniform shape. */
export const CONTENTS: readonly Part[] = OUTLINE;

/** Every anchor in the document, as a type. A typo is a compile error. */
export type SectionId = (typeof OUTLINE)[number]["entries"][number]["id"];

const TITLES: Record<string, string> = Object.fromEntries(
  OUTLINE.flatMap((part) => part.entries.map((entry) => [entry.id, entry.title])),
);

/** The heading text for a section, so the document never re-types it.
 *
 *  `SectionId` is derived from the same array `TITLES` is built from, so the
 *  fallback is unreachable — it exists because the compiler cannot see that
 *  and the honest alternative is a non-null assertion, which would also be
 *  wrong if the derivation ever changed. */
export function titleOf(id: SectionId): string {
  return TITLES[id] ?? id;
}

/** Document order, which is what the scroll-spy walks. */
export const SECTION_IDS: readonly SectionId[] = OUTLINE.flatMap((part) =>
  part.entries.map((entry) => entry.id),
);
