-- Tabela de workspaces: cada SaaS criado pela fábrica é um workspace isolado

create table workspaces (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  slug         text not null unique,         -- ex: 'floricultura-primavera'
  descricao    text,
  logo_url     text,
  owner_email  text,
  status       text not null default 'configurando'
                 check (status in ('configurando','ativo','pausado','encerrado')),
  -- Segmento do negócio (usado pelos agentes para contexto)
  segmento     text default 'varejo',        -- ex: 'floricultura','ecommerce','servicos'
  -- Configurações operacionais
  horario_abertura  time default '08:00',
  horario_fechamento time default '18:00',
  timezone     text default 'America/Sao_Paulo',
  criado_em    timestamptz default now(),
  atualizado_em timestamptz default now()
);

create trigger workspaces_atualizado_em
  before update on workspaces
  for each row execute function atualizar_timestamp();

create index on workspaces(status);
create index on workspaces(slug);

alter table workspaces enable row level security;
create policy "service_role_acesso_total" on workspaces
  using (true) with check (true);

-- Rollback:
-- drop table workspaces cascade;
