-- Tabela de leads: captura leads de todos os canais (WhatsApp, Instagram, Facebook, Site)
-- Alimentada pelo agente captacao-leads, consumida pelo agente whatsapp-sdr

create table leads (
  id              uuid primary key default gen_random_uuid(),
  canal           text not null check (canal in ('whatsapp','instagram','facebook','site','indicacao','outro')),
  nome            text,
  telefone        text,
  email           text,
  mensagem_inicial text,
  intencao        text not null default 'desconhecida'
                    check (intencao in ('alta','media','baixa','desconhecida')),
  status          text not null default 'novo'
                    check (status in (
                      'novo',
                      'em_atendimento',
                      'proposta_enviada',
                      'aguardando_pagamento',
                      'convertido',
                      'perdido',
                      'inativo'
                    )),
  -- Identificação externa do canal (ex: número WhatsApp, ID do Instagram)
  canal_id        text,
  -- Contexto do anúncio que originou o lead (quando aplicável)
  utm_source      text,
  utm_campaign    text,
  utm_medium      text,
  -- ID do agente que assumiu o atendimento
  agente_responsavel text,
  -- Dados de conversão
  pedido_id       uuid,
  valor_convertido numeric(10,2),
  convertido_em   timestamptz,
  -- Metadados
  metadata        jsonb default '{}',
  criado_em       timestamptz default now(),
  atualizado_em   timestamptz default now()
);

-- Atualiza atualizado_em automaticamente
create or replace function atualizar_timestamp()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger leads_atualizado_em
  before update on leads
  for each row execute function atualizar_timestamp();

-- Índices para queries frequentes dos agentes
create index on leads(status, criado_em desc);
create index on leads(canal, canal_id);
create index on leads(intencao, status);
create index on leads(telefone) where telefone is not null;
create index on leads(criado_em desc);

-- RLS: por ora desabilitado (leads são acessados pelo service_role dos workers)
-- Habilitar quando houver interface multi-tenant
alter table leads enable row level security;

-- Política temporária: service_role tem acesso total (workers)
-- Trocar por políticas de workspace quando implementar multi-tenant
create policy "service_role_acesso_total" on leads
  using (true)
  with check (true);

-- Rollback:
-- drop trigger leads_atualizado_em on leads;
-- drop function atualizar_timestamp();
-- drop table leads cascade;
