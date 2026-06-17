# sincronizar-repos.ps1
# Sincroniza fabrica-saas e enemeop-flores com o GitHub.
# Roda uma vez por dia. Na primeira execucao do dia, exibe estado-atual.md.
# Nas demais chamadas da mesma sessao: silencio total (zero tokens).

param(
  [switch]$Force
)

$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$clauDir    = Join-Path (Join-Path $scriptDir "..") ".claude"
$markerFile = Join-Path $clauDir ".last-sync"
$estadoFile = Join-Path $clauDir "memory\estado-atual.md"
$hoje       = (Get-Date).ToString("yyyy-MM-dd")

# --- Saida silenciosa se ja sincronizado hoje ---
if (-not $Force) {
  if (Test-Path $markerFile) {
    $ultima = (Get-Content $markerFile -Raw).Trim()
    if ($ultima -eq $hoje) { exit 0 }
  }
}

function Get-BranchPrincipal {
  $branch = git symbolic-ref refs/remotes/origin/HEAD --short 2>$null
  if ($branch) { return ($branch -replace "^origin/", "") }
  $remotes = git branch -r 2>$null
  if ($remotes -match "origin/main")   { return "main" }
  if ($remotes -match "origin/master") { return "master" }
  return "main"
}

function Sincronizar-Repo {
  param([string]$Caminho, [string]$Nome)
  if (-not (Test-Path $Caminho)) { return }

  Push-Location $Caminho

  $branch  = Get-BranchPrincipal
  $status  = git status --porcelain 2>$null
  $aviso   = if ($status) { " [AVISO: alteracoes nao comitadas]" } else { "" }

  Write-Host "=== $Nome — branch: $branch$aviso ===" -ForegroundColor Cyan

  $pullOut = git pull origin $branch 2>$null
  $linha   = ($pullOut | Where-Object { $_ -match '\S' }) -join " | "
  if ($linha) { Write-Host "  pull: $linha" -ForegroundColor DarkGray }

  $aheadOut = git rev-list --count "origin/$branch..HEAD" 2>$null
  if ($LASTEXITCODE -eq 0 -and [int]($aheadOut.Trim()) -gt 0) {
    $ahead = [int]($aheadOut.Trim())
    Write-Host "  push: $ahead commit(s) local(is)..." -ForegroundColor Gray
    git push origin $branch 2>$null | Out-Null
  }

  Pop-Location
}

$fabricaCaminho = Resolve-Path (Join-Path $scriptDir "..") 2>$null
$enemeOpCaminho = Join-Path (Split-Path $fabricaCaminho -Parent) "enemeop-flores"

Write-Host ""
Write-Host "[sync] Primeiro acesso do dia — $hoje" -ForegroundColor Green
Sincronizar-Repo -Caminho $fabricaCaminho -Nome "Fabrica de SaaS"
Sincronizar-Repo -Caminho $enemeOpCaminho -Nome "Enemeop Flores"

# Gravar marcador
$hoje | Out-File -FilePath $markerFile -Encoding UTF8 -NoNewline

# Injetar estado-atual.md no contexto do Claude (uma vez por dia)
if (Test-Path $estadoFile) {
  Write-Host ""
  Write-Host "=== ESTADO ATUAL DO PROJETO (leia e continue de onde parou) ===" -ForegroundColor Yellow
  Get-Content $estadoFile -Raw | Write-Host -ForegroundColor White
}
