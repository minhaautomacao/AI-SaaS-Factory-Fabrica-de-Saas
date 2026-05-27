import type { Job } from 'bullmq'
import { criarWorker, despacharParaAgente, filas } from '../lib/queue.js'
import { log } from '../lib/supabase.js'
import type { OrchestratorJob, AgentJob, Urgencia } from '../types.js'
import { TIMEOUTS, QUEUES } from '../types.js'

// Mapa de roteamento: tipo de evento → agente responsável
// Segue a lógica do .claude/agents/orquestrador.md
const ROTEAMENTO: Record<string, string[]> = {
  // Escopo Produção
  'novo-lead':               ['captacao-leads'],
  'lead-qualificado':        ['whatsapp-sdr'],
  'pagamento-gerado':        ['conciliacao'],
  'pagamento-confirmado':    ['operacional', 'financeiro'],
  'pedido-liberado':         ['logistica'],
  'pedido-despachado':       ['rastreamento'],
  'entrega-concluida':       ['pos-venda'],
  'reclamacao-recebida':     ['pos-venda'],
  'analise-periodica':       ['inteligencia'],

  // Escopo Fábrica
  'criar-saas':              ['inteligencia', 'agente-dev'],
  'nova-feature':            ['agente-dev'],
  'bug-producao':            ['agente-dev'],
  'nova-migration':          ['agente-dev'],
  'campanha-lancamento':     ['marketing'],
  'setup-cobranca':          ['financeiro'],
}

// Situações de escalada para humano (Carlos)
const REQUER_ESCALADA = [
  'divergencia-financeira-alta',
  'acao-irreversivel',
  'reclamacao-grave',
]

async function processarJob(job: Job<OrchestratorJob>): Promise<void> {
  const evento = job.data
  const inicio = Date.now()

  await log({
    task_id: evento.task_id,
    escopo: evento.escopo,
    agente: 'orquestrador',
    tipo_evento: 'recebido',
    urgencia: evento.urgencia,
    fila: job.queueName,
    payload: evento.payload,
    lead_id: evento.lead_id,
    pedido_id: evento.pedido_id,
  })

  // Verificar se precisa de escalada humana
  if (REQUER_ESCALADA.includes(evento.tipo)) {
    await escalar(evento)
    return
  }

  // Resolver agentes responsáveis pelo tipo do evento
  const agentes = ROTEAMENTO[evento.tipo]
  if (!agentes || agentes.length === 0) {
    await log({
      task_id: evento.task_id,
      escopo: evento.escopo,
      agente: 'orquestrador',
      tipo_evento: 'falhou',
      urgencia: evento.urgencia,
      erro: `Tipo de evento sem roteamento configurado: ${evento.tipo}`,
      duracao_ms: Date.now() - inicio,
    })
    return
  }

  await log({
    task_id: evento.task_id,
    escopo: evento.escopo,
    agente: 'orquestrador',
    tipo_evento: 'classificado',
    urgencia: evento.urgencia,
    payload: { agentes_destino: agentes, tipo: evento.tipo },
    lead_id: evento.lead_id,
  })

  // Despachar para cada agente (em paralelo se múltiplos)
  const agentJob: AgentJob = {
    task_id: evento.task_id,
    urgencia: evento.urgencia,
    payload: evento.payload,
    lead_id: evento.lead_id,
    pedido_id: evento.pedido_id,
    timeout_ms: TIMEOUTS[evento.urgencia],
    criado_em: new Date().toISOString(),
  }

  await Promise.all(
    agentes.map(async (agente) => {
      await despacharParaAgente(agente, agentJob, {
        priority: evento.urgencia === 'critical' ? 1
                : evento.urgencia === 'normal'   ? 5
                : 10,
      })

      await log({
        task_id: evento.task_id,
        escopo: evento.escopo,
        agente,
        tipo_evento: 'despachado',
        urgencia: evento.urgencia,
        fila: `queue:agent:${agente}`,
        lead_id: evento.lead_id,
        pedido_id: evento.pedido_id,
        duracao_ms: Date.now() - inicio,
      })
    })
  )
}

async function escalar(evento: OrchestratorJob): Promise<void> {
  await log({
    task_id: evento.task_id,
    escopo: evento.escopo,
    agente: 'orquestrador',
    tipo_evento: 'escalado',
    urgencia: evento.urgencia,
    payload: {
      motivo: evento.tipo,
      mensagem: 'Requer aprovação humana — notificando Carlos via WhatsApp',
    },
    lead_id: evento.lead_id,
    pedido_id: evento.pedido_id,
  })

  // TODO: integrar com agente WhatsApp SDR para notificar Carlos
  console.warn(`[Orquestrador] ESCALADO para humano — task_id: ${evento.task_id} tipo: ${evento.tipo}`)
}

// Workers — um por fila de entrada
export function iniciarWorkers(): void {
  const handlers: Array<[string, Urgencia]> = [
    [QUEUES.FABRICA_CRITICAL,  'critical'],
    [QUEUES.FABRICA_NORMAL,    'normal'],
    [QUEUES.FABRICA_LOW,       'low'],
    [QUEUES.PRODUCAO_CRITICAL, 'critical'],
    [QUEUES.PRODUCAO_NORMAL,   'normal'],
    [QUEUES.PRODUCAO_LOW,      'low'],
  ]

  for (const [nomeFila] of handlers) {
    const worker = criarWorker<OrchestratorJob>(nomeFila, processarJob)

    worker.on('completed', (job) => {
      console.log(`[Orquestrador] ✓ ${job.data.task_id} — ${job.data.tipo}`)
    })

    worker.on('failed', (job, err) => {
      console.error(`[Orquestrador] ✗ ${job?.data.task_id} — ${err.message}`)
    })

    console.log(`[Orquestrador] Worker iniciado: ${nomeFila}`)
  }
}
