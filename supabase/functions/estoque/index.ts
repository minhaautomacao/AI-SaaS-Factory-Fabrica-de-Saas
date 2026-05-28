import { callClaude } from '../_shared/anthropic.ts';
import { logEvento } from '../_shared/logger.ts';
import type { OrquestradorPayload } from '../_shared/types.ts';

const SYSTEM_PROMPT = `Você é o agente de Controle de Estoque da Fábrica de SaaS.
Analise movimentações e alertas de estoque. Retorne JSON:
{
  "acao": "reduzir_estoque"|"aumentar_estoque"|"gerar_proposta_compra"|"alertar_ruptura"|"nenhuma",
  "produtos_afetados": [{"id": string, "nome": string, "quantidade": number}],
  "proposta_compra": {"produto": string, "quantidade_sugerida": number, "fornecedor": string}|null,
  "alerta_nivel": "critico"|"atencao"|"normal",
  "acoes": ["string com ações executadas"]
}
IMPORTANTE: Nunca permita saldo negativo. Proposta de compra nunca é enviada automaticamente.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const inicio = Date.now();
  let body: OrquestradorPayload;
  try { body = await req.json(); } catch { return new Response('JSON inválido', { status: 400 }); }

  const { task_id, escopo, urgencia, payload, workspace_id } = body;

  try {
    const resposta = await callClaude(SYSTEM_PROMPT, `Situação de estoque:\n${JSON.stringify(payload, null, 2)}`);
    const resultado = JSON.parse(resposta);

    await logEvento({ task_id, escopo, agente: 'estoque', tipo_evento: 'concluido', urgencia, duracao_ms: Date.now() - inicio, workspace_id });
    return new Response(JSON.stringify({ sucesso: true, acoes_executadas: resultado.acoes ?? [], acao: resultado.acao, alerta: resultado.alerta_nivel }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEvento({ task_id, escopo, agente: 'estoque', tipo_evento: 'erro', urgencia, duracao_ms: Date.now() - inicio, erro: msg, workspace_id });
    return new Response(JSON.stringify({ sucesso: false, erro: msg }), { status: 500 });
  }
});
