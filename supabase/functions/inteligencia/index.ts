import { callClaude } from '../_shared/anthropic.ts';
import { getSupabaseAdmin } from '../_shared/supabase.ts';
import { logEvento } from '../_shared/logger.ts';
import type { OrquestradorPayload } from '../_shared/types.ts';

const SYSTEM_PROMPT = `Você é o agente de Inteligência da Fábrica de SaaS.
Analise métricas e gere insights estratégicos. Retorne JSON:
{
  "insights": ["string com insight estratégico"],
  "alertas": ["string com alerta importante"],
  "recomendacoes": ["string com recomendação acionável"],
  "metricas_chave": {"nome": "valor"},
  "acoes": ["string com ações executadas"]
}`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const inicio = Date.now();
  let body: OrquestradorPayload;
  try { body = await req.json(); } catch { return new Response('JSON inválido', { status: 400 }); }

  const { task_id, escopo, urgencia, payload, workspace_id } = body;
  const sb = getSupabaseAdmin();

  try {
    // Coleta métricas dos últimos 7 dias
    const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: leads } = await sb.from('leads').select('status, intencao, canal').gte('criado_em', seteDiasAtras);
    const { data: logs } = await sb.from('orchestrator_logs').select('agente, tipo_evento, erro').gte('criado_em', seteDiasAtras);

    const contexto = JSON.stringify({ payload, metricas: { leads_periodo: leads?.length ?? 0, eventos_periodo: logs?.length ?? 0, erros_periodo: logs?.filter(l => l.erro).length ?? 0 } }, null, 2);
    const resposta = await callClaude(SYSTEM_PROMPT, `Dados para análise:\n${contexto}`, 3000);
    const resultado = JSON.parse(resposta);

    await logEvento({ task_id, escopo, agente: 'inteligencia', tipo_evento: 'concluido', urgencia, duracao_ms: Date.now() - inicio, workspace_id });
    return new Response(JSON.stringify({ sucesso: true, acoes_executadas: resultado.acoes ?? [], insights: resultado.insights }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEvento({ task_id, escopo, agente: 'inteligencia', tipo_evento: 'erro', urgencia, duracao_ms: Date.now() - inicio, erro: msg, workspace_id });
    return new Response(JSON.stringify({ sucesso: false, erro: msg }), { status: 500 });
  }
});
