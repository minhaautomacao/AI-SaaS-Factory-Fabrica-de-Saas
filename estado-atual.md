# Estado Atual — Fábrica de SaaS

> Atualizado em: 2026-06-17 (fim do dia)

## Projeto ativo: Enemeop Flores

### Infraestrutura em produção

| Componente | URL/Info | Status |
|---|---|---|
| App (painel admin) | https://enemeop-flores-three.vercel.app | ✅ Online |
| Supabase Enemeop | https://gftnjvdvzgjkhwxnxnwl.supabase.co | ✅ Ativo |
| Webhook Meta (Flora) | webhook-meta no Supabase Enemeop (`gftnjvdvzgjkhwxnxnwl`) | ✅ Deployado v8 |
| Pipeline Instagram | DM → webhook-meta → IA Flora → Graph API v21.0 | ⚠️ Webhook não recebe DMs reais |
| Orquestrador | https://enemeop-orchestrator.onrender.com | ✅ Online |
| WhatsApp Z-API | Instância "Enemeop Flores" | ✅ Funcionando e respondendo |

---

## O que foi feito hoje (2026-06-16 / 2026-06-17)

### Manhã — Z-API WhatsApp ✅ CONCLUÍDO
- Z-API configurado com sucesso (instância "Enemeop Flores")
- Variáveis ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN configuradas no Render
- WhatsApp **testado e funcionando** — agente Flora responde clientes normalmente
- SDR melhorado: usa nome do cliente, salva `mensagem_inicial` e `status` no primeiro contato
- Build TS corrigido, polling BullMQ reduzido de 5ms para 30s

### Tarde/Noite — Agente Meta (Instagram) ⚠️ PENDENTE
- `webhook-meta` atualizado (v8, `--no-verify-jwt`):
  - **Bug crítico corrigido**: função `enviarAoOrquestrador` usava `FACTORY_SECRET` como Bearer token para chamar `orquestrador`, mas `orquestrador` tem `verify_jwt: true` e só aceita JWTs Supabase. Corrigido para sempre usar `SUPABASE_SERVICE_ROLE_KEY`
  - `META_PAGE_ACCESS_TOKEN` como token para envio de DMs (com fallback para IG token)
  - API Graph atualizada v19.0 → v21.0
  - Correção na extração de comentários
- App Meta publicado em modo **Live** (Publicado)
- Subscriptions app-level confirmadas: `instagram` → `messages,mentions`; `page` → `feed,messages`
- Pipeline interno **funcionando**: webhook-meta → orquestrador (200) → captacao-leads (200)
- Novo SUPABASE_ACCESS_TOKEN gerado (sem expiração)

### Problemas encontrados e NÃO resolvidos
1. **DMs reais do Instagram não chegam ao webhook** — app-level subscription está ativa mas Meta não envia events
2. **`POST /17841402064363907/subscribed_apps` → erro #3** — app não tem o produto Messenger habilitado
3. **`POST /350648311678163/subscribed_apps` com `messages` → erro #200** — token não tem `pages_messaging`
4. **Step 2 "Gerar tokens de acesso" no dashboard** (Casos de uso → API do Instagram) — accordion não abre via Playwright; é necessário completar manualmente para vincular a conta @enemeopflores
5. **"enemeopflores-IG" (ID: 140371980443657)** — app Instagram de terceiro ainda aparece vinculado; usuário quer remover

---

## Status atual detalhado

### Pipeline WhatsApp (Z-API) ✅
```
Cliente WhatsApp → Z-API → Orquestrador (Render) → Flora (Groq) → Z-API → Cliente
```
- Instância: "Enemeop Flores"
- Número: 5511912808282
- Histórico salvo no Redis (TTL 3 dias)
- Escalada para Carlos quando cliente pede atendente

### Pipeline Instagram ⚠️
```
DM Instagram → Meta Webhook → webhook-meta (Supabase) → Orquestrador → Flora (Groq) → Graph API v21.0 → DM reply
```
- webhook-meta: deployado e funcional quando recebe POST
- Problema: Meta não está enviando events de DM reais para o webhook
- Causa raiz: conta Instagram (@enemeopflores) não está explicitamente subscrita ao app

---

## Próximos passos CRÍTICOS (Meta/Instagram)

### Opção A — Completar o Step 2 manualmente no dashboard Meta
1. Ir para: https://developers.facebook.com/apps/512230540723061/use_cases/customize/API-Setup/?product_route=instagram-business&business_id=404645956664099&use_case_enum=INSTAGRAM_BUSINESS&selected_tab=API-Setup
2. Expandir "2. Gerar tokens de acesso"
3. Clicar em "Adicionar conta do Instagram" e fazer OAuth com @enemeopflores
4. Isso cria a subscription de webhook para a conta
5. **Também remover "enemeopflores-IG" (ID: 140371980443657) — terceiro que não administra mais a conta**

### Opção B — Adicionar permissão `pages_messaging` ao token
1. No Graph API Explorer, adicionar `pages_messaging` às permissões
2. Gerar novo token
3. Chamar `POST /350648311678163/subscribed_apps?subscribed_fields=messages`
4. Isso vincula a Page do Facebook (que tem Instagram conectado) ao webhook

### Opção C — App Review (necessário para produção completa)
- Submeter para App Review as permissões `pages_messaging` e `pages_manage_metadata`
- Sem isso, só desenvolvedores/admins do app podem testar em Live

---

## Credenciais relevantes

| Credencial | Localização |
|---|---|
| Supabase Access Token CLI | `.credentials/infraestrutura/.env` (sem expiração) |
| Z-API credenciais | `.credentials/infraestrutura/.env` |
| Meta App Secret / Tokens | `.credentials/meta/.env` |
| WhatsApp número Enemeop | 5511912808282 |
| Instagram ID @enemeopflores | 17841402064363907 |
| Facebook Page ID | 350648311678163 |
| Meta App ID | 512230540723061 |
| CARLOS_WHATSAPP (verificar no Render) | 5511982829083 (não 5511912808282) |
