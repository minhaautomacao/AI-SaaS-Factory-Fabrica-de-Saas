-- Tabela de auditoria do orquestrador: registra cada decisão e despacho de agente
-- Permite rastrear o fluxo completo de qualquer tarefa pelo task_id

create table orchestrator_logs (
  id              uuid primary key default gen_random_uuid(),
  -- Identificador único da tarefa (agrupa todas as entradas de uma mesma tarefa)
  task_id         text not null,
  -- Escopo: fábrica (criar SaaS) ou producao (operar SaaS existente)
  escopo          text not null check (escopo in ('fabrica','producao')),
  -- Agente que recebeu o despacho (ou 'orquestrador' para ações próprias)
  agente          text not null,
  -- Tipo do evento registrado
  tipo_evento     text not null check (tipo_evento in (
    'recebido',       -- tarefa chegou na fila
    'classificado',   -- orquestrador classificou escopo e urgência
    'despachado',     -- tarefa enviada para agente
    'concluido',      -- agente retornou sucesso
    'falhou',         -- agente retornou erro
    'timeout',        -- agente não respondeu dentro do prazo
    'acionado',       -- orquestrador acionou agente alternativo (fallback)
    'escalado'        -- encaminhado para humano (Carlos)
  )),
  -- Urgência da tarefa no momento do evento
  urgencia        text check (urgencia in ('critical','normal','low')),
  -- Fila de origem ou destino
  fila            text,
  -- Payload completo (entrada ou saída do agente)
  payload         jsonb default '{}',
  -- Resultado quando tipo_evento = 'concluido' ou 'falhou'
  resultado       jsonb,
  -- Mensagem de erro quando tipo_evento = 'falhou' ou 'timeout'
  erro            text,
  -- Tempo de execução em milissegundos (preenchido em 'concluido' e 'falhou')
  duracao_ms      integer,
  -- ID do lead ou pedido relacionado (para rastreabilidade de negócio)
  lead_id         uuid references leads(id),
  pedido_id       uuid,
  criado_em       timestamptz default now()
);

-- Índices para queries de monitoramento e debugging
create index on orchestrator_logs(task_id, criado_em);
create index on orchestrator_logs(agente, tipo_evento, criado_em desc);
create index on orchestrator_logs(escopo, urgencia, criado_em desc);
create index on orchestrator_logs(lead_id) where lead_id is not null;
create index on orchestrator_logs(criado_em desc);

-- RLS: acesso via service_role apenas (workers e dashboard interno)
alter table orchestrator_logs enable row level security;

create policy "service_role_acesso_total" on orchestrator_logs
  using (true)
  with check (true);

-- View para monitoramento em tempo real (últimas 200 entradas)
create view v_orchestrator_monitor as
  select
    ol.task_id,
    ol.escopo,
    ol.agente,
    ol.tipo_evento,
    ol.urgencia,
    ol.fila,
    ol.duracao_ms,
    ol.erro,
    ol.criado_em,
    l.nome     as lead_nome,
    l.canal    as lead_canal,
    l.status   as lead_status
  from orchestrator_logs ol
  left join leads l on l.id = ol.lead_id
  order by ol.criado_em desc
  limit 200;

-- Rollback:
-- drop view v_orchestrator_monitor;
-- drop table orchestrator_logs cascade;
