# CREDENTIALS INDEX — Fábrica de SaaS

> Índice seguro de credenciais. NUNCA registrar valores reais aqui.
> Apenas nome, localização, status e metadados.
> Atualizar via comando: `ATUALIZAR_CREDENCIAL <nome_do_serviço>`

---

## Infraestrutura

| Serviço | Variável | Arquivo | Status | Última atualização | Impacto |
|---|---|---|---|---|---|
| Supabase fábrica URL | `SUPABASE_URL` | `.credentials/infraestrutura/.env` | ✅ Presente | 2026-06-02 | Banco principal da fábrica |
| Supabase fábrica Anon Key | `SUPABASE_ANON_KEY` | `.credentials/infraestrutura/.env` | ✅ Presente | 2026-06-02 | Acesso público seguro |
| Supabase fábrica Service Role | `SUPABASE_SERVICE_ROLE_KEY` | `.credentials/infraestrutura/.env` | ✅ Presente | 2026-06-02 | Acesso admin — nunca expor |
| Supabase Access Token (CLI) | `SUPABASE_ACCESS_TOKEN` | Uso temporário em sessão | ✅ Presente | 2026-06-02 | Deploy de edge functions |
| Vercel Token | `VERCEL_TOKEN` | `~/.vercel/auth.json` | ✅ Presente | 2026-05-01 | Deploy frontend |
| Anthropic API Key | `ANTHROPIC_API_KEY` | `.credentials/infraestrutura/.env` | ✅ Presente | 2026-05-01 | IA — Claude nas edge functions |
| Groq API Key | `GROQ_API_KEY` | Supabase Secrets (`ebeapnydeiwuewxatuuw`) | ✅ Presente | 2026-06-02 | Classificação de leads em tempo real |
| Upstash Redis URL | `UPSTASH_REDIS_REST_URL` | `.credentials/infraestrutura/.env` | ✅ Presente | 2026-05-01 | Queue do orquestrador |
| Upstash Redis Token | `UPSTASH_REDIS_REST_TOKEN` | `.credentials/infraestrutura/.env` | ✅ Presente | 2026-05-01 | Queue do orquestrador |

---

## Meta / Instagram

| Serviço | Variável | Arquivo | Status | Última atualização | Impacto |
|---|---|---|---|---|---|
| Meta App ID | `META_APP_ID` | `.credentials/meta/.env` | ✅ Presente | 2026-06-02 | Identificação do app (público) |
| Meta App Secret | `META_APP_SECRET` | `.credentials/meta/.env` | ✅ Presente | 2026-06-02 | Validação HMAC do webhook |
| Meta Verify Token | `META_VERIFY_TOKEN` | Supabase Secrets | ✅ Presente | 2026-06-02 | Verificação do webhook |
| Instagram Token | `META_IG_ACCESS_TOKEN` | Supabase Secrets | ✅ Presente | 2026-07-01 | Instagram Business Login — **expira 2026-08-30**, renovar até 2026-08-23. Pendente: teste de DM real confirmando envio |
| Instagram App ID | `INSTAGRAM_APP_ID` | `.credentials/meta/.env` | ✅ Presente | 2026-06-02 | Identificação Instagram |
| Instagram App Secret | `INSTAGRAM_APP_SECRET` | `.credentials/meta/.env` | ✅ Presente | 2026-06-02 | OAuth Instagram |
| Meta Page Access Token | `META_PAGE_ACCESS_TOKEN` | Supabase Secrets | ❌ Ausente | — | Publicação no Facebook |
| Meta Page ID | `META_PAGE_ID` | `.credentials/meta/.env` | ❌ Ausente | — | Identificação da página |

---

## WhatsApp

| Serviço | Variável | Arquivo | Status | Última atualização | Impacto |
|---|---|---|---|---|---|
| Z-API Instance ID | `ZAPI_INSTANCE_ID` | `.credentials/whatsapp/.env` | ⏳ Pendente | — | WhatsApp SDR (não contratado) |
| Z-API Token | `ZAPI_TOKEN` | `.credentials/whatsapp/.env` | ⏳ Pendente | — | WhatsApp SDR |
| Z-API Client Token | `ZAPI_CLIENT_TOKEN` | `.credentials/whatsapp/.env` | ⏳ Pendente | — | WhatsApp SDR |

> Decisão: Evolution API e Baileys descartados. Usar Z-API (~R$79/mês).
> Ver: `.claude/memory/whatsapp-decisao-zapi.md`

---

## Enemeop Flores (Supabase enemeop)

| Serviço | Variável | Arquivo | Status | Última atualização | Impacto |
|---|---|---|---|---|---|
| Supabase enemeop URL | `NEXT_PUBLIC_SUPABASE_URL` | `enemeop-flores/.env.local` | ✅ Presente | 2026-05-01 | Dashboard enemeop |
| Supabase enemeop Anon Key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `enemeop-flores/.env.local` | ✅ Presente | 2026-05-01 | Dashboard enemeop |
| NextAuth Secret | `NEXTAUTH_SECRET` | `enemeop-flores/.env.local` | ✅ Presente | 2026-05-01 | Autenticação do dashboard |
| Admin email | — | `.credentials/infraestrutura/.env` | ✅ Presente | 2026-05-01 | `contato@enemeopflores.com.br` |

---

## IA / GPT Advisor

| Serviço | Variável | Arquivo | Status | Última atualização | Impacto |
|---|---|---|---|---|---|
| OpenAI API Key | `OPENAI_API_KEY` | `.credentials/ia/.env` | ❌ Ausente | — | GPT Advisor (diagnóstico local, nunca produção) |

---

## Render / Orquestrador

| Serviço | Variável | Arquivo | Status | Última atualização | Impacto |
|---|---|---|---|---|---|
| Render API Key | `RENDER_API_KEY` | `.credentials/infraestrutura/.env` | ✅ Presente | 2026-06-10 | Keep-alive via GitHub Actions |
| Orquestrador URL | — | — | Online | 2026-06-17 | enemeop-orchestrator.onrender.com |

---

## Procedimento de validação (sem expor segredos)

```bash
# Verificar se var está definida (sem imprimir valor)
[[ -n "$SUPABASE_URL" ]] && echo "OK" || echo "AUSENTE"

# Testar endpoint que requer credencial
curl -s -o /dev/null -w "%{http_code}" https://ebeapnydeiwuewxatuuw.supabase.co/functions/v1/leads-enemeop

# Verificar secrets no Supabase (lista nomes, não valores)
npx supabase secrets list --project-ref ebeapnydeiwuewxatuuw
```

---

## Alertas

| Credencial | Alerta | Prazo |
|---|---|---|
| `META_IG_ACCESS_TOKEN` | Renovar (60 dias, Instagram Business Login) | **2026-08-30** (renovar preventivamente até 2026-08-23) |
| `META_PAGE_ACCESS_TOKEN` | Ausente — bloqueia publicação Facebook | Sem prazo definido |
| Z-API | Não contratado — bloqueia WhatsApp SDR | Quando iniciar Fase 8 |
