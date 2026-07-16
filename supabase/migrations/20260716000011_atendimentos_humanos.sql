-- Registro persistente do handoff humano (Instagram/Facebook/WhatsApp) com código legível de atendimento.
-- Complementa `conversas` (estado ao vivo do inbox) sem duplicar arquitetura: reaproveita workspace_id
-- e conversa_id já usados em conversas/leads.

create sequence if not exists atendimentos_humanos_sequencial_seq;

-- RPC usada pela edge function para obter o próximo sequencial de forma atômica.
create or replace function public.next_atendimento_sequencial()
returns bigint
language sql
as $$ select nextval('public.atendimentos_humanos_sequencial_seq') $$;

create table if not exists atendimentos_humanos (
  id                    uuid primary key default gen_random_uuid(),
  codigo                text not null unique,
  workspace_id          uuid references workspaces(id),
  conversa_id           uuid references conversas(id),
  canal                 text not null check (canal in ('whatsapp','instagram','facebook')),
  canal_cliente_id      text not null,
  telefone              text,
  nome_cliente          text,
  resumo                text,
  historico_referencia  text,
  dados_pedido          jsonb default '{}',
  pendencias            jsonb default '[]',
  motivo_transferencia  text,
  status                text not null default 'aguardando_humano'
                          check (status in ('aguardando_humano','em_atendimento','concluido','cancelado')),
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now()
);

create trigger atendimentos_humanos_atualizado_em
  before update on atendimentos_humanos
  for each row execute function atualizar_timestamp();

create index if not exists idx_atendimentos_humanos_conversa
  on atendimentos_humanos(conversa_id);

create index if not exists idx_atendimentos_humanos_canal_cliente
  on atendimentos_humanos(canal, canal_cliente_id);

create index if not exists idx_atendimentos_humanos_status
  on atendimentos_humanos(status, criado_em desc);

-- Prevenção de duplicidade: no máximo um atendimento aberto por conversa.
create unique index if not exists idx_atendimentos_humanos_aberto_unico
  on atendimentos_humanos(conversa_id)
  where status in ('aguardando_humano','em_atendimento');

alter table atendimentos_humanos enable row level security;
create policy "service_role_acesso_total" on atendimentos_humanos
  using (true) with check (true);

-- Rollback:
-- drop table atendimentos_humanos cascade;
-- drop function public.next_atendimento_sequencial();
-- drop sequence atendimentos_humanos_sequencial_seq;
