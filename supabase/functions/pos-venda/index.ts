/**
 * pos-venda — Follow-up pós-compra e NPS
 *
 * Fluxo:
 *   1. Claude gera mensagem de follow-up personalizada
 *   2. Envia via WhatsApp E/OU Email conforme disponível
 *   3. Registra NPS estimado
 *
 * Credenciais necessárias (workspace_credentials):
 *   tipo='evolution'/'whatsapp': para follow-up WhatsApp
 *   tipo='email': para follow-up por email
 *
 * Payload esperado:
 *   telefone       — telefone do cliente
 *   email          — email do cliente (opcional)
 *   cliente_nome   — nome do cliente
 *   produto        — produto comprado
 *   data_entrega   — data de entrega (para calcular quando acionar)
 *   tipo_evento    — entrega_concluida | devolucao_solicitada | feedback_cliente
 */

import { callClaude } from '../_shared/anthropic.ts';
import { logEvento } from '../_shared/logger.ts';
import { enviarWhatsApp } from '../_shared/whatsapp.ts';
import { enviarEmail } from '../_shared/email.ts';
import type { OrquestradorPayload } from '../_shared/types.ts';

const SYSTEM_PROMPT = `Você é o agente de Pós-Venda da Fábrica de SaaS.
Cuide da experiência do cliente após a compra. Retorne JSON:
{
  "acao": "enviar_pesquisa_satisfacao"|"oferecer_recompra"|"registrar_reclamacao"|"iniciar_troca"|"nenhuma",
  "mensagem_whatsapp": "mensagem de follow-up WhatsApp (máx 280 chars, tom caloroso e pessoal) ou null",
  "assunto_email": "assunto do email (máx 60 chars) ou null",
  "corpo_email": "corpo do email em texto (máx 400 chars) ou null",
  "nps_estimado": number|null,
  "enviar_whatsapp": boolean,
  "enviar_email": boolean,
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
    const resposta = await callClaude(SYSTEM_PROMPT, `Contexto pós-venda:\n${JSON.stringify(payload, null, 2)}`);
    const resultado = JSON.parse(resposta);

    acoes.push(`Ação: ${resultado.acao}`);
    if (resultado.nps_estimado !== null) acoes.push(`NPS estimado: ${resultado.nps_estimado}`);

    const telefone = payload.telefone as string | undefined;
    const email    = payload.email    as string | undefined;

    // Envio WhatsApp
    if (resultado.enviar_whatsapp && resultado.mensagem_whatsapp) {
      const envio = await enviarWhatsApp(workspace_id, telefone, resultado.mensagem_whatsapp);
      acoes.push(envio.enviado
        ? `Follow-up WhatsApp enviado (${envio.provedor})`
        : `WhatsApp não enviado: ${envio.erro}`);
    }

    // Envio Email
    if (resultado.enviar_email && resultado.corpo_email) {
      const envio = await enviarEmail(
        workspace_id,
        email,
        resultado.assunto_email ?? 'Como foi sua experiência?',
        resultado.corpo_email,
      );
      acoes.push(envio.enviado
        ? `Follow-up email enviado (id: ${envio.id})`
        : `Email não enviado: ${envio.erro}`);
    }

    await logEvento({ task_id, escopo, agente: 'pos-venda', tipo_evento: 'concluido', urgencia, duracao_ms: Date.now() - inicio, workspace_id });
    return new Response(
      JSON.stringify({ sucesso: true, acao: resultado.acao, nps_estimado: resultado.nps_estimado, acoes_executadas: acoes }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEvento({ task_id, escopo, agente: 'pos-venda', tipo_evento: 'erro', urgencia, duracao_ms: Date.now() - inicio, erro: msg, workspace_id });
    return new Response(JSON.stringify({ sucesso: false, erro: msg }), { status: 500 });
  }
});
