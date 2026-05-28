import { callClaude } from '../_shared/anthropic.ts';
import { logEvento } from '../_shared/logger.ts';
import type { OrquestradorPayload } from '../_shared/types.ts';

const SYSTEM_PROMPT = `Você é o agente Dev da Fábrica de SaaS.
Planeje e documente tarefas de desenvolvimento de SaaS. Retorne JSON:
{
  "tipo_tarefa": "criar_schema"|"criar_componente"|"corrigir_bug"|"configurar_infra"|"criar_migracao",
  "arquivos_a_criar": [{"caminho": string, "descricao": string}],
  "migracao_sql": string|null,
  "instrucoes_deploy": ["string"],
  "acoes": ["string com ações executadas"],
  "estimativa_horas": number
}
IMPORTANTE: Nunca faça push direto para main. Sempre crie em branch separada.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const inicio = Date.now();
  let body: OrquestradorPayload;
  try { body = await req.json(); } catch { return new Response('JSON inválido', { status: 400 }); }

  const { task_id, escopo, urgencia, payload, workspace_id } = body;

  try {
    const resposta = await callClaude(SYSTEM_PROMPT, `Tarefa de desenvolvimento:\n${JSON.stringify(payload, null, 2)}`, 4096);
    const resultado = JSON.parse(resposta);

    await logEvento({ task_id, escopo, agente: 'agente-dev', tipo_evento: 'concluido', urgencia, duracao_ms: Date.now() - inicio, workspace_id });
    return new Response(JSON.stringify({ sucesso: true, acoes_executadas: resultado.acoes ?? [], plano: resultado }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEvento({ task_id, escopo, agente: 'agente-dev', tipo_evento: 'erro', urgencia, duracao_ms: Date.now() - inicio, erro: msg, workspace_id });
    return new Response(JSON.stringify({ sucesso: false, erro: msg }), { status: 500 });
  }
});
