---
name: estado-atual
<<<<<<< HEAD
description: Estado completo do projeto em 2026-06-17 — pipeline Meta em produção, WhatsApp SDR pendente, renovação token Instagram em agosto
=======
description: Estado do projeto em 2026-06-25 — webhook-meta v23 deployado com fix concluido; webhook-whatsapp v28 no ar
>>>>>>> 290c2c7d0753505a14d092d64159c5e0456fed40
metadata:
  type: project
---

## Protocolo multiagente ativo

Consulte `.claude/AGENTES.md` para papéis, fluxo e convenções.
Relatórios de auditoria em `.claude/audits/`.

---

## Estado atual — 2026-06-25

### Bola com: Claude Code (aguardando próximo objetivo via ChatGPT)

### Última feature entregue
- `webhook-meta v23` — corrige bug concluido: reinicia conversa em vez de ignorar novas mensagens (mesmo fix do whatsapp v27)
- `webhook-whatsapp v28` — corrige double-confirm de endereço e reset após pedido concluído
- `agente-logistica v4` — MOTORCYCLE-first com fallback para CAR, markup R$15

### Pendências abertas

| # | Tarefa | Responsável |
|---|---|---|
| 1 | Testar cotação Lalamove com CEP real de SP | Carlos (teste manual no WhatsApp) |
| 2 | Após pagamento confirmado: booking real Lalamove + pedido na tela | Claude Code |
| 3 | Renovação token Instagram (~2026-08-01) | Claude Code quando chegar a data |

### Fluxo WhatsApp — estado atual

```
DM WhatsApp → webhook-whatsapp → Groq IA
  → formulário de endereço → extração de dados → confirmação única
  → agente-logistica → Lalamove MOTORCYCLE/CAR → cotação exibida ao cliente
  → [PENDENTE] pagamento confirmado → booking Lalamove + registro em pedidos
```

---

## Contexto geral

Projeto: **Fábrica de SaaS** — infraestrutura automatizada para criar, configurar e lançar SaaS completos com IA.

Repositório fábrica: `minhaautomacao/AI-SaaS-Factory-Fabrica-de-Saas`
Repositório floricultura: `minhaautomacao/enemeop-flores`
Local notebook: `C:\Users\NOTEBOOK\Documents\GitHub\enemeop-flores`
Data deste snapshot: 2026-06-17

---

## SaaS Enemeop Flores — Estado atual

### URLs de produção

| URL | Status |
|---|---|
| `https://enemeop-flores-three.vercel.app` | ONLINE — URL estável minhaautomacao |
| `https://enemeop-flores.vercel.app` | conta errada (essencial-auto-pecas) — ignorar |
| `https://app.enemeopflores.com.br` | CNAME pendente no Cloudflare |
| `https://enemeopflores.com.br` | site público da floricultura (hospedagem separada) |

### Vercel — conta minhaautomacao

- Team ID: `team_gZMrVpE7q1aYd7VXOAUcCN0E`
- Projeto enemeop-flores ID: `prj_rGXjRZzqsE8riGFyvY6koAchZC0Q`
- Projeto fabrica-saas ID: `prj_Iy5tnY1aXRkxYYtyLZn2tLJVt2g1`
- GitHub auto-deploy: conectado (push no `master` → deploy automático)
- SSO protection: desativado

### Infraestrutura

| Item | Valor |
|---|---|
| Supabase enemeop | `gftnjvdvzgjkhwxnxnwl` — São Paulo |
| Supabase URL | `https://gftnjvdvzgjkhwxnxnwl.supabase.co` |
| Supabase fábrica | `ebeapnydeiwuewxatuuw` — minhaautomacao-Saas |

---

## Pipeline Instagram — EM PRODUÇÃO

- App Meta: `enemeopflores` — App ID: `512230540723061`
- Instagram: `@enemeopflores` (ID: `17841402064363907`)
- Webhook: ativo e verificado
- Fluxo: DM Instagram → webhook-meta → orquestrador → captacao-leads → Supabase
- IA: Groq llama-3.3-70b classificando intenção em tempo real
- Primeiro lead real capturado: `canal_id: 9530087693699545`
- Edge Function leads: `https://ebeapnydeiwuewxatuuw.supabase.co/functions/v1/leads-enemeop`
- Token Instagram gerado em 2026-06-02 — **renovar em 2026-08-01**

---

## Fábrica de SaaS — estado geral

- 6 migrations aplicadas, 13 Edge Functions deployadas (ACTIVE)
- Stack: orquestrador + agentes (captacao-leads, whatsapp-sdr, financeiro, etc.)
- URL fábrica: `https://fabrica-saas-ebon.vercel.app`

---

## Próximas tarefas (por prioridade)

| # | Tarefa | Detalhe |
|---|---|---|
| 1 | CNAME Cloudflare | `app CNAME cname.vercel-dns.com` (usuário faz no painel) |
| 2 | Agente WhatsApp SDR | Resposta automática para leads — requer Oracle Cloud VM com Baileys ou Z-API R$79/mês |
| 3 | Renovação token Instagram | **2026-08-01** — token gerado em 2026-06-02 |
| 4 | Bug REQUER_ESCALADA | `orchestrator/src/workers/orquestrador.ts` linhas 38–43 |
| 5 | Mercado Pago PIX | `enemeop-flores/api/webhooks/mercadopago.ts` |

### Credenciais Meta obtidas
- App ID: `512230540723061` | App Secret: `f0c1df8038b53a709bccec7ddd023012`
- Instagram App ID: `1403719804436572` | Instagram App Secret: `acdabdba549c851fcae862f3c56ed877`

### WhatsApp — decisão atual
Evolution API e Baileys falharam. Opção aprovada: Z-API (~R$79/mês).
Vars: `ZAPI_INSTANCE_ID`, `ZAPI_TOKEN`, `ZAPI_CLIENT_TOKEN`

---

**How to apply:** Leia este arquivo no início de cada sessão e continue de onde parou sem perguntar contexto.
