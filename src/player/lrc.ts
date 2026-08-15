import type { LyricLine } from "./types";

/**
 * LRC PARSING.
 *
 * PORTED, NOT REWRITTEN, from `bunny-hop-player/src/common/lyrics/lrcParser.ts`.
 * Real-world LRC is messy in specific, well-known ways — two- and three-digit
 * fractions, several timestamps on one line, `[hh:mm:ss]` from some tools,
 * commas for decimal points, header tags, blank instrumental lines, duplicate
 * and out-of-order timestamps — and the extension's parser already survives all
 * of them. Writing a fresh one here would have been rediscovering that list one
 * malformed file at a time, in front of a visitor.
 *
 * WHAT WAS LEFT BEHIND: the metadata map and the plain-lyrics path. The website
 * has one use for a header tag (`[offset:]`, which it applies) and no use at all
 * for unsynced words — a lyric with no timestamp cannot drive a screen that
 * exists to follow a recording. Both are dropped rather than carried dead.
 */

/**
 * `[mm:ss]`, `[mm:ss.xx]`, `[mm:ss.xxx]`, and the `[hh:mm:ss.xx]` variant some
 * tools emit. A comma is accepted in place of the decimal point.
 */
const TIMESTAMP = /\[(\d{1,3}):(\d{1,2}(?:[.:,]\d{1,3})?)\]/g;

/** `[ti:Title]` style header tags — a word key with a non-numeric start. */
const METADATA_TAG = /^\[([a-zA-Z_][a-zA-Z0-9_-]*):(.*)\]$/;

/** Enhanced-LRC per-word timings, e.g. `<00:12.34>`. Stripped from display text. */
const WORD_TIMING = /<\d{1,3}:\d{1,2}(?:[.:,]\d{1,3})?>/g;

/**
 * Parses one timestamp body ("01:23.45") into seconds.
 *
 * The fractional part is scaled by its digit count, so `.5` is half a second,
 * `.45` is 450ms and `.456` is 456ms — the common two- and three-digit forms
 * both land where a human would expect.
 */
function parseTimestamp(minutesPart: string, secondsPart: string): number {
  const minutes = Number.parseInt(minutesPart, 10);
  const [wholeRaw, fractionRaw] = secondsPart.split(/[.:,]/);
  const whole = Number.parseInt(wholeRaw ?? "0", 10);

  let fraction = 0;
  if (fractionRaw) {
    const digits = fractionRaw.slice(0, 3);
    fraction = Number.parseInt(digits, 10) / 10 ** digits.length;
  }

  if (!Number.isFinite(minutes) || !Number.isFinite(whole)) return Number.NaN;
  return minutes * 60 + whole + fraction;
}

/** `[offset:+250]` in milliseconds, positive meaning "show the words earlier". */
function parseOffset(raw: string | undefined): number {
  if (raw === undefined) return 0;
  const milliseconds = Number.parseFloat(raw.trim());
  return Number.isFinite(milliseconds) ? milliseconds / 1000 : 0;
}

/** Removes a UTF-8 BOM and normalizes line endings. */
function splitLines(raw: string): string[] {
  return raw.replace(/^﻿/, "").split(/\r\n|\r|\n/);
}

/**
 * Parses synchronized LRC text into the shape `useLyricSync` already consumes.
 *
 * Lines come back sorted by time. The sort is stable on the original file order,
 * which keeps duplicate timestamps (two vocalists on one beat) in the order the
 * author wrote them.
 */
export function parseLrc(raw: string): LyricLine[] {
  if (typeof raw !== "string" || raw.trim() === "") return [];

  const metadata: Record<string, string> = {};
  const collected: Array<{ time: number; text: string; order: number }> = [];
  let order = 0;

  for (const rawLine of splitLines(raw)) {
    const line = rawLine.trim();
    if (line === "") continue;

    // Reset the shared regex before each line — it is stateful with /g.
    TIMESTAMP.lastIndex = 0;
    const times: number[] = [];
    let match: RegExpExecArray | null;
    let lastTimestampEnd = 0;

    while ((match = TIMESTAMP.exec(line)) !== null) {
      // Only LEADING timestamps count; a bracket mid-lyric is just text.
      if (match.index !== lastTimestampEnd) break;
      const seconds = parseTimestamp(match[1] ?? "", match[2] ?? "");
      if (Number.isFinite(seconds)) times.push(seconds);
      lastTimestampEnd = match.index + match[0].length;
    }

    if (times.length === 0) {
      const tag = METADATA_TAG.exec(line);
      if (tag?.[1] !== undefined) {
        metadata[tag[1].toLowerCase()] = (tag[2] ?? "").trim();
      }
      continue;
    }

    const text = line
      .slice(lastTimestampEnd)
      .replace(WORD_TIMING, "")
      .replace(/\s+/g, " ")
      .trim();

    // One entry per timestamp: `[00:10][01:20]text` is a repeated chorus line.
    for (const time of times) {
      collected.push({ time, text, order: order++ });
    }
  }

  const offsetSeconds = parseOffset(metadata.offset);

  const lines = collected
    .map((entry) => ({
      /* LRC convention: a positive offset means the words should appear
         EARLIER, so it is subtracted from each timestamp. */
      startTimeSeconds: Math.max(0, entry.time - offsetSeconds),
      text: entry.text,
      order: entry.order,
    }))
    .sort((a, b) =>
      a.startTimeSeconds === b.startTimeSeconds
        ? a.order - b.order
        : a.startTimeSeconds - b.startTimeSeconds,
    )
    .map(({ startTimeSeconds, text }): LyricLine => ({ startTimeSeconds, text }));

  /* Drops lines repeating BOTH the previous timestamp and its text — a common
     artefact of merged LRC files. Genuine duplicate timestamps carrying
     different text are kept, because those are real. */
  return lines.filter((line, index) => {
    const previous = lines[index - 1];
    return (
      previous === undefined ||
      previous.startTimeSeconds !== line.startTimeSeconds ||
      previous.text !== line.text
    );
  });
}
