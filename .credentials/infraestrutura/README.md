# Credenciais de Infraestrutura

> **NUNCA commitar valores reais nesta pasta.** Apenas os arquivos README.md são versionados.

## Como usar

Crie um arquivo `.env` local nesta pasta (ignorado pelo git) com as credenciais reais:

```env
# Vercel
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_PASSWORD=

# Render
RENDER_API_KEY=

# Upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
UPSTASH_QSTASH_TOKEN=

# Cloudflare
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_ZONE_ID=

# UptimeRobot
UPTIMEROBOT_API_KEY=
```

## Onde obter cada credencial

| Serviço | Onde encontrar |
|---|---|
| Vercel Token | vercel.com → Settings → Tokens |
| Supabase | supabase.com → projeto → Settings → API |
| Render API Key | render.com → Account Settings → API Keys |
| Upstash | console.upstash.com → Redis → Details |
| Cloudflare | dash.cloudflare.com → My Profile → API Tokens |
| UptimeRobot | uptimerobot.com → My Settings → API Settings |
