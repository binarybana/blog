#!/bin/bash
# Re-containerize iPhone MOV (HEVC/AAC) to MP4 with AV1 video for HTML5 browser playback.
# Usage: mise run convert-video input.MOV [output.mp4]

INPUT="${1:?Usage: $0 input.MOV [output.mp4]}"
OUTPUT="${2:-${INPUT%.*}.mp4}"

ffmpeg -y -nostdin -i "$INPUT" \
  -map 0:v:0 \
  -map 0:a:0 \
  -c:v libsvtav1 -crf 30 -preset 4 \
  -svtav1-params "color-primaries=9:transfer-characteristics=18:matrix-coefficients=9" \
  -c:a copy \
  -movflags +faststart \
  "$OUTPUT"
