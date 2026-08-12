/**
 * STORAGE
 *
 * A very small typed wrapper over `localStorage`. One module, no dependencies.
 *
 * ── Contract ────────────────────────────────────────────────────────────────
 *
 * Nothing in here throws. Ever. Persistence is a nicety on this site — a
 * visitor with storage disabled, a full quota, or a hand-edited value must get
 * exactly the same page as everyone else, just without the remembered bit.
 *
 * Two shapes, pick per call site:
 *
 *   read(key, validate, fallback) → T
 *       The one you almost always want. Any failure yields `fallback`.
 *
 *   readResult(key, validate)     → StorageResult<T>
 *       When the difference between "never stored" and "stored but corrupt"
 *       actually changes behaviour.
 *
 *   write(key, value)             → WriteResult
 *       Returns an outcome instead of throwing. Ignoring the return value is a
 *       legitimate choice and is the common case.
 *
 * ── Keys ────────────────────────────────────────────────────────────────────
 *
 * Every key is namespaced and versioned: `personal-space:v1:<name>`.
 *
 * The version lives in the key rather than in the stored payload, so stale
 * data does not need migrating or validating — a `v2` read simply does not see
 * `v1` data, and `purgeOtherVersions()` sweeps it when convenient. Bump
 * `SCHEMA_VERSION` when a stored shape changes incompatibly.
 *
 * ── Validation ──────────────────────────────────────────────────────────────
 *
 * Reads take a type-guard. There is no schema library and there should not be
 * one: the stored shapes here are small enough that a hand-written guard is
 * shorter than a schema. A value that fails its guard is treated as corrupt
 * and removed, because the key is already version-scoped — anything that fails
 * is genuinely bad data, not a future format.
 */

const NAMESPACE = "personal-space";

/** Bump when a persisted shape changes incompatibly. Old keys are then
 *  invisible to reads and can be swept with `purgeOtherVersions()`. */
export const SCHEMA_VERSION = "v1";

const KEY_PREFIX = `${NAMESPACE}:${SCHEMA_VERSION}:`;
const NAMESPACE_PREFIX = `${NAMESPACE}:`;

/** `personal-space:v1:<name>` */
export function storageKey(name: string): string {
  return `${KEY_PREFIX}${name}`;
}

/* -------------------------------------------------------------------------- */
/* Results                                                                     */
/* -------------------------------------------------------------------------- */

export type StorageResult<T> =
  | { readonly status: "ok"; readonly value: T }
  /** No entry under this key. The normal first-visit case. */
  | { readonly status: "missing" }
  /** Present but unusable — bad JSON, or failed its validator. Already removed. */
  | { readonly status: "invalid" }
  /** Storage itself is unavailable: disabled, private mode, no window. */
  | { readonly status: "unavailable" };

export type WriteResult =
  | { readonly status: "ok" }
  | { readonly status: "unavailable" }
  /** Quota exceeded. Nothing was written; existing data is untouched. */
  | { readonly status: "full" }
  /** The value could not be serialised (cycles, BigInt, …). A programming
   *  error rather than an environment one — surfaced, still not thrown. */
  | { readonly status: "unserializable" };

export type Validator<T> = (value: unknown) => value is T;

/* -------------------------------------------------------------------------- */
/* Availability                                                                */
/* -------------------------------------------------------------------------- */

let cachedBackend: Storage | null | undefined;

/**
 * Accessing `window.localStorage` can itself throw (Safari private browsing,
 * blocked third-party storage, `SecurityError` under a file:// origin), so the
 * probe is a real write/remove round-trip, not a truthiness check.
 *
 * Cached: the answer does not change within a page life, and the probe is a
 * synchronous storage write we should not repeat on every read.
 */
function backend(): Storage | null {
  if (cachedBackend !== undefined) return cachedBackend;

  cachedBackend = null;
  try {
    if (typeof window === "undefined") return cachedBackend;
    const store = window.localStorage;
    const probe = `${KEY_PREFIX}__probe__`;
    store.setItem(probe, "1");
    store.removeItem(probe);
    cachedBackend = store;
  } catch {
    cachedBackend = null;
  }
  return cachedBackend;
}

