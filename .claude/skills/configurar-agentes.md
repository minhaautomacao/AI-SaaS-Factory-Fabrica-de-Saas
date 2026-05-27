# Skill: Configurar Agentes

## Descrição
Ativa e configura o sistema de agentes para um novo SaaS — define quais agentes são necessários pelo tipo de negócio, configura as filas BullMQ no Upstash e estabelece a comunicação entre eles.

## Quando usar
- Na Etapa 4 do `pipeline-novo-saas.md`
- Invocado pelo comando `/setup-agentes [tipo-negocio]`
- Ao adicionar novos agentes a um SaaS existente

---

## Etapa 1 — Identificar agentes necessários por tipo de negócio

### Floricultura / E-commerce com entrega
```
Obrigatórios:
  ✅ Orquestrador
  ✅ Captação de Leads
  ✅ WhatsApp SDR
  ✅ Financeiro
  ✅ Logística
  ✅ Conciliação
  ✅ Operacional
  ✅ Rastreamento
  ✅ Pós-Venda

Recomendados:
  ✅ Marketing
  ✅ Inteligência

Opcional:
  ⬜ Estoque
```

### SaaS B2B / Serviços digitais
```
Obrigatórios:
  ✅ Orquestrador
  ✅ Captação de Leads
  ✅ WhatsApp SDR
  ✅ Financeiro
  ✅ Conciliação
  ✅ Pós-Venda

Recomendados:
  ✅ Marketing
  ✅ Inteligência

Não necessários:
  ❌ Logística (sem entrega física)
  ❌ Rastreamento (sem entrega física)
  ❌ Operacional (sem produção física)
```

### Produto centrado em agente / IA
```
Obrigatórios:
  ✅ Orquestrador
  ✅ Agente específico do produto

Recomendados:
  ✅ Financeiro
  ✅ Pós-Venda

Conforme necessidade:
  ⬜ Captação de Leads
  ⬜ Marketing
  ⬜ Inteligência
```

---

## Etapa 2 — Configurar variáveis de ambiente dos agentes

Adicionar ao `.env.local` e ao Vercel:

```env
# Sistema de agentes
ANTHROPIC_API_KEY=               # Claude API — obrigatório para todos os agentes
AGENT_MODEL=claude-sonnet-4-6    # Modelo padrão
AGENT_MAX_TOKENS=8096

# Upstash Redis (filas BullMQ)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Operador (escalonamento)
OPERADOR_NOME=Carlos
OPERADOR_WHATSAPP=5511999999999  # Com código do país, sem +

# Configurações de fila
QUEUE_URGENTE_CONCURRENCY=3
QUEUE_NORMAL_CONCURRENCY=5
QUEUE_RETRY_ATTEMPTS=3
QUEUE_RETRY_DELAY_MS=5000
```

---

## Etapa 3 — Criar estrutura de filas BullMQ

Criar `lib/queues/index.ts`:

```typescript
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'

const connection = new Redis(process.env.UPSTASH_REDIS_REST_URL!, {
  tls: { rejectUnauthorized: false },
  maxRetriesPerRequest: null,
})

// Filas de produção (operação do negócio)
export const queueUrgente = new Queue('producao:urgente', { connection })
export const queueNormal = new Queue('producao:normal', { connection })
export const queueBaixaPrioridade = new Queue('producao:baixa', { connection })

// Fila da fábrica (criação de novos SaaS)
export const queueFabrica = new Queue('fabrica', { connection })

// Fila de alertas (sempre processada primeiro)
export const queueAlertas = new Queue('alertas', { connection })

export { connection }
```

---

## Etapa 4 — Criar orquestrador

Criar `lib/agents/orquestrador.ts`:

```typescript
import { Worker, Job } from 'bullmq'
import { connection } from '@/lib/queues'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface JobAgente {
  agente: string
  acao: string
  payload: Record<string, unknown>
  callback_queue?: string
  lead_id?: string
  pedido_id?: string
}

export const orquestrador = new Worker(
  'producao:urgente',
  async (job: Job<JobAgente>) => {
    const { agente, acao, payload } = job.data

    // Roteamento para o agente correto
    switch (agente) {
      case 'sdr':
        return await processarSDR(acao, payload)
      case 'financeiro':
        return await processarFinanceiro(acao, payload)
      case 'logistica':
        return await processarLogistica(acao, payload)
      case 'conciliacao':
        return await processarConciliacao(acao, payload)
      case 'operacional':
        return await processarOperacional(acao, payload)
      case 'rastreamento':
        return await processarRastreamento(acao, payload)
      case 'pos_venda':
        return await processarPosVenda(acao, payload)
      case 'marketing':
        return await processarMarketing(acao, payload)
      case 'inteligencia':
        return await processarInteligencia(acao, payload)
      default:
        throw new Error(`Agente desconhecido: ${agente}`)
    }
  },
  {
    connection,
    concurrency: Number(process.env.QUEUE_URGENTE_CONCURRENCY) || 3,
  }
)

async function invocarAgente(
  instrucoes: string,
  payload: Record<string, unknown>
): Promise<string> {
  const response = await anthropic.messages.create({
    model: process.env.AGENT_MODEL || 'claude-sonnet-4-6',
    max_tokens: Number(process.env.AGENT_MAX_TOKENS) || 8096,
    system: instrucoes,
    messages: [
      {
        role: 'user',
        content: JSON.stringify(payload),
      },
    ],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}
```

---

## Etapa 5 — Configurar endpoint de webhook dos agentes

Criar `src/app/api/agentes/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { queueUrgente, queueNormal } from '@/lib/queues'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { agente, acao, payload, prioridade = 'normal' } = body

  const queue = prioridade === 'urgente' ? queueUrgente : queueNormal

  const job = await queue.add(
    `${agente}:${acao}`,
    { agente, acao, payload },
    {
      attempts: Number(process.env.QUEUE_RETRY_ATTEMPTS) || 3,
      backoff: {
        type: 'exponential',
        delay: Number(process.env.QUEUE_RETRY_DELAY_MS) || 5000,
      },
    }
  )

  return NextResponse.json({ job_id: job.id, status: 'enfileirado' })
}
```

---

## Etapa 6 — Verificação do sistema de agentes

```bash
# 1. Verificar conexão com Redis
node -e "
const { Redis } = require('ioredis');
const client = new Redis(process.env.UPSTASH_REDIS_REST_URL);
client.ping().then(r => console.log('Redis:', r));
"

# 2. Enfileirar job de teste
curl -X POST http://localhost:3000/api/agentes/webhook \
  -H 'Content-Type: application/json' \
  -d '{"agente":"sdr","acao":"teste","payload":{"mensagem":"ping"},"prioridade":"normal"}'

# 3. Verificar job foi processado no dashboard do Upstash
```

✅ Sistema de agentes configurado e comunicando.

---

## Configuração do identificador de clientes (#XXXXX)

Criar migration para sequência de clientes:

```sql
-- Sequência para geração do número do cliente
CREATE SEQUENCE cliente_numero_seq START 1;

-- Função para gerar número formatado #00001
CREATE OR REPLACE FUNCTION gerar_numero_cliente()
RETURNS TEXT AS $$
BEGIN
  RETURN '#' || LPAD(nextval('cliente_numero_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;
```

O Agente Pós-Venda usa essa função ao criar cada novo cliente.
