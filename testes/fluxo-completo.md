# Teste do Fluxo Completo: Lead → SDR → Financeiro → Conciliação → Operacional

## Objetivo

Validar que o pipeline de ponta a ponta funciona sem intervenção humana para o cenário mais comum: cliente novo chegando pelo WhatsApp, sendo atendido pelo SDR, fechando pedido via PIX, tendo o pagamento confirmado e o pedido liberado para produção.

## Pré-requisitos

- [ ] `supabase start` rodando localmente (ou projeto Supabase de dev ativo)
- [ ] `orchestrator/.env` preenchido com credenciais reais ou de sandbox
- [ ] Upstash Redis configurado e acessível
- [ ] Migrations aplicadas: `supabase db push`
- [ ] `npm install` dentro de `orchestrator/`
- [ ] `npm run dev` dentro de `orchestrator/` (orquestrador rodando)

---

## Cenário de teste

**Persona**: Maria, 38 anos, cliente nova. Viu post no Instagram da Floricultura Primavera e quer encomendar buquê de rosas para aniversário da mãe, entrega em casa no dia seguinte.

**Canal de entrada**: WhatsApp  
**Urgência**: normal  
**Valor esperado**: R$ 120,00 (buquê) + R$ 15,00 (entrega) = R$ 135,00

---

## Passo 1 — Injetar evento de novo lead

Simula mensagem chegando do webhook do WhatsApp.

```typescript
// scripts/injetar-lead.ts
import 'dotenv/config'
import { filas } from '../src/lib/queue.js'
import type { OrchestratorJob } from '../src/types.js'
import { randomUUID } from 'crypto'

const evento: OrchestratorJob = {
  task_id: randomUUID(),
  escopo: 'producao',
  urgencia: 'normal',
  tipo: 'novo-lead',
  payload: {
    canal: 'whatsapp',
    canal_id: '5511987654321@s.whatsapp.net',
    nome: 'Maria',
    telefone: '+55 11 98765-4321',
    mensagem_inicial: 'Oi, vi o post de vocês no Instagram! Vocês fazem buquê de rosas? Quero para o aniversário da minha mãe amanhã',
    intencao_estimada: 'alta',
  },
  origem: 'webhook-whatsapp',
  timestamp: new Date().toISOString(),
}

await filas.producaoNormal.add(evento.task_id, evento)
console.log('Lead injetado:', evento.task_id)
```

**Executar:**
```bash
cd orchestrator
npx tsx scripts/injetar-lead.ts
```

**Verificar no Supabase:**
```sql
select * from orchestrator_logs where task_id = '[task_id_gerado]' order by criado_em;
```

**Resultado esperado:**
- 1 log `recebido` (orquestrador)
- 1 log `classificado` com `agentes_destino: ["captacao-leads"]`
- 1 log `despachado` para `queue:agent:captacao-leads`

---

## Passo 2 — Simular resposta do agente captacao-leads

O agente captacao-leads processaria o lead e criaria o registro. Simular o resultado:

```typescript
// scripts/simular-captacao.ts
import 'dotenv/config'
import { getSupabase, log } from '../src/lib/supabase.js'
import { filas } from '../src/lib/queue.js'
import type { OrchestratorJob } from '../src/types.js'
import { randomUUID } from 'crypto'

const TASK_ID = process.argv[2] // passar o task_id do passo anterior

// 1. Criar lead no banco
const supabase = getSupabase()
const { data: lead } = await supabase
  .from('leads')
  .insert({
    canal: 'whatsapp',
    canal_id: '5511987654321@s.whatsapp.net',
    nome: 'Maria',
    telefone: '+55 11 98765-4321',
    mensagem_inicial: 'Oi, vi o post de vocês no Instagram! Vocês fazem buquê de rosas?',
    intencao: 'alta',
    status: 'novo',
    metadata: { post_origem: 'instagram_floricultura' },
  })
  .select()
  .single()

console.log('Lead criado:', lead!.id)

// 2. Registrar conclusão no log
await log({
  task_id: TASK_ID,
  escopo: 'producao',
  agente: 'captacao-leads',
  tipo_evento: 'concluido',
  urgencia: 'normal',
  resultado: { lead_id: lead!.id, intencao: 'alta' },
  lead_id: lead!.id,
  duracao_ms: 1200,
})

// 3. Injetar próximo evento: lead qualificado → acionar SDR
const proximoEvento: OrchestratorJob = {
  task_id: randomUUID(),
  escopo: 'producao',
  urgencia: 'normal',
  tipo: 'lead-qualificado',
  payload: {
    lead_id: lead!.id,
    telefone: '+55 11 98765-4321',
    nome: 'Maria',
    canal: 'whatsapp',
    canal_id: '5511987654321@s.whatsapp.net',
    mensagem_inicial: 'Oi, vi o post de vocês no Instagram! Vocês fazem buquê de rosas?',
    intencao: 'alta',
  },
  lead_id: lead!.id,
  origem: 'captacao-leads',
  timestamp: new Date().toISOString(),
}

await filas.producaoNormal.add(proximoEvento.task_id, proximoEvento)
console.log('Lead qualificado injetado:', proximoEvento.task_id)
```

