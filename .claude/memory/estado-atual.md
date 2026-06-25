---
name: estado-atual
description: Estado do projeto em 2026-06-25 — webhook-whatsapp v28 no ar, fluxo WhatsApp funcional com cotação de frete e correção de double-confirm
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
- Token API: [ver em ~/.claude/.env ou painel Vercel — não commitar]
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

**Estado atual:**
- Logamos no Instagram como `@enemeopflores` (senha: Cloe2026) via Chrome MCP
- Navegamos até `developers.facebook.com/apps/512230540723061/roles/`
- **PRÓXIMO PASSO IMEDIATO:** Localizar seção "Testadores do Instagram", verificar se `@enemeopflores` está como Pendente e reenviar o convite

### 3. Roteiro completo de credenciais Meta (ordem de execução)

| # | O que | Onde | Status |
|---|---|---|---|
| 1 | Aceitar convite Testador Instagram @enemeopflores | Funções do app → Testadores do Instagram | ⚠️ PENDENTE |
| 2 | Token de Página do Facebook + Page ID | Graph API Explorer | ⏳ aguarda etapa 1 |
| 3 | Instagram Business Account ID + Token | Graph API Explorer | ⏳ aguarda etapa 2 |
| 4 | WhatsApp Phone Number ID + Token | Casos de uso → WhatsApp | ⏳ aguarda etapa 1 |
| 5 | Webhooks (criar rotas no Next.js) | Código + painel Meta | ⏳ eu faço no código |
| 6 | Ad Account ID | business.facebook.com | ⏳ |
| 7 | Publicar app (sair do modo dev) | Publicar → Análise | ⏳ último passo |

### 4. Credenciais já obtidas
- App ID: `512230540723061`
- App Secret: `f0c1df8038b53a709bccec7ddd023012`
- Instagram App ID: `1403719804436572`
- Instagram App Secret: `acdabdba549c851fcae862f3c56ed877`

---

## Sessão 2026-06-02 — O que o notebook fez (commit a25e247 + 6d860f7)

### Conquistas do notebook
- **webhook-meta deployado** (`supabase/functions/webhook-meta/index.ts`) — recebe DMs e comentários Instagram/Facebook com validação HMAC-SHA256. URL: `https://ebeapnydeiwuewxatuuw.supabase.co/functions/v1/webhook-meta` (verify_jwt=false)
- **App Meta publicado em modo Live** — App ID `512230540723061` saiu do modo dev
- **Primeiro lead real capturado** em 2026-06-02 via Instagram DM
- **captacao-leads v9** — parsing JSON robusto, mais resiliente a payloads variados
- **leads-enemeop** edge function — API interna que retorna leads do Instagram para o dashboard (`/functions/v1/leads-enemeop`)
- **Migration `20260602000008_leads_fix.sql`** — correção/ajuste nas tabelas de leads

### Estado atual de cada integração (pós-notebook)

| Integração | Status | Detalhe |
|---|---|---|
| Instagram DM → lead | ✅ **EM PRODUÇÃO** | webhook-meta recebendo, 1 lead real capturado |
| WhatsApp (resposta) | ❌ 0% | `lib/whatsapp.ts` não existe no orquestrador |
| Mercado Pago PIX | ❌ 0% | nenhum gateway integrado |
| Logística | ❌ 0% | sem cálculo de frete |
| Dashboard com dados reais | ⚠️ parcial | leads reais via leads-enemeop, resto mockado |
| Bug REQUER_ESCALADA | ❌ pendente | orquestrador.ts linhas 38–43 |

### Próximos passos (por prioridade)

1. **Evolution API no orquestrador** — criar `orchestrator/src/lib/whatsapp.ts` para responder via WhatsApp
2. **Mercado Pago PIX** — integrar no enemeop-flores, webhook `api/webhooks/mercadopago.ts`
3. **Tela entregas com dados reais** — tabela `despachos` no Supabase + Realtime
4. **Bug REQUER_ESCALADA** — corrigir `orchestrator/src/workers/orquestrador.ts` linhas 38–43

### Credenciais Meta já obtidas
- App ID: `512230540723061` | App Secret: `f0c1df8038b53a709bccec7ddd023012`
- Instagram App ID: `1403719804436572` | Instagram App Secret: `acdabdba549c851fcae862f3c56ed877`

**Why:** Salvo para retomar contexto na próxima sessão sem perda de informação.
**How to apply:** Leia este arquivo no início de cada sessão e continue de onde parou. Próximo passo: CNAME Cloudflare + WhatsApp SDR.
