# Evolution API no Render — Deploy Gratuito WhatsApp

## O que é

Evolution API é uma API self-hosted gratuita para WhatsApp. Hospedada no Render (free tier), sem custo mensal.

## Deploy

### 1. Banco de dados (Render PostgreSQL)

No Render → **New → PostgreSQL**
- Name: `evolution-db`
- Region: Oregon (mesmo da API)
- Plan: Free

Copie a **Internal Database URL** gerada.

### 2. Web Service com Docker

1. Dashboard → **New → Web Service**
2. **"Deploy an existing image from a registry"**
3. Image URL: `atendai/evolution-api:latest`
4. Name: `enemeop-evolution`
5. Region: Oregon (US West)
6. Instance Type: **Free**

### 3. Variáveis de ambiente

| Key | Value |
|-----|-------|
| `AUTHENTICATION_API_KEY` | `enemeop_evo_key_2026` |
| `AUTHENTICATION_TYPE` | `apikey` |
| `SERVER_PORT` | `8080` |
| `DATABASE_ENABLED` | `true` |
| `DATABASE_PROVIDER` | `postgresql` |
| `DATABASE_CONNECTION_URI` | *(Internal Database URL do Render PostgreSQL)* |
| `DATABASE_URL` | *(mesma Internal Database URL)* |
| `DATABASE_SAVE_DATA_INSTANCE` | `true` |
| `DATABASE_SAVE_DATA_NEW_MESSAGE` | `true` |
| `CACHE_REDIS_ENABLED` | `false` |
| `DEL_INSTANCE` | `false` |
| `LANGUAGE` | `pt-BR` |
| `LOG_LEVEL` | `ERROR` |

> **Importante**: usar a Internal Database URL do Render (não Supabase).
> O Supabase bloqueia conexões diretas do Render Oregon no free tier.

### 4. Após o deploy — Conectar WhatsApp

**Criar instância:**
```bash
curl -X POST https://enemeop-evolution.onrender.com/instance/create \
  -H "apikey: enemeop_evo_key_2026" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "floricultura", "qrcode": true}'
```

**Obter QR Code:**
```bash
curl https://enemeop-evolution.onrender.com/instance/connect/floricultura \
  -H "apikey: enemeop_evo_key_2026"
```

Abra o WhatsApp → **Dispositivos conectados** → **Conectar dispositivo** → escaneie o QR Code.

---

## Credenciais no orchestrator/.env

```env
EVOLUTION_API_URL=https://enemeop-evolution.onrender.com
EVOLUTION_API_KEY=enemeop_evo_key_2026
EVOLUTION_INSTANCE=floricultura
```

---

## Manter acordado (obrigatório no free tier)

Configure o UptimeRobot (uptimerobot.com — gratuito):
- Monitor HTTP(s): `https://enemeop-evolution.onrender.com/`
- Intervalo: 5 minutos
