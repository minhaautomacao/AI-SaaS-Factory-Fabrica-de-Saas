# sincronizar-repos.ps1
# Sincroniza fabrica-saas e enemeop-flores com o GitHub.
# Detecta automaticamente os caminhos e o branch principal.
# Roda apenas uma vez por dia (marca em .claude/.last-sync).

param(
  [switch]$Force
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$markerFile = Join-Path (Join-Path (Join-Path $scriptDir "..") ".claude") ".last-sync"
$hoje = (Get-Date).ToString("yyyy-MM-dd")

if (-not $Force) {
  if (Test-Path $markerFile) {
    $ultima = (Get-Content $markerFile -Raw).Trim()
    if ($ultima -eq $hoje) {
      Write-Host "[sync] Ja sincronizado hoje ($hoje). Use -Force para forcar." -ForegroundColor DarkGray
      exit 0
    }
  }
}

function Get-BranchPrincipal {
  $branch = git symbolic-ref refs/remotes/origin/HEAD --short 2>$null
  if ($branch) { return ($branch -replace "^origin/", "") }
  # Fallback: tentar main depois master
  $remotes = git branch -r 2>$null
  if ($remotes -match "origin/main") { return "main" }
  if ($remotes -match "origin/master") { return "master" }
  return "main"
}

function Sincronizar-Repo {
  param([string]$Caminho, [string]$Nome)

  if (-not (Test-Path $Caminho)) {
    Write-Host "[sync] $Nome - pasta nao encontrada em: $Caminho" -ForegroundColor Yellow
    return
  }

  Write-Host ""
  Write-Host "=== $Nome ===" -ForegroundColor Cyan
  Push-Location $Caminho

  $branch = Get-BranchPrincipal
  Write-Host "  Branch: $branch" -ForegroundColor DarkGray

  # Verificar alteracoes nao comitadas
  $status = git status --porcelain 2>&1
  if ($status) {
    Write-Host "  AVISO: Ha alteracoes nao comitadas." -ForegroundColor Yellow
    Write-Host ($status | Out-String).Trim() -ForegroundColor DarkYellow
  }

  # Pull
  Write-Host "  [pull] Buscando atualizacoes..." -ForegroundColor Gray
  $pullOut = git pull origin $branch 2>&1
  Write-Host ("  " + ($pullOut -join "`n  ")) -ForegroundColor White

  # Push se houver commits locais
  $aheadOut = git rev-list --count "origin/$branch..HEAD" 2>&1
  if ($LASTEXITCODE -eq 0) {
    $ahead = [int]($aheadOut.Trim())
    if ($ahead -gt 0) {
      Write-Host "  [push] $ahead commit(s) local(is) - enviando..." -ForegroundColor Gray
      $pushOut = git push origin $branch 2>&1
      Write-Host ("  " + ($pushOut -join "`n  ")) -ForegroundColor White
    } else {
      Write-Host "  [ok] Nenhum commit local para enviar." -ForegroundColor DarkGray
    }
  }

  Write-Host "  [ok] $Nome pronto." -ForegroundColor Green
  Pop-Location
}

$fabricaCaminho = Resolve-Path (Join-Path $scriptDir "..") 2>$null
$enemeOpCaminho = Join-Path (Split-Path $fabricaCaminho -Parent) "enemeop-flores"

Write-Host "Sincronizando repositorios - $hoje" -ForegroundColor Cyan
Write-Host "  Fabrica: $fabricaCaminho" -ForegroundColor DarkGray
Write-Host "  Enemeop: $enemeOpCaminho" -ForegroundColor DarkGray

Sincronizar-Repo -Caminho $fabricaCaminho -Nome "Fabrica de SaaS"
Sincronizar-Repo -Caminho $enemeOpCaminho -Nome "Enemeop Flores"

$hoje | Out-File -FilePath $markerFile -Encoding UTF8 -NoNewline
Write-Host ""
Write-Host "[ok] Sync concluido. Proximo sync automatico amanha." -ForegroundColor Green
