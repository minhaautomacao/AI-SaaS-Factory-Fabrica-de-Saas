# CHANGELOG DO AGENTE — Fábrica de SaaS

> Registro cronológico de ações executadas pelo Claude Code.
> Formato: bloco por sessão, mais recente no topo.
> Nunca apagar entradas — apenas adicionar.

---

## 2026-07-01 — MISSÃO M002: META_INSTAGRAM_ID atualizado no Supabase

**Objetivo:** Corrigir bloqueador final da integração Instagram Direct (Flora não respondia DMs)

**Ações executadas:**
- Confirmado via Supabase Dashboard que `META_INSTAGRAM_ID` existia desde 08/Jun mas não havia sido atualizado/verificado após deploy v19
- Substituído `META_INSTAGRAM_ID` nos Edge Function Secrets (projeto `gftnjvdvzgjkhwxnxnwl`) via Playwright — valor: `17841402064363907`
- Timestamp de atualização confirmado: `01 Jul 2026 01:26:56 (+0000)`
- webhook-meta v19 permanece ativa (sem redeploy necessário)

**Estado da missão ao encerrar:**
```
Meta → webhook → HMAC → Flora → Captação → Orquestrador  ✅ (todos)
Resposta no Instagram Direct                               ❌ aguarda teste
```

**Próximo passo:** Carlos envia "teste" para @enemeopflores → verificar logs endpoint=ig/fb + Graph API

---

## 2026-06-17 — Sistema de memória permanente

**Ação:** Criação do sistema permanente de memória, retomada e gestão de estado.

**Arquivos criados/alterados:**
- `CLAUDE.md` — reescrito com protocolos RETOMAR/CHECKPOINT/SYNC_GITHUB/ATUALIZAR_CREDENCIAL
- `docs/SESSION_STATE.md` — criado (estado atual do projeto)
- `docs/CHANGELOG_AGENT.md` — criado (este arquivo)
- `docs/GITHUB_SYNC_STATE.md` — criado (status Git dos repositórios)
- `docs/CREDENTIALS_INDEX.md` — criado (índice seguro de credenciais)
- `scripts/sincronizar-repos.ps1` — corrigido: saída silenciosa no skip, `2>$null` no git, injeta estado-atual.md na 1ª execução do dia
- `.claude/memory/estado-atual.md` — atualizado com data 2026-06-17
- `.gitignore` — adicionadas entradas para diretórios hyperframes do Claude

**Comandos executados:**
```
git add scripts/sincronizar-repos.ps1 .gitignore .claude/memory/estado-atual.md
git commit -m "fix: sync silencioso, sem warnings git, estado-atual atualizado"
```

**Problemas resolvidos:**
- Hook UserPromptSubmit emitia texto em toda mensagem → agora silencioso
- `git status 2>&1` capturava warnings de diretórios inexistentes → `2>$null`
- estado-atual.md não era carregado automaticamente → injetado no 1º sync do dia

**Pendências criadas:**
- Nenhuma nova

**Decisão técnica:**
Hook UserPromptSubmit com saída silenciosa no skip elimina ~50 tokens por mensagem.
Estado atual injetado automaticamente via hook na 1ª mensagem do dia, sem custo nas seguintes.

---

## 2026-06-17 — Diagnóstico inicial de configuração

**Ação:** Análise da configuração existente e diagnóstico de problemas.

**Arquivos lidos:**
- `.claude/settings.json` (projeto)
- `~/.claude/settings.json` (global)
- `.claude/settings.local.json`
- `scripts/sincronizar-repos.ps1`
- `scripts/auto-commit-ao-sair.ps1`
- `.claude/memory/MEMORY.md`

**Problemas identificados:**
1. Hook rodando em cada mensagem com saída verbosa
2. `git status --porcelain 2>&1` capturando warnings de stderr
3. Diretórios `.claude/skills/hyperframes*/` ausentes gerando warnings
4. estado-atual.md não carregado automaticamente no início da sessão
5. Sem arquivos docs/ estruturados para retomada de sessão

---

## 2026-06-02 — Pipeline Instagram em produção

**Ação:** Deploy do webhook-meta e captura do primeiro lead real.

**Arquivos criados/alterados:**
- `supabase/functions/webhook-meta/index.ts` — webhook com validação HMAC-SHA256
- `supabase/functions/captacao-leads/index.ts` — v9, parsing JSON robusto
- `supabase/functions/leads-enemeop/index.ts` — API interna de leads para dashboard
- `supabase/migrations/20260602000008_leads_fix.sql` — correção de schema

**Comandos executados:**
```
npx supabase functions deploy webhook-meta --project-ref ebeapnydeiwuewxatuuw
npx supabase functions deploy captacao-leads --project-ref ebeapnydeiwuewxatuuw
npx supabase functions deploy leads-enemeop --project-ref ebeapnydeiwuewxatuuw
```

**Resultado:**
- App Meta publicado em modo Live (App ID: 512230540723061)
- Webhook verificado e ativo
- Primeiro lead real capturado: `canal_id: 9530087693699545`
- 368 leads Instagram visíveis no dashboard

**Pendências criadas:**
- WhatsApp SDR sem implementação (`lib/whatsapp.ts` não existe no orquestrador)
- Bug REQUER_ESCALADA em `orchestrator/src/workers/orquestrador.ts` linhas 38–43
- Token Instagram precisa renovação em 2026-08-01
