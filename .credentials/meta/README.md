# Credenciais Meta — Instagram & Facebook (Enemeop Flores)

> **NUNCA commitar o arquivo `.env` desta pasta.** Apenas este README é versionado.

Crie o arquivo `.env` local aqui com os valores reais.

---

## Credenciais do App Meta

```env
# App ID e Secret — Meta Developer Console
# https://developers.facebook.com/apps/512230540723061
META_APP_ID=512230540723061
META_APP_SECRET=

# Token de verificação do webhook (você define, deve bater com o que está no Meta Developer)
META_VERIFY_TOKEN=

# Page Access Token (long-lived) — para enviar DMs e responder comentários
# Obtido em: Meta Business Suite → Configurações → Contas Conectadas → Token da Página
META_PAGE_ACCESS_TOKEN=

# ID da Página do Facebook (necessário para evitar loop de eco)
META_PAGE_ID=

# ID do Perfil Profissional do Instagram
META_INSTAGRAM_ID=17841402064363907
```

---

## Credenciais do Instagram Graph API

```env
# Instagram Business Account ID
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841402064363907

# Instagram User Access Token — gerado via fluxo Instagram Business Login
# (Meta Dashboard → enemeopflores → API do Instagram → Configuração da API com login do Instagram)
# Conta: @enemeopflores | Escopos: instagram_business_basic, instagram_business_manage_messages, instagram_business_manage_comments
# Gerado em: 2026-07-01 — expira em: 2026-08-30 (60 dias) — renovar preventivamente até 2026-08-23
META_IG_ACCESS_TOKEN=
```

> Decisão anterior (Graph API Explorer / app principal) descartada — token incompatível com o endpoint de mensagens. Ver `docs/DECISIONS.md`.

---

## Onde cada credencial é usada

| Variável | Onde usar | Para que serve |
|---|---|---|
| `META_APP_ID` | Meta Developer Console | Identificação do app |
| `META_APP_SECRET` | Supabase env (webhook-meta) | Valida assinatura HMAC dos webhooks |
| `META_VERIFY_TOKEN` | Supabase env (webhook-meta) | Handshake de verificação do webhook |
| `META_PAGE_ACCESS_TOKEN` | Supabase env (webhook-meta) | Envia DMs e responde comentários automaticamente |
| `META_PAGE_ID` | Supabase env (webhook-meta) | Evita loop: ignora mensagens da própria página |
| `META_INSTAGRAM_ID` | Supabase env (webhook-meta) | Já configurado: `17841402064363907` |
| `INSTAGRAM_USER_ACCESS_TOKEN` | Pipeline captacao-leads | Lê DMs recebidas no Instagram |

---

## Como adicionar no Supabase

Acesse: [supabase.com → projeto ebeapnydeiwuewxatuuw → Settings → Edge Functions → Secrets](https://supabase.com/dashboard/project/ebeapnydeiwuewxatuuw/settings/functions)

Adicione cada variável acima como **secret**.

---

## Como renovar o Page Access Token

O Page Access Token long-lived **não expira** (diferente do User Token de 60 dias).
Para gerar/renovar:

1. Acesse [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Selecione o app `enemeopflores` (ID: 512230540723061)
3. Selecione a Página da Enemeop Flores
4. Permissões necessárias:
   - `pages_messaging` — para enviar DMs no Messenger
   - `instagram_basic` — acesso básico ao Instagram
   - `instagram_manage_messages` — para responder DMs do Instagram
   - `instagram_manage_comments` — para responder comentários
   - `pages_read_engagement` — para ler comentários no Facebook
   - `pages_manage_posts` — para responder comentários no Facebook
5. Clique em **Generate Access Token**
6. Troque pelo long-lived token via:
   ```
   GET https://graph.facebook.com/v21.0/oauth/access_token
     ?grant_type=fb_exchange_token
     &client_id=512230540723061
     &client_secret={META_APP_SECRET}
     &fb_exchange_token={token_gerado}
   ```

---

## Status atual das credenciais no Supabase

| Variável | Status |
|---|---|
| `META_VERIFY_TOKEN` | ✅ Configurada |
| `META_APP_SECRET` | ✅ Configurada |
| `GROQ_API_KEY` | ✅ Configurada |
| `FACTORY_SECRET` | ✅ Configurada |
| `SAAS_WORKSPACE_ID` | ✅ Configurada |
| `META_PAGE_ACCESS_TOKEN` | ❌ **FALTANDO** — respostas automáticas paradas |
| `META_PAGE_ID` | ❌ **FALTANDO** — recomendado para evitar loop |
| `META_INSTAGRAM_ID` | ✅ Hardcoded: `17841402064363907` |
| `WHATSAPP_ACCESS_TOKEN` | ❌ **FALTANDO** — SDR WhatsApp parado |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | ❌ **FALTANDO** — SDR WhatsApp parado |
