# Evolution API no Render — Deploy Gratuito WhatsApp

## O que é

Evolution API é uma API self-hosted gratuita para WhatsApp. Hospedada no Render (free tier), sem custo mensal.

## Deploy em 5 passos

### 1. Criar conta no Render
Acesse **render.com** → **Get Started for Free** → **Sign up with GitHub**

### 2. Novo Web Service com Docker

1. Dashboard → **New → Web Service**
2. Selecione **"Deploy an existing image from a registry"**
3. **Image URL**: `atendai/evolution-api:latest`
4. Clique em **Next**

### 3. Configurar o serviço

| Campo | Valor |
|---|---|
| Name | `enemeop-evolution` |
| Region | Oregon (US West) |
| Instance Type | **Free** |
| Port | `8080` |

### 4. Variáveis de ambiente obrigatórias

Clique em **Advanced** → **Add Environment Variable** e adicione:

```
AUTHENTICATION_API_KEY=enemeop_evo_key_2026
AUTHENTICATION_TYPE=apikey
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=<URL do Supabase Postgres — ver abaixo>
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true
DATABASE_SAVE_DATA_LABELS=true
DATABASE_SAVE_DATA_HISTORIC=true
CACHE_REDIS_ENABLED=false
DEL_INSTANCE=false
LANGUAGE=pt-BR
SERVER_PORT=8080
SERVER_TYPE=http
LOG_LEVEL=ERROR
LOG_COLOR=false
LOG_BAILEYS=false
```

**URL do Supabase Postgres** (connection string):
```
postgresql://postgres.gftnjvdvzgjkhwxnxnwl:[SENHA_DB]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```
> A senha do banco está no Supabase → Settings → Database → Connection string

### 5. Criar e aguardar deploy

Clique em **Create Web Service**. O deploy leva ~3 minutos.

URL gerada: `https://enemeop-evolution.onrender.com`

---

## Após o deploy — Conectar WhatsApp

### Criar instância

```bash
curl -X POST https://enemeop-evolution.onrender.com/instance/create \
  -H "apikey: enemeop_evo_key_2026" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "floricultura", "qrcode": true}'
```

### Obter QR Code para escanear

```bash
curl https://enemeop-evolution.onrender.com/instance/connect/floricultura \
  -H "apikey: enemeop_evo_key_2026"
```

Abra o WhatsApp no celular → **Dispositivos conectados** → **Conectar dispositivo** → escaneie o QR Code.

---

## Credenciais para salvar no orchestrator/.env

Após o deploy, adicione ao `orchestrator/.env`:

```env
EVOLUTION_API_URL=https://enemeop-evolution.onrender.com
EVOLUTION_API_KEY=enemeop_evo_key_2026
EVOLUTION_INSTANCE=floricultura
CARLOS_WHATSAPP=55XXXXXXXXXXX
```

---

## Manter acordado (obrigatório no free tier)

O Render dorme após 15 min de inatividade. Configure o UptimeRobot:

1. Acesse **uptimerobot.com** (gratuito)
2. **Add New Monitor** → HTTP(s)
3. URL: `https://enemeop-evolution.onrender.com/`
4. Intervalo: **5 minutes**

Isso mantém a Evolution API sempre acordada sem custo.
