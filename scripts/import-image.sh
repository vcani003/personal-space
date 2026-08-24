#!/usr/bin/env bash
#
# import-image.sh — bring a personal photo into the repo safely.
#
#   ./scripts/import-image.sh ~/Desktop/code/tokyo.jpg tokyo-flowers
#   ./scripts/import-image.sh ~/photo.HEIC lumi-asleep 520
#
#   1  source image (jpg / jpeg / png / heic / webp)
#   2  output basename, no extension  → public/assets/wall/<name>.jpg
#   3  max width in px, optional      → default 760
#
# WHY THIS EXISTS
#
# Phones embed the exact latitude and longitude of where a photo was taken,
# plus the timestamp and the device. It is invisible, it survives AirDrop and
# copying, and `git add` does not care. Publishing a personal photo to a public
# site therefore publishes where its owner physically was, to within a few
# metres, on a specific afternoon.
#
# The first photo imported into this project carried 35.649, 139.790 — a street
# corner in Tokyo — and nothing about the file said so.
#
# So every image goes through here. It is not a suggestion; it is the only
# import path. The script strips ALL metadata rather than only the GPS block,
# because "which fields are sensitive" is a judgement and "keep none of them"
# is not.
#
# It also refuses to finish if a location survives, so a silent failure of the
# stripping step cannot end with the file sitting in `public/`.

set -euo pipefail

SRC="${1:-}"
NAME="${2:-}"
MAX_WIDTH="${3:-760}"

if [[ -z "$SRC" || -z "$NAME" ]]; then
  echo "usage: $0 <source-image> <output-basename> [max-width]" >&2
  exit 64
fi

if [[ ! -f "$SRC" ]]; then
  echo "no such file: $SRC" >&2
  exit 66
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$REPO_ROOT/public/assets/wall"
mkdir -p "$OUT_DIR"

# TRANSPARENCY DECIDES THE FORMAT, and getting this wrong is silent and total.
# JPEG has no alpha channel: a transparent drawing flattened to JPEG comes back
# as the same drawing on an opaque black rectangle, which on this site looks
# like a deliberate framed panel rather than a mistake. Charms are typically
# transparent PNGs, so the format cannot be a fixed choice.
#
# THE TEST IS WHETHER THE ALPHA IS USED, NOT WHETHER IT EXISTS. This used to ask
# `alphaextract` whether the image HAS an alpha channel, and a great many files
# have one that is fully opaque in every pixel — every macOS screenshot, for a
# start. Those were routed to PNG, which for a photographic image is roughly
# eight times the bytes of the identical-looking JPEG. A 3.7MB screenshot came
# out as a 1.6MB PNG where a 200KB JPEG was indistinguishable.
#
# So the alpha channel is extracted as greyscale and the bytes that are NOT 0xFF
# are counted. `tr -d` deletes every fully-opaque byte; whatever is left is real
# transparency. An image with no alpha channel at all makes `alphaextract` fail
# and emit nothing, which counts as zero and lands on JPEG — the same answer the
# old test gave, by a route that also covers the opaque-channel case.
NON_OPAQUE="$(ffmpeg -loglevel error -i "$SRC" -vf "alphaextract,format=gray" \
  -f rawvideo - 2>/dev/null | LC_ALL=C tr -d '\377' | wc -c | tr -d ' ')"

if [[ "$NON_OPAQUE" -gt 0 ]]; then
  HAS_ALPHA=1
  OUT="$OUT_DIR/$NAME.png"
  echo "  transparency: $NON_OPAQUE non-opaque pixels → PNG"
else
  HAS_ALPHA=0
  OUT="$OUT_DIR/$NAME.jpg"
  echo "  transparency: none used → JPEG"
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# ---------------------------------------------------------------------------
# 1. Report what is in the original, so the risk is visible rather than
#    silently handled.
# ---------------------------------------------------------------------------

LAT="$(mdls -raw -name kMDItemLatitude "$SRC" 2>/dev/null || echo '(null)')"
LON="$(mdls -raw -name kMDItemLongitude "$SRC" 2>/dev/null || echo '(null)')"

echo "source:  $SRC"
if [[ "$LAT" != "(null)" && -n "$LAT" ]]; then
  echo "  ⚠ LOCATION FOUND: $LAT, $LON  → will be removed"
else
  echo "  location: none detected"
fi

# ---------------------------------------------------------------------------
# 2. HEIC is the iPhone default and ffmpeg often cannot read it. sips can, and
#    ships with macOS, so normalise first and let the rest of the pipeline see
#    a format it definitely understands.
# ---------------------------------------------------------------------------

