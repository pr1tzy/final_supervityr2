# AceLink ngrok setup helper. Usage: .\scripts\ngrok_ready.ps1

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path", "User")

Write-Host ""
Write-Host "=== AceLink ngrok env summary ===" -ForegroundColor Cyan
Write-Host "Project:  $root"
Write-Host "API port: 8001"
Write-Host "Webhook:  POST /api/orchestrator/webhook/lead"
Write-Host ""

if (Test-Path ".env") {
    Write-Host ".env: $root\.env"
    $secretLine = Select-String -Path ".env" -Pattern "^ORCHESTRATOR_WEBHOOK_SECRET=." -Quiet
    if ($secretLine) {
        Write-Host "  ORCHESTRATOR_WEBHOOK_SECRET: SET"
    } else {
        Write-Host "  ORCHESTRATOR_WEBHOOK_SECRET: MISSING"
    }
} else {
    Write-Host "WARNING: no .env file" -ForegroundColor Yellow
}

try {
    Invoke-RestMethod -Uri "http://localhost:8001/api/orchestrator/health" -TimeoutSec 3 | Out-Null
    Write-Host "API: RUNNING on http://localhost:8001" -ForegroundColor Green
} catch {
    Write-Host "API: NOT RUNNING - run .\scripts\start.ps1 first" -ForegroundColor Yellow
}

$ngrokCmd = Get-Command ngrok -ErrorAction SilentlyContinue
if ($ngrokCmd) {
    Write-Host "ngrok: $($ngrokCmd.Source)" -ForegroundColor Green
} else {
    Write-Host "ngrok: not in PATH - reopen terminal" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Run these two commands ===" -ForegroundColor Cyan
Write-Host "ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN"
Write-Host "ngrok http 8001"
Write-Host ""
Write-Host "Teammate URL: https://YOUR-NGROK/api/orchestrator/webhook/lead"
Write-Host "Header: X-Webhook-Secret from .env ORCHESTRATOR_WEBHOOK_SECRET"
Write-Host ""
