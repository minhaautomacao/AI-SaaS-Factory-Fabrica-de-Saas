# Estado Atual — Fábrica de SaaS

> Atualizado em: 2026-06-09

## Projeto ativo: Enemeop Flores

### Infraestrutura em produção

| Componente | URL | Status |
|---|---|---|
| App (painel admin) | https://enemeop-flores-three.vercel.app | ✅ Online |
| Supabase | https://gftnjvdvzgjkhwxnxnwl.supabase.co | ✅ Ativo |
| Webhook Instagram | via Supabase Edge Function | ✅ Ativo |
| Pipeline leads | DM Instagram → Supabase | ✅ Funcional |

### O que foi feito hoje (2026-06-09)

- [x] Auditoria completa do projeto
- [x] `SUPABASE_SERVICE_ROLE_KEY` obtida via API e salva em todos os arquivos `.env`
- [x] `orchestrator/.env` criado com todas as credenciais disponíveis
- [x] `.env.local` do app completado
- [x] Bug de login corrigido — `site_url` do Supabase auth corrigido para `https://enemeop-flores-three.vercel.app`
- [x] Login verificado e funcionando via API
- [x] Guia Evolution API (WhatsApp gratuito no Render) criado
- [x] Guia Upstash Redis (setup gratuito) criado

### Próximos passos (pendentes de ação manual)

1. **Upstash Redis** — criar banco gratuito em console.upstash.com
   - Guia: `infraestrutura/upstash-setup.md`
   - Após criar: preencher `UPSTASH_REDIS_URL` e `UPSTASH_REDIS_TOKEN` no `orchestrator/.env`

2. **Evolution API (WhatsApp)** — deploy no Render.com
   - Guia: `infraestrutura/evolution-api-render.md`
   - Após deploy: preencher `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE` no `orchestrator/.env`
   - Escanear QR Code com o celular da floricultura

3. **CARLOS_WHATSAPP** — adicionar número no `orchestrator/.env`
   - Formato: `5511999999999` (sem +, sem espaços)

4. **Token Vercel** — regenerar em vercel.com/account/tokens
   - Atualizar em `.credentials/infraestrutura/.env`

5. **Orquestrador** — após Upstash configurado, fazer deploy no Render
   - Repositório: AI-SaaS-Factory-Fabrica-de-Saas
   - Pasta: `orchestrator/`
   - Build: `npm install && npm run build`
   - Start: `npm start`

6. **UptimeRobot** — configurar monitor para Evolution API (mantém acordado no free tier)

### Credenciais — resumo do que está onde

| Credencial | Arquivo | Status |
|---|---|---|
| SUPABASE_URL + ANON_KEY | `.env.local` do app | ✅ |
| SUPABASE_SERVICE_ROLE_KEY | `.env.local` + `orchestrator/.env` + `.credentials/infraestrutura/.env` | ✅ |
| META_* (Instagram/Facebook) | `.credentials/meta/.env` | ✅ |
| GROQ_API_KEY | `orchestrator/.env` + `.credentials/infraestrutura/.env` | ✅ |
| ANTHROPIC_API_KEY | `orchestrator/.env` + `.credentials/infraestrutura/.env` | ✅ |
| UPSTASH_REDIS_URL/TOKEN | `orchestrator/.env` | ❌ Faltando |
| EVOLUTION_API_* | `orchestrator/.env` | ❌ Faltando |
| CARLOS_WHATSAPP | `orchestrator/.env` | ❌ Faltando |
| VERCEL_TOKEN | `.credentials/infraestrutura/.env` | ⚠️ Expirado |
