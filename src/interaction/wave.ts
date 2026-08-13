import {
  disturbField,
  holdPointerFrames,
  subscribePointerFrame,
} from "../atmosphere";
import { lerp } from "../lib/math";
import { splitPageText, type Particle, type TextField } from "./textSplit";

/* =============================================================================
   THE WAVEFRONT — the click displaces the page, rather than being drawn on it
   =============================================================================

   A ring painted over the page is a decal: it is a shape that travels in front
   of the content and the content never learns about it. Water does not do that.
   The disturbance IS the movement of the medium — you know a pond was touched
   because everything floating in it moved, not because a circle appeared.

   So a touch here emits an expanding annulus. Anything the annulus passes over
   is pushed outward along the radius and settles back behind it. Nothing ends
   up anywhere new, nothing is left displaced, and the ring that is still drawn
   is now the crest of that wave rather than the event itself — see the note at
   the bottom of this header, and `Ripple.module.css`.

   ── This is `pointer.ts`'s push field with a different driver ───────────────

   The arithmetic is deliberately the same shape as local repulsion in
   `atmosphere/pointer.ts`, because it is the same problem: distance, a
   smooth falloff, a normalised direction, an amplitude, asymmetric easing. The
   only difference is what supplies the falloff. There it is a steady-state disc
   centred on the cursor; here it is a moving annulus that decays. Everything
   structural about that file is copied on purpose:

     - positions are cached in DOCUMENT coordinates and NEVER measured inside a
       frame,
     - the range test is four comparisons before any square root,
     - a piece that is at rest and out of range is skipped before anything is
       interpolated or written,
     - a write only happens when the ROUNDED value changed, because the
       measurements in that file show the arithmetic is free and the CSSOM write
       is not.

   ── The model ───────────────────────────────────────────────────────────────

   For a wave of age u (0…1) and a piece at distance d from where the page was
   touched:

     radius   = R · (START + (1 − START)·u)        linear: constant speed
     s        = (d − radius) / BAND                where in the band it sits
     shape    = (1 − s²)²                for |s| < 1, else 0
     strength = R₀/(R₀ + radius) · taper(u)
     push     = amplitude · strength · shape · (piece − origin)/(d + CORE)

   CONSTANT SPEED, not eased. A wavefront that decelerates is a UI animation
   playing an ease-out; a wavefront that travels at one speed and dies out is a
   wave. All of the dissipation is in the amplitude, which is where it belongs.

   THE SHAPE IS A SINGLE POSITIVE LOBE. (1 − s²)² is zero at both edges of the
   band AND has zero slope there, so a piece cannot be caught starting to move —
   the same reason `pointer.ts` smoothsteps its falloff, and it matters more
   here because this moves something rather than dimming it. There is no
   negative lobe, no trough behind the crest: a trough pulls words toward the
   click, which does not read as being disturbed, it reads as being sucked in.

   `/(d + CORE)` NORMALISES THE DIRECTION AND KILLS THE CENTRE. Straight from
   `pointer.ts`: the piece you clicked ON barely moves, which is right — the
   disturbance travels outward from the contact, it does not eject what was
   underneath it.

   THE TAPER IS NOT DECORATION, IT IS A CORRECTNESS REQUIREMENT. The radius
   stops growing at R. Without a taper, a piece sitting at exactly d = R would
   be left parked at the peak of the band for ever, because the band it is
   inside stops moving. The taper runs the amplitude to zero over the last
   quarter of the wave's life, so the outermost pieces get a whisper and a
   return rather than a permanent offset.

   ── What became quieter to make room for it ─────────────────────────────────

   The ring. It used to be two rings and it was the whole effect; it is now one,
   dimmer, and its scale animation is tuned to draw the crest of THIS wave — it
   starts at the same fraction, ends at the same radius, and travels at the same
   constant speed, so the luminous band and the moving words are the same
   event. The wake that trailed it was deleted outright: a second visible ring
   with no displacement under it would be exactly the decal this work exists to
   remove. See the header of `Ripple.module.css`.

   ── Nothing here starts a loop ──────────────────────────────────────────────

   The page has one `requestAnimationFrame` loop and it belongs to the
   atmosphere. This borrows it with `holdPointerFrames()` and receives its
   frames through `subscribePointerFrame()`, exactly as dragging does, and
   releases both on the frame everything reaches rest. A page with no live wave
   costs nothing at all: no frames, no listeners doing arithmetic, no timers.
   ========================================================================== */

