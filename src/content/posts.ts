import type { Post, SiteIdentity } from "./types";

/**
 * PLACEHOLDER CONTENT
 *
 * Everything marked `placeholder: true` is scaffolding written to hold the
 * composition's shape — real line lengths, real rhythm, the right register —
 * so the page can be judged with words in it rather than with lorem ipsum.
 *
 * It is written in the site's voice but it is NOT the site owner's writing and
 * makes no claims about her life. Replace it wholesale; do not edit these into
 * real entries and leave the flag behind.
 *
 * Image `src` values point at files that do not exist yet. That is on purpose:
 * composition has to tolerate missing assets while final art arrives.
 */

export const identity: SiteIdentity = {
  name: "Veronica Canido",
  handle: "@starcharm",
  instagramUrl: "https://www.instagram.com/starcharm/",
};

/**
 * The last thing on the page.
 *
 * Not a footer, not a colophon, not a sign-off — a thought, small and almost
 * missed, after a long stretch of empty darkness. This is the ONE place PP
 * Eiko Light Italic appears on the entire site.
 *
 * It is deliberately the quietest text on the page rather than the loudest.
 * A line like this stops meaning anything at 56px; it only works if a visitor
 * has to still be paying attention by the time they reach it.
 */
export const closingLine = "Maybe it's kismet.";

/**
 * THE SITE'S NAME, under hers.
 *
 * P.S. is short for Personal Space, and it is also how a letter carries on
 * after it has signed off. The intro below says so, which is why the metadata
 * line no longer does — "PERSONAL SPACE" spelled out beside a name that
 * already reads "P.S., ILY" was the same fact stated twice, once as a label.
 */
export const siteName = "P.S., ILY";

/**
 * THE INTRO — her words, in her voice.
 *
 * Written by the site owner. It stays casual on purpose: the professional
 * paragraph below has its own beat, and merging the two produces the About Me
 * that reads like a LinkedIn summary, which is the one thing this page should
 * not sound like.
 *
 * An array of paragraphs rather than one string, so the register and the
 * spacing are decided once by the component instead of by markup in the copy.
 *
 * ── TWO MARKERS, AND THEY ARE THE ONLY MARKUP ALLOWED HERE ──────────────────
 *
 *   **loud**       opens a paragraph, or names the site inside one. The
 *                  biggest thing in the prose.
 *   *lifted*       a word worth catching the eye on the way past.
 *   [text](url)    a link. Opens in a new tab if it leaves the site.
 *
 * They exist so the emphasis lives in the WRITING rather than in a component —
 * changing which words are large is editing this sentence, not editing markup.
 *
 * Use them sparingly. Everything lifted is nothing lifted, and prose where
 * every third word is large has stopped being prose.
 */
export const intro: readonly string[] = [
  "**Hi, I'm Vero.** I really love *traveling*, good food, and spending time with my husband and our [cats](https://www.instagram.com/lumi2luci/).",
  "I'm a *Type B* personality at heart. I like going with the flow, following whatever catches my *curiosity*, and seeing how the story unfolds.",
  "Lately, I'm finding my *spark* again and seeing where it takes me next \u22c6\u2b52\u02da.\u22c6",
  "**P.S., ILY** is my little *home base* for thoughts, interests, things I'm making, and anything that reminds me what's important in life. P.S. is short for Personal Space, but I liked that it also reads like the end of a letter.",
  "So maybe this is a little *love letter* to myself, and to the *curious wanderer* who happens to stumble across it.",
];

/**
 * THE PROFESSIONAL BEAT, deliberately separate and deliberately short.
 *
 * It has its own heading so the personal section does not have to absorb it.
 * The project pages and a résumé can prove the engineering; this page only has
 * to say who is doing it.
 */
export const work = {
  heading: "somewhere between building & becoming",
  paragraphs: [
    "I'm a frontend software engineer who took a detour into entrepreneurship. After 6+ years of building software, I stepped away to help build and run a business of my own.",
    "Now I'm finding my way back to software with a different perspective, and trying to reconnect with the creativity and curiosity that made me love building things in the first place.",
    "I'm making things again. Let's see what happens.",
  ],
} as const;

/**
 * About. THIS IS VERO'S OWN WRITING — not placeholder. Kept verbatim, on
 * purpose, including the run-on energy and the extra Ls.
 *
 * On the tension between this voice and the site's calm: the restraint is
 * carried by the TYPOGRAPHY, not by the words. Eiko Thin at a narrow measure
 * with generous leading and a great deal of empty space around it is what
 * makes the page quiet. The sentences inside it are free to talk fast. The
 * contrast is the point — exuberant writing set calmly reads as a person; the
 * same writing set excitedly reads as a landing page.
 *
 * So: do not tidy this into brand copy, do not break it into bullet points,
 * and do not "balance" it by making the layout busier to match.
 *
 * TWO THINGS FOR VERO:
 *   1. `??` below is her own blank, left exactly as written — the sentence
 *      wants the daylight half of the light/dark contrast.
 *   2. "obsessions is" is hers verbatim; left alone rather than silently
 *      corrected, since it may be the voice.
 */
