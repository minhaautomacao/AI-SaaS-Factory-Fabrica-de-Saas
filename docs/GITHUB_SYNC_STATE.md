# GITHUB SYNC STATE — Fábrica de SaaS

> Atualizar a cada CHECKPOINT ou SYNC_GITHUB.
> Nunca executar push sem autorização explícita do usuário.

---

## Repositórios locais

### 1. AI-SaaS-Factory-Fabrica-de-Saas

| Campo | Valor |
|---|---|
| Caminho local | `C:\Users\NOTEBOOK\Documents\GitHub\AI-SaaS-Factory-Fabrica-de-Saas` |
| Branch atual | `main` |
| Remote origin | `https://github.com/minhaautomacao/AI-SaaS-Factory-Fabrica-de-Saas.git` |
| Último commit | `65f2778` — fix: sync silencioso, sem warnings git, estado-atual atualizado |
| Data do último commit | 2026-06-17 |
| Status de arquivos | Limpo (sem alterações pendentes neste snapshot) |
| Sincronizado com GitHub | Sim |

### 2. enemeop-flores

| Campo | Valor |
|---|---|
| Caminho local | `C:\Users\NOTEBOOK\Documents\GitHub\enemeop-flores` |
| Branch atual | `master` |
| Remote origin | `https://github.com/minhaautomacao/enemeop-flores.git` |
| Último commit | Ver: `git -C C:\Users\NOTEBOOK\Documents\GitHub\enemeop-flores log --oneline -1` |
| Status de arquivos | Verificar antes de qualquer operação |
| Sincronizado com GitHub | Verificar antes de qualquer operação |

---

## Pendências de commit conhecidas

| Repositório | Arquivo | Tipo | Prioridade |
|---|---|---|---|
| Fábrica | `docs/SESSION_STATE.md` | Novo | Alta |
| Fábrica | `docs/CHANGELOG_AGENT.md` | Novo | Alta |
| Fábrica | `docs/GITHUB_SYNC_STATE.md` | Novo | Alta |
| Fábrica | `docs/CREDENTIALS_INDEX.md` | Novo | Alta |
| Fábrica | `CLAUDE.md` | Atualizado | Alta |

---

## Riscos antes de sincronizar

Verificar SEMPRE antes de `git add`:

```powershell
# Listar arquivos que seriam commitados
git status --porcelain

# Verificar se arquivos sensíveis escaparam do .gitignore
git status --porcelain | Select-String "\.env|\.key|\.pem|credentials|secret"
```

### Arquivos NUNCA devem entrar no commit
- `.env`, `.env.local`, `.env.production`
- `.credentials/**/*.env`
- `*.key`, `*.pem`, `*.p12`
- `.claude/settings.local.json`
- `.playwright-mcp/`

---

## Hooks ativos

| Hook | Script | Frequência |
|---|---|---|
| `UserPromptSubmit` | `scripts/sincronizar-repos.ps1` | 1x por dia (silencioso depois) |
| `Stop` | `scripts/auto-commit-ao-sair.ps1` | A cada encerramento de sessão |

### Comportamento do hook de sync
- **1ª mensagem do dia**: faz pull/push, exibe `estado-atual.md`
- **Mensagens seguintes**: `exit 0` silencioso — zero tokens desperdiçados
- **Com `-Force`**: força re-execução ignorando o marcador diário

---

## Procedimento SYNC_GITHUB

Quando o usuário digitar `SYNC_GITHUB`:

```powershell
# Fábrica
cd C:\Users\NOTEBOOK\Documents\GitHub\AI-SaaS-Factory-Fabrica-de-Saas
git status
git branch --show-current
git remote -v
git log --oneline -3

# Enemeop
cd C:\Users\NOTEBOOK\Documents\GitHub\enemeop-flores
git status
git branch --show-current
git log --oneline -3
```

Depois: apresentar plano de commit por repositório, aguardar autorização antes de push.

---

## Histórico de sincronizações

| Data | Repositório | Ação | Resultado |
|---|---|---|---|
| 2026-06-17 | Fábrica | pull + commit fix sync | OK — 65f2778 |
| 2026-06-17 | Enemeop | pull | Already up to date |
| 2026-06-16 | Fábrica | auto-commit Stop | Alterações salvas |
| 2026-06-02 | Fábrica | commit pipeline Meta | a25e247 + 6d860f7 |
