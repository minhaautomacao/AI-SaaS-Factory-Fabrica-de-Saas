export type Escopo = 'fabrica' | 'producao'
export type Urgencia = 'critical' | 'normal' | 'low'
export type TipoEvento =
  | 'recebido'
  | 'classificado'
  | 'despachado'
  | 'concluido'
  | 'falhou'
  | 'timeout'
  | 'reacaoado'
  | 'escalado'

export type NomeAgente =
  | 'orquestrador'
  | 'captacao-leads'
  | 'whatsapp-sdr'
  | 'financeiro'
  | 'logistica'
  | 'conciliacao'
  | 'operacional'
  | 'rastreamento'
  | 'pos-venda'
  | 'marketing'
  | 'inteligencia'
  | 'agente-dev'

// Evento que chega na fila do orquestrador
export interface OrchestratorJob {
  task_id: string
  escopo: Escopo
  urgencia: Urgencia
  tipo: string                  // ex: 'novo-lead', 'bug-producao', 'criar-saas'
  payload: Record<string, unknown>
  lead_id?: string
  pedido_id?: string
  origem?: string               // qual sistema gerou o evento
  timestamp: string
}

// Evento que o orquestrador envia para filas de agentes
export interface AgentJob {
  task_id: string
  urgencia: Urgencia
  payload: Record<string, unknown>
  lead_id?: string
  pedido_id?: string
  timeout_ms: number
  criado_em: string
}

// Resposta que os agentes retornam para o orquestrador
export interface AgentResult {
  task_id: string
  agente: NomeAgente
  status: 'concluido' | 'bloqueado' | 'parcial'
  resultado?: Record<string, unknown>
  erro?: string
  duracao_ms: number
  proximo_passo?: string
}

// Mapa de timeouts por urgência (em ms)
export const TIMEOUTS: Record<Urgencia, number> = {
  critical: 30_000,    // 30s
  normal: 300_000,     // 5min
  low: 1_800_000,      // 30min
}

// Nomes das filas BullMQ
export const QUEUES = {
  // Filas de entrada do orquestrador (por escopo e urgência)
  FABRICA_CRITICAL: 'queue:fabrica:critical',
  FABRICA_NORMAL:   'queue:fabrica:normal',
  FABRICA_LOW:      'queue:fabrica:low',
  PRODUCAO_CRITICAL: 'queue:producao:critical',
  PRODUCAO_NORMAL:   'queue:producao:normal',
  PRODUCAO_LOW:      'queue:producao:low',

  // Filas de saída (por agente)
  AGENT_CAPTACAO:    'queue:agent:captacao-leads',
  AGENT_SDR:         'queue:agent:whatsapp-sdr',
  AGENT_FINANCEIRO:  'queue:agent:financeiro',
  AGENT_LOGISTICA:   'queue:agent:logistica',
  AGENT_CONCILIACAO: 'queue:agent:conciliacao',
  AGENT_OPERACIONAL: 'queue:agent:operacional',
  AGENT_RASTREAMENTO:'queue:agent:rastreamento',
  AGENT_POS_VENDA:   'queue:agent:pos-venda',
  AGENT_MARKETING:   'queue:agent:marketing',
  AGENT_INTELIGENCIA:'queue:agent:inteligencia',
  AGENT_DEV:         'queue:agent:agente-dev',

  // Fila de resultados (agentes respondem aqui)
  RESULTS: 'queue:results',
} as const
