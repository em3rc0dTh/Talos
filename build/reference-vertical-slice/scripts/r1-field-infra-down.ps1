param(
  [switch]$DeleteModelVolume
)

$ErrorActionPreference = 'Stop'
$script:DockerMode = $null
$script:ComposeFileForDocker = $null

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

  throw 'Docker Compose is unavailable. Talos supports either Docker on Windows PATH or Docker inside WSL.'
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

$sliceRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$composeFile = Join-Path $sliceRoot 'docker-compose.r1-field.yml'
if (-not (Test-Path $composeFile)) { throw "Compose file not found: $composeFile" }
Initialize-Docker $composeFile

if ($DeleteModelVolume) {
  Invoke-Docker compose -f $script:ComposeFileForDocker down -v
} else {
  Invoke-Docker compose -f $script:ComposeFileForDocker down
}
if ($LASTEXITCODE -ne 0) { throw "docker compose down failed with exit code $LASTEXITCODE" }

if ($DeleteModelVolume) {
  Write-Host "Talos R1 field infrastructure stopped via $script:DockerMode; persisted Ollama model volume deleted." -ForegroundColor Yellow
} else {
  Write-Host "Talos R1 field infrastructure stopped via $script:DockerMode; Ollama model volume preserved." -ForegroundColor Green
}