/** How long a wavefront takes to cross its radius. Matches the ring's animation
 *  duration, which is `--duration-transition-slow`, the top of the brief's
 *  TRANSITION band. The pieces then settle for another ~150ms behind it; that is
 *  a settle, not a duration, and it is the same distinction the trailing ring's
 *  offset used to make. */
const DURATION_SECONDS = 0.6;

/** Where the front starts, as a fraction of its final radius. Not zero, for the
 *  same reason the ring is not born at scale 0 — a disturbance has a size. */
export const WAVE_START_FRACTION = 0.16;

/** The furthest the front travels, in px, and the fraction of the viewport it
 *  is allowed to be on a small screen. 180px is about a hand's width: far
 *  enough to cross a couple of lines of prose, short enough that it is a local
 *  disturbance rather than an event that crosses the composition. */
const RADIUS_MAX = 180;
const RADIUS_VIEWPORT_FRACTION = 0.34;

/** Half-width of the moving band, in px. Wide relative to the travel on
 *  purpose: a narrow band snaps pieces up and down as it passes, a wide one
 *  swells them. */
const BAND = 100;

/** Amplitude halves when the front has travelled this far. The energy in a
 *  ring is spread over its circumference, so it thins as it grows; this is that
 *  in one number. */
const DECAY_RADIUS = 260;

/** When the amplitude starts being taken away, as a fraction of the life. */
const TAPER_START = 0.75;

/** Softens the direction vector at the point of contact. See the header. */
const CORE = 12;

/** Asymmetric easing, straight from the push field: prompt going out (~50ms),
 *  reluctant coming back (~125ms). Matched rates read as tracking; a fast
 *  return reads as a snap. Both sit inside the RESPONSE band. */
const ENGAGE_LAMBDA = 20;
const RELEASE_LAMBDA = 8;

/** Below this a piece is snapped to its target, which is how a return lands on
 *  exactly zero rather than approaching it for ever. */
const EPSILON = 0.02;

/** Displacements are published to a tenth of a pixel. Against a peak of a few
 *  px that is far below a device pixel, and it means the last third of every
 *  settle produces no CSSOM write at all. */
const ROUNDING = 10;

/** How many wavefronts may exist at once. Three, the same as the rings, and for
 *  the same reason: more than a calm visitor will ever produce, few enough that
 *  drumming on the trackpad reads as a disturbed surface rather than as chaos.
 *  The oldest is dropped; the pieces it was holding simply ease back. */
const MAX_WAVES = 3;

/** A tab restored after five minutes must not deliver a five-minute frame. */
const MAX_FRAME_SECONDS = 0.05;

interface Wave {
  /** Origin, in DOCUMENT coordinates — so the wave stays with the words if the
   *  page is scrolled while it is alive. The ring is anchored the same way. */
  readonly x: number;
  readonly y: number;
  /** Final radius, fixed at emission: a resize mid-wave must not resize it. */
  readonly maxRadius: number;
  /** Age, 0…1. */
  u: number;
  /** Recomputed once per frame, then read by every piece. */
  radius: number;
  strength: number;
  reach: number;
}

let field: TextField | null = null;
let particles: readonly Particle[] = [];
let waves: Wave[] = [];

/** Positions are stale. Set by resize and by the page changing shape; cleared
 *  by a measurement, which happens at the next emission and not before. */
let stale = true;

let unsubscribe: (() => void) | null = null;
let release: (() => void) | null = null;
let lastFrameTime = 0;

let resizeObserver: ResizeObserver | null = null;

/**
 * The radius a wave emitted right now would travel, in px.
 *
 * Exported so the drawn ring can size itself from the same number rather than
 * from a constant in a stylesheet that could drift away from this one. It is
 * read at the moment a ripple is rendered — which is the moment its wave is
 * emitted — so it is always current without anything listening to resize.
 */
