/* =============================================================================
   THE YOUTUBE IFRAME API — loaded lazily, typed locally, never a dependency
   =============================================================================

   NO NPM PACKAGE. The IFrame API is a script tag and a global; the only thing a
   package would add is a `@types/youtube` install for the handful of methods
   below, which are declared here instead. The project rule is that no
   dependency is added before the exact problem it solves is named, and "typing
   six methods" is not that problem.

   THIS IS THE SITE'S FIRST AND ONLY THIRD-PARTY RUNTIME REQUEST. Fonts are
   self-hosted precisely so that a visitor's browser talks to nobody but this
   origin. So the script is fetched on the FIRST PRESS OF PLAY and never before:
   a visitor who reads the page and leaves has made no request to Google, and
   the page has cost them nothing in latency either.

   TWO HOSTS ARE INVOLVED, and only one of them is our choice:

     www.youtube.com          serves `iframe_api`, the small loader script.
                              There is no nocookie variant of this URL. It is a
                              static script; the request itself is what reaches
                              Google, and it is the price of embedded playback.
     www.youtube-nocookie.com serves the PLAYER, via the `host` option below.
                              This is the strictly better of the two available
                              embed hosts and is what we pass.

   Everything here is inert until `loadYouTubeApi()` is called.
   ========================================================================== */

/** Player states, as the IFrame API reports them on `onStateChange`. */
export const PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

/**
 * The methods this site actually calls. Deliberately not the whole API surface:
 * a local declaration that lists only what is used is also a list of what the
 * player is allowed to do.
 */
export interface YouTubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlaybackRate(): number;
  getPlayerState(): number;
  getIframe(): HTMLIFrameElement;
  destroy(): void;
}

export interface YouTubePlayerEvent {
  target: YouTubePlayer;
}

export interface YouTubeDataEvent {
  target: YouTubePlayer;
  data: number;
}

export interface YouTubePlayerOptions {
  videoId: string;
  /** The embed host. We pass the nocookie one; see the header. */
  host?: string;
  width?: string;
  height?: string;
  playerVars?: Readonly<Record<string, string | number>>;
  events?: {
    onReady?: (event: YouTubePlayerEvent) => void;
    onStateChange?: (event: YouTubeDataEvent) => void;
    onError?: (event: YouTubeDataEvent) => void;
  };
}

export interface YouTubeApi {
  Player: new (host: HTMLElement, options: YouTubePlayerOptions) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: Partial<YouTubeApi>;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const API_SCRIPT_URL = "https://www.youtube.com/iframe_api";

/**
 * How long to wait for the script to arrive AND announce itself.
 *
 * `script.onerror` covers a refused connection, but not the two quieter
 * failures: a content blocker that answers with an empty 200, and a network
 * that accepts the request and never replies. Without a deadline those leave
 * the player in "loading" for the rest of the session, which is the state a
 * visitor reads as broken.
 */
const API_TIMEOUT_MS = 10_000;

/** One in-flight load for the whole document, whatever mounts ask for it. */
let pendingApi: Promise<YouTubeApi> | null = null;

/**
 * Fetch the IFrame API, once.
 *
 * Rejects rather than throwing asynchronously, so every failure — blocked
 * script, offline, silent timeout — arrives at one `catch` in the driver and
 * produces one honest state. A rejection also clears the cached promise, so a
 * visitor who was offline on their first press can succeed on their second.
 */
export function loadYouTubeApi(): Promise<YouTubeApi> {
  if (pendingApi !== null) return pendingApi;

  const promise = new Promise<YouTubeApi>((resolve, reject) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      reject(new Error("No document to load the YouTube API into."));
      return;
    }

    /* Already there — another mount loaded it, or the visitor came back to a
       page where the script is still resident. */
    const existing = window.YT;
    if (existing?.Player !== undefined) {
      resolve(existing as YouTubeApi);
      return;
    }

    let settled = false;
    const timer = window.setTimeout(() => {
      finish(null, new Error("The YouTube API did not answer."));
    }, API_TIMEOUT_MS);

    function finish(api: YouTubeApi | null, error: Error | null): void {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (api !== null) resolve(api);
      else reject(error ?? new Error("The YouTube API could not be loaded."));
    }

    /* The API announces itself through a global callback and there is no other
       hook. Anything already installed there is called first rather than
       clobbered — nothing else on this site installs one, but silently
       replacing a global is the kind of thing that is only ever discovered by
       breaking something. */
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      const api = window.YT;
      if (api?.Player !== undefined) finish(api as YouTubeApi, null);
      else finish(null, new Error("The YouTube API loaded without a player."));
    };

    const script = document.createElement("script");
    script.src = API_SCRIPT_URL;
    script.async = true;
    script.addEventListener("error", () => {
      finish(null, new Error("The YouTube API script was blocked or unreachable."));
    });
    document.head.appendChild(script);
  });

  promise.catch(() => {
    if (pendingApi === promise) pendingApi = null;
  });

  pendingApi = promise;
  return promise;
}
