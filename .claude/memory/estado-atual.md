---
name: estado-atual
description: Estado completo do projeto em 2026-06-02 — pipeline Instagram ativo, dashboard de leads em produção, Vercel unificada em minhaautomacao
metadata:
  type: project
---

## Contexto geral

Projeto: **Fábrica de SaaS** — infraestrutura automatizada para criar, configurar e lançar SaaS completos com IA.

Repositório fábrica: `minhaautomacao/AI-SaaS-Factory-Fabrica-de-Saas`
Repositório floricultura: `minhaautomacao/enemeop-flores`
Local notebook: `C:\Users\NOTEBOOK\Documents\GitHub\enemeop-flores`
Data deste snapshot: 2026-06-02

---

## SaaS Enemeop Flores — Estado atual

### URLs de produção

| URL | Status |
|---|---|
| `https://enemeop-flores-three.vercel.app` | ✅ ONLINE — URL estável minhaautomacao |
| `https://enemeop-flores.vercel.app` | ⚠️ conta errada (essencial-auto-pecas) — ignorar |
| `https://app.enemeopflores.com.br` | ⏳ CNAME pendente no Cloudflare |
| `https://enemeopflores.com.br` | ✅ site público da floricultura (hospedagem separada) |

### Vercel — conta minhaautomacao

- Team ID: `team_gZMrVpE7q1aYd7VXOAUcCN0E`
- Projeto enemeop-flores ID: `prj_rGXjRZzqsE8riGFyvY6koAchZC0Q`
- Projeto fabrica-saas ID: `prj_Iy5tnY1aXRkxYYtyLZn2tLJVt2g1`
- Token API: `vcp_7vhOv4P6PZraSVrJuTlMTq1r5GYiFc6HlazaOltXlTovgKGc2j1UHaRO`
- GitHub auto-deploy: ✅ conectado (push no `master` → deploy automático)
- SSO protection: ✅ desativado (acesso público sem conta Vercel)

### Domínio customizado pendente

Para ativar `app.enemeopflores.com.br` o usuário precisa adicionar no Cloudflare:
- Tipo: `CNAME`
- Nome: `app`
- Destino: `cname.vercel-dns.com`
- Proxy: **OFF** (só DNS)

O registro foi adicionado no Vercel (`verified: true`) — só falta o DNS.

### Infraestrutura

| Item | Valor |
|---|---|
| Supabase enemeop | `gftnjvdvzgjkhwxnxnwl` — São Paulo |
| Supabase URL | `https://gftnjvdvzgjkhwxnxnwl.supabase.co` |
| Supabase fábrica | `ebeapnydeiwuewxatuuw` — minhaautomacao-Saas |
| Vercel MCP config | `~/.claude/.mcp.json` → `vercel-minhaautomacao` |

### Telas implementadas (todas em produção)

- `/login` — tela de acesso
- `/dashboard` — visão geral com métricas e gráfico
- `/dashboard/pedidos` — gestão de pedidos
- `/dashboard/leads` — CRM com dados reais do Instagram via Edge Function
- `/dashboard/entregas` — acompanhamento de entregas
- `/dashboard/financeiro` — receitas, despesas, meta mensal
- `/dashboard/configuracoes` — integrações, horários, agente IA

### Usuário admin

- Email: `contato@enemeopflores.com.br`
- Senha: `12345678`

---

## Pipeline Instagram — EM PRODUÇÃO

- App Meta: `enemeopflores` — App ID: `512230540723061`
- Instagram: `@enemeopflores` (ID: `17841402064363907`)
- Webhook: ativo e verificado
- Fluxo: DM Instagram → webhook-meta → orquestrador → captacao-leads → Supabase
- IA: Groq llama-3.3-70b classificando intenção em tempo real
- Primeiro lead real capturado: `canal_id: 9530087693699545`

### Edge Function de leads

- Função: `leads-enemeop` no Supabase fábrica (`ebeapnydeiwuewxatuuw`)
- URL: `https://ebeapnydeiwuewxatuuw.supabase.co/functions/v1/leads-enemeop`
- Sem JWT verification, lê leads do Instagram, retorna `{ leads, total }`

### Token Instagram

- Gerado em 2026-06-02
- Renovar em ~2026-08-01 (60 dias)

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
| 2 | Agente WhatsApp SDR | Resposta automática para leads do Instagram |
| 3 | Renovação token Instagram | ~60 dias a partir de 2026-06-02 |

### Agente WhatsApp SDR — o que precisa

- Quando um lead é capturado, enviar mensagem de boas-vindas via WhatsApp
- Usar a Edge Function `whatsapp-sdr` já existente na fábrica
- Conectar ao número (11) 982829083
- Credenciais faltantes: `WHATSAPP_ACCESS_TOKEN` e `WHATSAPP_BUSINESS_ACCOUNT_ID` (variáveis criadas no Vercel mas sem valor)

**Why:** Salvo para retomar contexto na próxima sessão sem perda de informação.
**How to apply:** Leia este arquivo no início de cada sessão e continue de onde parou. Próximo passo: CNAME Cloudflare + WhatsApp SDR.
