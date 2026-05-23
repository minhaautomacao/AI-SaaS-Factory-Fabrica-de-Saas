# Upstash — Configuração Gratuita

## Visão geral

Redis e Kafka serverless com pricing por requisição. Ideal para cache, filas de mensagens, rate limiting e sessões em aplicações SaaS. O plano gratuito é generoso para projetos iniciais.

## Produtos disponíveis

| Produto | Uso |
|---|---|
| **Redis** | Cache, sessões, rate limiting, pub/sub |
| **QStash** | Filas de mensagens, webhooks, agendamento |
| **Kafka** | Streaming de eventos em escala |

## Limites do plano gratuito

### Redis
| Recurso | Limite |
|---|---|
| Databases | 1 |
| Comandos/dia | 10.000 |
| Max data size | 256 MB |
| Bandwidth | Ilimitado |
| Regiões | 1 |

### QStash
| Recurso | Limite |
|---|---|
| Mensagens/dia | 500 |
| Retenção | 3 dias |
| Delay máximo | 7 dias |

## Configuração do Redis

### 1. Criar banco

1. Acesse [console.upstash.com](https://console.upstash.com)
2. Login com GitHub ou Google
3. **Create Database**
4. Configurações:
   - **Name**: nome-do-projeto
   - **Region**: South America (São Paulo)
   - **Type**: Regional (gratuito) ou Global (pago)
5. Copie as credenciais:

```env
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...
```

### 2. Instalar SDK

```bash
npm install @upstash/redis
```

### 3. Usar no código

```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})
```

### 4. Casos de uso comuns

**Cache de dados**:
```typescript
// Buscar com cache
async function getUsuario(id: string) {
  const cacheKey = `usuario:${id}`
  
  // Tentar cache primeiro
  const cached = await redis.get(cacheKey)
  if (cached) return cached
  
  // Buscar no banco
  const usuario = await db.usuarios.findById(id)
  
  // Salvar no cache por 5 minutos
  await redis.setex(cacheKey, 300, JSON.stringify(usuario))
  
  return usuario
}

// Invalidar cache
async function invalidarCache(id: string) {
  await redis.del(`usuario:${id}`)
}
```

**Rate limiting**:
```typescript
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 req/minuto
})

// Em um API handler
export async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.ip
  const { success, limit, reset, remaining } = await ratelimit.limit(ip)
  
  if (!success) {
    return res.status(429).json({
      error: 'Muitas requisições',
      resetEm: new Date(reset).toISOString()
    })
  }
  
  // Continuar com a requisição...
}
```

**Sessões**:
```typescript
// Salvar sessão
await redis.setex(`session:${sessionId}`, 86400, JSON.stringify({
  userId,
  email,
  plano,
  criadoEm: Date.now()
}))

// Buscar sessão
const session = await redis.get<{ userId: string }>(`session:${sessionId}`)

// Destruir sessão
await redis.del(`session:${sessionId}`)
```

**Contadores**:
```typescript
// Incrementar contador de visitas
await redis.incr(`visitas:${slug}`)

// Buscar contagem
const visitas = await redis.get<number>(`visitas:${slug}`)
```

## Configuração do QStash (filas)

### 1. Obter credenciais

No console Upstash → **QStash**:
```env
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=eyJ...
QSTASH_CURRENT_SIGNING_KEY=sig_...
QSTASH_NEXT_SIGNING_KEY=sig_...
```

### 2. Instalar SDK

```bash
npm install @upstash/qstash
```

### 3. Publicar mensagem

```typescript
import { Client } from '@upstash/qstash'

const qstash = new Client({ token: process.env.QSTASH_TOKEN! })

// Enviar para endpoint com delay
await qstash.publishJSON({
  url: 'https://meuapp.com/api/processar-pedido',
  body: { pedidoId: '123', usuarioId: '456' },
  delay: 60, // segundos
})
```

### 4. Verificar assinatura no endpoint

```typescript
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'

async function handler(req: Request) {
  const body = await req.json()
  // Processar mensagem
  console.log('Processando pedido:', body.pedidoId)
  return Response.json({ ok: true })
}

export const POST = verifySignatureAppRouter(handler)
```

## Quando migrar para o pago

- **Pay as you go**: $0.20 por 100k comandos Redis, sem limite diário
- Vale migrar quando os 10.000 comandos/dia não bastarem

Para a maioria dos SaaS iniciais, 10.000 comandos/dia são suficientes.
