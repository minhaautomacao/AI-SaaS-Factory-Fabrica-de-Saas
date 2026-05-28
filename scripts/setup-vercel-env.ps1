# Configura variáveis de ambiente do dashboard na Vercel
# Uso: .\scripts\setup-vercel-env.ps1
# Requer: vercel CLI autenticado + arquivo .env preenchido

$EnvFile = Join-Path $PSScriptRoot "..\\.env"
$Scope   = "essencial-auto-pecas-projects"

if (-not (Test-Path $EnvFile)) {
  Write-Host "ERRO: arquivo .env nao encontrado." -ForegroundColor Red
  Write-Host "Copie .env.example para .env e preencha os valores reais." -ForegroundColor Yellow
  exit 1
}

$vercelKeys = @(
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
  "CREDENTIAL_ENCRYPTION_KEY",
  "APP_PASSWORD"
)

$envVars = @{}
Get-Content $EnvFile | ForEach-Object {
  if ($_ -match '^([^#\s][^=]*)=(.+)$') {
    $name  = $matches[1].Trim()
    $value = $matches[2].Trim().Trim('"').Trim("'")
    if ($name -in $vercelKeys -and $value -ne '') {
      $envVars[$name] = $value
    }
  }
}

$missing = $vercelKeys | Where-Object { $_ -notin $envVars.Keys }
if ($missing.Count -gt 0) {
  Write-Host "AVISO: chaves ausentes ou vazias: $($missing -join ', ')" -ForegroundColor Yellow
  Write-Host "Estas precisam ser configuradas manualmente no Vercel Dashboard." -ForegroundColor Yellow
}

foreach ($key in $envVars.Keys) {
  Write-Host "  Configurando $key..." -ForegroundColor Cyan
  $value = $envVars[$key]
  # Adiciona para production, preview e development
  echo $value | vercel env add $key production --scope $Scope --yes 2>&1 | Out-Null
  echo $value | vercel env add $key preview    --scope $Scope --yes 2>&1 | Out-Null
  echo $value | vercel env add $key development --scope $Scope --yes 2>&1 | Out-Null
}

Write-Host ""
Write-Host "Variaveis configuradas: $($envVars.Count)/$($vercelKeys.Count)" -ForegroundColor Green
Write-Host ""
Write-Host "Fazendo novo deploy com as variaveis..." -ForegroundColor White
vercel deploy --prod --yes --scope $Scope 2>&1 | Select-String "fabrica-saas"
Write-Host ""
Write-Host "Pronto! Acesse: https://fabrica-saas.vercel.app" -ForegroundColor Green
