import { callClaude } from '../_shared/anthropic.ts';
import { getSupabaseAdmin } from '../_shared/supabase.ts';
import { logEvento } from '../_shared/logger.ts';
import type { OrquestradorPayload } from '../_shared/types.ts';

const SYSTEM_PROMPT = `Você é o agente de Captação de Leads da Fábrica de SaaS.
Seu papel: classificar leads recém-chegados e decidir a ação imediata.
Analise os dados do lead e retorne JSON com:
{
  "intencao": "alta"|"media"|"baixa",
  "status_sugerido": "novo"|"em_atendimento"|"qualificado",
  "notas": "string com observações relevantes",
  "acoes": ["string com ações a executar"]
}`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const inicio = Date.now();
  let body: OrquestradorPayload;
  try { body = await req.json(); } catch { return new Response('JSON inválido', { status: 400 }); }

  const { task_id, escopo, urgencia, payload, workspace_id } = body;
  const sb = getSupabaseAdmin();

  try {
    const contexto = JSON.stringify(payload, null, 2);
    const resposta = await callClaude(SYSTEM_PROMPT, `Dados do lead:\n${contexto}`);
    const resultado = JSON.parse(resposta);

    if (payload.lead_id) {
      await sb.from('leads').update({
        intencao: resultado.intencao,
        status: resultado.status_sugerido,
        notas: resultado.notas,
      }).eq('id', payload.lead_id);
    }

    await logEvento({ task_id, escopo, agente: 'captacao-leads', tipo_evento: 'concluido', urgencia, duracao_ms: Date.now() - inicio, workspace_id });
    return new Response(JSON.stringify({ sucesso: true, acoes_executadas: resultado.acoes ?? [] }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEvento({ task_id, escopo, agente: 'captacao-leads', tipo_evento: 'erro', urgencia, duracao_ms: Date.now() - inicio, erro: msg, workspace_id });
    return new Response(JSON.stringify({ sucesso: false, erro: msg }), { status: 500 });
  }
});
