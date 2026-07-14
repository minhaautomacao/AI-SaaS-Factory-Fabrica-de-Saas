-- Inbox humano da Flora integrado ao dashboard
-- Campos opcionais e idempotentes para controle Flora x humano em conversas Meta.

alter table if exists public.conversas
  add column if not exists modo_atendimento text not null default 'flora',
  add column if not exists status_atendimento text not null default 'flora_atendendo',
  add column if not exists motivo_handoff text,
  add column if not exists handoff_em timestamptz,
  add column if not exists resumo text,
  add column if not exists proximo_passo text,
  add column if not exists atendente_id text,
  add column if not exists assumido_em timestamptz,
  add column if not exists pedido_id uuid;

create index if not exists idx_conversas_inbox_meta
  on public.conversas (canal, status_atendimento, atualizado_em desc)
  where canal in ('instagram', 'facebook');

create index if not exists idx_conversas_atendente
  on public.conversas (atendente_id)
  where atendente_id is not null;
