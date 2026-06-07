# auto-commit-ao-sair.ps1
# Roda quando o Claude encerra a sessao (hook Stop).
# Commita e envia qualquer alteracao pendente nos dois repos.

function Auto-Commit-Repo {
  param([string]$Caminho, [string]$Nome)

  if (-not (Test-Path $Caminho)) { return }

  Push-Location $Caminho

  # Verificar se ha algo para commitar (tracked modificado ou untracked nao ignorado)
  $pendente = git status --porcelain 2>$null | Where-Object { $_ -notmatch "^\?\? \.claude/(\.last-sync|scheduled_tasks)" }

  if ($pendente) {
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm")
    $branch = git symbolic-ref refs/remotes/origin/HEAD --short 2>$null
    if ($branch) { $branch = $branch -replace "^origin/", "" } else { $branch = "main" }

    git add -A 2>$null
    git commit -m "auto-commit: salva alteracoes antes de encerrar sessao [$timestamp]" 2>&1 | Out-Null
    git push origin $branch 2>&1 | Out-Null

    Write-Host "[auto-commit] $Nome - alteracoes salvas e enviadas ($timestamp)" -ForegroundColor Green
  }

  Pop-Location
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$fabricaCaminho = Resolve-Path (Join-Path $scriptDir "..") 2>$null
$enemeOpCaminho = Join-Path (Split-Path $fabricaCaminho -Parent) "enemeop-flores"

Auto-Commit-Repo -Caminho $fabricaCaminho -Nome "Fabrica de SaaS"
Auto-Commit-Repo -Caminho $enemeOpCaminho -Nome "Enemeop Flores"
