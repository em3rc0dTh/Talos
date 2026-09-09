param(
  [Parameter(Mandatory=$true)][string]$ImagePath,
  [string]$Model = 'gemini-3.6-flash',
  [int]$TimeoutSeconds = 90
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $ImagePath -PathType Leaf)) {
  throw "Image not found: $ImagePath"
}

if ($TimeoutSeconds -lt 1 -or $TimeoutSeconds -gt 300) {
  throw 'TimeoutSeconds must be between 1 and 300.'
}

$hadExistingKey = Test-Path Env:GEMINI_API_KEY
$existingKey = if ($hadExistingKey) { $env:GEMINI_API_KEY } else { $null }
$ptr = [IntPtr]::Zero

try {
  if (-not $env:GEMINI_API_KEY) {
    $secure = Read-Host 'Paste GEMINI_API_KEY (input is hidden)' -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $env:GEMINI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  }

  node .\scripts\r1-gemini-vision-benchmark.mjs $ImagePath $Model $TimeoutSeconds
  if ($LASTEXITCODE -ne 0) {
    throw "Gemini benchmark exited with code $LASTEXITCODE"
  }
}
finally {
  if ($ptr -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
  if ($hadExistingKey) {
    $env:GEMINI_API_KEY = $existingKey
  } else {
    Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue
  }
}
