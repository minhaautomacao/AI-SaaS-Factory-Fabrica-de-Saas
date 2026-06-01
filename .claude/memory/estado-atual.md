---
name: estado-atual
description: Estado completo do projeto em 2026-05-29 — SaaS Enemeop Flores criado, deployado, com bug de login pendente
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

**Why:** Salvo para retomar contexto na próxima sessão sem perda de informação.
**How to apply:** Leia este arquivo no início de cada sessão e continue de onde parou.
