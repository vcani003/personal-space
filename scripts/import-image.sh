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
OUT="$OUT_DIR/$NAME.jpg"
mkdir -p "$OUT_DIR"

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

ffmpeg -loglevel error -y \
  -i "$INPUT" \
  -vf "scale='min($MAX_WIDTH,iw)':-2" \
  -map_metadata -1 \
  -q:v 4 \
  "$OUT"

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
echo "output:  public/assets/wall/$NAME.jpg"
echo "  ${DIMS}px · $SRC_SIZE → $OUT_SIZE"
echo
echo "reference it in src/content/wall.ts as: assets/wall/$NAME.jpg"
