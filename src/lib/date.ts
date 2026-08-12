/**
 * Date display.
 *
 * Content stores machine-readable ISO (`2026-02-14`, `2026-02`, or `2026`);
 * how a date *looks* is a design decision, and it is made here rather than at
 * six call sites.
 *
 * The chosen form is short month + year — `FEB 2026` — uppercased by the
 * metadata register's CSS. A day number is deliberately dropped: on a personal
 * site the month is the useful granularity, and `14 FEB 2026` reads like a
 * changelog. A year-only date stays year-only.
 *
 * Parsed manually rather than through `new Date()`, which interprets a
 * date-only ISO string as UTC and can therefore render the previous month for
 * anyone west of Greenwich.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatPostDate(iso: string): string {
  const [yearPart, monthPart] = iso.split("-");
  if (!yearPart) return iso;

  if (!monthPart) return yearPart;

  const monthIndex = Number(monthPart) - 1;
  const month = MONTHS[monthIndex];
  // An unparseable month degrades to the year rather than printing `undefined`.
  return month ? `${month} ${yearPart}` : yearPart;
}
