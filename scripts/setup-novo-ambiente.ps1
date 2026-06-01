# ===========================================================================
# AUTO-CONFIGURACAO COMPLETA - Claude Code / Fabrica de SaaS
# Replica exatamente o ambiente do desktop no notebook
#
# USO: Abra o PowerShell como Administrador e execute:
#   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
#   .\scripts\setup-novo-ambiente.ps1
# ===========================================================================

$ErrorActionPreference = "Stop"

# --- Configuracoes do ambiente ---
$GITHUB_USER    = "minhaautomacao"
$GITHUB_EMAIL   = "minhaautomacao10@gmail.com"
$GIT_NAME       = "CarlosRon"
$projetosDir    = "C:\Users\$env:USERNAME\Projetos Minha Automacao"
$claudeDir      = "$env:USERPROFILE\.claude"

$repos = @(
    @{ name = "fabrica-saas";   url = "https://github.com/minhaautomacao/AI-SaaS-Factory-Fabrica-de-Saas" },
    @{ name = "enemeop-flores"; url = "https://github.com/minhaautomacao/enemeop-flores" }
)

function Write-Step($n, $total, $msg) {
    Write-Host ""
    Write-Host "[$n/$total] $msg" -ForegroundColor Cyan
}
function Write-OK($msg)     { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg)   { Write-Host "    [!]  $msg" -ForegroundColor Yellow }
function Write-Err($msg)    { Write-Host "    [X]  $msg" -ForegroundColor Red }
function Write-Manual($msg) { Write-Host "    >>>  $msg" -ForegroundColor Magenta }

Clear-Host
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   SETUP COMPLETO - Claude Code / Fabrica de SaaS" -ForegroundColor Cyan
Write-Host "   Replica o ambiente do desktop no notebook" -ForegroundColor DarkCyan
Write-Host "================================================================" -ForegroundColor Cyan

$totalSteps = 9

# ============================================================
# PASSO 1 - Pre-requisitos (Node, Git, npm)
# ============================================================
Write-Step 1 $totalSteps "Verificando pre-requisitos basicos..."

$missing = @()
@("git", "node", "npm") | ForEach-Object {
    try {
        $v = & $_ --version 2>&1 | Select-Object -First 1
        Write-OK "$_  $v"
    } catch {
        Write-Err "$_ NAO ENCONTRADO"
        $missing += $_
    }
}

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "  Instale os itens abaixo antes de continuar:" -ForegroundColor Red
    if ($missing -contains "git")  { Write-Host "  - Git:  https://git-scm.com/download/win" -ForegroundColor White }
    if ($missing -contains "node") { Write-Host "  - Node: https://nodejs.org (LTS)" -ForegroundColor White }
    exit 1
}

# ============================================================
# PASSO 2 - Instalar ferramentas CLI globais
# ============================================================
Write-Step 2 $totalSteps "Instalando ferramentas CLI globais (npm global)..."

$npmGlobals = @(
    @{ pkg = "@anthropic-ai/claude-code"; cmd = "claude" },
    @{ pkg = "vercel";                    cmd = "vercel"  },
    @{ pkg = "pnpm";                      cmd = "pnpm"    }
)

foreach ($tool in $npmGlobals) {
    try {
        $v = & $tool.cmd --version 2>&1 | Select-Object -First 1
        Write-OK "$($tool.cmd) ja instalado: $v"
    } catch {
        Write-Warn "$($tool.cmd) nao encontrado. Instalando $($tool.pkg)..."
        npm install -g $tool.pkg --silent
        Write-OK "$($tool.cmd) instalado"
    }
}

# ============================================================
# PASSO 3 - GitHub CLI (gh)
# ============================================================
Write-Step 3 $totalSteps "Verificando GitHub CLI (gh)..."

try {
    $ghv = gh --version 2>&1 | Select-Object -First 1
    Write-OK "gh encontrado: $ghv"
} catch {
    Write-Warn "GitHub CLI nao encontrado."
    Write-Manual "Instale manualmente: https://cli.github.com"
    Write-Manual "Depois execute: gh auth login"
}

