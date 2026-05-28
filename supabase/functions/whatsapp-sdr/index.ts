import { callClaude } from '../_shared/anthropic.ts';
import { getSupabaseAdmin } from '../_shared/supabase.ts';
import { logEvento } from '../_shared/logger.ts';
import type { OrquestradorPayload } from '../_shared/types.ts';

const SYSTEM_PROMPT = `Você é o SDR via WhatsApp da Fábrica de SaaS.
Seu papel: redigir mensagens de WhatsApp personalizadas para leads e clientes.
Retorne JSON:
{
  "mensagem": "texto da mensagem (sem emojis excessivos, tom profissional e caloroso)",
  "tipo": "abordagem_inicial"|"follow_up"|"confirmacao_pedido"|"notificacao_entrega"|"reativacao",
  "acoes": ["string com ações executadas"]
}
Máximo 300 caracteres na mensagem. Português brasileiro.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const inicio = Date.now();
  let body: OrquestradorPayload;
  try { body = await req.json(); } catch { return new Response('JSON inválido', { status: 400 }); }

  const { task_id, escopo, urgencia, payload, workspace_id } = body;
  const sb = getSupabaseAdmin();

  try {
    let contextoLead = JSON.stringify(payload, null, 2);

    if (payload.lead_id) {
      const { data } = await sb.from('leads').select('nome, canal, intencao, status').eq('id', payload.lead_id).single();
      if (data) contextoLead = JSON.stringify({ ...payload, lead: data }, null, 2);
    }

    const resposta = await callClaude(SYSTEM_PROMPT, `Contexto:\n${contextoLead}`);
    const resultado = JSON.parse(resposta);

    // Aqui chamaria a Evolution API ou Z-API — registra a intenção no log
    await logEvento({ task_id, escopo, agente: 'whatsapp-sdr', tipo_evento: 'concluido', urgencia, duracao_ms: Date.now() - inicio, workspace_id });
    return new Response(JSON.stringify({ sucesso: true, mensagem: resultado.mensagem, acoes_executadas: resultado.acoes ?? [] }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEvento({ task_id, escopo, agente: 'whatsapp-sdr', tipo_evento: 'erro', urgencia, duracao_ms: Date.now() - inicio, erro: msg, workspace_id });
    return new Response(JSON.stringify({ sucesso: false, erro: msg }), { status: 500 });
  }
});
