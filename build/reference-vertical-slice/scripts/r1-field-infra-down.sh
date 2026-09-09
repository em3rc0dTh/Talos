#!/usr/bin/env bash
set -euo pipefail

slice_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
compose_file="$slice_root/docker-compose.r1-field.yml"

if [[ ! -f "$compose_file" ]]; then
  echo "Compose file not found: $compose_file" >&2
  exit 1
fi
if ! command -v docker >/dev/null 2>&1; then
  echo 'Docker CLI is required inside WSL/Linux.' >&2
  exit 1
fi

if [[ "${DELETE_MODEL_VOLUME:-false}" =~ ^(1|true|yes|on)$ ]]; then
  docker compose -f "$compose_file" down -v
  echo 'Talos R1 field infrastructure stopped; persisted Ollama model volume deleted.'
else
  docker compose -f "$compose_file" down
  echo 'Talos R1 field infrastructure stopped; Ollama model volume preserved.'
fi