/** Whether anything will actually persist. Useful for not offering a control
 *  that cannot work; never required in order to call the other functions. */
export function isStorageAvailable(): boolean {
  return backend() !== null;
}

/** Test seam. Forces the next call to re-probe. */
export function resetStorageProbe(): void {
  cachedBackend = undefined;
}

/* -------------------------------------------------------------------------- */
/* Read                                                                        */
/* -------------------------------------------------------------------------- */

export function readResult<T>(
  name: string,
  validate: Validator<T>,
): StorageResult<T> {
  const store = backend();
  if (store === null) return { status: "unavailable" };

  const key = storageKey(name);

  let raw: string | null;
  try {
    raw = store.getItem(key);
  } catch {
    return { status: "unavailable" };
  }

  if (raw === null) return { status: "missing" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    discard(store, key);
    return { status: "invalid" };
  }

  if (!validate(parsed)) {
    discard(store, key);
    return { status: "invalid" };
  }

  return { status: "ok", value: parsed };
}

/** The everyday read. Any failure — disabled, missing, corrupt — is `fallback`. */
export function read<T>(
  name: string,
  validate: Validator<T>,
  fallback: T,
): T {
  const result = readResult(name, validate);
  return result.status === "ok" ? result.value : fallback;
}

/* -------------------------------------------------------------------------- */
/* Write / remove                                                              */
/* -------------------------------------------------------------------------- */

export function write(name: string, value: unknown): WriteResult {
  const store = backend();
  if (store === null) return { status: "unavailable" };

  let serialised: string;
  try {
    serialised = JSON.stringify(value);
    // `JSON.stringify(undefined)` is `undefined`, not a string.
    if (typeof serialised !== "string") return { status: "unserializable" };
  } catch {
    return { status: "unserializable" };
  }

  try {
    store.setItem(storageKey(name), serialised);
    return { status: "ok" };
  } catch (error) {
    return isQuotaError(error)
      ? { status: "full" }
      : { status: "unavailable" };
  }
}

export function remove(name: string): void {
  discard(backend(), storageKey(name));
}

/**
 * Delete every `personal-space:*` key that is not the current version.
 * Optional housekeeping — call it once at startup if it ever matters. Reads
 * are already immune to stale versions, so this is only about not leaving
 * litter in someone's browser.
 */
export function purgeOtherVersions(): void {
  const store = backend();
  if (store === null) return;

  try {
    const stale: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (
        key !== null &&
        key.startsWith(NAMESPACE_PREFIX) &&
        !key.startsWith(KEY_PREFIX)
      ) {
        stale.push(key);
      }
    }
    // Collected first: removing during iteration reindexes the store.
    for (const key of stale) discard(store, key);
  } catch {
    /* housekeeping is never worth an error */
  }
}

/* -------------------------------------------------------------------------- */
/* Internals                                                                   */
/* -------------------------------------------------------------------------- */

function discard(store: Storage | null, key: string): void {
  if (store === null) return;
  try {
    store.removeItem(key);
  } catch {
    /* nothing useful to do */
  }
}

/**
 * Browsers disagree on how quota exhaustion is reported: name, legacy `code`
 * 22, and Firefox's `1014` / `NS_ERROR_DOM_QUOTA_REACHED` all occur.
 */
function isQuotaError(error: unknown): boolean {
  if (!(error instanceof DOMException)) return false;
  return (
    error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error.code === 22 ||
    error.code === 1014
  );
}

/* -------------------------------------------------------------------------- */
/* Validator building blocks                                                   */
/* -------------------------------------------------------------------------- */
/* Enough to hand-write a guard in one line at the call site. Not a schema
   library, and not the beginning of one.                                      */

export const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

export const isString = (value: unknown): value is string =>
  typeof value === "string";

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);
