# SESSION STATE — Fábrica de SaaS

> Fonte de verdade do estado atual. Atualizar a cada CHECKPOINT.
> Máx. 60 linhas. Se crescer além disso, arquivar em CHANGELOG_AGENT.md.

---

## Status geral

| Campo | Valor |
|---|---|
| Data deste snapshot | 2026-06-30 |
| Fase atual | Fase 8 — Execução pós-produção |
| Branch fábrica | main |
| Branch enemeop | master |
| Pipeline Instagram | Produção — funcional (via Supabase Edge Functions) |

---

## Último deploy no Render

| Serviço | Commit deployado | Data |
|---|---|---|
| enemeop-orchestrator | 53f307c | 22/06/2026 |
| Workspace | **SUSPENSO** (cota banda excedida) | desde 25/06/2026 |
| Renovação cota | **01/07/2026** | automática |

---

## HEAD atual (main) — pronto para deploy

```
6cb7519 — WORKERS_ENABLED=false + BullMQ drainDelay=30s (não deployado)
f1eedfa — /health leve {"ok":true} (não deployado)
6422133 — keep-alive 14min, remove ping Evolution (não deployado)
```

---

## Plano aprovado para 01/07 (por Carlos em 30/06/2026) — CORRIGIDO

**Sem alterações novas. Apenas deploy do HEAD atual.**

1. Confirmar workspace ativo no Render
2. Confirmar que HEAD contém os commits `6422133`, `f1eedfa`, `6cb7519`:
   `git log --oneline -5` + `git status`
3. Deploy manual enemeop-orchestrator (HEAD main = 6cb7519)
4. Confirmar nos logs:
   - `WORKERS_ENABLED=false`
   - workers BullMQ desativados
   - sem erro Upstash
   - servidor online
5. `curl -fsS https://enemeop-orchestrator.onrender.com/health` → `{"ok":true}`
6. Testar fluxos críticos: WhatsApp, Instagram/Meta, pagamento, logística

**NÃO deletar, suspender ou alterar nenhum serviço sem nova aprovação explícita.**

---

## Problemas abertos

| # | Problema | Impacto | Status |
|---|---|---|---|
| 1 | Deploy pendente (commits 6422133+f1eedfa+6cb7519) | drainDelay=30s não ativo | Aguarda 01/07 |
| 2 | CNAME `app.enemeopflores.com.br` não configurado | Domínio customizado offline | Aguarda usuário |
| 3 | WhatsApp SDR não implementado | Sem resposta automática | Em planejamento |
| 4 | Token Instagram expira 2026-08-01 | Pipeline offline após data | Monitorar |

---

## Infraestrutura crítica

| Serviço | URL / ID | Status |
|---|---|---|
| enemeop-orchestrator (Render) | enemeop-orchestrator.onrender.com | Suspenso — retorna 01/07 |
| Supabase enemeop | gftnjvdvzgjkhwxnxnwl | Online |
| Supabase fábrica | ebeapnydeiwuewxatuuw | Online |
| Webhook Meta | /functions/v1/webhook-meta | Ativo (independente do Render) |
| Z-API WhatsApp | ZAPI_* vars no Render | Aguarda retorno do orquestrador |