INPUT="$SRC"
case "${SRC##*.}" in
  heic | HEIC | heif | HEIF)
    INPUT="$WORK/normalised.jpg"
    sips -s format jpeg "$SRC" --out "$INPUT" >/dev/null
    ;;
esac

# ---------------------------------------------------------------------------
# 3. Resize and strip. `-map_metadata -1` drops every metadata stream: EXIF,
#    GPS, the maker note, the timestamp, the device. `-vf scale=W:-2` keeps the
#    aspect ratio and forces an even height, which some encoders require.
#    Images already narrower than the target are not upscaled.
# ---------------------------------------------------------------------------

if [[ "$HAS_ALPHA" == "1" ]]; then
  # PNG keeps the alpha channel. No quality flag — PNG is lossless, and the
  # size saving that matters for a drawing is the resize, not the encoder.
  ffmpeg -loglevel error -y \
    -i "$INPUT" \
    -vf "scale='min($MAX_WIDTH,iw)':-2" \
    -map_metadata -1 \
    "$OUT"

  # ── AND THEN STRIP THE CHUNKS FFMPEG WRITES ANYWAY ──────────────────────
  #
  # `-map_metadata -1` drops the CONTAINER's metadata. PNG metadata is not in a
  # container — it is chunks in the file — and ffmpeg's PNG encoder writes an
  # `eXIf` chunk from the decoded frame's side data regardless of that flag.
  # Verified: `-map_metadata:s:v -1`, `-bitexact`, `-sn -dn` and every
  # combination of them leave it in place.
  #
  # It was the verification step at the bottom that caught this, by refusing a
  # file and deleting it — which is the whole reason that step exists rather
  # than trusting the flag. The chunk in the case that found it held only
  # dimensions and the word "Screenshot", but "this one was harmless" is not a
  # policy, and the next one is a phone photo.
  #
  # PNG is a length-prefixed chunk format, so dropping the metadata chunks is a
  # straight rewrite. Everything structural is kept; only the four chunks that
  # carry text or EXIF are removed.
  python3 - "$OUT" <<'STRIP_PNG_CHUNKS'
import sys, struct

path = sys.argv[1]
data = open(path, "rb").read()
DROP = {b"eXIf", b"tEXt", b"iTXt", b"zTXt", b"tIME"}

out, i = [data[:8]], 8            # 8-byte PNG signature
while i < len(data):
    (length,) = struct.unpack(">I", data[i : i + 4])
    kind = data[i + 4 : i + 8]
    end = i + 12 + length         # length + type + payload + CRC
    if kind not in DROP:
        out.append(data[i:end])
    i = end

open(path, "wb").write(b"".join(out))
STRIP_PNG_CHUNKS
else
  ffmpeg -loglevel error -y \
    -i "$INPUT" \
    -vf "scale='min($MAX_WIDTH,iw)':-2" \
    -map_metadata -1 \
    -q:v 4 \
    "$OUT"
fi

# ---------------------------------------------------------------------------
# 4. Verify, and fail loudly if anything survived. Spotlight can lag on a file
#    written a moment ago, so the raw byte scan is the authority and the
#    Spotlight read is a second opinion.
# ---------------------------------------------------------------------------

OUT_LAT="$(mdls -raw -name kMDItemLatitude "$OUT" 2>/dev/null || echo '(null)')"
GPS_STRINGS="$(strings "$OUT" | grep -icE 'gps|exif' || true)"

if [[ "$OUT_LAT" != "(null)" && -n "$OUT_LAT" ]] || [[ "$GPS_STRINGS" != "0" ]]; then
  echo "  ✗ METADATA SURVIVED — refusing to leave this file in public/" >&2
  rm -f "$OUT"
  exit 1
fi

SRC_SIZE="$(du -h "$SRC" | cut -f1 | tr -d ' ')"
OUT_SIZE="$(du -h "$OUT" | cut -f1 | tr -d ' ')"
DIMS="$(sips -g pixelWidth -g pixelHeight "$OUT" | awk '/pixel/ {printf "%s ", $2}')"

echo "  ✓ clean — no location, no camera, no timestamp"
echo "output:  public/assets/wall/$(basename "$OUT")"
# The wall is where images usually go, and it is not where they must stay.
# Anything for a project page or a case study gets moved after import; the
# guarantee this script makes is about the file's CONTENTS, not its folder.
echo "  ${DIMS}px · $SRC_SIZE → $OUT_SIZE"
echo
echo "reference it in src/content/wall.ts as: wall/$(basename "$OUT")"
