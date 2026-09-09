param(
  [switch]$DeleteModelVolume
)

$ErrorActionPreference = 'Stop'
$sliceRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$composeFile = Join-Path $sliceRoot 'docker-compose.r1-field.yml'
if (-not (Test-Path $composeFile)) { throw "Compose file not found: $composeFile" }

if ($DeleteModelVolume) {
  docker compose -f $composeFile down -v
} else {
  docker compose -f $composeFile down
}
if ($LASTEXITCODE -ne 0) { throw "docker compose down failed with exit code $LASTEXITCODE" }

if ($DeleteModelVolume) {
  Write-Host 'Talos R1 field infrastructure stopped; persisted Ollama model volume deleted.' -ForegroundColor Yellow
} else {
  Write-Host 'Talos R1 field infrastructure stopped; Ollama model volume preserved.' -ForegroundColor Green
}