**Resultado esperado no banco:**
```sql
select id, canal, nome, telefone, intencao, status from leads order by criado_em desc limit 1;
-- deve retornar Maria com intencao='alta' e status='novo'

select agente, tipo_evento, resultado from orchestrator_logs order by criado_em desc limit 5;
-- deve mostrar a sequência: recebido → classificado → despachado → (captacao concluido) → despachado para SDR
```

---

## Passo 3 — Verificar despacho para o SDR

Após o evento `lead-qualificado`, o orquestrador deve despachar para `queue:agent:whatsapp-sdr`.

**Verificar fila:**
```typescript
// scripts/inspecionar-fila.ts
import 'dotenv/config'
import { filasAgentes } from '../src/lib/queue.js'

const jobs = await filasAgentes['whatsapp-sdr'].getWaiting()
console.log('Jobs aguardando no SDR:', jobs.length)
jobs.forEach(j => console.log(' -', j.name, JSON.stringify(j.data.payload).slice(0, 100)))
```

---

## Passo 4 — Simular fechamento de venda pelo SDR

```typescript
// scripts/simular-sdr.ts — SDR fechou venda, gera evento de pagamento
import 'dotenv/config'
import { filas, getSupabase, log } from '../src/lib/queue.js'
import type { OrchestratorJob } from '../src/types.js'

// Atualizar status do lead para aguardando_pagamento
await getSupabase()
  .from('leads')
  .update({ status: 'aguardando_pagamento' })
  .eq('id', LEAD_ID)

// Disparar evento de pagamento gerado → aciona conciliação
const evento: OrchestratorJob = {
  task_id: randomUUID(),
  escopo: 'producao',
  urgencia: 'critical',   // pagamento é crítico
  tipo: 'pagamento-gerado',
  payload: {
    lead_id: LEAD_ID,
    valor: 135.00,
    metodo: 'pix',
    pix_copia_cola: '00020126580014br.gov.bcb.pix...',
    expira_em: new Date(Date.now() + 30 * 60_000).toISOString(), // 30min
  },
  lead_id: LEAD_ID,
  origem: 'whatsapp-sdr',
  timestamp: new Date().toISOString(),
}

await filas.producaoCritical.add(evento.task_id, evento)
```

---

## Passo 5 — Simular confirmação de pagamento PIX

```typescript
// evento confirmando pagamento → aciona operacional + financeiro em paralelo
const evento: OrchestratorJob = {
  task_id: randomUUID(),
  escopo: 'producao',
  urgencia: 'critical',
  tipo: 'pagamento-confirmado',
  payload: {
    lead_id: LEAD_ID,
    valor_pago: 135.00,
    e2e_id: 'E12345678202605270001111111111',
    pago_em: new Date().toISOString(),
  },
  lead_id: LEAD_ID,
  origem: 'conciliacao',
  timestamp: new Date().toISOString(),
}

await filas.producaoCritical.add(evento.task_id, evento)
```

**Resultado esperado:** orquestrador despacha simultaneamente para `operacional` e `financeiro`.

---

## Checklist de validação final

Após todos os passos, verificar no Supabase:

```sql
-- Lead deve estar com status 'aguardando_pagamento' ou 'convertido'
select id, nome, status, valor_convertido from leads where nome = 'Maria';

-- Log deve mostrar o fluxo completo
select agente, tipo_evento, urgencia, criado_em
from orchestrator_logs
where lead_id = '[LEAD_ID]'
order by criado_em;
```

**Sequência esperada no log:**
```
orquestrador    | recebido      | normal
orquestrador    | classificado  | normal   → ["captacao-leads"]
captacao-leads  | despachado    | normal
captacao-leads  | concluido     | normal
orquestrador    | recebido      | normal   (lead-qualificado)
orquestrador    | classificado  | normal   → ["whatsapp-sdr"]
whatsapp-sdr    | despachado    | normal
whatsapp-sdr    | concluido     | normal
orquestrador    | recebido      | critical (pagamento-gerado)
orquestrador    | classificado  | critical → ["conciliacao"]
conciliacao     | despachado    | critical
conciliacao     | concluido     | critical
orquestrador    | recebido      | critical (pagamento-confirmado)
orquestrador    | classificado  | critical → ["operacional", "financeiro"]
operacional     | despachado    | critical
financeiro      | despachado    | critical
```

---

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Worker não processa | Redis inacessível | Verificar `UPSTASH_REDIS_URL` e `UPSTASH_REDIS_TOKEN` |
| Log não grava | Supabase inacessível ou permissão negada | Verificar `SUPABASE_SERVICE_ROLE_KEY` e RLS |
| Job fica em `waiting` para sempre | Worker da fila não iniciado | Verificar se `iniciarWorkers()` cobriu a fila correta |
| `tipo` sem roteamento | Tipo de evento não mapeado em `ROTEAMENTO` | Adicionar entrada no mapa `src/workers/orquestrador.ts` |
| Erro de conexão TLS | Formato errado da URL Upstash | URL deve começar com `rediss://` (com dois `s`) |
