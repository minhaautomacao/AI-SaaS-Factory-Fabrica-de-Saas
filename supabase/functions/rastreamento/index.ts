import { callClaude } from '../_shared/anthropic.ts';
import { logEvento } from '../_shared/logger.ts';
import type { OrquestradorPayload } from '../_shared/types.ts';

const SYSTEM_PROMPT = `Você é o agente de Rastreamento de Entregas da Fábrica de SaaS.
Analise atualizações de entrega e decida próximas ações. Retorne JSON:
{
  "status_entrega": "em_transito"|"saiu_entrega"|"entregue"|"tentativa_falha"|"devolvido",
  "mensagem_cliente": "mensagem para enviar ao cliente (máx 200 chars)",
  "acao_logistica": "reagendar"|"contatar_cliente"|"iniciar_devolucao"|"nenhuma",
  "acoes": ["string com ações executadas"]
}`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const inicio = Date.now();
  let body: OrquestradorPayload;
  try { body = await req.json(); } catch { return new Response('JSON inválido', { status: 400 }); }

  const { task_id, escopo, urgencia, payload, workspace_id } = body;

  try {
    const resposta = await callClaude(SYSTEM_PROMPT, `Atualização de rastreamento:\n${JSON.stringify(payload, null, 2)}`);
    const resultado = JSON.parse(resposta);

    await logEvento({ task_id, escopo, agente: 'rastreamento', tipo_evento: 'concluido', urgencia, duracao_ms: Date.now() - inicio, workspace_id });
    return new Response(JSON.stringify({ sucesso: true, acoes_executadas: resultado.acoes ?? [], status: resultado.status_entrega }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEvento({ task_id, escopo, agente: 'rastreamento', tipo_evento: 'erro', urgencia, duracao_ms: Date.now() - inicio, erro: msg, workspace_id });
    return new Response(JSON.stringify({ sucesso: false, erro: msg }), { status: 500 });
  }
});
