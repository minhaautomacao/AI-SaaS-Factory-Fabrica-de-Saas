/**
 * rastreamento — Monitoramento de entregas
 *
 * Fluxo:
 *   1. Claude analisa atualização de rastreamento
 *   2. Envia notificação WhatsApp ao cliente com status
 *   3. Se tentativa falhou → aciona logistica para reagendamento
 *
 * Credenciais necessárias (workspace_credentials):
 *   tipo='evolution'/'whatsapp': para notificações ao cliente
 *
 * Payload esperado:
 *   telefone         — telefone do cliente
 *   codigo_rastreio  — código de rastreamento
 *   status_atual     — status recebido da transportadora
 *   transportadora   — nome da transportadora
 *   previsao_entrega — data prevista (opcional)
 */

import { callClaude } from '../_shared/anthropic.ts';
import { logEvento } from '../_shared/logger.ts';
import { enviarWhatsApp } from '../_shared/whatsapp.ts';
import type { OrquestradorPayload } from '../_shared/types.ts';

const SYSTEM_PROMPT = `Você é o agente de Rastreamento da Fábrica de SaaS.
Analise atualizações de entrega e decida próximas ações. Retorne JSON:
{
  "status_entrega": "em_transito"|"saiu_entrega"|"entregue"|"tentativa_falha"|"devolvido",
  "mensagem_cliente": "notificação WhatsApp ao cliente (máx 250 chars, inclua código de rastreio)",
  "notificar_cliente": boolean,
  "acao_logistica": "reagendar"|"contatar_cliente"|"iniciar_devolucao"|"nenhuma",
  "acoes": ["ações executadas"]
}`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const inicio = Date.now();
  let body: OrquestradorPayload;
  try { body = await req.json(); } catch { return new Response('JSON inválido', { status: 400 }); }

  const { task_id, escopo, urgencia, payload, workspace_id } = body;
  const acoes: string[] = [];

  try {
    const resposta = await callClaude(SYSTEM_PROMPT, `Atualização de rastreamento:\n${JSON.stringify(payload, null, 2)}`);
    const resultado = JSON.parse(resposta);

    acoes.push(`Status: ${resultado.status_entrega} | Logística: ${resultado.acao_logistica}`);

    // Notificação WhatsApp
    if (resultado.notificar_cliente && resultado.mensagem_cliente) {
      const telefone = payload.telefone as string | undefined;
      const envio = await enviarWhatsApp(workspace_id, telefone, resultado.mensagem_cliente);
      acoes.push(envio.enviado
        ? `Cliente notificado via WhatsApp (${envio.provedor})`
        : `Notificação não enviada: ${envio.erro}`);
    }

    await logEvento({ task_id, escopo, agente: 'rastreamento', tipo_evento: 'concluido', urgencia, duracao_ms: Date.now() - inicio, workspace_id });
    return new Response(
      JSON.stringify({ sucesso: true, status: resultado.status_entrega, acao_logistica: resultado.acao_logistica, acoes_executadas: acoes }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEvento({ task_id, escopo, agente: 'rastreamento', tipo_evento: 'erro', urgencia, duracao_ms: Date.now() - inicio, erro: msg, workspace_id });
    return new Response(JSON.stringify({ sucesso: false, erro: msg }), { status: 500 });
  }
});
