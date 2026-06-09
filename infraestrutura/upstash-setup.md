# Upstash Redis — Setup Gratuito (2 minutos)

## Por que Upstash

Único Redis gratuito compatível com BullMQ em produção. Plano free: 10.000 req/dia, 256 MB.

## Passo a passo

1. Acesse **console.upstash.com**
2. **Login with Google** (use a conta minhaautomacao10@gmail.com)
3. Clique em **Create Database**
4. Configure:
   - **Name**: `floricultura`
   - **Type**: Regional
   - **Region**: `South America (São Paulo)` — `sa-east-1`
   - **Plan**: Free
5. Clique em **Create**
6. Após criar, clique no banco → aba **Details**
7. Copie:
   - `UPSTASH_REDIS_REST_URL` → cole como `UPSTASH_REDIS_URL` no orchestrator/.env
   - `UPSTASH_REDIS_REST_TOKEN` → cole como `UPSTASH_REDIS_TOKEN` no orchestrator/.env

> **Atenção**: o campo no orchestrator usa `ioredis` com conexão TLS direta, não REST.
> Na aba **Details** do Upstash, use a **Connection String** (formato `rediss://default:TOKEN@host:port`).

## Após preencher o orchestrator/.env

```env
UPSTASH_REDIS_URL=rediss://default:XXXX@global-XXX.upstash.io:6379
UPSTASH_REDIS_TOKEN=XXXX
```

O campo `UPSTASH_REDIS_TOKEN` é a senha (parte após `default:` na connection string).
