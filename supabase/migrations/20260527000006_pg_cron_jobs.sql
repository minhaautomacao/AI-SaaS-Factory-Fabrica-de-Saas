-- Jobs agendados com pg_cron (substitui os workers periódicos do BullMQ)
-- Requer extensão pg_cron habilitada no Supabase (Project Settings → Extensions)

-- Habilitar extensão (executar uma vez no SQL Editor do Supabase)
-- create extension if not exists pg_cron;

-- Análise de inteligência a cada 2 horas durante horário comercial
select cron.schedule(
  'inteligencia-periodica',
  '0 8-20/2 * * *',   -- das 8h às 20h, a cada 2 horas
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/orquestrador',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'tipo', 'analise-periodica',
      'escopo', 'producao',
      'urgencia', 'low',
      'task_id', gen_random_uuid()::text,
      'payload', jsonb_build_object('origem', 'pg_cron'),
      'timestamp', now()::text
    )
  );
  $$
);

-- Varredura de estoque a cada 6 horas
select cron.schedule(
  'estoque-varredura',
  '0 */6 * * *',
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/orquestrador',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'tipo', 'ruptura-estoque',
      'escopo', 'producao',
      'urgencia', 'normal',
      'task_id', gen_random_uuid()::text,
      'payload', jsonb_build_object('origem', 'pg_cron', 'tipo_varredura', 'periodica'),
      'timestamp', now()::text
    )
  );
  $$
);

-- Relatório diário de inteligência às 23h
select cron.schedule(
  'relatorio-diario',
  '0 23 * * *',
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/orquestrador',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'tipo', 'analise-periodica',
      'escopo', 'producao',
      'urgencia', 'low',
      'task_id', gen_random_uuid()::text,
      'payload', jsonb_build_object('origem', 'pg_cron', 'tipo', 'relatorio_diario'),
      'timestamp', now()::text
    )
  );
  $$
);

-- Rollback:
-- select cron.unschedule('inteligencia-periodica');
-- select cron.unschedule('estoque-varredura');
-- select cron.unschedule('relatorio-diario');
