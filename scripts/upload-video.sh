#!/bin/bash
# Upload a converted MP4 video (AV1 + optional H.264 companion) to Cloudflare R2 and update uploads.md.
# Generates the same HTML snippet and log format as the upload Cloudflare Worker.
# Usage: mise run upload-video input.mp4 [caption]
# Accepts any of: clip.mp4, clip-h264.mp4, or clip (basename) — derives BASE automatically.

set -euo pipefail

INPUT="${1:?Usage: $0 input.mp4 [caption]}"

# Derive BASE by stripping known suffixes
BASE="${INPUT%.*}"          # strip extension
BASE="${BASE%-h264}"        # strip -h264 suffix if present
AV1_FILE="${BASE}.mp4"
H264_FILE="${BASE}-h264.mp4"

CAPTION="${2:-$(basename "$BASE")}"

BASE_URL="https://blob.bask.day"
BUCKET="binarybana-blog-static"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Use wrangler from the upload-worker local install
wrangler() {
  (cd "$REPO_ROOT/upload-worker" && bunx wrangler "$@")
}

# Check if AV1 file exists
if [ ! -f "$AV1_FILE" ]; then
  echo "Error: AV1 file not found: $AV1_FILE" >&2
  exit 1
fi

# Check if H.264 companion exists
HAS_H264=false
if [ -f "$H264_FILE" ]; then
  HAS_H264=true
fi

TODAY=$(date -u '+%Y-%m-%d')

# Derive stable keys from file content hashes (matching upload worker scheme)
if command -v sha256sum &>/dev/null; then
  AV1_HASH=$(sha256sum "$AV1_FILE" | cut -c1-16)
else
  AV1_HASH=$(shasum -a 256 "$AV1_FILE" | cut -c1-16)
fi
VIDEO_KEY="uploads/${AV1_HASH}.mp4"
H264_KEY="uploads/${AV1_HASH}-h264.mp4"
POSTER_KEY="uploads/${AV1_HASH}-poster.jpg"

TMPDIR_WORK=$(mktemp -d)
trap 'rm -rf "$TMPDIR_WORK"' EXIT

POSTER_FILE="$TMPDIR_WORK/poster.jpg"
UPLOADS_CURRENT="$TMPDIR_WORK/uploads-current.md"
UPLOADS_NEW="$TMPDIR_WORK/uploads-new.md"
ENTRY_FILE="$TMPDIR_WORK/entry.txt"
UPDATE_SCRIPT="$TMPDIR_WORK/update_log.py"

# Extract video dimensions from AV1 file
echo "Extracting video dimensions..."
WIDTH=$(ffprobe -v error -select_streams v:0 \
  -show_entries stream=width -of default=noprint_wrappers=1:nokey=1 "$AV1_FILE")
HEIGHT=$(ffprobe -v error -select_streams v:0 \
  -show_entries stream=height -of default=noprint_wrappers=1:nokey=1 "$AV1_FILE")

SCALED_HEIGHT=$(python3 -c "print(round($HEIGHT * 800 / $WIDTH))")
SCALED_WIDTH=800

echo "Dimensions: ${WIDTH}x${HEIGHT} -> ${SCALED_WIDTH}x${SCALED_HEIGHT}"

# Extract poster frame — prefer H.264 (already BT.709 SDR) over AV1 (needs colormatrix)
echo "Extracting poster frame..."
if [ "$HAS_H264" = true ]; then
  ffmpeg -y -nostdin -i "$H264_FILE" -vframes 1 \
    -vf "format=yuv420p,unsharp=5:5:0.8:3:3:0.0" \
    -q:v 2 -f image2 "$POSTER_FILE"
else
  ffmpeg -y -nostdin -i "$AV1_FILE" -vframes 1 \
    -vf "colormatrix=bt2020:bt709,format=yuv420p,unsharp=5:5:0.8:3:3:0.0" \
    -q:v 2 -f image2 "$POSTER_FILE"
