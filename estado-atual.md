# Estado Atual — Fábrica de SaaS

<<<<<<< HEAD
> Atualizado em: 2026-06-17 (fim do dia)
=======
> Atualizado em: 2026-06-23
>>>>>>> 290c2c7d0753505a14d092d64159c5e0456fed40

## Projeto ativo: Enemeop Flores

### Sessão 2026-06-23 — O que foi feito

#### WhatsApp Bot (webhook-whatsapp)

1. **Tabela `conversas` criada** — era o root cause de tudo não funcionar ✅
2. **webhook-whatsapp v7 deployado** com:
   - `verify_jwt: false` (Z-API não manda JWT — NUNCA deployar com true)
   - Catálogo corrigido: apenas códigos reais do banco (removidos ~30 códigos inventados como M28, 051, etc.)
   - Normalização de telefone: números sem `55` recebem o prefixo automaticamente
   - Integração de frete: detecta CEP na mensagem → chama `logistica` → injeta cotação no contexto da IA
   - System prompt: entrega NUNCA é gratuita; fotos automáticas com códigos; sem mencionar ligação
3. **JWT bug resolvido** — v3 e v4 deployaram com `verify_jwt: true` quebrando tudo. Corrigido na v5+
4. **Foto dos produtos** — sistema funciona quando IA inclui código; catálogo corrigido garante códigos válidos
5. **Multi-cliente** — sistema atende múltiplos clientes simultaneamente via tabela `conversas` por (canal_id, canal)

#### Números WhatsApp
- **Bot (Z-API): `5511912808282`** — clientes mandam mensagem aqui para falar com Flor (bot)
- **Site/humano: `5511982829083`** — NÃO TOCAR, outro sistema já configurado no site

#### Pendentes
- [ ] Confirmar cotação Lalamove funcionando para CEPs de SP (integrado mas não testado com sucesso ainda)
- [ ] Corrigir coordenadas de origem no `lalamove.ts` (ainda usa defaults de Aracaju em vez de Ipiranga SP)
- [ ] Corrigir bug de login em `enemeop-flores.vercel.app`
- [ ] Renovação do token Instagram (~60 dias)
- [ ] Divulgar número do bot (91280-8282) nos canais de marketing

---

### Infraestrutura em produção

| Componente | URL/Info | Status |
|---|---|---|
| App (painel admin) | https://enemeop-flores-three.vercel.app | ✅ Online |
<<<<<<< HEAD
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
=======
| Supabase | https://gftnjvdvzgjkhwxnxnwl.supabase.co | ✅ Ativo |
| Webhook WhatsApp | `webhook-whatsapp` v7, verify_jwt: false | ✅ Funcional |
| Webhook Instagram | `webhook-meta` | ✅ Ativo |
| Pipeline leads | DM Instagram/WhatsApp → Supabase | ✅ Funcional |
| Bot WhatsApp | número 5511912808282 via Z-API | ✅ Respondendo |
| Lalamove (frete) | Integrado no webhook-whatsapp v7 | ⚠️ Integrado, cotação SP não confirmada |

---

### Credenciais Z-API (Enemeop Flores)
>>>>>>> 290c2c7d0753505a14d092d64159c5e0456fed40

| Credencial | Localização |
|---|---|
<<<<<<< HEAD
| Supabase Access Token CLI | `.credentials/infraestrutura/.env` (sem expiração) |
| Z-API credenciais | `.credentials/infraestrutura/.env` |
| Meta App Secret / Tokens | `.credentials/meta/.env` |
| WhatsApp número Enemeop | 5511912808282 |
| Instagram ID @enemeopflores | 17841402064363907 |
| Facebook Page ID | 350648311678163 |
| Meta App ID | 512230540723061 |
| CARLOS_WHATSAPP (verificar no Render) | 5511982829083 (não 5511912808282) |
=======
| ZAPI_INSTANCE_ID | 3F4B4EBCBF57819B4C199EBEB687E09D |
| ZAPI_TOKEN | 23A3BBB9EBFED71EB53E773B |
| ZAPI_CLIENT_TOKEN | F85b5a2e44844413db35105bfc68493d1S |
| Número conectado | 5511912808282 |
| Webhook configurado | https://gftnjvdvzgjkhwxnxnwl.supabase.co/functions/v1/webhook-whatsapp |

---

### Próximo passo imediato

1. Testar cotação de frete: mandar mensagem com CEP para o bot e verificar se Lalamove retorna valor correto
2. Se não funcionar: checar coordenadas de origem no `lalamove.ts` (mudar de Aracaju para Ipiranga SP: lat -23.5906, lng -46.6070)
3. Após frete funcionando: corrigir bug de login no painel admin
>>>>>>> 290c2c7d0753505a14d092d64159c5e0456fed40
