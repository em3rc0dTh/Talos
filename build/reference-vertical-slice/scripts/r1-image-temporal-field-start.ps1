param(
  [string]$TemporalAddress = '127.0.0.1:7233',
  [string]$TemporalNamespace = 'default',
  [string]$TemporalTaskQueue = 'talos-r1-image-field',
  [switch]$EnableLocalFallback,
  [switch]$DisableLocalFallback,
  [switch]$RequireLocalFallback,
  [switch]$PullFallbackModel,
  [string]$GeminiModel = 'gemini-3.6-flash',
  [string]$FallbackModel = 'qwen3-vl:4b-instruct',
  [string]$OllamaBaseUrl = 'http://127.0.0.1:11434'
)

$ErrorActionPreference = 'Stop'

function Remove-EnvIfPresent([string]$Name) {
  Remove-Item "Env:$Name" -ErrorAction SilentlyContinue
}

function Normalize-BaseUrl([string]$Value) {
  return $Value.Trim().TrimEnd('/')
}

function Get-OllamaModelNames([string]$BaseUrl) {
  try {
    $response = Invoke-RestMethod -Method Get -Uri "$(Normalize-BaseUrl $BaseUrl)/api/tags" -TimeoutSec 5
    if (-not $response.models) { return @() }
    return @($response.models | ForEach-Object { [string]$_.name })
  } catch {
    return $null
  }
}

function Pull-OllamaModel([string]$BaseUrl, [string]$Model) {
  $body = @{ model = $Model; stream = $false } | ConvertTo-Json -Compress
  Invoke-RestMethod -Method Post -Uri "$(Normalize-BaseUrl $BaseUrl)/api/pull" -ContentType 'application/json' -Body $body -TimeoutSec 1800 | Out-Null
}

