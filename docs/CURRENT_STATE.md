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
webhook-meta v19 ativa       ✅
Resposta aparece no Direct   ❌  (aguardando teste após correção do secret)
```

---

## Próximo passo exato

1. Pedir que Carlos envie "teste" para @enemeopflores pelo Instagram Direct.
2. Verificar SOMENTE os logs da função `webhook-meta` (Supabase `gftnjvdvzgjkhwxnxnwl`).
3. Confirmar: canal (ig/fb), status da Graph API, se a resposta chegou no Direct.

### Se não responder
Preparar diff mínimo v20 do `webhook-meta` para registrar em log (sem tokens/secrets):
- canal
- igId
- endpoint usado
- status da Graph API
- corpo do erro da Graph API

---

## Pendências conhecidas (não bloqueiam a missão atual)

- Deploy de 3 commits do orquestrador pendente no Render (não é blocker do M002)
- Vercel MCP conectado na conta errada ("Essencial Auto Peças") — não usar até trocar
- Token Instagram expira 2026-08-01
