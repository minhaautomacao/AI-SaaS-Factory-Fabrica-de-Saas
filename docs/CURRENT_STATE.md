# CURRENT STATE — fonte única de retomada

> Ler ESTE arquivo primeiro em toda retomada. Não fazer auditoria completa sem pedido explícito.
> Atualizar sempre que o próximo passo mudar.

---

## Missão M002 — CONCLUÍDA (2026-07-03)

**Flora responde DM real no Instagram.** ✅

```
Meta entrega webhook         ✅
Webhook recebe POST          ✅
HMAC valida (dual secret)    ✅
Flora executa                ✅
Captação executa             ✅
Orquestrador executa         ✅
Token Instagram válido       ✅
Endpoint Graph API correto   ✅  (graph.instagram.com, não graph.facebook.com)
Resposta aparece no Direct   ✅  CONFIRMADO EM PRODUÇÃO
```

Causa raiz: host errado (`graph.facebook.com` em vez de `graph.instagram.com`) para o Instagram User Access Token — não o token, que já estava correto desde 01/07. Corrigido e deployado na função `webhook-meta`. Confirmado por 20+ logs `DM enviado ... endpoint=ig` para destinatários reais distintos entre 02/07 09:35 e 03/07 08:20 (horário local), zero `erro DM` no mesmo período.

Detalhes completos em `docs/DECISIONS.md` (entrada 2026-07-02).

---

## Próxima missão candidata (aguardando confirmação de Carlos)

Conforme roadmap Meta em `CLAUDE.md`, com Instagram 100% concluído, os próximos passos naturais são:

1. **Facebook Messenger 100%** — o código de `webhook-meta` já tem o ramo Facebook/Messenger implementado (`graph.facebook.com/v21.0/me/messages`), mas não foi validado com teste real ainda.
2. **WhatsApp 100% (Cloud API oficial)** — migrar do Z-API atual para a Cloud API Meta.
3. Pendências menores do sprint (ver `CLAUDE.md` → Foco do Sprint Atual): renovação do token Instagram (prazo mencionado ali é 2026-08-01; a entrada de 2026-07-01 em `DECISIONS.md` registra expiração em 2026-08-30 — conferir qual data é a correta antes de agir), CNAME Cloudflare `app.enemeopflores.com.br`, bug REQUER_ESCALADA em `orquestrador/src/workers/orquestrador.ts` linhas 38–43.

**Ainda não escolhida** — qual encarar primeiro deve ser confirmado por Carlos antes de iniciar.

---

## GPT Advisor (frente pausada)

```
Status:              pausado
Motivo:              OpenAI API retornou 429 insufficient_quota
Próxima ação futura: habilitar billing/créditos da OpenAI e repetir teste de conexão
```

Ver `docs/GPT_ADVISOR_RULES.md`. Não reabrir esta frente sem pedido explícito.

---

## Achado desta sessão — pasta local sem as Edge Functions

O repositório local `enemeop-flores` **não contém** `supabase/functions/` (só `supabase/migrations/`). O achado anterior de "conflito de merge não resolvido" em `webhook-meta/index.ts` não se aplica mais — o arquivo simplesmente não existe localmente e nunca foi commitado neste repo (`git log` não retorna histórico para esse caminho). As Edge Functions parecem ser geridas só via deploy direto ao Supabase (MCP/dashboard), fora do controle de versão local — não é bloqueador, mas é risco de rastreabilidade a considerar no futuro.

## Pendências conhecidas (não bloqueiam nada crítico agora)

- Deploy de 3 commits do orquestrador pendente no Render
- Vercel MCP conectado na conta errada ("Essencial Auto Peças") — não usar até trocar
- Edge Functions em produção sem versionamento local (ver achado acima)