function Set-FieldEnvironment([string]$GitSha) {
  $env:TALOS_PRIVATE_PREVIEW_WORKSPACE_ID = "r1-image-temporal-field-$($GitSha.Substring(0, 12))"
  $env:TALOS_PRIVATE_PREVIEW_ACTOR_ID = 'em3rc0d-field-tester'
  $env:TALOS_PRIVATE_PREVIEW_BEARER_TOKEN = ([Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N'))
  $env:TALOS_PRIVATE_PREVIEW_BIND_HOST = '127.0.0.1'
  $env:TALOS_PRIVATE_PREVIEW_ALLOWED_HOSTNAMES = '127.0.0.1,localhost'
  $env:TALOS_PRIVATE_PREVIEW_ALLOWED_ORIGINS = 'NONE'
  $env:TALOS_PRIVATE_PREVIEW_MAX_JSON_BYTES = '20971520'
  $env:TALOS_PRIVATE_PREVIEW_MAX_IMAGE_BYTES = '12582912'
  $env:TALOS_PRIVATE_PREVIEW_IMAGE_MODE = 'REQUIRED'
  $env:TALOS_PRIVATE_PREVIEW_RUNTIME_MODE = 'TEMPORAL_EXECUTION'
  $env:TALOS_PRIVATE_PREVIEW_TEMPORAL_ADDRESS = $TemporalAddress
  $env:TALOS_PRIVATE_PREVIEW_TEMPORAL_NAMESPACE = $TemporalNamespace
  $env:TALOS_PRIVATE_PREVIEW_TEMPORAL_TASK_QUEUE = $TemporalTaskQueue
  $env:TALOS_PRODUCT_PORT = '8787'
  $env:TALOS_GEMINI_MODEL = $GeminiModel
  $env:TALOS_PRIVATE_PREVIEW_RUNTIME_DIR = Join-Path ([System.IO.Path]::GetTempPath()) "talos-r1-image-temporal-$GitSha"

  foreach ($name in @(
    'TALOS_IMAGE_PERCEPTION_PROVIDER_URL',
    'TALOS_IMAGE_PERCEPTION_PROVIDER_ID',
    'TALOS_IMAGE_PERCEPTION_PROVIDER_VERSION',
    'TALOS_IMAGE_PERCEPTION_MODEL_REF',
    'TALOS_IMAGE_PERCEPTION_MODEL_VERSION',
    'TALOS_IMAGE_PERCEPTION_PIPELINE_VERSION',
    'TALOS_IMAGE_PERCEPTION_TIMEOUT_MS',
    'TALOS_IMAGE_PERCEPTION_BEARER_TOKEN',
    'TALOS_IMAGE_PERCEPTION_PROVIDER_CLASS',
    'TALOS_IMAGE_PERCEPTION_EVIDENCE_MODE',
    'TALOS_IMAGE_PERCEPTION_FALLBACK_PROVIDER_URL',
    'TALOS_IMAGE_PERCEPTION_FALLBACK_PROVIDER_ID',
    'TALOS_IMAGE_PERCEPTION_FALLBACK_PROVIDER_VERSION',
    'TALOS_IMAGE_PERCEPTION_FALLBACK_MODEL_REF',
    'TALOS_IMAGE_PERCEPTION_FALLBACK_MODEL_VERSION',
    'TALOS_IMAGE_PERCEPTION_FALLBACK_PIPELINE_VERSION',
    'TALOS_IMAGE_PERCEPTION_FALLBACK_TIMEOUT_MS',
    'TALOS_IMAGE_PERCEPTION_FALLBACK_BEARER_TOKEN',
    'TALOS_IMAGE_PERCEPTION_FALLBACK_PROVIDER_CLASS',
    'TALOS_IMAGE_PERCEPTION_FALLBACK_EVIDENCE_MODE',
    'TALOS_OLLAMA_FALLBACK_ENABLED',
    'TALOS_OLLAMA_FALLBACK_URL',
    'TALOS_OLLAMA_FALLBACK_MODEL',
    'TALOS_OLLAMA_FALLBACK_TIMEOUT_MS',
    'TALOS_OLLAMA_AUTOMATION_FALLBACK_ENABLED',
    'TALOS_OLLAMA_AUTOMATION_FALLBACK_MODEL',
    'TALOS_OLLAMA_AUTOMATION_FALLBACK_URL',
    'TALOS_OLLAMA_AUTOMATION_FALLBACK_TIMEOUT_MS',
    'TALOS_OLLAMA_AUTOMATION_FALLBACK_MAX_OUTPUT_TOKENS'
  )) { Remove-EnvIfPresent $name }
}

function Clear-FieldEnvironment {
  foreach ($name in @(
    'TALOS_PRIVATE_PREVIEW_WORKSPACE_ID',
    'TALOS_PRIVATE_PREVIEW_ACTOR_ID',
    'TALOS_PRIVATE_PREVIEW_BEARER_TOKEN',
    'TALOS_PRIVATE_PREVIEW_BIND_HOST',
    'TALOS_PRIVATE_PREVIEW_ALLOWED_HOSTNAMES',
    'TALOS_PRIVATE_PREVIEW_ALLOWED_ORIGINS',
    'TALOS_PRIVATE_PREVIEW_MAX_JSON_BYTES',
    'TALOS_PRIVATE_PREVIEW_MAX_IMAGE_BYTES',
    'TALOS_PRIVATE_PREVIEW_IMAGE_MODE',
    'TALOS_PRIVATE_PREVIEW_RUNTIME_MODE',
    'TALOS_PRIVATE_PREVIEW_RUNTIME_DIR',
    'TALOS_PRIVATE_PREVIEW_TEMPORAL_ADDRESS',
    'TALOS_PRIVATE_PREVIEW_TEMPORAL_NAMESPACE',
    'TALOS_PRIVATE_PREVIEW_TEMPORAL_TASK_QUEUE',
    'TALOS_PRODUCT_PORT',
    'TALOS_GEMINI_MODEL',
    'TALOS_OLLAMA_FALLBACK_ENABLED',
    'TALOS_OLLAMA_FALLBACK_URL',
    'TALOS_OLLAMA_FALLBACK_MODEL',
    'TALOS_OLLAMA_FALLBACK_TIMEOUT_MS',
    'TALOS_OLLAMA_AUTOMATION_FALLBACK_ENABLED',
    'TALOS_OLLAMA_AUTOMATION_FALLBACK_MODEL',
    'TALOS_OLLAMA_AUTOMATION_FALLBACK_URL',
    'TALOS_OLLAMA_AUTOMATION_FALLBACK_TIMEOUT_MS',
    'TALOS_OLLAMA_AUTOMATION_FALLBACK_MAX_OUTPUT_TOKENS'
  )) { Remove-EnvIfPresent $name }
}

function Enable-LocalProviderFallback([string]$Model, [string]$BaseUrl) {
  $chatEndpoint = "$(Normalize-BaseUrl $BaseUrl)/api/chat"
  $env:TALOS_OLLAMA_FALLBACK_ENABLED = 'true'
  $env:TALOS_OLLAMA_FALLBACK_URL = $chatEndpoint
  $env:TALOS_OLLAMA_FALLBACK_MODEL = $Model
  $env:TALOS_OLLAMA_AUTOMATION_FALLBACK_ENABLED = 'true'
  $env:TALOS_OLLAMA_AUTOMATION_FALLBACK_URL = $chatEndpoint
  $env:TALOS_OLLAMA_AUTOMATION_FALLBACK_MODEL = $Model
}

$sliceRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Push-Location $sliceRoot
$createdGeminiKey = $false

try {
  if ($DisableLocalFallback -and ($EnableLocalFallback -or $RequireLocalFallback -or $PullFallbackModel)) {
    throw 'DisableLocalFallback cannot be combined with EnableLocalFallback, RequireLocalFallback or PullFallbackModel.'
  }

  $gitSha = (git rev-parse HEAD).Trim()
  if (-not $gitSha) { throw 'Unable to resolve the current Git SHA.' }

  $dirty = git status --porcelain
  if ($dirty) {
    throw "Field evidence requires a clean working tree. Commit/stash local changes first.`n$dirty"
  }

  $nodeVersion = (node --version).Trim()
  Write-Host 'Talos R1 image + Temporal executable field test' -ForegroundColor Cyan
  Write-Host "Git SHA : $gitSha"
  Write-Host "Node    : $nodeVersion"

  if (-not (Test-Path (Join-Path $sliceRoot 'node_modules'))) {
    Write-Host 'node_modules not found; running npm ci from the lock file...' -ForegroundColor Yellow
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed with exit code $LASTEXITCODE" }
  }

  if (-not $env:GEMINI_API_KEY) {
    $secure = Read-Host 'Paste GEMINI_API_KEY (input is hidden)' -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
      $env:GEMINI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    } finally {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
    $createdGeminiKey = $true
  }
  if (-not $env:GEMINI_API_KEY) { throw 'GEMINI_API_KEY is required for the primary field test.' }

  Set-FieldEnvironment $gitSha

  $strictLocalFallback = [bool]($EnableLocalFallback -or $RequireLocalFallback)
  $tryLocalFallback = -not [bool]$DisableLocalFallback
  $localFallbackEnabled = $false
  $localFallbackReason = 'explicitly disabled'

  if ($tryLocalFallback) {
    $ollamaModels = Get-OllamaModelNames $OllamaBaseUrl
    if ($null -eq $ollamaModels) {
      $localFallbackReason = "Ollama service is not reachable at $(Normalize-BaseUrl $OllamaBaseUrl)"
      if ($strictLocalFallback) {
        throw "Local AI fallback is required but $localFallbackReason. Start it with: .\scripts\r1-field-infra-up.ps1"
      }
      Write-Host "Local AI fallback unavailable: $localFallbackReason. Talos will start with degraded provider redundancy." -ForegroundColor Yellow
    } else {
      if ($PullFallbackModel -and ($ollamaModels -notcontains $FallbackModel)) {
        Write-Host "Pulling Docker/local fallback model $FallbackModel through the Ollama API..." -ForegroundColor Yellow
        Pull-OllamaModel $OllamaBaseUrl $FallbackModel
        $ollamaModels = Get-OllamaModelNames $OllamaBaseUrl
      }

      if ($null -eq $ollamaModels) {
        $localFallbackReason = 'Ollama became unavailable while checking its model inventory'
        if ($strictLocalFallback) { throw "Local AI fallback is required but $localFallbackReason." }
        Write-Host "Local AI fallback unavailable: $localFallbackReason. Talos will start with degraded provider redundancy." -ForegroundColor Yellow
      } elseif ($ollamaModels -notcontains $FallbackModel) {
        $localFallbackReason = "model '$FallbackModel' is not installed in the Ollama runtime"
        if ($strictLocalFallback) {
          throw "Local AI fallback is required but $localFallbackReason. Run: .\scripts\r1-field-infra-up.ps1 -FallbackModel '$FallbackModel'"
        }
        Write-Host "Local AI fallback unavailable: $localFallbackReason. Talos will start with degraded provider redundancy." -ForegroundColor Yellow
      } else {
        Enable-LocalProviderFallback $FallbackModel $OllamaBaseUrl
        $localFallbackEnabled = $true
        $localFallbackReason = 'configured'
      }
    }
  }

  Write-Host ''
  Write-Host 'Configuration:' -ForegroundColor Green
  Write-Host "  Primary AI          : Gemini / $GeminiModel"
  Write-Host "  Ollama runtime      : $(Normalize-BaseUrl $OllamaBaseUrl)"
  Write-Host "  Vision fallback     : $(if ($localFallbackEnabled) { "Ollama / $FallbackModel" } else { "not configured ($localFallbackReason)" })"
  Write-Host "  Automation fallback : $(if ($localFallbackEnabled) { "Ollama / $FallbackModel" } else { "not configured ($localFallbackReason)" })"
  Write-Host "  AI redundancy       : $(if ($localFallbackEnabled) { 'READY' } else { 'DEGRADED_AI_REDUNDANCY' })"
  Write-Host '  Runtime             : TEMPORAL_EXECUTION'
  Write-Host "  Temporal            : $TemporalAddress"
  Write-Host "  Namespace           : $TemporalNamespace"
  Write-Host "  TaskQueue           : $TemporalTaskQueue"
  Write-Host '  Product             : http://127.0.0.1:8787'
  Write-Host "  State               : $env:TALOS_PRIVATE_PREVIEW_RUNTIME_DIR"
  Write-Host ''
  if (-not $localFallbackEnabled) {
    Write-Host 'Talos remains available, but an unusable Gemini result will safe-stop AI-dependent work until a fallback/provider or manual source route is available.' -ForegroundColor Yellow
    Write-Host 'For release-grade provider redundancy, start the Docker Compose field infrastructure and run with -RequireLocalFallback.' -ForegroundColor Yellow
  }
  Write-Host 'Talos will fail before serving if Temporal is not reachable.' -ForegroundColor Yellow
  Write-Host 'KEEP THIS TERMINAL RUNNING after READY appears.' -ForegroundColor Yellow
  Write-Host ''

  npm run product
  if ($LASTEXITCODE -ne 0) { throw "npm run product exited with code $LASTEXITCODE" }
}
finally {
  Clear-FieldEnvironment
  if ($createdGeminiKey) { Remove-EnvIfPresent 'GEMINI_API_KEY' }
  Pop-Location
}
