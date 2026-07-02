# SESSION STATE — Fábrica de SaaS

> Fonte de verdade do estado atual. Atualizar a cada CHECKPOINT.
> Máx. 60 linhas. Se crescer além disso, arquivar em CHANGELOG_AGENT.md.

---

## Status geral

| Campo | Valor |
|---|---|
| Data deste snapshot | 2026-07-01 |
| Fase atual | Fase 8 — Integração Meta (MISSÃO M002) |
| Branch fábrica | main |
| Branch enemeop | master |
| Pipeline Instagram | Em validação final — aguarda teste DM com META_INSTAGRAM_ID corrigido |

---

## Último deploy no Render

| Serviço | Commit deployado | Data |
|---|---|---|
| enemeop-orchestrator | 53f307c | 22/06/2026 |
| Workspace | **SUSPENSO** (cota banda excedida) | desde 25/06/2026 |
| Renovação cota | **01/07/2026** | automática |

---

## HEAD atual (master enemeop) — pronto para deploy em 01/07

```
6cb7519 — WORKERS_ENABLED=false + BullMQ drainDelay=30s (não deployado)
f1eedfa — /health leve {"ok":true} (não deployado)
6422133 — keep-alive 14min, remove ping Evolution (não deployado)
```

---

## MISSÃO M002 — Estado atual (01/07/2026 22:50 UTC)

```
Meta entrega webhook         ✅
Webhook recebe POST          ✅
HMAC valida (dual secret)    ✅  (META_IG_APP_SECRET + META_APP_SECRET)
Flora executa                ✅
Captação executa             ✅
Orquestrador executa         ✅
META_INSTAGRAM_ID no secret  ✅
Token novo (fluxo correto)   ✅  gerado e salvo 01/07 22:46 UTC
webhook-meta v22 ativa       ✅
Resposta aparece no Direct   ❌  mesmo erro 190 com token novo — hipótese malformação descartada
```

Detalhe completo da investigação e das duas frentes abertas (testador do Instagram pendente vs. host errado no código): ver `docs/CURRENT_STATE.md`, seção "Duas frentes abertas para o erro 190".

### Próximo passo ao retomar amanhã
1. Checar aba "Convites do testador" em `instagram.com/accounts/manage_access/` (sessão caiu antes de verificar)
2. Se pendente, Carlos aceita; confirmar no Meta Dashboard que testador não é mais "0 de 500"
3. Repetir teste "teste" para @enemeopflores e checar logs
4. Se persistir erro 190: retomar diff de host `graph.facebook.com`→`graph.instagram.com` (já preparado, aguardando aprovação para aplicar/deploy)

---

## Secrets Supabase (gftnjvdvzgjkhwxnxnwl) — estado confirmado

| Secret | Status | Atualizado |
|---|---|---|
| META_INSTAGRAM_ID | ✅ atualizado | 01 Jul 2026 01:26 UTC |
| META_IG_ACCESS_TOKEN | ✅ | 30 Jun 2026 22:19 |
| META_IG_APP_SECRET | ✅ | 30 Jun 2026 23:52 |
| META_PAGE_ACCESS_TOKEN | ✅ | 30 Jun 2026 21:55 |
| META_APP_SECRET | ✅ | 08 Jun 2026 |
| META_VERIFY_TOKEN | ✅ | 08 Jun 2026 |

---

## Plano aprovado para 01/07

1. Confirmar workspace Render ativo
2. Deploy HEAD master (commits 6422133, f1eedfa, 6cb7519)
3. Validar health + workers desativados
4. Testar fluxos críticos

---

## Problemas abertos

| # | Problema | Status |
|---|---|---|
| 1 | Deploy pendente Render (3 commits) | Aguarda 01/07 renovação |
| 2 | CNAME app.enemeopflores.com.br | Aguarda usuário |
| 3 | WhatsApp SDR | Em planejamento |
| 4 | Token Instagram expira 2026-08-29 | Monitorar |