export function waveRadius(): number {
  return Math.min(RADIUS_MAX, window.innerWidth * RADIUS_VIEWPORT_FRACTION);
}

/**
 * Break the page's text into movable pieces and start listening for waves.
 *
 * Returns the teardown, which puts every piece back. Mounted only when motion
 * is allowed: under `prefers-reduced-motion` the page is never restructured at
 * all, because restructuring the DOM for an effect that will not run is a cost
 * with no benefit attached to it.
 */
export function mountWaveField(): () => void {
  if (typeof window === "undefined") return () => {};

  field = splitPageText();
  particles = field.particles;
  stale = true;

  window.addEventListener("resize", markStale, { passive: true });

  /* The same trigger the atmosphere watches, for the same reason: the page's
     boxes move when fonts arrive and when an image finally has a size, and
     neither of those fires `resize`. Marking rather than measuring is what
     makes this free — see `markStale`. */
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(markStale);
    resizeObserver.observe(document.body);
  }

  return () => {
    window.removeEventListener("resize", markStale);
    resizeObserver?.disconnect();
    resizeObserver = null;

    stopFrames();
    waves = [];
    /* Clear before restoring, so no piece is returned to the document still
       carrying an inline transform. */
    for (const piece of particles) {
      piece.currentX = 0;
      piece.currentY = 0;
      piece.published = "";
      piece.element.style.translate = "";
    }
    field?.restore();
    field = null;
    particles = [];
  };
}

/**
 * The page was touched at this DOCUMENT position. Send a wave out from it.
 *
 * Called from the same gesture that spawns the drawn ring, on `pointerup`, and
 * only for a press that stayed put — a drag, a swipe and a text selection are
 * not touches. See `Ripple.tsx`, which owns that distinction.
 */
export function emitWave(x: number, y: number): void {
  /* The sky is not text and is not in `particles`. `--star-push-x/y` has
     exactly one writer — the atmosphere's own loop — so the wave is handed
     over as a fact rather than written from here, and the geometry travels
     with it so the drawn crest, the moving words and the moving stars cannot
     drift apart if any one of them is retuned.

     Above the particle guard on purpose: the sky still answers a click even on
     a page where text splitting produced nothing. */
  disturbField({
    x,
    y,
    radius: waveRadius(),
    startFraction: WAVE_START_FRACTION,
    seconds: DURATION_SECONDS,
  });

  if (particles.length === 0) return;

  /* Measured HERE, in an event handler, never in a frame — and only when
     something has actually changed shape since the last one. A visitor who
     resizes the window for a minute and never clicks pays nothing. */
  if (stale) measure();

  waves.push({
    x,
    y,
    maxRadius: waveRadius(),
    u: 0,
    radius: 0,
    strength: 0,
    reach: 0,
  });
  if (waves.length > MAX_WAVES) waves.shift();

  startFrames();
}

function markStale(): void {
  stale = true;
}

/**
 * Cache every piece's centre in DOCUMENT coordinates.
 *
 * One batch of reads with no writes between them, so it cannot thrash layout.
 * The current displacement is subtracted, which is what allows this to run
 * while a wave is in flight without the pieces drifting: what is wanted is
 * where the piece BELONGS, not where the wave has currently put it.
 */
function measure(): void {
  stale = false;
  const offsetX = window.scrollX;
  const offsetY = window.scrollY;

  for (const piece of particles) {
    const rect = piece.element.getBoundingClientRect();
    piece.x = rect.left + offsetX + rect.width / 2 - piece.currentX;
    piece.y = rect.top + offsetY + rect.height / 2 - piece.currentY;
  }
}

function startFrames(): void {
  if (unsubscribe !== null) return;
  lastFrameTime = performance.now();
  release = holdPointerFrames();
  unsubscribe = subscribePointerFrame(frame);
}

function stopFrames(): void {
  unsubscribe?.();
  unsubscribe = null;
  /* Releasing is not optional: an unreleased hold is a rAF loop running for the
     rest of the session. */
  release?.();
  release = null;
}

