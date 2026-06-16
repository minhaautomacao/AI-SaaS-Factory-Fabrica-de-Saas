import { Queue, Worker, type Job, type ConnectionOptions } from 'bullmq'
import { getRedis } from './redis.js'
import type { OrchestratorJob, AgentJob } from '../types.js'
import { QUEUES } from '../types.js'

// bullmq e ioredis têm versões internas diferentes do ioredis — cast necessário
function conexao(): ConnectionOptions {
  return getRedis() as unknown as ConnectionOptions
}

export function criarFila<T = unknown>(nome: string): Queue<T> {
  return new Queue<T>(nome, {
    connection: conexao(),
    defaultJobOptions: {
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    },
  })
}

export const filas = {
  fabricaCritical:  criarFila<OrchestratorJob>(QUEUES.FABRICA_CRITICAL),
  fabricaNormal:    criarFila<OrchestratorJob>(QUEUES.FABRICA_NORMAL),
  fabricaLow:       criarFila<OrchestratorJob>(QUEUES.FABRICA_LOW),
  producaoCritical: criarFila<OrchestratorJob>(QUEUES.PRODUCAO_CRITICAL),
  producaoNormal:   criarFila<OrchestratorJob>(QUEUES.PRODUCAO_NORMAL),
  producaoLow:      criarFila<OrchestratorJob>(QUEUES.PRODUCAO_LOW),
}

export const filasAgentes: Record<string, Queue<AgentJob>> = {
  'captacao-leads': criarFila<AgentJob>(QUEUES.AGENT_CAPTACAO),
  'whatsapp-sdr':   criarFila<AgentJob>(QUEUES.AGENT_SDR),
  'financeiro':     criarFila<AgentJob>(QUEUES.AGENT_FINANCEIRO),
  'logistica':      criarFila<AgentJob>(QUEUES.AGENT_LOGISTICA),
  'conciliacao':    criarFila<AgentJob>(QUEUES.AGENT_CONCILIACAO),
  'operacional':    criarFila<AgentJob>(QUEUES.AGENT_OPERACIONAL),
  'rastreamento':   criarFila<AgentJob>(QUEUES.AGENT_RASTREAMENTO),
  'pos-venda':      criarFila<AgentJob>(QUEUES.AGENT_POS_VENDA),
  'marketing':      criarFila<AgentJob>(QUEUES.AGENT_MARKETING),
  'inteligencia':   criarFila<AgentJob>(QUEUES.AGENT_INTELIGENCIA),
  'agente-dev':     criarFila<AgentJob>(QUEUES.AGENT_DEV),
  'estoque':        criarFila<AgentJob>(QUEUES.AGENT_ESTOQUE),
}

export async function despacharParaAgente(
  agente: string,
  job: AgentJob,
  opcoes?: { priority?: number; delay?: number }
): Promise<void> {
  const fila = filasAgentes[agente]
  if (!fila) throw new Error(`Agente desconhecido: ${agente}`)

  await fila.add(job.task_id, job, {
    priority: opcoes?.priority,
    delay: opcoes?.delay,
  })
}

export function criarWorker<T>(
  nomeFila: string,
  handler: (job: Job<T>) => Promise<void>
): Worker<T> {
  return new Worker<T>(nomeFila, handler, {
    connection: conexao(),
    concurrency: 2,
    // Sem jobs na fila: aguarda 30s antes de re-poll (padrão é 5ms → 200x/seg)
    drainDelay: 30000,
    settings: {
      // Verifica jobs travados a cada 5 minutos (padrão 30s)
      stalledInterval: 300000,
      // Lock dura 60s (padrão 30s), reduz renovações
      lockDuration: 60000,
    },
  })
}
