# Configura secrets das Edge Functions no Supabase via Management API
# Uso: .\scripts\setup-secrets.ps1 -AccessToken "sbp_..."
#
# Obter o Access Token em: https://app.supabase.com/account/tokens
# O .env precisa ter: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

param(
  [Parameter(Mandatory=$true)]
  [string]$AccessToken
)

$ProjectRef = "ebeapnydeiwuewxatuuw"
$EnvFile = Join-Path $PSScriptRoot "..\\.env"

if (-not (Test-Path $EnvFile)) {
  Write-Host "ERRO: arquivo .env nao encontrado em $EnvFile" -ForegroundColor Red
  Write-Host "Copie .env.example para .env e preencha os valores reais." -ForegroundColor Yellow
  exit 1
}

$requiredKeys = @("ANTHROPIC_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
$secrets = @()

Get-Content $EnvFile | ForEach-Object {
  if ($_ -match '^([^#\s][^=]*)=(.+)$') {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim().Trim('"').Trim("'")
    if ($name -in $requiredKeys -and $value -ne '') {
      $secrets += @{ name = $name; value = $value }
      Write-Host "  + $name" -ForegroundColor Cyan
    }
  }
}

$missing = $requiredKeys | Where-Object { $_ -notin ($secrets | ForEach-Object { $_.name }) }
if ($missing.Count -gt 0) {
  Write-Host "ERRO: chaves ausentes ou vazias no .env: $($missing -join ', ')" -ForegroundColor Red
  exit 1
}

Write-Host "`nEnviando $($secrets.Count) secrets para o Supabase (projeto: $ProjectRef)..." -ForegroundColor White

try {
  $body = ConvertTo-Json $secrets -Compress
  Invoke-RestMethod `
    -Method POST `
    -Uri "https://api.supabase.com/v1/projects/$ProjectRef/secrets" `
    -Headers @{
      "Authorization" = "Bearer $AccessToken"
      "Content-Type"  = "application/json"
    } `
    -Body $body | Out-Null

  Write-Host "Secrets configurados com sucesso!" -ForegroundColor Green
  Write-Host ""
  Write-Host "Proximos passos:" -ForegroundColor White
  Write-Host "  1. Configure pg_cron no Supabase SQL Editor (veja CLAUDE.md)" -ForegroundColor Gray
  Write-Host "  2. Faca o deploy do dashboard na Vercel" -ForegroundColor Gray
} catch {
  Write-Host "ERRO ao configurar secrets: $_" -ForegroundColor Red
  exit 1
}
