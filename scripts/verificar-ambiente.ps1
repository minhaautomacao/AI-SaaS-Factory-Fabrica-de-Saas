# verificar-ambiente.ps1
# Gera relatorio do estado dos repositorios locais vs GitHub
# Execute no notebook e compare com o relatorio do desktop

$base = "C:\Users\$env:USERNAME\Projetos Minha Automacao"
$repos = @(
    @{ name = "fabrica-saas";   remote = "https://github.com/minhaautomacao/AI-SaaS-Factory-Fabrica-de-Saas.git"; branch = "main"   },
    @{ name = "enemeop-flores"; remote = "https://github.com/minhaautomacao/enemeop-flores.git";                  branch = "master" }
)

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host " RELATORIO DE VERIFICACAO - $env:COMPUTERNAME" -ForegroundColor Cyan
Write-Host " $(Get-Date -Format 'dd/MM/yyyy HH:mm')" -ForegroundColor DarkCyan
Write-Host "=======================================" -ForegroundColor Cyan

foreach ($repo in $repos) {
    $dir = "$base\$($repo.name)"
    Write-Host ""
    Write-Host "--- $($repo.name) ---" -ForegroundColor Yellow

    if (-not (Test-Path "$dir\.git")) {
        Write-Host "  [X] REPOSITORIO NAO ENCONTRADO em $dir" -ForegroundColor Red
        continue
    }

    Push-Location $dir
    git fetch origin --quiet 2>$null

    $branch      = git branch --show-current
    $lastCommit  = git log -1 --format="%H"
    $lastMsg     = git log -1 --format="%s"
    $lastDate    = git log -1 --format="%ci"
    $remoteHead  = git rev-parse "origin/$($repo.branch)" 2>$null
    $behind      = git rev-list "HEAD..origin/$($repo.branch)" --count 2>$null
    $ahead       = git rev-list "origin/$($repo.branch)..HEAD" --count 2>$null
    $modified    = (git status --short).Count
    $remoteUrl   = git remote get-url origin

    $syncStatus = if ($behind -eq "0" -and $ahead -eq "0") { "[OK] SINCRONIZADO" }
                  elseif ($behind -gt 0) { "[!]  $behind commit(s) ATRASADO do GitHub" }
                  elseif ($ahead -gt 0)  { "[!]  $ahead commit(s) A FRENTE do GitHub" }
                  else { "[?]  Estado desconhecido" }

    Write-Host "  Branch:       $branch"
    Write-Host "  Ultimo commit: $lastCommit"
    Write-Host "  Mensagem:     $lastMsg"
    Write-Host "  Data:         $lastDate"
    Write-Host "  Remote:       $remoteUrl"
    Write-Host "  Arquivos modificados: $modified"
    Write-Host "  Sync:         $syncStatus" -ForegroundColor $(if ($syncStatus -match "OK") { "Green" } else { "Yellow" })

    if ($modified -gt 0) {
        Write-Host "  Arquivos alterados:" -ForegroundColor DarkYellow
        git status --short | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkYellow }
    }

    Pop-Location
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host " REFERENCIA DO DESKTOP (esperado)" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  fabrica-saas" -ForegroundColor Yellow
Write-Host "    Branch:        main"
Write-Host "    Ultimo commit: bf64485a43c29b4ccce70f66a83c3e417522c167"
Write-Host "    Mensagem:      Atualiza setup: inclui Git, GitHub CLI, Vercel CLI, ambos os repos e npm install"
Write-Host ""
Write-Host "  enemeop-flores" -ForegroundColor Yellow
Write-Host "    Branch:        master"
Write-Host "    Ultimo commit: a81bb7e1dac03ec067e19201b3f27c0497c04477"
Write-Host "    Mensagem:      Redesign visual: Bling-inspired + identidade Enemeop consistente"
Write-Host ""
Write-Host "  Se os commits acima baterem com o relatorio: tudo sincronizado." -ForegroundColor Green
Write-Host "  Se divergir: execute 'git pull origin main' na pasta do repo." -ForegroundColor Yellow
Write-Host ""