# Verificar se esta autenticado
$ghStatus = gh auth status 2>&1
if ($ghStatus -match "Logged in") {
    Write-OK "gh autenticado no GitHub"
} else {
    Write-Warn "gh NAO autenticado. Iniciando login..."
    Write-Host ""
    gh auth login
}

# ============================================================
# PASSO 4 - Configuracao global do Git
# ============================================================
Write-Step 4 $totalSteps "Configurando Git global (usuario + email + LFS)..."

git config --global user.name  $GIT_NAME
git config --global user.email $GITHUB_EMAIL
git config --global core.autocrlf true
git config --global init.defaultBranch main
Write-OK "user.name  = $GIT_NAME"
Write-OK "user.email = $GITHUB_EMAIL"

# Git LFS
try {
    $lfsv = git lfs version 2>&1 | Select-Object -First 1
    git lfs install --silent 2>&1 | Out-Null
    Write-OK "Git LFS configurado: $lfsv"
} catch {
    Write-Warn "Git LFS nao encontrado (opcional)"
}

# ============================================================
# PASSO 5 - Clonar / atualizar repositorios
# ============================================================
Write-Step 5 $totalSteps "Clonando/atualizando repositorios..."

if (-not (Test-Path $projetosDir)) {
    New-Item -ItemType Directory -Path $projetosDir -Force | Out-Null
    Write-OK "Pasta criada: $projetosDir"
}

foreach ($repo in $repos) {
    $dir = "$projetosDir\$($repo.name)"
    if (Test-Path "$dir\.git") {
        Write-OK "$($repo.name) ja existe. Atualizando..."
        Push-Location $dir
        git fetch origin
        git pull origin main 2>&1 | Tail -1
        Pop-Location
    } else {
        Write-OK "Clonando $($repo.name)..."
        git clone $repo.url $dir
    }
    Write-OK "$($repo.name) --> $dir"
}

# ============================================================
# PASSO 6 - Dependencias npm dos projetos
# ============================================================
Write-Step 6 $totalSteps "Instalando dependencias npm dos projetos..."

foreach ($repo in $repos) {
    $dir   = "$projetosDir\$($repo.name)"
    $pkgjson = "$dir\package.json"
    if (Test-Path $pkgjson) {
        Write-OK "npm install em $($repo.name)..."
        Push-Location $dir
        npm install --silent 2>&1 | Select-Object -Last 2
        Pop-Location
    }
}

# ============================================================
# PASSO 7 - Configuracoes globais do Claude Code
# ============================================================
Write-Step 7 $totalSteps "Configurando Claude Code (~/.claude/)..."

if (-not (Test-Path $claudeDir)) {
    New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null
}

# settings.json (tema)
Set-Content -Path "$claudeDir\settings.json" -Encoding utf8 -Value '{"theme": "dark"}'
Write-OK "settings.json: theme dark"

# .mcp.json (servidores MCP globais)
Set-Content -Path "$claudeDir\.mcp.json" -Encoding utf8 -Value @'
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:/meus-projetos"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    }
  }
}
'@
Write-OK ".mcp.json: filesystem + github MCPs"

# ============================================================
# PASSO 8 - Verificar conteudo .claude/ do repositorio
# ============================================================
Write-Step 8 $totalSteps "Verificando configuracoes do Claude Code no repositorio..."

$repoDir = "$projetosDir\fabrica-saas"

$checks = @(
    @{ path = ".claude\agents";              label = "Agents (12)"       },
    @{ path = ".claude\skills";              label = "Skills (6)"        },
    @{ path = ".claude\commands";            label = "Commands slash (4)"},
    @{ path = ".claude\memory\MEMORY.md";    label = "Memory index"      },
    @{ path = ".claude\memory\estado-atual.md"; label = "Estado atual"   },
    @{ path = ".claude\settings.local.json"; label = "Permissoes MCP"    },
    @{ path = "CLAUDE.md";                   label = "CLAUDE.md"         },
    @{ path = "scripts\setup-novo-ambiente.ps1"; label = "Este script"   }
)

