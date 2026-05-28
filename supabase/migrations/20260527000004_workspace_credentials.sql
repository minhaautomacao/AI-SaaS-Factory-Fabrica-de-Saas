-- Tabela de credenciais por workspace: valores encriptados com AES-256-GCM
-- O campo 'valor' nunca é retornado ao frontend — apenas status e metadata

create table workspace_credentials (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  tipo         text not null
                 check (tipo in (
                   'whatsapp',     -- Evolution API ou Z-API
                   'meta',         -- Instagram/Facebook Business
                   'mercadopago',  -- Mercado Pago PIX/checkout
                   'stripe',       -- Stripe subscriptions
                   'openbanking',  -- Open Banking extrato
                   'email',        -- Resend ou SMTP
                   'evolution'     -- Evolution API self-hosted
                 )),
  chave        text not null,      -- nome da variável: 'access_token', 'phone_number_id', etc.
  valor        text not null,      -- ENCRIPTADO AES-256-GCM (nunca expor no frontend)
  iv           text not null,      -- initialization vector hex para descriptografia
  ativo        boolean default true,
  testado_em   timestamptz,
  teste_status text check (teste_status in ('ok','erro','pendente')) default 'pendente',
  teste_detalhe text,              -- mensagem do último teste (ex: "Conexão recusada")
  criado_em    timestamptz default now(),
  unique(workspace_id, tipo, chave)
);

create index on workspace_credentials(workspace_id, tipo);
create index on workspace_credentials(workspace_id, ativo);

alter table workspace_credentials enable row level security;
create policy "service_role_acesso_total" on workspace_credentials
  using (true) with check (true);

-- Rollback:
-- drop table workspace_credentials cascade;
