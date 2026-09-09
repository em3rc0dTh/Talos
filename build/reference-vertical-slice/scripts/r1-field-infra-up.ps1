param(
  [string]$FallbackModel = 'qwen3-vl:4b-instruct',
  [int]$ModelReadyTimeoutSeconds = 1800
)

$ErrorActionPreference = 'Stop'
$script:DockerMode = $null
$script:ComposeFileForDocker = $null

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

function Initialize-Docker([string]$ComposeFile) {
  $nativeDocker = Get-Command docker -ErrorAction SilentlyContinue
  if ($nativeDocker) {
    & docker compose version | Out-Null
    if ($LASTEXITCODE -eq 0) {
      $script:DockerMode = 'WINDOWS'
      $script:ComposeFileForDocker = $ComposeFile
      return
    }
  }

  $wsl = Get-Command wsl.exe -ErrorAction SilentlyContinue
  if ($wsl) {
    & wsl.exe docker compose version | Out-Null
    if ($LASTEXITCODE -eq 0) {
      $wslPath = (& wsl.exe wslpath -a $ComposeFile | Out-String).Trim()
      if (-not $wslPath) { throw 'Unable to translate the Compose path for WSL Docker.' }
      $script:DockerMode = 'WSL'
      $script:ComposeFileForDocker = $wslPath
      return
    }
  }

  throw 'Docker Compose is unavailable. Talos supports either Docker on Windows PATH or Docker inside WSL (wsl.exe docker compose ...).'
}

function Invoke-Docker {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
  if ($script:DockerMode -eq 'WINDOWS') {
    & docker @Arguments
  } elseif ($script:DockerMode -eq 'WSL') {
    & wsl.exe docker @Arguments
  } else {
    throw 'Docker runtime has not been initialized.'
  }
}

function Stop-LegacyTemporalIfRunning {
  $legacy = (Invoke-Docker ps --filter 'name=^/talos-temporal$' --format '{{.Names}}' 2>$null | Out-String).Trim()
  if ($legacy -eq 'talos-temporal') {
    Write-Host 'Stopping legacy talos-temporal container so Compose can own 127.0.0.1:17233...' -ForegroundColor Yellow
    Invoke-Docker stop talos-temporal | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Unable to stop legacy talos-temporal container.' }
    Write-Host 'Legacy container stopped and preserved (not deleted).' -ForegroundColor Yellow
  }
}

$sliceRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$composeFile = Join-Path $sliceRoot 'docker-compose.r1-field.yml'
if (-not (Test-Path $composeFile)) { throw "Compose file not found: $composeFile" }

Initialize-Docker $composeFile

$previousModel = $env:TALOS_OLLAMA_MODEL
try {
  $env:TALOS_OLLAMA_MODEL = $FallbackModel

  Write-Host 'Starting Talos R1 field infrastructure...' -ForegroundColor Cyan
  Write-Host "  Docker  : $script:DockerMode"
  Write-Host "  Compose : $script:ComposeFileForDocker"
  Write-Host '  Temporal: 127.0.0.1:17233 (UI 127.0.0.1:18233)'
  Write-Host '  Ollama  : http://127.0.0.1:11434'
  Write-Host "  Model   : $FallbackModel"
  Write-Host ''

  Stop-LegacyTemporalIfRunning

  Invoke-Docker compose -f $script:ComposeFileForDocker up -d
  if ($LASTEXITCODE -ne 0) { throw "docker compose up failed with exit code $LASTEXITCODE" }

  if (-not (Wait-ForTcp '127.0.0.1' 17233 90)) {
    Invoke-Docker compose -f $script:ComposeFileForDocker ps
    throw 'Temporal did not become reachable from Windows on 127.0.0.1:17233. If Docker is in WSL, verify WSL localhost forwarding.'
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
        Write-Host "  Docker   : $script:DockerMode"
        Write-Host '  Compose  : talos-r1-field'
        Write-Host ''
        Write-Host 'Next: run .\scripts\r1-image-temporal-field-start.ps1 -TemporalAddress "127.0.0.1:17233" -RequireLocalFallback' -ForegroundColor Yellow
        return
      }
    }
    Start-Sleep -Seconds 3
  } while ((Get-Date) -lt $deadline)

  Invoke-Docker compose -f $script:ComposeFileForDocker logs --tail 100 ollama-init
  throw "Ollama became reachable but model '$FallbackModel' was not ready within $ModelReadyTimeoutSeconds seconds. Models seen: $($lastModels -join ', ')"
}
finally {
  if ($null -eq $previousModel) {
    Remove-Item Env:TALOS_OLLAMA_MODEL -ErrorAction SilentlyContinue
  } else {
    $env:TALOS_OLLAMA_MODEL = $previousModel
  }
}
