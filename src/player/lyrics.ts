import { parseLrc } from "./lrc";
import type { LyricLine } from "./types";

/**
 * LRCLIB — where the words come from.
 *
 * =============================================================================
 * WHY THIS IS A FETCH AND NOT A FILE, which is the whole point
 * =============================================================================
 *
 * Lyrics are copyrighted. `types.ts` and `track.ts` both say, in as many
 * words, that if the real words are ever shown they come from a runtime source
 * and never from a checked-in string — and this module is what makes good on
 * that. Nothing in this repository contains a single lyric. The words exist in
 * the visitor's browser for as long as the tab is open and are not persisted,
 * not cached to disk, and not committed.
 *
 * ONE THING TO UNDERSTAND BEFORE THIS PAGE IS PUBLIC, flagged here because it
 * is easy to lose: the Bunny Hop extension's own notes point out that LRCLIB
 * inside a personal extension is a different posture from displaying lyrics on
 * a public website. Runtime fetching is the better side of that line, not a
 * resolution of it.
 *
 * =============================================================================
 * NO BACKEND, AND THAT WAS VERIFIED RATHER THAN ASSUMED
 * =============================================================================
 *
 * The extension runs these requests in its service worker, where
 * `host_permissions` covers the origin and CORS never enters into it. A web
 * page has no such escape, so the load-bearing question was whether LRCLIB
 * answers a cross-origin request from a plain page. It does — a request
 * carrying a foreign `Origin` comes back `200` with
 * `access-control-allow-origin: *`. That is the only reason this site needs no
 * server of its own.
 *
 * WHAT LEAVES THE BROWSER: a song title, an artist name and a duration. No
 * visitor identity, no page address, nothing about who is listening. It is a
 * GET to a public database asking what words go with a song, and it is worth
 * being able to state that precisely, because the site's privacy story should
 * be one sentence long.
 *
 * =============================================================================
 * TWO ENDPOINTS, IN ORDER OF PRECISION
 * =============================================================================
 *
 *   /api/get     exact: artist + track + duration. One row or a 404.
 *   /api/search  fuzzy: returns candidates, which we then have to rank.
 *
 * The exact lookup is tried first BECAUSE IT IS THE ONE THAT CANNOT BE WRONG.
 * Search will happily return a cover, a live version or a remix of the right
 * length, and lyrics that are subtly the wrong take are worse than no lyrics —
 * a screen that confidently shows the wrong words reads as broken in a way an
 * empty screen does not. Search runs only when the exact lookup finds nothing,
 * and its results are then filtered down to rows that actually carry synced
 * timestamps and sorted by how close their duration is to the recording's.
 */

const BASE_URL = "https://lrclib.net/api";
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * How far a search result's duration may sit from the recording's, in seconds.
 *
 * Eight. LRCLIB's own exact endpoint allows two, which is too strict here: the
 * duration we hold is YouTube's, and a YouTube upload routinely carries a
 * second or two of silence at either end that the release does not. Eight
 * absorbs that without being wide enough to admit a different arrangement —
 * an edit or an extended mix is off by far more than eight seconds.
 */
const DURATION_TOLERANCE_SECONDS = 8;

/** The subset of LRCLIB's row shape this site relies on. */
interface LrclibRow {
  readonly trackName?: unknown;
  readonly artistName?: unknown;
  readonly duration?: unknown;
  readonly instrumental?: unknown;
  readonly syncedLyrics?: unknown;
}

export interface LyricsQuery {
  readonly title: string;
  readonly artist: string;
  /** The RECORDING's duration, as reported by the player. Not the fixture's. */
  readonly durationSeconds: number;
}

/**
 * A resolved lyric sheet. `lines` is never empty — a lookup that produces no
 * synced lines resolves to `null` instead, so callers never have to distinguish
 * "found nothing" from "found an empty thing".
 */
export interface LyricSheet {
  readonly lines: readonly LyricLine[];
}

async function requestJson(url: string, signal: AbortSignal): Promise<unknown | null> {
  /* The caller's signal aborts this; so does the timeout. Both have to reach
     one `fetch`, and `AbortSignal.any` is what joins them without leaking a
     timer when the caller wins the race. */
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: AbortSignal.any([signal, timeout.signal]),
      headers: { accept: "application/json" },
    });
    /* 404 is the ordinary answer to "no lyrics for this", not a failure. Every
       non-OK status collapses to the same `null` for the same reason: there is
       exactly one thing this page can do about any of them. */
    if (!response.ok) return null;
    return (await response.json()) as unknown;
  } catch {
    /* Offline, blocked by an extension, DNS, timeout, malformed JSON. The
       screen's answer is identical in every case and it is not an error
       message — see the resting state in `Player.tsx`. */
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Pulls synced lines out of a row, if it has any worth having. */
function toLines(row: unknown): readonly LyricLine[] | null {
  if (typeof row !== "object" || row === null) return null;
  const value = row as LrclibRow;

  if (value.instrumental === true) return null;
  if (typeof value.syncedLyrics !== "string" || value.syncedLyrics.trim() === "") {
    return null;
  }

  const lines = parseLrc(value.syncedLyrics);
  return lines.length > 0 ? lines : null;
}

function durationOf(row: unknown): number | null {
  if (typeof row !== "object" || row === null) return null;
  const value = (row as LrclibRow).duration;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function query(path: string, params: Record<string, string>): string {
  return `${BASE_URL}${path}?${new URLSearchParams(params).toString()}`;
}

/**
 * Finds synced lyrics for a recording, or resolves `null`.
 *
 * NEVER THROWS AND NEVER REJECTS. Missing lyrics are the normal case for a
 * great many songs, and the player's answer to them — show nothing, keep
 * playing — is the same answer it gives to a network failure. Making the caller
 * write a `catch` to reach a branch it already has would be ceremony.
 */
export async function fetchLyrics(
  { title, artist, durationSeconds }: LyricsQuery,
  signal: AbortSignal,
): Promise<LyricSheet | null> {
  const rounded = Math.round(durationSeconds);

  const exact = await requestJson(
    query("/get", {
      artist_name: artist,
      track_name: title,
      duration: String(rounded),
    }),
    signal,
  );

  const exactLines = toLines(exact);
  if (exactLines) return { lines: exactLines };

  const found = await requestJson(
    query("/search", { artist_name: artist, track_name: title }),
    signal,
  );
  if (!Array.isArray(found)) return null;

  /* Closest duration first, among rows that actually carry timestamps. The
     ranking is deliberately this small: LRCLIB's search already matched the
     title and artist, so duration is the only axis left that distinguishes the
     album take from a live one — and a cleverer ranking here would be a second
     implementation of the extension's `ranking.ts` with none of its tests. */
  const best = found
    .map((row) => ({ row, duration: durationOf(row) }))
    .filter(
      (candidate) =>
        candidate.duration !== null &&
        Math.abs(candidate.duration - durationSeconds) <= DURATION_TOLERANCE_SECONDS,
    )
    .sort(
      (a, b) =>
        Math.abs((a.duration ?? 0) - durationSeconds) -
        Math.abs((b.duration ?? 0) - durationSeconds),
    );

  for (const candidate of best) {
    const lines = toLines(candidate.row);
    if (lines) return { lines };
  }

  return null;
}
