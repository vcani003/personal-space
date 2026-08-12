/**
 * COMPONENTS — stub. Owned by the design lead / visual-design-engineer.
 *
 * Page content components live here: the identity block, the post renderers,
 * and whatever else the composition needs. Layout and atmosphere do not — they
 * live in `src/atmosphere/`.
 *
 * House rules:
 *   - One CSS Module per component, colocated (`Thing.tsx` + `Thing.module.css`).
 *   - Never a raw hex, duration, size or z-index in a component or its module.
 *     If a value is missing, the token set is incomplete — add the token.
 *   - Each post kind renders differently. There is no universal card, and the
 *     content types are shaped to make writing one awkward on purpose.
 *   - Metadata (`post.meta`) is a separate object so it can be positioned away
 *     from the content it describes. Take advantage of that.
 *   - Not every section needs a container. Ask whether the content actually
 *     needs a panel before adding one.
 *   - Tolerate missing assets. Final art arrives gradually; nothing should
 *     break or look broken while a file is absent.
 */

export { Identity } from "./Identity";
export { Navigation } from "./Navigation";
export { About } from "./About";
export { JournalEntry } from "./Journal";
export { Meta, META_SEPARATOR } from "./Meta";
