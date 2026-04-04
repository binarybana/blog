#!/bin/bash
# Re-containerize iPhone MOV (HEVC/AAC) to MP4 with AV1 video for HTML5 browser playback.
# Also produces a H.264 fallback for devices without AV1 hardware decode (e.g. iPhone 14 and older).
# Usage: mise run convert-video [-r] input.MOV [output.mp4]
# Options:
#   -r    Rotate 90 degrees counter-clockwise

ROTATE=0
while getopts "r" opt; do
  case "$opt" in
    r) ROTATE=1 ;;
    *) echo "Usage: $0 [-r] input.MOV [output.mp4]"; exit 1 ;;
  esac
done
shift $((OPTIND - 1))

INPUT="${1:?Usage: $0 [-r] input.MOV [output.mp4]}"
OUTPUT="${2:-${INPUT%.*}.mp4}"
OUTPUT_H264="${OUTPUT%.mp4}-h264.mp4"

if [ "$ROTATE" -eq 1 ]; then
  VF_ARGS=(-vf "transpose=2")
else
  VF_ARGS=()
fi

if [ -f "$OUTPUT" ]; then
  echo "AV1 output already exists, skipping: $OUTPUT"
else
  ffmpeg -y -nostdin -i "$INPUT" \
    -map 0:v:0 \
    -map 0:a:0 \
    -c:v libsvtav1 -crf 36 -preset 4 \
    -svtav1-params "color-primaries=9:transfer-characteristics=18:matrix-coefficients=9" \
    "${VF_ARGS[@]}" \
    -c:a copy \
    -movflags +faststart \
    "$OUTPUT"
fi

if [ -f "$OUTPUT_H264" ]; then
  echo "H.264 output already exists, skipping: $OUTPUT_H264"
else
  ffmpeg -y -nostdin -i "$INPUT" \
    -map 0:v:0 \
    -map 0:a:0 \
    -c:v libx264 -crf 25 -preset slow -profile:v high -pix_fmt yuv420p \
    "${VF_ARGS[@]}" \
    -c:a copy \
    -movflags +faststart \
    "$OUTPUT_H264"
fi
