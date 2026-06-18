/**
 * whatsapp-sdr — SDR via WhatsApp
 *
 * Fluxo:
 *   1. Busca dados do lead no banco (se lead_id presente)
 *   2. Claude gera mensagem personalizada
 *   3. Envia a mensagem via WhatsApp (Evolution API ou Z-API)
 *   4. Atualiza status do lead no banco
 *
 * Credenciais necessárias (workspace_credentials):
 *   tipo='evolution': api_url, api_key, instance
 *   tipo='whatsapp':  instance_id, token, client_token (Z-API)
 *
 * Payload esperado:
 *   telefone    — número do destinatário (obrigatório para envio real)
 *   lead_id     — UUID do lead (opcional, enriquece contexto)
 *   tipo_evento — contexto do acionamento
 */

import { callClaude } from '../_shared/anthropic.ts';
import { getSupabaseAdmin } from '../_shared/supabase.ts';
import { logEvento } from '../_shared/logger.ts';
import { enviarWhatsApp } from '../_shared/whatsapp.ts';
import { enviarDMInstagram } from '../_shared/instagram.ts';
import type { OrquestradorPayload } from '../_shared/types.ts';

const SYSTEM_PROMPT = `Você é o SDR da floricultura Enemeop Flores.
Seu papel: redigir mensagens personalizadas para leads e clientes que entraram em contato.
Retorne JSON:
{
  "mensagem": "texto da mensagem (tom acolhedor e profissional, pode usar 1-2 emojis de flores)",
  "tipo": "abordagem_inicial"|"follow_up"|"confirmacao_pedido"|"notificacao_entrega"|"reativacao",
  "acoes": ["ações executadas"]
}
Máximo 300 caracteres. Português brasileiro.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const inicio = Date.now();
  let body: OrquestradorPayload;
  try { body = await req.json(); } catch { return new Response('JSON inválido', { status: 400 }); }

  const { task_id, escopo, urgencia, payload, workspace_id } = body;
  const sb = getSupabaseAdmin();
  const acoes: string[] = [];

  try {
    // 1. Enriquecer contexto com dados do lead
    let contexto = JSON.stringify(payload, null, 2);
    let telefone = payload.telefone as string | undefined;
    let canalLead = payload.canal as string | undefined;
    let canalId = payload.canal_id as string | undefined;

    if (payload.lead_id) {
      const { data: lead } = await sb
        .from('leads')
        .select('nome, telefone, canal, canal_id, intencao, status')
        .eq('id', payload.lead_id)
        .single();
      if (lead) {
        contexto = JSON.stringify({ ...payload, lead }, null, 2);
        telefone = telefone ?? (lead.telefone as string | undefined);
        canalLead = canalLead ?? (lead.canal as string | undefined);
        canalId = canalId ?? (lead.canal_id as string | undefined);
      }
    }

    // 2. Claude gera mensagem
    const resposta = await callClaude(SYSTEM_PROMPT, `Contexto:\n${contexto}`);
    const jsonStr = resposta.replace(/```json\n?|\n?```/g, '').trim();
    const resultado = JSON.parse(jsonStr);
    const mensagem: string = resultado.mensagem ?? '';

    acoes.push(`Mensagem gerada (tipo: ${resultado.tipo})`);

    // 3. Envia via canal do lead
    if (mensagem) {
      const isInstagram = canalLead?.toLowerCase() === 'instagram';

      if (isInstagram && canalId) {
        // Lead veio do Instagram → responde via DM
        const envio = await enviarDMInstagram(canalId, mensagem);
        if (envio.enviado) {
          acoes.push(`Instagram DM enviada para ${canalId}`);
          if (payload.lead_id) {
            await sb.from('leads').update({ status: 'em_atendimento' }).eq('id', payload.lead_id);
            acoes.push('Lead atualizado: status → em_atendimento');
          }
        } else {
          acoes.push(`Instagram DM não enviada: ${envio.erro}`);
        }
      } else if (telefone) {
        // Lead tem telefone → responde via WhatsApp
        const envio = await enviarWhatsApp(workspace_id, telefone, mensagem);
        if (envio.enviado) {
          acoes.push(`WhatsApp enviado para ${telefone} via ${envio.provedor}`);
          if (payload.lead_id) {
            await sb.from('leads').update({ status: 'em_atendimento' }).eq('id', payload.lead_id);
            acoes.push('Lead atualizado: status → em_atendimento');
          }
        } else {
          acoes.push(`WhatsApp não enviado: ${envio.erro}`);
        }
      } else {
        acoes.push('Nenhum canal disponível para envio (sem telefone nem canal_id Instagram)');
      }
    }

    await logEvento({ task_id, escopo, agente: 'whatsapp-sdr', tipo_evento: 'concluido', urgencia, duracao_ms: Date.now() - inicio, workspace_id });
    return new Response(
      JSON.stringify({ sucesso: true, mensagem, acoes_executadas: acoes }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEvento({ task_id, escopo, agente: 'whatsapp-sdr', tipo_evento: 'erro', urgencia, duracao_ms: Date.now() - inicio, erro: msg, workspace_id });
    return new Response(JSON.stringify({ sucesso: false, erro: msg }), { status: 500 });
  }
});
