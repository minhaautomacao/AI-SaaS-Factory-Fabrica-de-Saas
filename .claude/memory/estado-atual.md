---
name: estado-atual
description: Estado completo do projeto em 2026-05-27 — dashboard implementado, Edge Functions criadas, zero erros TypeScript
metadata:
  type: project
---

## Contexto geral

Projeto: **Fábrica de SaaS** — infraestrutura automatizada para criar, configurar e lançar SaaS completos com IA, voltada para empreendedores brasileiros com baixo custo inicial.

Repositório: `minhaautomacao/AI-SaaS-Factory-Fabrica-de-Saas` (branch `main`)  
Data deste snapshot: 2026-05-27

---

## Estado atual: IMPLEMENTAÇÃO COMPLETA

### Arquitetura decisiva: 24/7 a custo zero
- **Sem BullMQ/Redis** — migrado para Supabase Edge Functions (Deno serverless)
- **Sem Gemini** — removido; Anthropic Claude Sonnet 4.6 é o único modelo usado
- **Custo** = somente API Anthropic (~R$20-50/mês por SaaS) + planos gratuitos de Supabase/Vercel

---

## O que está criado e funcional

### Migrations Supabase (`supabase/migrations/`)
| Arquivo | Conteúdo |
|---|---|
| `20260527000001_leads.sql` | Tabela leads com CRM completo, UTMs, RLS |
| `20260527000002_orchestrator_logs.sql` | Logs do orquestrador + view de monitoramento |
| `20260527000003_workspaces.sql` | Multi-tenant: tabela workspaces |
| `20260527000004_workspace_credentials.sql` | Credenciais encriptadas (AES-256-GCM) |
| `20260527000005_add_workspace_fk.sql` | FK workspace_id em leads e orchestrator_logs |
| `20260527000006_pg_cron_jobs.sql` | Jobs periódicos (inteligencia 2h, estoque 6h, relatorio 23h) |

### Edge Functions Supabase (`supabase/functions/`)
| Arquivo | Função |
|---|---|
| `_shared/types.ts` | Tipos compartilhados (OrquestradorPayload, AgentResult, NomeAgente) |
| `_shared/anthropic.ts` | Cliente Claude API via fetch direto |
| `_shared/supabase.ts` | Cliente Supabase admin (singleton) |
| `_shared/logger.ts` | `logEvento()` → insere em orchestrator_logs |
| `orquestrador/index.ts` | Roteador principal: 23 tipos de evento → 12 agentes |
| `captacao-leads/index.ts` | Classifica leads por intenção |
| `whatsapp-sdr/index.ts` | Redige mensagens WhatsApp personalizadas |
| `financeiro/index.ts` | Processa pagamentos e cobranças |
| `logistica/index.ts` | Calcula frete e agenda coleta |
| `conciliacao/index.ts` | Concilia extratos bancários |
| `operacional/index.ts` | Gerencia status de pedidos |
| `rastreamento/index.ts` | Monitora entregas |
| `pos-venda/index.ts` | Follow-up pós-compra, NPS |
| `marketing/index.ts` | Campanhas e copy de marketing |
| `inteligencia/index.ts` | Análise de métricas e insights |
| `estoque/index.ts` | Controle de estoque (sem saldo negativo) |
| `agente-dev/index.ts` | Planejamento de tarefas de dev |

### Backend dashboard (`server.ts` + `src/lib/`)
| Arquivo | Função |
|---|---|
| `server.ts` | Express com rotas: workspaces, credentials (AES-256-GCM), monitor |
| `src/lib/supabase-server.ts` | `getSupabaseAdmin()` singleton |
| `src/lib/crypto.ts` | `encrypt()` / `decrypt()` AES-256-GCM via Node crypto |

### Rotas disponíveis
- `GET/POST /api/workspaces` + `GET/PUT /api/workspaces/:id`
- `GET/POST /api/workspaces/:id/credentials` + `DELETE` + `POST .../test`
- `GET /api/monitor/logs` + `/metrics` + `/activity`
- `POST /api/login` + `GET /api/auth-status` + `/config-status`

### Frontend dashboard (`src/`)
| Arquivo | Função |
|---|---|
| `src/types.ts` | +Workspace, WorkspaceCredential, OrchestratorLog, ActivityMetric |
| `src/App.tsx` | Navegação por view state (workspaces/detail/credentials/monitor/logs/planner) |
| `src/components/layout/FactorySidebar.tsx` | Sidebar com Fábrica nav + lista de SaaS ativos |
| `src/components/factory/WorkspacesView.tsx` | Grid de cards de workspaces + modal de criação |
| `src/components/factory/WorkspaceDetailView.tsx` | Detalhe: credenciais + métricas |
| `src/components/factory/CreateWorkspaceModal.tsx` | Modal de criação de workspace |
| `src/components/credentials/CredentialCard.tsx` | Card de status de uma credencial |
| `src/components/credentials/CredentialSetup.tsx` | Wizard 6 abas (WhatsApp/Meta/MP/Stripe/Banco/Email) |
| `src/components/monitor/ActivityMonitor.tsx` | Gráfico de barras de atividade 24h (polling 10s) |
| `src/components/monitor/LogsViewer.tsx` | Tabela de logs com filtros (polling 10s) |

