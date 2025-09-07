#!/usr/bin/env bash
set -euo pipefail
: "${OPENSEARCH_URL:=http://localhost:9200}"
curl -s -X PUT "$OPENSEARCH_URL/t3" -H 'Content-Type: application/json' --data-binary @packages/search/mapping.json || true
echo "Index 't3' mapping applied."