fi

# Upload AV1 MP4
echo "Uploading AV1 video: ${VIDEO_KEY}"
wrangler r2 object put "${BUCKET}/${VIDEO_KEY}" --file="$AV1_FILE" --content-type="video/mp4" --remote
echo "  -> done."

# Upload H.264 companion if present
if [ "$HAS_H264" = true ]; then
  echo "Uploading H.264 video: ${H264_KEY}"
  wrangler r2 object put "${BUCKET}/${H264_KEY}" --file="$H264_FILE" --content-type="video/mp4" --remote
  echo "  -> done."
fi

# Upload poster
echo "Uploading poster: ${POSTER_KEY}"
wrangler r2 object put "${BUCKET}/${POSTER_KEY}" --file="$POSTER_FILE" --content-type="image/jpeg" --remote
echo "  -> done."

# Build the HTML snippet
POSTER_URL="${BASE_URL}/cdn-cgi/image/width=800,format=auto/${POSTER_KEY}"
if [ "$HAS_H264" = true ]; then
  SNIPPET="<video controls width=\"${SCALED_WIDTH}\" height=\"${SCALED_HEIGHT}\" preload=\"none\" poster=\"${POSTER_URL}\">
  <source src=\"${BASE_URL}/${VIDEO_KEY}\" type='video/mp4; codecs=\"av01.0.04M.08\"'>
  <source src=\"${BASE_URL}/${H264_KEY}\" type=\"video/mp4\">
</video>"
else
  SNIPPET="<video controls width=\"${SCALED_WIDTH}\" height=\"${SCALED_HEIGHT}\" preload=\"none\" poster=\"${POSTER_URL}\">
  <source src=\"${BASE_URL}/${VIDEO_KEY}\" type=\"video/mp4\">
</video>"
fi

# Build the log entry (matching prependToLog in index.ts)
printf '### %s\n\n%s\n' "$CAPTION" "$SNIPPET" > "$ENTRY_FILE"

# Fetch existing uploads.md (ignore error if it doesn't exist yet)
echo "Fetching uploads.md from R2..."
if wrangler r2 object get "${BUCKET}/uploads.md" --file="$UPLOADS_CURRENT" --remote > /dev/null 2>&1; then
  : # file saved directly to $UPLOADS_CURRENT
else
  touch "$UPLOADS_CURRENT"
fi

# Write the Python helper that replicates prependToLog logic
cat > "$UPDATE_SCRIPT" << 'PYEOF'
import sys

current_file, entry_file, out_file, date_header = sys.argv[1:]

try:
    with open(current_file) as f:
        existing = f.read()
except FileNotFoundError:
    existing = ''

with open(entry_file) as f:
    entry = f.read()

if date_header in existing:
    idx = existing.index(date_header)
    after = idx + len(date_header)
    new_content = existing[:after] + '\n\n' + entry + '\n' + existing[after:]
else:
    new_content = date_header + '\n\n' + entry
    if existing.strip():
        new_content += '\n' + existing

with open(out_file, 'w') as f:
    f.write(new_content)
PYEOF

python3 "$UPDATE_SCRIPT" "$UPLOADS_CURRENT" "$ENTRY_FILE" "$UPLOADS_NEW" "## ${TODAY}"

# Upload updated uploads.md
echo "Updating uploads.md in R2..."
wrangler r2 object put "${BUCKET}/uploads.md" --file="$UPLOADS_NEW" --content-type="text/markdown" --remote > /dev/null 2>&1

echo ""
echo "Upload complete!"
echo "  AV1 video:  ${BASE_URL}/${VIDEO_KEY}"
if [ "$HAS_H264" = true ]; then
  echo "  H.264 video: ${BASE_URL}/${H264_KEY}"
fi
echo "  Poster: ${BASE_URL}/${POSTER_KEY}"
echo ""
echo "uploads.md snippet:"
printf '### %s\n\n%s\n' "$CAPTION" "$SNIPPET"
