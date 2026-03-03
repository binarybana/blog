#!/bin/bash
# Upload a converted MP4 video to Cloudflare R2 and update uploads.md.
# Generates the same HTML snippet and log format as the upload Cloudflare Worker.
# Usage: mise run upload-video input.mp4 [caption]

set -euo pipefail

INPUT="${1:?Usage: $0 input.mp4 [caption]}"
CAPTION="${2:-$(basename "${INPUT%.*}")}"

BASE_URL="https://blob.bask.day"
BUCKET="binarybana-blog-static"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Use wrangler from the upload-worker local install
wrangler() {
  (cd "$REPO_ROOT/upload-worker" && bunx wrangler "$@")
}

# Generate timestamp and random ID matching the upload worker format
TIMESTAMP=$(date -u '+%Y-%m-%d-%H%M%S')
ID=$(openssl rand -hex 4)
TODAY=$(date -u '+%Y-%m-%d')

VIDEO_KEY="uploads/${TIMESTAMP}-${ID}.mp4"
POSTER_KEY="uploads/${TIMESTAMP}-${ID}-poster.jpg"

TMPDIR_WORK=$(mktemp -d)
trap 'rm -rf "$TMPDIR_WORK"' EXIT

POSTER_FILE="$TMPDIR_WORK/poster.jpg"
UPLOADS_CURRENT="$TMPDIR_WORK/uploads-current.md"
UPLOADS_NEW="$TMPDIR_WORK/uploads-new.md"
ENTRY_FILE="$TMPDIR_WORK/entry.txt"
UPDATE_SCRIPT="$TMPDIR_WORK/update_log.py"

# Extract video dimensions
echo "Extracting video dimensions..."
WIDTH=$(ffprobe -v error -select_streams v:0 \
  -show_entries stream=width -of default=noprint_wrappers=1:nokey=1 "$INPUT")
HEIGHT=$(ffprobe -v error -select_streams v:0 \
  -show_entries stream=height -of default=noprint_wrappers=1:nokey=1 "$INPUT")

SCALED_HEIGHT=$(python3 -c "print(round($HEIGHT * 800 / $WIDTH))")
SCALED_WIDTH=800

echo "Dimensions: ${WIDTH}x${HEIGHT} -> ${SCALED_WIDTH}x${SCALED_HEIGHT}"

# Extract poster frame
echo "Extracting poster frame..."
ffmpeg -y -nostdin -i "$INPUT" -vframes 1 -q:v 2 -f image2 "$POSTER_FILE" 2>/dev/null

# Upload MP4
echo "Uploading video to R2..."
wrangler r2 object put "${BUCKET}/${VIDEO_KEY}" --file="$INPUT" --content-type="video/mp4" --remote

# Upload poster
echo "Uploading poster to R2..."
wrangler r2 object put "${BUCKET}/${POSTER_KEY}" --file="$POSTER_FILE" --content-type="image/jpeg" --remote

# Build the HTML snippet (matching generateVideoSnippet in index.ts)
SNIPPET="<video controls width=\"${SCALED_WIDTH}\" height=\"${SCALED_HEIGHT}\" preload=\"none\" poster=\"${BASE_URL}/cdn-cgi/image/width=800,format=auto/${POSTER_KEY}\">
  <source src=\"${BASE_URL}/${VIDEO_KEY}\" type=\"video/mp4\">
</video>"

# Build the log entry (matching prependToLog in index.ts)
printf '### %s\n\n%s\n' "$CAPTION" "$SNIPPET" > "$ENTRY_FILE"

# Fetch existing uploads.md (ignore error if it doesn't exist yet)
echo "Fetching uploads.md from R2..."
FETCH_TMP="$TMPDIR_WORK/fetch.md"
if wrangler r2 object get "${BUCKET}/uploads.md" --pipe --remote > "$FETCH_TMP" 2>/dev/null; then
  mv "$FETCH_TMP" "$UPLOADS_CURRENT"
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
wrangler r2 object put "${BUCKET}/uploads.md" --file="$UPLOADS_NEW" --content-type="text/markdown" --remote

echo ""
echo "Upload complete!"
echo "  Video:  ${BASE_URL}/${VIDEO_KEY}"
echo "  Poster: ${BASE_URL}/${POSTER_KEY}"
echo ""
echo "HTML snippet:"
echo "$SNIPPET"
