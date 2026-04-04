#!/bin/bash
# Upload an image file to Cloudflare R2 and update uploads.md.
# Generates the same HTML snippet and log format as the upload Cloudflare Worker.
# Usage: mise run upload-image input.heic [caption]

set -euo pipefail

INPUT="${1:?Usage: $0 input.[heic|jpg|png|webp|gif] [caption]}"
CAPTION="${2:-$(basename "${INPUT%.*}")}"

BASE_URL="https://blob.bask.day"
BUCKET="binarybana-blog-static"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Use wrangler from the upload-worker local install
wrangler() {
  (cd "$REPO_ROOT/upload-worker" && bunx wrangler "$@")
}

if [ ! -f "$INPUT" ]; then
  echo "Error: file not found: $INPUT" >&2
  exit 1
fi

# Detect content type from extension
EXT="${INPUT##*.}"
EXT_LOWER=$(echo "$EXT" | tr '[:upper:]' '[:lower:]')
case "$EXT_LOWER" in
  heic|heif) CONTENT_TYPE="image/heic" ;;
  jpg|jpeg)  CONTENT_TYPE="image/jpeg" ;;
  png)       CONTENT_TYPE="image/png"  ;;
  webp)      CONTENT_TYPE="image/webp" ;;
  gif)       CONTENT_TYPE="image/gif"  ;;
  *)
    echo "Error: unsupported image type: $EXT" >&2
    exit 1
    ;;
esac

TODAY=$(date -u '+%Y-%m-%d')

# Derive stable key from file content hash (matching upload worker scheme)
HASH=$( (sha256sum "$INPUT" 2>/dev/null || shasum -a 256 "$INPUT") | cut -c1-16)
IMAGE_KEY="uploads/${HASH}.${EXT_LOWER}"

TMPDIR_WORK=$(mktemp -d)
trap 'rm -rf "$TMPDIR_WORK"' EXIT

UPLOADS_CURRENT="$TMPDIR_WORK/uploads-current.md"
UPLOADS_NEW="$TMPDIR_WORK/uploads-new.md"
ENTRY_FILE="$TMPDIR_WORK/entry.txt"
UPDATE_SCRIPT="$TMPDIR_WORK/update_log.py"

# Extract image dimensions using ffprobe
echo "Extracting image dimensions..."
DIMENSIONS=$(ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height -of csv=p=0 "$INPUT" 2>/dev/null || true)

if [ -z "$DIMENSIONS" ]; then
  echo "Error: could not extract dimensions from $INPUT" >&2
  exit 1
fi

WIDTH=$(echo "$DIMENSIONS" | cut -d',' -f1)
HEIGHT=$(echo "$DIMENSIONS" | cut -d',' -f2)

THUMB_HEIGHT=$(python3 -c "print(round($HEIGHT * 300 / $WIDTH))")
FULL_HEIGHT=$(python3 -c "print(round($HEIGHT * 800 / $WIDTH))")

echo "Dimensions: ${WIDTH}x${HEIGHT}"

# Upload image (skip if already exists in R2)
echo "Checking image in R2..."
if wrangler r2 object head "${BUCKET}/${IMAGE_KEY}" --remote 2>/dev/null; then
  echo "Image already exists in R2, skipping upload."
else
  echo "Uploading image to R2..."
  wrangler r2 object put "${BUCKET}/${IMAGE_KEY}" --file="$INPUT" --content-type="$CONTENT_TYPE" --remote > /dev/null 2>&1
fi

# Build HTML snippets (matching generateImageSnippets in index.ts)
ESCAPED_CAPTION=$(python3 -c "
import sys, html
print(html.escape(sys.argv[1], quote=True).replace(\"'\", '&#039;'))
" "$CAPTION")

THUMB_HTML="<a href=\"${BASE_URL}/cdn-cgi/image/format=auto/${IMAGE_KEY}\" target=\"_blank\">
  <img alt=\"${ESCAPED_CAPTION}\" src=\"${BASE_URL}/cdn-cgi/image/width=300,format=auto,dpr=2/${IMAGE_KEY}\"
       width=\"300\" height=\"${THUMB_HEIGHT}\" loading=\"lazy\" />
</a>"

FULL_HTML="<a href=\"${BASE_URL}/cdn-cgi/image/format=auto/${IMAGE_KEY}\" target=\"_blank\">
  <img alt=\"${ESCAPED_CAPTION}\" src=\"${BASE_URL}/cdn-cgi/image/width=800,format=auto,dpr=2/${IMAGE_KEY}\"
       width=\"800\" height=\"${FULL_HEIGHT}\" loading=\"lazy\" />
</a>"

# Build log entry (matching prependToLog in index.ts)
printf '### %s\n\n%s\n' "$CAPTION" "$FULL_HTML" > "$ENTRY_FILE"

# Fetch existing uploads.md
echo "Fetching uploads.md from R2..."
if wrangler r2 object get "${BUCKET}/uploads.md" --file="$UPLOADS_CURRENT" --remote > /dev/null 2>&1; then
  : # file saved directly to $UPLOADS_CURRENT
else
  touch "$UPLOADS_CURRENT"
fi

# Replicate prependToLog logic
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
echo "  Image: ${BASE_URL}/${IMAGE_KEY}"
echo ""
echo "uploads.md snippet:"
printf '### %s\n\n%s\n' "$CAPTION" "$FULL_HTML"
