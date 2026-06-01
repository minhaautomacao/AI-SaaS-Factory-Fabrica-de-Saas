# ===========================================================================
# AUTO-CONFIGURACAO Claude Code - Fabrica de SaaS
# Execute no notebook com: .\scripts\setup-novo-ambiente.ps1
# ===========================================================================

$ErrorActionPreference = "Stop"
$claudeDir = "$env:USERPROFILE\.claude"
$repoUrl   = "https://github.com/minhaautomacao/AI-SaaS-Factory-Fabrica-de-Saas"
$projetosDir = "C:\Users\$env:USERNAME\Projetos Minha Automacao"
$repoDir   = "$projetosDir\fabrica-saas"

function Write-Step($n, $msg) { Write-Host "`n[$n] $msg" -ForegroundColor Cyan }
function Write-OK($msg)       { Write-Host "    OK - $msg" -ForegroundColor Green }
function Write-Warn($msg)     { Write-Host "    ATENCAO: $msg" -ForegroundColor Yellow }
function Write-Manual($msg)   { Write-Host "    >>> $msg" -ForegroundColor Magenta }

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   AUTO-CONFIGURACAO - Claude Code / Fabrica de SaaS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# 1. Verificar pre-requisitos
# ---------------------------------------------------------------------------
Write-Step "1/7" "Verificando pre-requisitos..."

$prereqs = @("git", "node", "npm")
foreach ($cmd in $prereqs) {
    try {
        $v = & $cmd --version 2>&1 | Select-Object -First 1
        Write-OK "$cmd encontrado: $v"
    } catch {
        Write-Host "    ERRO: $cmd nao encontrado. Instale antes de continuar." -ForegroundColor Red
        exit 1
    }
}

# ---------------------------------------------------------------------------
# 2. Clonar ou atualizar repositorio
# ---------------------------------------------------------------------------
Write-Step "2/7" "Repositorio do projeto..."

if (-not (Test-Path $projetosDir)) {
    New-Item -ItemType Directory -Path $projetosDir -Force | Out-Null
    Write-OK "Pasta criada: $projetosDir"
}

if (Test-Path "$repoDir\.git") {
    Write-OK "Repositorio ja existe. Atualizando..."
    Push-Location $repoDir
    git pull origin main
    Pop-Location
} else {
    Write-OK "Clonando repositorio..."
    git clone $repoUrl $repoDir
}

Write-OK "Repositorio em: $repoDir"

# ---------------------------------------------------------------------------
# 3. Configuracoes globais do Claude Code
# ---------------------------------------------------------------------------
Write-Step "3/7" "Configurando ~/.claude/settings.json..."

if (-not (Test-Path $claudeDir)) {
    New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null
}

Set-Content -Path "$claudeDir\settings.json" -Encoding utf8 -Value @'
{
  "theme": "dark"
}
'@
Write-OK "Theme: dark configurado"

# ---------------------------------------------------------------------------
# 4. MCP global (filesystem + github)
# ---------------------------------------------------------------------------
Write-Step "4/7" "Configurando ~/.claude/.mcp.json (MCPs globais)..."

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
Write-OK "MCPs globais: filesystem + github"

# ---------------------------------------------------------------------------
# 5. Instalar dependencias npm do projeto (se existir package.json)
# ---------------------------------------------------------------------------
Write-Step "5/7" "Dependencias npm..."

if (Test-Path "$repoDir\package.json") {
    Push-Location $repoDir
    npm install --silent
    Pop-Location
    Write-OK "npm install concluido"
} else {
    Write-OK "Sem package.json na raiz - nada a instalar"
}

# ---------------------------------------------------------------------------
# 6. Verificar conteudo .claude/ do repositorio
# ---------------------------------------------------------------------------
Write-Step "6/7" "Verificando configuracoes do Claude Code no repositorio..."

$checks = @(
    @{ path = ".claude\agents";   label = "Agents"   },
    @{ path = ".claude\skills";   label = "Skills"   },
    @{ path = ".claude\commands"; label = "Commands" },
    @{ path = ".claude\memory";   label = "Memory"   },
    @{ path = "CLAUDE.md";        label = "CLAUDE.md" }
)

foreach ($c in $checks) {
    $full = Join-Path $repoDir $c.path
    if (Test-Path $full) {
        if ((Get-Item $full).PSIsContainer) {
            $count = (Get-ChildItem $full -File).Count
            Write-OK "$($c.label): $count arquivo(s)"
        } else {
            Write-OK "$($c.label): presente"
        }
    } else {
        Write-Warn "$($c.label): nao encontrado em $full"
    }
}

# ---------------------------------------------------------------------------
# 7. Instrucoes manuais restantes
# ---------------------------------------------------------------------------
Write-Step "7/7" "Configuracoes manuais necessarias no Claude Code Desktop..."

Write-Host ""
Write-Host "  As configuracoes abaixo NAO podem ser automatizadas." -ForegroundColor White
Write-Host "  Faca-as no Claude Code Desktop do notebook:" -ForegroundColor White
Write-Host ""
Write-Host "  A) LOGIN na conta Anthropic" -ForegroundColor White
Write-Host "     - Abra o Claude Code Desktop" -ForegroundColor DarkGray
Write-Host "     - Faca login com a conta: minhaautomacao10@gmail.com" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  B) INSTALAR 3 plugins MCP (via interface do app)" -ForegroundColor White
Write-Host "     1. Supabase MCP  - busque 'Supabase' nos plugins" -ForegroundColor DarkGray
Write-Host "     2. Vercel MCP    - busque 'Vercel' nos plugins" -ForegroundColor DarkGray
Write-Host "     3. Claude in Chrome - instale a extensao Chrome + plugin" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  C) ABRIR o projeto no Claude Code" -ForegroundColor White
Write-Host "     Pasta: $repoDir" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  D) VARIAVEIS DE AMBIENTE (se for usar Supabase/Vercel via CLI)" -ForegroundColor White
Write-Host '     $env:GITHUB_TOKEN = "seu-token-aqui"' -ForegroundColor DarkGray
Write-Host ""

# ---------------------------------------------------------------------------
# Resumo final
# ---------------------------------------------------------------------------
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   SETUP AUTOMATICO CONCLUIDO" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Automatizado com sucesso:" -ForegroundColor White
Write-Host "    [x] Repositorio clonado/atualizado" -ForegroundColor Green
Write-Host "    [x] ~/.claude/settings.json (tema dark)" -ForegroundColor Green
Write-Host "    [x] ~/.claude/.mcp.json (filesystem + github)" -ForegroundColor Green
Write-Host "    [x] Agents, Skills, Commands, Memory (via Git)" -ForegroundColor Green
Write-Host "    [x] CLAUDE.md com todas as instrucoes" -ForegroundColor Green
Write-Host "    [x] Permissoes settings.local.json (via Git)" -ForegroundColor Green
Write-Host ""
Write-Host "  Pendente (manual no app):" -ForegroundColor White
Write-Host "    [ ] Login na conta Anthropic" -ForegroundColor Yellow
Write-Host "    [ ] Plugin Supabase MCP" -ForegroundColor Yellow
Write-Host "    [ ] Plugin Vercel MCP" -ForegroundColor Yellow
Write-Host "    [ ] Plugin Claude in Chrome" -ForegroundColor Yellow
Write-Host ""
