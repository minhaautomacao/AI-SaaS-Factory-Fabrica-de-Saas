-- Migration: corrige tabela leads para produção
-- 1. Adiciona valor 'urgente' ao check de intencao
-- 2. Adiciona coluna notas (usada pelo agente captacao-leads)
-- 3. Adiciona coluna historico_canal (contexto de migração de rede social)

-- Recria o check de intencao aceitando 'urgente'
alter table leads
  drop constraint if exists leads_intencao_check;

alter table leads
  add constraint leads_intencao_check
  check (intencao in ('urgente','alta','media','baixa','desconhecida'));

-- Adiciona coluna notas (observações do agente)
alter table leads
  add column if not exists notas text;

-- Adiciona coluna historico_canal (conversa anterior em rede social antes de migrar para WhatsApp)
alter table leads
  add column if not exists historico_canal text;

-- Rollback:
-- alter table leads drop constraint leads_intencao_check;
-- alter table leads add constraint leads_intencao_check check (intencao in ('alta','media','baixa','desconhecida'));
-- alter table leads drop column notas;
-- alter table leads drop column historico_canal;
