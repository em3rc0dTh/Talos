#!/usr/bin/env bash
# Git policy: this launcher must remain LF-only for WSL/Linux execution.
set -euo pipefail

FALLBACK_MODEL="${TALOS_OLLAMA_MODEL:-qwen3-vl:4b-instruct}"
MODEL_READY_TIMEOUT_SECONDS="${TALOS_MODEL_READY_TIMEOUT_SECONDS:-1800}"

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
if ! docker compose version >/dev/null 2>&1; then
  echo 'Docker Compose v2 is required (docker compose ...).' >&2
  exit 1
fi

legacy="$(docker ps --filter 'name=^/talos-temporal$' --format '{{.Names}}' 2>/dev/null || true)"
if [[ "$legacy" == "talos-temporal" ]]; then
  echo 'Stopping legacy talos-temporal container so Compose can own 127.0.0.1:17233...'
  docker stop talos-temporal >/dev/null
  echo 'Legacy container stopped and preserved (not deleted).'
fi

export TALOS_OLLAMA_MODEL="$FALLBACK_MODEL"

echo 'Starting Talos R1 field infrastructure...'
echo "  Docker  : WSL/Linux"
echo "  Compose : $compose_file"
echo '  Temporal: 127.0.0.1:17233 (UI 127.0.0.1:18233)'
echo '  Ollama  : http://127.0.0.1:11434'
echo "  Model   : $FALLBACK_MODEL"
echo

docker compose -f "$compose_file" up -d

for _ in $(seq 1 90); do
  if timeout 1 bash -c '</dev/tcp/127.0.0.1/17233' >/dev/null 2>&1; then
    temporal_ready=true
    break
  fi
  sleep 1
done
if [[ "${temporal_ready:-false}" != "true" ]]; then
  docker compose -f "$compose_file" ps
  echo 'Temporal did not become reachable on 127.0.0.1:17233.' >&2
  exit 1
fi

iterations=$(( MODEL_READY_TIMEOUT_SECONDS / 3 ))
if (( iterations < 1 )); then iterations=1; fi
for _ in $(seq 1 "$iterations"); do
  if docker compose -f "$compose_file" exec -T ollama ollama show "$FALLBACK_MODEL" >/dev/null 2>&1; then
    model_ready=true
    break
  fi
  sleep 3
done

if [[ "${model_ready:-false}" != "true" ]]; then
  docker compose -f "$compose_file" logs --tail 100 ollama-init || true
  echo "Ollama model '$FALLBACK_MODEL' was not ready within ${MODEL_READY_TIMEOUT_SECONDS}s." >&2
  exit 1
fi

echo
echo 'Talos R1 field infrastructure READY'
echo '  Temporal : READY'
echo "  Ollama   : READY / $FALLBACK_MODEL"
echo '  Docker   : WSL/Linux'
echo '  Compose  : talos-r1-field'
echo
echo 'Return to Windows PowerShell and run:'
echo '  .\scripts\r1-image-temporal-field-start.ps1 -TemporalAddress "127.0.0.1:17233" -RequireLocalFallback'
