import { callClaude } from '../_shared/anthropic.ts';
import { logEvento } from '../_shared/logger.ts';
import type { OrquestradorPayload } from '../_shared/types.ts';

const SYSTEM_PROMPT = `Você é o agente de Pós-Venda da Fábrica de SaaS.
Cuide da experiência do cliente após a compra. Retorne JSON:
{
  "acao": "enviar_pesquisa_satisfacao"|"oferecer_recompra"|"registrar_reclamacao"|"iniciar_troca"|"nenhuma",
  "mensagem_cliente": "mensagem de follow-up (máx 250 chars, tom caloroso)",
  "nps_estimado": number|null,
  "acoes": ["string com ações executadas"]
}`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const inicio = Date.now();
  let body: OrquestradorPayload;
  try { body = await req.json(); } catch { return new Response('JSON inválido', { status: 400 }); }

  const { task_id, escopo, urgencia, payload, workspace_id } = body;

  try {
    const resposta = await callClaude(SYSTEM_PROMPT, `Contexto pós-venda:\n${JSON.stringify(payload, null, 2)}`);
    const resultado = JSON.parse(resposta);

    await logEvento({ task_id, escopo, agente: 'pos-venda', tipo_evento: 'concluido', urgencia, duracao_ms: Date.now() - inicio, workspace_id });
    return new Response(JSON.stringify({ sucesso: true, acoes_executadas: resultado.acoes ?? [], acao: resultado.acao }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEvento({ task_id, escopo, agente: 'pos-venda', tipo_evento: 'erro', urgencia, duracao_ms: Date.now() - inicio, erro: msg, workspace_id });
    return new Response(JSON.stringify({ sucesso: false, erro: msg }), { status: 500 });
  }
});