### Agentes `.claude/agents/` (todos os 12 completos)
orquestrador, captacao-leads, whatsapp-sdr, financeiro, logistica, conciliacao, operacional, rastreamento, pos-venda, marketing, inteligencia, estoque, agente-dev

---

## Verificações finais
- `npm run lint` → zero erros TypeScript ✅
- `npm run dev` → servidor inicia em :3000 ✅
- Supabase/functions excluídos do tsconfig (Deno não precisa de verificação Node) ✅

---

## Status de deploy (2026-05-27)

### Supabase Migrations — APLICADAS ✅
Todas as 6 migrations aplicadas via MCP no projeto `ebeapnydeiwuewxatuuw`.

### Edge Functions — TODAS DEPLOYADAS ✅
orquestrador, captacao-leads, whatsapp-sdr, financeiro, logistica, conciliacao, operacional, rastreamento, pos-venda, marketing, inteligencia, estoque, agente-dev — todas ACTIVE v1.

---

## Status de produção (2026-05-29) — SISTEMA ONLINE ✅

### Dashboard Vercel — LIVE
- URL: https://fabrica-saas.vercel.app
- `isProtected: true` ✅ | `hasAPIKey: true` ✅
- Env vars configuradas: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, CREDENTIAL_ENCRYPTION_KEY, APP_PASSWORD

### Edge Function Secrets — CONFIGURADOS
- `ANTHROPIC_API_KEY` → salvo em Edge Function Secrets ✅
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` → injetados automaticamente pelo Supabase ✅

### Cofre local — COMPLETO
- `.credentials/infraestrutura/fabrica.env` → todos os campos preenchidos ✅

## Status de produção (2026-05-29) — SISTEMA ONLINE ✅

### Edge Functions adicionais
| Função | Status |
|---|---|
| `webhook-whatsapp-proxy` | ACTIVE v1 — proxy para coexistência de sistemas WhatsApp |

### Template saas-base — CÓDIGO REAL IMPLEMENTADO ✅
`templates/saas-base/` agora contém código deployável completo:
- `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`
- `middleware.ts` — proteção de rotas (auth Supabase SSR)
- `app/layout.tsx`, `app/globals.css`, `app/page.tsx` — landing page com hero + features + pricing
- `app/(auth)/login/page.tsx`, `signup/page.tsx` — autenticação completa
- `app/api/auth/callback/route.ts` — callback OAuth
- `app/api/webhooks/stripe/route.ts` — atualização de plano via webhook
- `app/(dashboard)/layout.tsx` — sidebar com auth server-side
- `app/(dashboard)/dashboard/page.tsx` — stats cards personalizáveis
- `app/(dashboard)/settings/page.tsx` — perfil + plano + logout
- `lib/supabase/client.ts`, `server.ts` — clientes SSR/browser tipados
- `lib/stripe.ts` — checkout, portal, criação de customer
- `lib/utils.ts` — cn, formatarMoeda, formatarData, iniciais
- `types/index.ts` — Database type + Profile + PLANOS config
- `.env.example` — todas as variáveis documentadas com links

### Script de scaffolding — CRIADO ✅
`scripts/criar-saas.ts` — cria novo projeto a partir do template com 5 prompts interativos

## Pendências

### 1. WhatsApp proxy — aguardando URL do sistema antigo
`webhook-whatsapp-proxy` deployado, mas precisa de:
- `WHATSAPP_OLD_SYSTEM_WEBHOOK` (URL do webhook atual da floricultura)
- Configurar `SAAS_WHATSAPP_ACTIVE=false`, `SAAS_WORKSPACE_ID=b30e0fa6-3369-44bf-b766-dd3adf90501b`

### 2. Criar o SaaS da floricultura usando o template
Executar: `npx tsx scripts/criar-saas.ts`
Escolher: saas-base → customizar para floricultura → deploy Vercel + Supabase

---

## Decisões estratégicas fixas

1. **Modelo**: Claude Sonnet 4.6 — único modelo, todos os agentes
2. **Infraestrutura**: Supabase + Vercel (gratuitos); Anthropic API é o único custo
3. **Criptografia**: AES-256-GCM para valores de credenciais; valor nunca retorna ao frontend
4. **Multi-tenant**: `workspace_id` em todas as tabelas isola dados de cada SaaS
5. **Orquestrador**: Event-driven, 23 tipos de evento → 12 agentes; paralelo por padrão
6. **Sem desconto**: agentes nunca concedem desconto sem aprovação explícita do operador
7. **Escalonamento humano**: Carlos é o fallback final para situações críticas

**Why:** Este arquivo foi criado para que qualquer sessão nova possa retomar o trabalho exatamente de onde parou.  
**How to apply:** Sempre ler este arquivo no início de uma sessão. Atualizar quando houver mudanças significativas.
