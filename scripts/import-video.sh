#!/usr/bin/env bash
#
# import-video.sh — bring a screen recording into the repo safely.
#
#   ./scripts/import-video.sh ~/Desktop/bunny-raw.mov bunny-hop
#   ./scripts/import-video.sh ~/rec.mp4 spatial-canvas 1600
#
#   1  source recording (mov / mp4 / webm / m4v)
#   2  output basename, no extension  → public/assets/demos/<name>.mp4
#                                       public/assets/demos/<name>.jpg  (poster)
#   3  max width in px, optional      → default 1280
#
# WHY THIS EXISTS
#
# The sibling script, import-image.sh, exists because photographs carry the
# exact coordinates of where they were taken. A screen recording leaks more
# than a photograph does, and none of it is in a metadata block where a tool
# can find it — it is IN THE PICTURE:
#
#   other browser tabs, and their titles
#   the bookmarks bar
#   notifications that arrive mid-take
#   an email address in a signed-in interface
#   file paths containing a real name
#
# No script can strip those. WATCH THE RECORDING BACK AT FULL SIZE BEFORE
# RUNNING THIS, and record in a clean browser profile with the bookmarks bar
# hidden and notifications off. This script prints that reminder and will not
# let it scroll past unread.
#
# What it CAN do is the mechanical part: strip container metadata (the device
# and software fields), drop the audio track, encode small enough to sit in a
# repository, and pull a poster frame so the page has something to show before
# the file arrives.

set -euo pipefail

SRC="${1:-}"
NAME="${2:-}"
MAX_WIDTH="${3:-1280}"

if [[ -z "$SRC" || -z "$NAME" ]]; then
  echo "usage: $0 <source-recording> <output-basename> [max-width]" >&2
  exit 64
fi

if [[ ! -f "$SRC" ]]; then
  echo "no such file: $SRC" >&2
  exit 66
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required: brew install ffmpeg" >&2
  exit 69
fi

DEST_DIR="public/assets/demos"
VIDEO="$DEST_DIR/$NAME.mp4"
POSTER="$DEST_DIR/$NAME.jpg"
mkdir -p "$DEST_DIR"

# ── the part no tool can check ───────────────────────────────────────────────
cat >&2 <<'WARN'

  BEFORE THIS SHIPS — a screen recording publishes whatever was on screen.
  Watch it back at full size and look for:
    · other tabs and their titles      · the bookmarks bar
    · notifications arriving           · an email address in a signed-in UI
    · file paths containing your name

WARN
read -r -p "  Watched it back and it is clean? [y/N] " CONFIRMED
# `tr` rather than `${VAR,,}` — that expansion is bash 4, and macOS ships 3.2.
if [[ "$(printf '%s' "$CONFIRMED" | tr '[:upper:]' '[:lower:]')" != "y" ]]; then
  echo "  stopped. nothing written." >&2
  exit 1
fi

# ── encode ───────────────────────────────────────────────────────────────────
#
#   scale=W:-2   keeps the aspect ratio and forces an even height, which H.264
#                requires and which is the usual cause of "height not divisible
#                by 2" failures on odd-sized recordings
#   crf 26       visually fine for flat UI footage, which compresses far better
#                than camera video
#   yuv420p      the pixel format every browser and phone can decode; ffmpeg
#                otherwise picks a 4:4:4 format from a screen capture that
#                Safari will refuse
#   -an          no audio track at all — this is a silent loop
#   +faststart   moves the index to the front so playback can begin before the
#                whole file has downloaded
#   -map_metadata -1
#                drops the container's device and software fields, for the same
#                reason the image script strips EXIF
echo "encoding…" >&2
ffmpeg -loglevel error -y -i "$SRC" \
  -vf "scale='min($MAX_WIDTH,iw)':-2" \
  -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p \
  -an -movflags +faststart -map_metadata -1 \
  "$VIDEO"

# A poster frame, one second in — frame zero of a screen recording is usually
# an empty window or a half-drawn page.
ffmpeg -loglevel error -y -ss 1 -i "$VIDEO" -frames:v 1 -q:v 4 -map_metadata -1 "$POSTER"

# ── verify ───────────────────────────────────────────────────────────────────
if ffprobe -loglevel error -show_streams "$VIDEO" 2>/dev/null | grep -q "codec_type=audio"; then
  echo "refusing to finish: an audio track survived in $VIDEO" >&2
  rm -f "$VIDEO" "$POSTER"
  exit 65
fi

SIZE_BYTES=$(wc -c < "$VIDEO" | tr -d ' ')
SIZE_MB=$(( SIZE_BYTES / 1000000 ))

echo >&2
echo "  wrote $VIDEO   (${SIZE_MB} MB)" >&2
echo "  wrote $POSTER" >&2

# GitHub Pages hard-limits a single file at 100 MB and softly limits the whole
# repository to about 1 GB. A demo that needs more than 25 MB wants trimming or
# a lower resolution, not a bigger budget.
if (( SIZE_MB > 25 )); then
  echo >&2
  echo "  ${SIZE_MB} MB is large for a repo-hosted demo. Consider a shorter clip" >&2
  echo "  or a smaller width: $0 \"$SRC\" \"$NAME\" 960" >&2
fi

echo >&2
echo "  then in the project page:" >&2
echo "    const DEMO: DemoSource = {" >&2
echo "      src: \"demos/$NAME.mp4\", poster: \"demos/$NAME.jpg\"," >&2
echo "      caption: \"…what the recording shows…\"," >&2
echo "    };" >&2
