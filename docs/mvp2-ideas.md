# MVP 2 — ideas and nice-to-haves

Captured from Vero, 2026-08-11. Nothing here is committed to MVP 1. This is a
parking lot, written down so it survives.

Each entry keeps her idea first, then a short design note from the MVP 1 work
about where it would fit and what it would cost — so the thinking isn't
re-derived later.

---

## 1. A distant shooting star, or running deer sprites

> "It would be nice to have a distant shooting star, or running deer sprites
> like the bunny sprite from the Bunny Hop extension. These would get revealed
> on scroll. Just small — slightly larger than a pointer cursor."

**Design note.** This is the strongest fit of the five, because it is *motion
that happens once* rather than a loop — exactly the brief's rule. Scroll-reveal
also means it can't be missed by someone who never moves their mouse.

Mechanics already in place: the atmosphere spans the document with authored
positions (`src/atmosphere/composition.ts`), so a one-shot object at a known
scroll depth is a natural addition. `IntersectionObserver` is already used for
pausing haze; the same hook fires the reveal.

The Bunny Hop sprite technique transfers directly: greyscale + alpha PNG strip,
animated by a pure-CSS `steps()` background-position sweep, no canvas, no
per-frame JS. See `player-integration-notes.md` §5. The extension's sprites are
generated from ~1536×1024 sources that are **not** in that repo — new art needs
new sources at high resolution.

**Caution — the one-bunny rule.** MVP 1 deliberately keeps zero bunnies outside
the player, so the emblem stays the player's mark. A *deer* is a different
animal and sidesteps that cleanly. A bunny running across the page would not.

Frequency matters more than the art: once per visit, not once per section.

---

## 2. Star click reveals a photo — B&W, misty, of Vero and her cat Lumi

> "On some star clicks, I'm thinking a picture appears in B&W, misty or cloudy,
> and it's a pic of me and my cat Lumi."

**Design note.** This is the single best candidate for the brief's "5%
unexpected magic", and it is *personal*, which is the whole thesis of the site.

MVP 1 Phase 5 already builds hidden discoveries and press-and-hold reveals, so
the machinery will exist. The open question is discoverability: a clickable
star has to be findable without a tutorial. Options worth trying — the star is
very slightly larger, or it is the one star that responds to pointer proximity.
MVP 1 already spends its one proximity reaction on the bloom; that reaction
could be *moved* to this star rather than added alongside it.

B&W and misty is exactly right and needs no filter work — the site is already
monochrome, and a soft-edged mask plus the existing haze does it.

**Only one or two stars should do this.** If several do, it becomes a gallery.

---

## 3. A click revealing a soft starburst of her constellation — Sagittarius

> "Another click could reveal a soft starburst of my constellation."

**Design note.** Pairs naturally with #2 and reuses the same reveal mechanism.

Sagittarius is a real star pattern, so the placement can be accurate rather
than decorative — the stars are already authored data with individual
positions, so a constellation is just a named group in `composition.ts` with
faint connecting lines drawn only during the reveal.

The risk is turning the sky into a diagram. Lines should appear on reveal and
fade out again, not persist. And the constellation's own stars should already
be present in the field beforehand, so the reveal *recognises* something that
was always there rather than adding something new. That is the difference
between a secret and a button.

---

## 4. Astrology — a moon rising, a sun rising

> "How can I incorporate some astrology stuff like a moon rising, sun rising?
> Just an idea, not sure what we'd do with these. Could also be on an about
> page."

**Design note.** Her own instinct is right that this needs a home before it
needs an implementation. Two directions worth separating:

- **Ambient/time-aware.** The page knows the visitor's local time and the field
  shifts very slightly — deeper at 3am than at noon. This is genuinely lovely
  and nearly free, because the tonal field is already a token-driven gradient.
  It also rewards return visits, which nothing else on the site does.
- **Iconographic.** Drawn moon/sun objects placed in the environment. Higher
  risk: this is where "celestial" tips into the literal sci-fi the brief rules
  out. Would need to be hand-drawn in the same pen-and-ink register as the
  other art, not symbols.

Recommend the first, and only consider the second once real art exists.

---

## 5. Interests, since it is still a portfolio

> "Since it still is a portfolio I want to put some stuff I've been interested
> in. KH (school years), Ariana Grande, fashion, dance, fun and silly websites,
> blogs, social media is fun, idk!!"

**Design note.** This is a content architecture question, not a visual one, and
it is probably the most important item on this list — it is what makes the site
*hers* rather than well-designed.

The content types in `src/content/types.ts` already support text, image,
drawing, quote and link, each rendering differently. A "things I like" section
needs no new types; it needs a new *treatment* and, more importantly, an
editorial decision about form.

What to avoid: a grid of logos, a tag cloud, or a bulleted list of nouns. Those
are the generic-portfolio tells the whole brief is organised against.

What might work instead — a loose constellation of fragments at different
scales and depths, where a Kingdom Hearts reference, a lyric, a fashion image
and a link to somebody's weird personal site all sit in the same space at
different sizes. That is the Tumblr/MySpace *idea* the brief takes as its
ancestor, executed with restraint. It is also the most natural place on the
site for the 15% whimsy budget.

Worth noting: "fun and silly websites" as a section of outbound links to other
people's personal sites is very much in the spirit of the old web — a blogroll.
That is a real and good idea on its own.

---

## Cross-cutting notes

- **Discoveries compete with each other.** MVP 1 caps at two hidden
  discoveries deliberately. #1, #2 and #3 are all reveals; shipping all three
  plus MVP 1's two means five things asking to be found, and the brief's
  scarcity rule ("VERY FEW should surprise") starts to break. Pick the best
  two or three total and cut the rest.
- **Everything here needs art.** #1, #2 and #4 are blocked on assets, not code.
  The photograph slot and the drawing slot in MVP 1 are already empty and
  waiting.
- **An about page** is mentioned in #4 and implied by #5. MVP 1 is deliberately
  one page with no routing. A second page is the natural start of MVP 2, and
  the token system, content types and atmosphere are all already page-agnostic.
