#!/bin/bash
# List objects in the R2 bucket with an optional prefix.
# Usage: mise run list-r2 [prefix]
#
# Requires env vars (or set in ~/.bashrc / a .env file):
#   R2_ACCESS_KEY_ID      - R2 API token access key
#   R2_SECRET_ACCESS_KEY  - R2 API token secret key
#   R2_ACCOUNT_ID         - Cloudflare account ID

set -euo pipefail

PREFIX="${1:-}"
BUCKET="binarybana-blog-static"

: "${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID is not set}"
: "${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY is not set}"
: "${R2_ACCOUNT_ID:?R2_ACCOUNT_ID is not set}"

AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
uvx --from awscli aws s3 ls "s3://${BUCKET}/${PREFIX}" \
  --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
