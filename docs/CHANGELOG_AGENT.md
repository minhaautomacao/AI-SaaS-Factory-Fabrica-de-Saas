# CHANGELOG DO AGENTE — Fábrica de SaaS

> Registro cronológico de ações executadas pelo Claude Code.
> Formato: bloco por sessão, mais recente no topo.
> Nunca apagar entradas — apenas adicionar.

---

## 2026-07-03 — MISSÃO M002 CONCLUÍDA: Flora responde DM real no Instagram

**Ação:** Retomada da sessão anterior. Verificado que a "Frente A" (testador do Instagram) não tinha ação pendente (aba "Convites do testador" sem botão aceitar). Ao inspecionar a versão realmente implantada de `webhook-meta` (v25, via `get_edge_function`), constatado que a "Frente B" (host `graph.instagram.com` em vez de `graph.facebook.com`) já havia sido aplicada e deployada em algum momento entre a última atualização do checkpoint e agora — só não estava registrada em `CURRENT_STATE.md`. Confirmado via logs do dashboard Supabase (Playwright): busca por `DM enviado` retornou 20+ sucessos com `endpoint=ig` para destinatários reais distintos entre 02/07 09:35 e 03/07 08:20 (horário local); busca por `erro DM` no mesmo período: zero resultados.

**Nenhum código alterado nesta sessão** — a correção já estava em produção; o trabalho foi de verificação, diagnóstico e atualização de documentação.

**Arquivos alterados:**
- `docs/CURRENT_STATE.md` — MISSÃO M002 marcada como concluída, próxima missão candidata listada (Messenger, WhatsApp Cloud API, pendências de sprint)
- `docs/KNOWN_ISSUES.md` — problemas do erro 190 removidos (resolvidos)
- `docs/DECISIONS.md` — nova entrada com causa raiz definitiva e evidência de confirmação em produção
- Memória persistente (`meta-instagram-bloqueios.md`, `MEMORY.md`) atualizada para refletir resolução

**Achado paralelo:** repositório local `enemeop-flores` não contém `supabase/functions/` — as Edge Functions em produção não têm histórico git local (deploy direto ao Supabase). Não é bloqueador, mas é risco de rastreabilidade a considerar.

**Pendências criadas:** nenhuma nova. Decisão sobre próxima missão (Messenger vs WhatsApp Cloud API vs pendências do sprint) aguarda confirmação de Carlos.

---

## 2026-07-01 (noite) — MISSÃO M002: token novo gerado (fluxo correto), erro 190 persiste

**Objetivo:** Testar se token gerado pelo fluxo correto (Instagram Business Login) resolve o erro `code=190 Cannot parse access token`.

**Ações executadas:**
- Navegação via Playwright até Meta Dashboard → app `enemeopflores` → Casos de uso → API do Instagram → Configuração da API com login do Instagram → conta `enemeopflores` (Instagram ID `17841402064363907`) → gerado novo token.
- Token colado e salvo em `META_IG_ACCESS_TOKEN` (Supabase Edge Function Secrets, projeto `gftnjvdvzgjkhwxnxnwl`), confirmado por toast de sucesso e mudança de digest SHA256 (01/07/2026 22:46:20 UTC). Nenhum redeploy necessário (confirmado via doc oficial Supabase).
- Teste de DM real "teste" para @enemeopflores → **mesmo erro 190** (`corpo={"error":{"message":"Invalid OAuth access token - Cannot parse access token",...}}`). Log `[diag-token]` confirma token limpo (length=183, sem espaço/aspas/quebra de linha/JSON) — descarta hipótese de malformação.
- Identificado (via doc oficial da Meta, fetch direto) que o host correto para esse tipo de token é `graph.instagram.com`, não `graph.facebook.com` (usado atualmente). Diff preparado mas **não aplicado nem deployado** — aguardando validação de outra frente antes.
- Carlos levantou hipótese de testador do Instagram não confirmado. Verificado no Meta Dashboard (Funções do app): "Testadores: 0 de 500", `enemeopflores`/`instacarlosron` com status "Carregando..." (convite pendente). Verificado também em `instagram.com/accounts/manage_access/`: app `enemeopflores-IG` já aparece em "Ativos", autorizado em 01/07/2026 — contradição a resolver checando a aba "Convites do testador" (sessão caiu antes de concluir).
- Achado paralelo: `supabase/functions/webhook-meta/index.ts` local está com conflito de merge não resolvido (marcadores literais) e diverge da versão v22 realmente implantada (obtida via `get_edge_function`). Nenhum deploy foi feito a partir do arquivo local.

**Estado da missão ao encerrar:**
```
Pipeline até geração de resposta          ✅ (todos os passos)
Envio da resposta ao Instagram Direct     ❌ erro 190 persiste com token novo
```

**Próximo passo:** ver `docs/CURRENT_STATE.md` — checar aba "Convites do testador", só então decidir entre aceitar convite ou retomar diff de host.

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
