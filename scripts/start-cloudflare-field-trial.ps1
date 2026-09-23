param(
  [Parameter(Mandatory = $true)]
  [string]$TunnelId,

  [string]$Hostname = "talos-test.vtkall.com",

  [string]$TalosOrigin = "http://localhost:8787"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
  throw "cloudflared is not installed or is not available on PATH."
}

Write-Host "Checking Talos origin: $TalosOrigin"
$status = Invoke-RestMethod -Uri "$TalosOrigin/api/status" -Method Get
if (-not $status) {
  throw "Talos status endpoint returned no response."
}
if ($status.status -and $status.status -ne "READY") {
  throw "Talos is not READY. Current status: $($status.status)"
}
Write-Host "Talos origin is reachable."

$cloudflaredDir = Join-Path $env:USERPROFILE ".cloudflared"
$credentialFile = Join-Path $cloudflaredDir "$TunnelId.json"
if (-not (Test-Path $credentialFile)) {
  throw "Tunnel credential file not found: $credentialFile. Run 'cloudflared tunnel login' and 'cloudflared tunnel create talos-field-trial' first."
}

$configFile = Join-Path $cloudflaredDir "talos-field-trial.yml"
$credentialYamlPath = $credentialFile -replace "\\", "/"

$config = @"
tunnel: $TunnelId
credentials-file: $credentialYamlPath

ingress:
  - hostname: $Hostname
    service: $TalosOrigin
  - service: http_status:404
"@

Set-Content -Path $configFile -Value $config -Encoding UTF8

Write-Host ""
Write-Host "Cloudflare config written to:"
Write-Host "  $configFile"
Write-Host ""
Write-Host "Public hostname:"
Write-Host "  https://$Hostname"
Write-Host ""
Write-Host "Only Talos is routed. Temporal ports 17233/18233 are not included."
Write-Host ""
Write-Host "Starting tunnel. Press Ctrl+C to stop the supervised field trial."
Write-Host ""

& cloudflared tunnel --config $configFile run $TunnelId
if ($LASTEXITCODE -ne 0) {
  throw "cloudflared exited with code $LASTEXITCODE"
}
