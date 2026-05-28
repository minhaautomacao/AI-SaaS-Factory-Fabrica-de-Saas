-- Adiciona workspace_id às tabelas existentes para isolamento multi-tenant

alter table leads
  add column workspace_id uuid references workspaces(id);

create index on leads(workspace_id, status);
create index on leads(workspace_id, criado_em desc);

alter table orchestrator_logs
  add column workspace_id uuid references workspaces(id);

create index on orchestrator_logs(workspace_id, criado_em desc);

-- Rollback:
-- alter table leads drop column workspace_id;
-- alter table orchestrator_logs drop column workspace_id;
