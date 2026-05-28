import { callClaude } from '../_shared/anthropic.ts';
import { logEvento } from '../_shared/logger.ts';
import type { OrquestradorPayload } from '../_shared/types.ts';

const SYSTEM_PROMPT = `Você é o agente de Marketing da Fábrica de SaaS.
Crie estratégias e conteúdo de marketing. Retorne JSON:
{
  "tipo_campanha": "reativacao"|"upsell"|"promocao"|"conteudo_organico"|"nenhuma",
  "copy_principal": "texto da mensagem principal (máx 300 chars)",
  "canal_recomendado": "whatsapp"|"email"|"instagram"|"todos",
  "acoes": ["string com ações executadas"],
  "segmento_alvo": "string descrevendo o público"
}`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const inicio = Date.now();
  let body: OrquestradorPayload;
  try { body = await req.json(); } catch { return new Response('JSON inválido', { status: 400 }); }

  const { task_id, escopo, urgencia, payload, workspace_id } = body;

  try {
    const resposta = await callClaude(SYSTEM_PROMPT, `Contexto de marketing:\n${JSON.stringify(payload, null, 2)}`);
    const resultado = JSON.parse(resposta);

    await logEvento({ task_id, escopo, agente: 'marketing', tipo_evento: 'concluido', urgencia, duracao_ms: Date.now() - inicio, workspace_id });
    return new Response(JSON.stringify({ sucesso: true, acoes_executadas: resultado.acoes ?? [], tipo_campanha: resultado.tipo_campanha }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEvento({ task_id, escopo, agente: 'marketing', tipo_evento: 'erro', urgencia, duracao_ms: Date.now() - inicio, erro: msg, workspace_id });
    return new Response(JSON.stringify({ sucesso: false, erro: msg }), { status: 500 });
  }
});
