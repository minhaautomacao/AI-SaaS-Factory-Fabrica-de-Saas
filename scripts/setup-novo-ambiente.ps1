# Setup Claude Code em novo ambiente (notebook ou nova máquina)
# Execute como: .\scripts\setup-novo-ambiente.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== Setup Claude Code - Fabrica de SaaS ===" -ForegroundColor Cyan
Write-Host ""

# 1. Configuracoes globais do Claude Code
Write-Host "[1/4] Configurando ~/.claude/settings.json..." -ForegroundColor Yellow
$claudeDir = "$env:USERPROFILE\.claude"
if (-not (Test-Path $claudeDir)) { New-Item -ItemType Directory -Path $claudeDir | Out-Null }

$settings = '{"theme": "dark"}'
Set-Content -Path "$claudeDir\settings.json" -Value $settings -Encoding utf8
Write-Host "      OK - theme: dark" -ForegroundColor Green

# 2. MCP global (filesystem + github)
Write-Host "[2/4] Configurando ~/.claude/.mcp.json..." -ForegroundColor Yellow
$mcpConfig = @'
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
Set-Content -Path "$claudeDir\.mcp.json" -Value $mcpConfig -Encoding utf8
Write-Host "      OK - filesystem + github MCP configurados" -ForegroundColor Green

# 3. Instalar MCPs via plugins do Claude Code
Write-Host "[3/4] Instalando plugins (Supabase + Vercel + Chrome)..." -ForegroundColor Yellow
Write-Host "      Execute manualmente no Claude Code Desktop:" -ForegroundColor DarkYellow
Write-Host "      /mcp add supabase" -ForegroundColor White
Write-Host "      /mcp add vercel" -ForegroundColor White
Write-Host "      /mcp add claude-in-chrome" -ForegroundColor White
Write-Host "      (ou instale pelos mesmos links usados no desktop)" -ForegroundColor DarkYellow

# 4. Verificar git
Write-Host "[4/4] Verificando repositorio..." -ForegroundColor Yellow
$repoPath = "C:\Users\$env:USERNAME\Projetos Minha Automacao\fabrica-saas"
if (Test-Path "$repoPath\.git") {
    Write-Host "      OK - repositorio encontrado em: $repoPath" -ForegroundColor Green
    Push-Location $repoPath
    git status --short
    Pop-Location
} else {
    Write-Host "      ATENCAO: Repositorio nao encontrado em $repoPath" -ForegroundColor Red
    Write-Host "      Clone com: git clone https://github.com/minhaautomacao/AI-SaaS-Factory-Fabrica-de-Saas '$repoPath'" -ForegroundColor White
}

Write-Host ""
Write-Host "=== Setup concluido! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos passos no notebook:" -ForegroundColor White
Write-Host "  1. Abrir Claude Code Desktop no notebook" -ForegroundColor White
Write-Host "  2. Navegar para: $repoPath" -ForegroundColor White
Write-Host "  3. Instalar os 3 plugins MCP (Supabase, Vercel, Chrome)" -ForegroundColor White
Write-Host "  4. Configurar variaveis de ambiente: GITHUB_TOKEN" -ForegroundColor White
Write-Host ""
Write-Host "Tudo mais (agents, skills, commands, memory) ja esta no Git." -ForegroundColor DarkGray