function frame(): void {
  const now = performance.now();
  const dt = Math.min((now - lastFrameTime) / 1000, MAX_FRAME_SECONDS);
  lastFrameTime = now;

  advance(dt);

  const engageT = 1 - Math.exp(-ENGAGE_LAMBDA * dt);
  const releaseT = 1 - Math.exp(-RELEASE_LAMBDA * dt);
  let settled = true;

  for (const piece of particles) {
    let toX = 0;
    let toY = 0;

    for (const wave of waves) {
      const dx = piece.x - wave.x;
      const dy = piece.y - wave.y;
      /* Four comparisons before any square root. Everything outside the band —
         which is nearly the whole page — leaves here. */
      if (dx > wave.reach || dx < -wave.reach) continue;
      if (dy > wave.reach || dy < -wave.reach) continue;

      const distance = Math.sqrt(dx * dx + dy * dy);
      const s = (distance - wave.radius) / BAND;
      if (s <= -1 || s >= 1) continue;

      const shape = (1 - s * s) * (1 - s * s);
      const push =
        (piece.amplitude * wave.strength * shape) / (distance + CORE);
      toX += dx * push;
      toY += dy * push;
    }

    /* At rest and unreached: nothing to interpolate, nothing to write. On a
       normal frame this is almost every piece on the page. */
    if (toX === 0 && toY === 0 && piece.currentX === 0 && piece.currentY === 0) {
      continue;
    }

    const leaving =
      Math.abs(toX) + Math.abs(toY) >
      Math.abs(piece.currentX) + Math.abs(piece.currentY);
    const rate = leaving ? engageT : releaseT;

    piece.currentX = lerp(piece.currentX, toX, rate);
    piece.currentY = lerp(piece.currentY, toY, rate);

    if (Math.abs(toX - piece.currentX) < EPSILON) piece.currentX = toX;
    else settled = false;

    if (Math.abs(toY - piece.currentY) < EPSILON) piece.currentY = toY;
    else settled = false;

    /* ROUNDED FIRST, AND A ROUNDED ZERO IS NO PROPERTY AT ALL. Two things
       depend on that, and the second one was measured:

       - A piece at rest is a piece with no inline style, which is both how it
         started and the only way to be certain that twenty clicks leave no
         residue anywhere on the page.
       - Adding or removing `translate` is two orders of magnitude more
         expensive than changing it — 0.011ms against 0.0001ms per element on
         this page, because the box gains and loses a paint layer. The band is
         283px wide at its widest and its outer edge is a whisper, so without
         this every piece it merely brushed past would pay that twice for a
         displacement of four hundredths of a pixel. */
    const nextX = Math.round(piece.currentX * ROUNDING) / ROUNDING;
    const nextY = Math.round(piece.currentY * ROUNDING) / ROUNDING;
    const next = nextX === 0 && nextY === 0 ? "" : `${nextX}px ${nextY}px`;

    if (next !== piece.published) {
      piece.published = next;
      piece.element.style.translate = next;
    }
  }

  if (settled && waves.length === 0) stopFrames();
}

/**
 * Age every wave and recompute the three numbers each frame reads from it.
 *
 * Compaction in place rather than `filter`, so a frame allocates nothing.
 */
function advance(dt: number): void {
  let live = 0;

  for (const wave of waves) {
    wave.u += dt / DURATION_SECONDS;
    if (wave.u >= 1) continue;

    wave.radius =
      wave.maxRadius *
      (WAVE_START_FRACTION + (1 - WAVE_START_FRACTION) * wave.u);
    wave.reach = wave.radius + BAND;
    wave.strength =
      (DECAY_RADIUS / (DECAY_RADIUS + wave.radius)) * taper(wave.u);

    waves[live] = wave;
    live += 1;
  }

  waves.length = live;
}

/** 1 until `TAPER_START`, then smoothly to 0 at the end of the wave's life. */
function taper(u: number): number {
  if (u <= TAPER_START) return 1;
  const k = (u - TAPER_START) / (1 - TAPER_START);
  return 1 - k * k * (3 - 2 * k);
}
