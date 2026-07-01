# CURRENT STATE — fonte única de retomada

> Ler ESTE arquivo primeiro em toda retomada. Não fazer auditoria completa sem pedido explícito.
> Atualizar sempre que o próximo passo mudar.

---

## Missão atual

**MISSÃO M002 — Fazer a Flora responder DM real no Instagram.**

Nenhuma funcionalidade nova do painel será desenvolvida antes de concluir a integração Meta.

---

## Estado já conhecido

```
Meta entrega webhook         ✅
Webhook recebe POST          ✅
HMAC valida (dual secret)    ✅  (META_IG_APP_SECRET + META_APP_SECRET)
Flora executa                ✅
Captação executa             ✅
Orquestrador executa         ✅
META_INSTAGRAM_ID no secret  ✅  (corrigido 01/07/2026 01:26 UTC)
webhook-meta v20 ativa       ✅  (já loga status/endpoint/corpo do erro da Graph API)
Endpoint Graph API correto   ✅  (endpoint=ig, confirmado no log)
Resposta aparece no Direct   ❌  BLOQUEADO — token malformado (ver causa raiz abaixo)
```

## Causa raiz confirmada (01/07/2026, via log real do Supabase Dashboard)

```
ERROR [webhook-meta] erro DM status=400 endpoint=ig
corpo={"error":{"message":"Invalid OAuth access token - Cannot parse access token","type":"OAuthException","code":190,"fbtrace_id":"AAY_PcKh4i4OP4IxKf4jhR5"}}
```

`META_IG_ACCESS_TOKEN` está malformado (não é "expirado" — é "não parseável", geralmente espaço/quebra de linha/aspas extras coladas ao salvar o secret em 30/06 22:19). Pipeline inteiro funciona; só o valor do token precisa ser resetado limpo.

---

## Próximo passo exato

1. Carlos gera um novo `META_IG_ACCESS_TOKEN` limpo (Graph API Explorer / fluxo Meta).
2. Definir o secret no Supabase via `Read-Host -AsSecureString` (nunca expor o token no chat/terminal) — ver [[feedback-seguranca-tokens]].
3. Pedir novo teste "teste" para @enemeopflores.
4. Verificar logs de `webhook-meta` no dashboard: `https://supabase.com/dashboard/project/gftnjvdvzgjkhwxnxnwl/functions/webhook-meta/logs` (Playwright MCP já tem sessão logada).

### Nota técnica — como ler os logs de execução
`mcp__supabase__get_logs` (service=edge-function) só retorna logs de gateway (método/status HTTP), não console.log/error da função. Para ver o erro real da Graph API, usar Playwright MCP navegando direto para a URL de logs acima.

---

## Sessão atual — GPT Advisor

**GPT Advisor integrado.** Status: **Operacional** (código pronto, `ai/advisor.ts` + `ai/sanitize.ts` + `ai/prompt.ts` + `scripts/gpt-advisor.ts`).
Ainda sem `OPENAI_API_KEY` configurada — nenhuma chamada real foi feita. Ver `docs/GPT_ADVISOR_RULES.md`.

---

## Pendências conhecidas (não bloqueiam a missão atual)

- Deploy de 3 commits do orquestrador pendente no Render (não é blocker do M002)
- Vercel MCP conectado na conta errada ("Essencial Auto Peças") — não usar até trocar
- Token Instagram expira 2026-08-01
