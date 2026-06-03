---
name: estado-atual
description: Estado completo do projeto em 2026-06-03 — pipeline Meta em produção, primeiro lead real capturado, próximo passo integração WhatsApp + pagamentos
metadata:
  type: project
---

## Contexto geral

Projeto: **Fábrica de SaaS** — infraestrutura automatizada para criar, configurar e lançar SaaS completos com IA.

Repositório fábrica: `minhaautomacao/AI-SaaS-Factory-Fabrica-de-Saas` (branch `main`)
Data deste snapshot: 2026-05-29

---

## NOVO PROJETO CRIADO HOJE: SaaS Enemeop Flores

### Repositório
- GitHub: `https://github.com/minhaautomacao/enemeop-flores` (público)
- Local: `C:\Users\carlo\Projetos Minha Automacao\enemeop-flores`

### Infraestrutura
| Item | Valor |
|---|---|
| Supabase projeto | `gftnjvdvzgjkhwxnxnwl` — São Paulo (sa-east-1) |
| Supabase URL | `https://gftnjvdvzgjkhwxnxnwl.supabase.co` |
| Supabase anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdG5qdmR2emdqa2h3eG54bndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMjExNTMsImV4cCI6MjA5NTU5NzE1M30.zgX7BLR5u8f3MNA5kwUVk3P6bjSWEjf9AZP0ksLjvY4` |
| Vercel projeto | `prj_ktppQMG8fL7H1sdrg53Ah5NfF7sB` |
| Vercel team | `team_hAVMrwjX5WZBXsOEcFGzbU8F` |
| URL produção | `https://enemeop-flores.vercel.app` |

### Identidade visual
- Fundo escuro `#1A1208` + dourado `#C9A84C` (extraído do cartão físico da empresa)
- Tipografia Inter, cards com borda dourada sutil

### Telas implementadas (todas em produção)
- `/login` — tela de acesso
- `/dashboard` — visão geral com métricas e gráfico
- `/dashboard/pedidos` — gestão de pedidos com filtros e status
- `/dashboard/leads` — CRM de clientes com classificação por IA
- `/dashboard/entregas` — acompanhamento de entregas por entregador
- `/dashboard/financeiro` — receitas, despesas, meta mensal, por canal
- `/dashboard/configuracoes` — integrações, horários, agente IA, mensagens

### Banco de dados (migration aplicada)
- `public.profiles` — perfis de usuários com trigger auto-create
- `public.pedidos` — pedidos com status workflow
- `public.leads` — CRM de clientes com intenção IA

### Usuário criado no Supabase
- Email: `contato@enemeopflores.com.br`
- Senha: `12345678`
- ID: `52d4c8ed-eb44-46ee-b50f-895bac435b69`

---

## ✅ Login funcionando

Confirmado em 2026-06-01: login manual em `https://enemeop-flores.vercel.app/login` funciona corretamente.
- Email: `contato@enemeopflores.com.br` / Senha: `12345678`
- O problema anterior era causado pela automação do browser (Chrome MCP), não pelo código.

---

## Regras ativas (salvas em memória)

1. **Testar antes de avisar** — nunca reportar tarefa concluída sem validar no ambiente real
2. **Aba auxiliar** — sempre abrir aba auxiliar ao usar Chrome MCP para testes

---

## Fábrica de SaaS — estado geral (sistema original)

### Supabase (projeto fábrica)
- Projeto: `ebeapnydeiwuewxatuuw` — minhaautomacao-Saas
- 6 migrations aplicadas, 13 Edge Functions deployadas (ACTIVE)
- Dashboard fábrica: `https://fabrica-saas.vercel.app`

### Stack Fábrica
- Edge Functions: orquestrador + 12 agentes (captacao-leads, whatsapp-sdr, financeiro, logistica, conciliacao, operacional, rastreamento, pos-venda, marketing, inteligencia, estoque, agente-dev)
- Shared: `_shared/credentials.ts`, `_shared/whatsapp.ts`, `_shared/email.ts`
- Secret `CREDENTIAL_ENCRYPTION_KEY` configurado nas Edge Functions

### Pendências da fábrica
1. WhatsApp proxy (`webhook-whatsapp-proxy`) aguarda `WHATSAPP_OLD_SYSTEM_WEBHOOK`
2. Credenciais reais da Enemeop precisam ser inseridas em `enemeop-flores.vercel.app/dashboard/configuracoes`

---

## Sessão 2026-06-01 — O que foi feito e onde paramos

### 1. Sincronização Desktop ↔ Notebook
- Criado script `scripts/setup-novo-ambiente.ps1` — instala Git, GitHub CLI, Vercel CLI, Claude Code CLI, clona os dois repos, configura `~/.claude/`
- Criado script `scripts/verificar-ambiente.ps1` — verifica se repos do notebook estão iguais ao desktop
- Notebook (usuário: NOTEBOOK / ANTONIOCARLOS) executou os scripts e ficou 100% sincronizado
- Ambos os repos confirmados sincronizados: `fabrica-saas` (commit 67008d7) e `enemeop-flores` (commit a81bb7e)
- Login funcionando em `https://enemeop-flores.vercel.app/login` — bug anterior era falso positivo da automação browser

### 2. Integração Meta (Facebook/Instagram/WhatsApp) — EM ANDAMENTO
**App criado:** `enemeopflores` — App ID: `512230540723061`

**Estado atual:**
- Logamos no Instagram como `@enemeopflores` (senha: Cloe2026) via Chrome MCP
- Navegamos até `developers.facebook.com/apps/512230540723061/roles/`
- Estamos na seção **Funções do app** — clicamos em "Funções" (não "Usuários de teste")
- **PRÓXIMO PASSO IMEDIATO:** Na tela de Funções, localizar a seção "Testadores do Instagram", verificar se `@enemeopflores` está como Pendente e reenviar o convite

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

1. **Evolution API no orquestrador** — criar `orchestrator/src/lib/whatsapp.ts` para responder via WhatsApp. Fecha o loop lead→resposta
2. **Mercado Pago PIX** — integrar no enemeop-flores, webhook `api/webhooks/mercadopago.ts`
3. **Tela entregas com dados reais** — tabela `despachos` no Supabase + Realtime
4. **Bug REQUER_ESCALADA** — corrigir `orchestrator/src/workers/orquestrador.ts` linhas 38–43

### Credenciais Meta já obtidas
- App ID: `512230540723061` | App Secret: `f0c1df8038b53a709bccec7ddd023012`
- Instagram App ID: `1403719804436572` | Instagram App Secret: `acdabdba549c851fcae862f3c56ed877`

**Why:** Salvo para retomar contexto na próxima sessão sem perda de informação.
**How to apply:** Leia este arquivo no início de cada sessão e continue de onde parou.
