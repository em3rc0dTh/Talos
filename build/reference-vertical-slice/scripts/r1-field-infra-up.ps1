param(
  [string]$FallbackModel = 'qwen3-vl:4b-instruct',
  [int]$ModelReadyTimeoutSeconds = 1800
)

$ErrorActionPreference = 'Stop'

function Wait-ForTcp([string]$HostName, [int]$Port, [int]$TimeoutSeconds) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    try {
      $client = [System.Net.Sockets.TcpClient]::new()
      try {
        $task = $client.ConnectAsync($HostName, $Port)
        if ($task.Wait(1000) -and $client.Connected) { return $true }
      } finally {
        $client.Dispose()
      }
    } catch {}
    Start-Sleep -Seconds 1
  } while ((Get-Date) -lt $deadline)
  return $false
}

function Get-OllamaModelNames([string]$BaseUrl) {
  try {
    $response = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/tags" -TimeoutSec 5
    if (-not $response.models) { return @() }
    return @($response.models | ForEach-Object { [string]$_.name })
  } catch {
    return $null
  }
}

$sliceRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$composeFile = Join-Path $sliceRoot 'docker-compose.r1-field.yml'
if (-not (Test-Path $composeFile)) { throw "Compose file not found: $composeFile" }

$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) { throw 'Docker CLI is required.' }

docker compose version | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Docker Compose v2 is required (docker compose ...).' }

$previousModel = $env:TALOS_OLLAMA_MODEL
try {
  $env:TALOS_OLLAMA_MODEL = $FallbackModel

  Write-Host 'Starting Talos R1 field infrastructure...' -ForegroundColor Cyan
  Write-Host "  Compose : $composeFile"
  Write-Host '  Temporal: 127.0.0.1:17233 (UI 127.0.0.1:18233)'
  Write-Host '  Ollama  : http://127.0.0.1:11434'
  Write-Host "  Model   : $FallbackModel"
  Write-Host ''

  docker compose -f $composeFile up -d
  if ($LASTEXITCODE -ne 0) { throw "docker compose up failed with exit code $LASTEXITCODE" }

  if (-not (Wait-ForTcp '127.0.0.1' 17233 90)) {
    docker compose -f $composeFile ps
    throw 'Temporal did not become reachable on 127.0.0.1:17233.'
  }

  $deadline = (Get-Date).AddSeconds($ModelReadyTimeoutSeconds)
  $lastModels = @()
  do {
    $models = Get-OllamaModelNames 'http://127.0.0.1:11434'
    if ($null -ne $models) {
      $lastModels = $models
      if ($models -contains $FallbackModel) {
        Write-Host ''
        Write-Host 'Talos R1 field infrastructure READY' -ForegroundColor Green
        Write-Host '  Temporal : READY'
        Write-Host "  Ollama   : READY / $FallbackModel"
        Write-Host '  Compose  : talos-r1-field'
        Write-Host ''
        Write-Host 'Next: run .\scripts\r1-image-temporal-field-start.ps1 -TemporalAddress "127.0.0.1:17233" -RequireLocalFallback' -ForegroundColor Yellow
        return
      }
    }
    Start-Sleep -Seconds 3
  } while ((Get-Date) -lt $deadline)

  docker compose -f $composeFile logs --tail 100 ollama-init
  throw "Ollama became reachable but model '$FallbackModel' was not ready within $ModelReadyTimeoutSeconds seconds. Models seen: $($lastModels -join ', ')"
}
finally {
  if ($null -eq $previousModel) {
    Remove-Item Env:TALOS_OLLAMA_MODEL -ErrorAction SilentlyContinue
  } else {
    $env:TALOS_OLLAMA_MODEL = $previousModel
  }
}
