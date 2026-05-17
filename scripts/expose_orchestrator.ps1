# Expose local orchestrator (port 8001) via ngrok and print teammate curl template.
# Usage:  .\scripts\expose_orchestrator.ps1
# Prereq: API running (.\scripts\start.ps1) and ngrok installed.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env"

Write-Host "`n=== AceLink orchestrator — public exposure ===" -ForegroundColor Cyan

# Health check
try {
    $h = Invoke-RestMethod -Uri "http://localhost:8001/api/orchestrator/health" -TimeoutSec 5
    Write-Host "Local API: OK ($($h.status))" -ForegroundColor Green
} catch {
    Write-Host "Local API not reachable on :8001. Run: .\scripts\start.ps1" -ForegroundColor Red
    exit 1
}

$secret = $null
if (Test-Path $envFile) {
    foreach ($line in Get-Content $envFile) {
        if ($line -match '^ORCHESTRATOR_WEBHOOK_SECRET=(.+)$') {
            $secret = $Matches[1].Trim()
            break
        }
    }
}
if (-not $secret) {
    Write-Host "`nWARNING: Set ORCHESTRATOR_WEBHOOK_SECRET in .env before sharing publicly." -ForegroundColor Yellow
    $secret = "CHANGE_ME"
}

$ngrok = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrok) {
    Write-Host @"

Next steps (ngrok not in PATH):
  1. Install https://ngrok.com/download
  2. Run:  ngrok http 8001
  3. Copy the https://....ngrok-free.app URL
  4. Teammate POSTs to:  https://YOUR-URL/api/orchestrator/webhook/lead
     Header: X-Webhook-Secret: $secret

See docs/PUBLIC_WEBHOOK.md and docs/webhook-curl-for-teammate.txt

"@ -ForegroundColor White
    exit 0
}

Write-Host "`nStarting ngrok on port 8001 (Ctrl+C to stop)..." -ForegroundColor Yellow
Write-Host "Webhook URL pattern:" -ForegroundColor White
Write-Host "  https://<ngrok-host>/api/orchestrator/webhook/lead" -ForegroundColor Cyan
Write-Host "  Header: X-Webhook-Secret: $secret" -ForegroundColor Cyan
Write-Host "`nFull curl templates: docs\webhook-curl-for-teammate.txt`n" -ForegroundColor Gray

& ngrok http 8001