export const about: readonly string[] = [
  "Veronica but pls u can call me Vero. I'm 30 and change my mind on my aesthetics a lot.",
  "I love ?? in my daily life but my eyes belongs to dark mode.",
  "This website will serve as a collection of works, my personality, thoughts, doodles and snaps. I love to find the whimsy in life.",
  "My lifelong obsessions is learning lyrics to my favorite songs to sing them off key. Just gotta let the music confiscate my soulllllll",
];

/**
 * On metadata: `date` is stored on every post but rendered almost nowhere, and
 * `label` is omitted wherever the section already names the thing.
 *
 * A date on every entry, in reverse-chronological order, with a kind label, is
 * a feed's data model. Nothing else about this page is a feed — there is no
 * archive, no chronology and nowhere to go — so six visible dates were
 * performing a recency the page does not have. The data stays because it is
 * true and costs nothing; the ink does not.
 */
// `as const satisfies` rather than a `: readonly Post[]` annotation. The
// annotation widens every `id` to `string`, which would make the KnownPostId
// union below meaningless; `satisfies` still type-checks each entry against
// `Post` while preserving the literal ids.
export const posts = [
  {
    kind: "text",
    id: "rooms",
    placeholder: true,
    // No `index` and no `label`: the margin note already says `01 / Journal`,
    // and a second grey line beside it saying `NOTE` is the same word twice.
    meta: { date: "2026-02-14" },
    title: "Notes toward a quieter internet",
    body: [
      "The web I remember was made of rooms. You arrived somewhere and could tell that a person had chosen the wallpaper, and that they had chosen it badly, and that this was the point.",
      "I am trying to build one of those again.",
    ],
  },
  {
    kind: "image",
    id: "four-am",
    placeholder: true,
    // The caption already does the temporal work — better than a date could.
    meta: { date: "2026-02-02" },
    src: "photography/placeholder.jpg",
    alt: "Placeholder photograph.",
    caption: "Somewhere between three and four in the morning.",
    aspectRatio: 3 / 2,
  },
  {
    kind: "quote",
    id: "stillness",
    placeholder: true,
    // No label, no attribution, no date. The quote is the one thing on the
    // page allowed to arrive without introduction. Set upright, not italic —
    // the italic is spent on `closingLine`, where it whispers instead.
    meta: { date: "2026-01-28" },
    text: "Some things are only visible if you stop moving.",
  },
  {
    kind: "link",
    id: "bunny-hop-player",
    placeholder: true,
    // `label` survives here because it says something the section does not.
    // `tags: ["TypeScript", "React"]` was removed: a tech-stack chip list is a
    // portfolio tell, and it was a second grey line under an entry that
    // already had one above it.
    meta: { date: "2026-01-09", label: "Chrome extension" },
    // TODO: real destination. `#` keeps the anchor valid and inert until then.
    href: "#",
    label: "Bunny Hop Player",
    description: "A lyric player that recedes while you are doing something else.",
    external: false,
  },
  {
    kind: "drawing",
    id: "drawing",
    placeholder: true,
    meta: { date: "2026-01-03" },
    src: "drawings/placeholder.png",
    // An empty alt is the correct answer for art that carries no information a
    // reader would otherwise miss. Typed out on purpose, not forgotten.
    alt: "",
    aspectRatio: 4 / 5,
  },
  {
    kind: "link",
    id: "instagram",
    // No label, no description. The section says `Elsewhere`, the title says
    // `@starcharm`, the href says instagram.com — a fourth statement of the
    // same fact is not information.
    meta: { date: "2026-01-01" },
    href: "https://www.instagram.com/starcharm/",
    label: "@starcharm",
    external: true,
  },
] as const satisfies readonly Post[];

/*
 * `postsOfKind()` used to live here. It was removed rather than repaired:
 * nothing on the page ever called it (the composition pulls specific posts by
 * id, because placement is a design decision, not a query), and its type
 * predicate stopped compiling once `posts` gained literal types.
 *
 * Keeping a generic collection query alive for a six-item static array, in
 * service of a grouped list view this site does not have, is the beginning of
 * the feed architecture the design brief spent its energy avoiding.
 */

/**
 * Every id that actually exists, derived from the data rather than maintained
 * by hand.
 */
export type KnownPostId = (typeof posts)[number]["id"];

/**
 * Lookup by id, accepting only ids that exist.
 *
 * This is typed rather than taking a plain `string` because the failure mode
 * is invisible: the composition renders each post behind a `{post && ...}`
 * guard, so a mistyped id does not throw or warn — the entry just silently
 * disappears from the page. That happened once, when a post was renamed and
 * the lookup in Home.tsx was not, and the quote vanished without a single
 * console message.
 *
 * With the id union derived from `posts`, the same mistake is now a compile
 * error. The return type stays optional so callers keep their guards, which
 * still matter for content that is genuinely conditional.
 */
export function postById(id: KnownPostId): Post | undefined {
  return posts.find((post) => post.id === id);
}