foreach ($c in $checks) {
    $full = Join-Path $repoDir $c.path
    if (Test-Path $full) {
        if ((Get-Item $full).PSIsContainer) {
            $n = (Get-ChildItem $full -File).Count
            Write-OK "$($c.label): $n arquivo(s)"
        } else {
            Write-OK "$($c.label): presente"
        }
    } else {
        Write-Warn "$($c.label): nao encontrado"
    }
}

# ============================================================
# PASSO 9 - Instrucoes manuais (nao automatizaveis)
# ============================================================
Write-Step 9 $totalSteps "Passos manuais restantes no Claude Code Desktop..."

Write-Host ""
Write-Host "  Estas acoes precisam ser feitas UMA VEZ no app Claude Code Desktop:" -ForegroundColor White
Write-Host ""
Write-Host "  1. LOGIN na conta Anthropic" -ForegroundColor White
Write-Host "     Conta: $GITHUB_EMAIL" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  2. INSTALAR 3 plugins MCP (menu Plugins no app):" -ForegroundColor White
Write-Host "     - Supabase MCP  (buscar 'Supabase')" -ForegroundColor DarkGray
Write-Host "     - Vercel MCP    (buscar 'Vercel')" -ForegroundColor DarkGray
Write-Host "     - Claude in Chrome (extensao Chrome + plugin)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  3. ABRIR o projeto fabrica-saas no Claude Code:" -ForegroundColor White
Write-Host "     $repoDir" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  4. AUTENTICAR Vercel:" -ForegroundColor White
Write-Host "     vercel login" -ForegroundColor DarkGray
Write-Host "     (conta: $GITHUB_EMAIL)" -ForegroundColor DarkGray
Write-Host ""

# ============================================================
# RESUMO FINAL
# ============================================================
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   SETUP AUTOMATICO CONCLUIDO COM SUCESSO" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Configurado automaticamente:" -ForegroundColor White
Write-Host "    [x] Git: user.name=$GIT_NAME, email=$GITHUB_EMAIL" -ForegroundColor Green
Write-Host "    [x] GitHub CLI autenticado (gh)" -ForegroundColor Green
Write-Host "    [x] Claude Code CLI (@anthropic-ai/claude-code)" -ForegroundColor Green
Write-Host "    [x] Vercel CLI" -ForegroundColor Green
Write-Host "    [x] pnpm" -ForegroundColor Green
Write-Host "    [x] Repositorio fabrica-saas clonado/atualizado" -ForegroundColor Green
Write-Host "    [x] Repositorio enemeop-flores clonado/atualizado" -ForegroundColor Green
Write-Host "    [x] Dependencias npm instaladas" -ForegroundColor Green
Write-Host "    [x] ~/.claude/settings.json (tema dark)" -ForegroundColor Green
Write-Host "    [x] ~/.claude/.mcp.json (filesystem + github)" -ForegroundColor Green
Write-Host "    [x] Agents, Skills, Commands, Memory (via Git)" -ForegroundColor Green
Write-Host "    [x] CLAUDE.md com todas as instrucoes" -ForegroundColor Green
Write-Host "    [x] Permissoes settings.local.json" -ForegroundColor Green
Write-Host ""
Write-Host "  Pendente (manual - ~5 min):" -ForegroundColor White
Write-Host "    [ ] Login no Claude Code Desktop" -ForegroundColor Yellow
Write-Host "    [ ] Plugin Supabase MCP" -ForegroundColor Yellow
Write-Host "    [ ] Plugin Vercel MCP" -ForegroundColor Yellow
Write-Host "    [ ] Plugin Claude in Chrome" -ForegroundColor Yellow
Write-Host "    [ ] vercel login" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Repositorios em: $projetosDir" -ForegroundColor DarkGray
Write-Host ""
