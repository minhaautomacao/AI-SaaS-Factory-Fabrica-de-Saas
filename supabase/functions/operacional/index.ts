import { callClaude } from '../_shared/anthropic.ts';
import { getSupabaseAdmin } from '../_shared/supabase.ts';
import { logEvento } from '../_shared/logger.ts';
import type { OrquestradorPayload } from '../_shared/types.ts';

const SYSTEM_PROMPT = `Você é o agente Operacional da Fábrica de SaaS.
Gerencie pedidos e operações diárias. Retorne JSON:
{
  "acao": "confirmar_pedido"|"cancelar_pedido"|"atualizar_status"|"escalar_para_humano"|"nenhuma",
  "novo_status": string|null,
  "motivo": "string",
  "acoes": ["string com ações executadas"],
  "requer_aprovacao_humana": boolean
}`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const inicio = Date.now();
  let body: OrquestradorPayload;
  try { body = await req.json(); } catch { return new Response('JSON inválido', { status: 400 }); }

  const { task_id, escopo, urgencia, payload, workspace_id } = body;
  const sb = getSupabaseAdmin();

  try {
    const resposta = await callClaude(SYSTEM_PROMPT, `Operação:\n${JSON.stringify(payload, null, 2)}`);
    const resultado = JSON.parse(resposta);

    if (payload.pedido_id && resultado.novo_status && !resultado.requer_aprovacao_humana) {
      await sb.from('leads').update({ status: resultado.novo_status }).eq('id', payload.pedido_id);
    }

    await logEvento({ task_id, escopo, agente: 'operacional', tipo_evento: 'concluido', urgencia, duracao_ms: Date.now() - inicio, workspace_id });
    return new Response(JSON.stringify({ sucesso: true, acoes_executadas: resultado.acoes ?? [], requer_aprovacao: resultado.requer_aprovacao_humana }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEvento({ task_id, escopo, agente: 'operacional', tipo_evento: 'erro', urgencia, duracao_ms: Date.now() - inicio, erro: msg, workspace_id });
    return new Response(JSON.stringify({ sucesso: false, erro: msg }), { status: 500 });
  }
});
