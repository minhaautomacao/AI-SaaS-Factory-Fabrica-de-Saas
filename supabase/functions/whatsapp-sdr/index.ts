/**
 * whatsapp-sdr — SDR automático + handoff para atendente humano
 *
 * Fluxo:
 *   1. Claude gera mensagem personalizada para o lead
 *   2. Envia via WhatsApp (Z-API) ou Instagram DM
 *   3. Se handoff solicitado: avisa o cliente e notifica o operador com contexto
 *
 * Handoff acontece quando:
 *   - Cliente pede falar com humano ("quero falar com alguém", "atendente", etc.)
 *   - Agente não consegue avançar na venda após várias trocas
 *   - payload.forcar_handoff = true
 *
 * Horário comercial: 08:00–18:00 BRT (seg–sáb)
 * Fora do horário: avisa cliente e agenda retorno no próximo dia útil.
 */

import { callClaude } from '../_shared/anthropic.ts';
import { getSupabaseAdmin } from '../_shared/supabase.ts';
import { logEvento } from '../_shared/logger.ts';
import { enviarWhatsApp } from '../_shared/whatsapp.ts';
import { enviarDMInstagram } from '../_shared/instagram.ts';
import type { OrquestradorPayload } from '../_shared/types.ts';

// Número do operador humano (WhatsApp)
const OPERADOR_WHATSAPP = Deno.env.get('CARLOS_WHATSAPP') ?? Deno.env.get('OPERADOR_WHATSAPP') ?? '';

// Horário comercial: 08:00–18:00 BRT = UTC-3 = 11:00–21:00 UTC
function eHorarioComercial(): boolean {
  const agora = new Date();
  const horaBRT = (agora.getUTCHours() - 3 + 24) % 24;
  const diaSemana = agora.getUTCDay(); // 0=dom, 6=sáb
  if (diaSemana === 0) return false; // domingo fechado
  return horaBRT >= 8 && horaBRT < 18;
}

const SYSTEM_PROMPT = `Você é o SDR da floricultura Enemeop Flores.
Seu papel: redigir mensagens e decidir o próximo passo no atendimento.
Retorne JSON:
{
  "mensagem": "texto da mensagem ao cliente (tom acolhedor, 1-2 emojis de flores, máx 300 chars)",
  "tipo": "abordagem_inicial"|"follow_up"|"cotacao_frete"|"confirmacao_pedido"|"notificacao_entrega"|"reativacao"|"handoff",
  "handoff": false,
  "motivo_handoff": null,
  "acoes": ["ações executadas"]
}

Quando acionar handoff (handoff: true):
- Cliente pediu explicitamente falar com humano/atendente
- Situação complexa que exige decisão humana (desconto especial, reclamação séria, pedido corporativo grande)
- Mais de 5 trocas sem conseguir fechar o pedido
Em caso de handoff, a mensagem deve ser cordial, avisando que um atendente entrará em contato em breve.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const inicio = Date.now();
  let body: OrquestradorPayload;
  try { body = await req.json(); } catch { return new Response('JSON inválido', { status: 400 }); }

  const { task_id, escopo, urgencia, payload, workspace_id } = body;
  const sb = getSupabaseAdmin();
  const acoes: string[] = [];

  try {
    let contexto = JSON.stringify(payload, null, 2);
    let telefone  = payload.telefone  as string | undefined;
    let canalLead = payload.canal     as string | undefined;
    let canalId   = payload.canal_id  as string | undefined;

    // Enriquece contexto com dados do lead
    if (payload.lead_id) {
      const { data: lead } = await sb
        .from('leads')
        .select('nome, telefone, canal, canal_id, intencao, status, notas, historico_canal')
        .eq('id', payload.lead_id as string)
        .single();
      if (lead) {
        contexto  = JSON.stringify({ ...payload, lead }, null, 2);
        telefone  = telefone  ?? (lead.telefone  as string | undefined);
        canalLead = canalLead ?? (lead.canal     as string | undefined);
        canalId   = canalId   ?? (lead.canal_id  as string | undefined);
      }
    }

    // Verifica se é handoff forçado pelo orquestrador
    const forcaHandoff = payload.forcar_handoff === true;

    const resposta = await callClaude(
      SYSTEM_PROMPT,
      `Contexto:\n${contexto}\n${forcaHandoff ? '\nIMPORTANTE: acionar handoff humano agora.' : ''}`,
    );
    const jsonStr  = resposta.replace(/```json\n?|\n?```/g, '').trim();
    const resultado = JSON.parse(jsonStr);
    const mensagem: string  = resultado.mensagem ?? '';
    const isHandoff: boolean = forcaHandoff || resultado.handoff === true;

    acoes.push(`Mensagem gerada (tipo: ${resultado.tipo})`);

    // Envia mensagem ao cliente
    if (mensagem) {
      const isInstagram = canalLead?.toLowerCase() === 'instagram';

      if (isInstagram && canalId) {
        const envio = await enviarDMInstagram(canalId, mensagem);
        if (envio.enviado) {
          acoes.push(`Instagram DM enviada para ${canalId}`);
          if (payload.lead_id) {
            await sb.from('leads').update({ status: 'em_atendimento' }).eq('id', payload.lead_id as string);
          }
        } else {
          acoes.push(`Instagram DM não enviada: ${envio.erro}`);
        }
      } else if (telefone) {
        const envio = await enviarWhatsApp(workspace_id, telefone, mensagem);
        if (envio.enviado) {
          acoes.push(`WhatsApp enviado para ${telefone} via ${envio.provedor}`);
          if (payload.lead_id) {
            const novoStatus = isHandoff ? 'em_atendimento' : 'em_atendimento';
            await sb.from('leads').update({ status: novoStatus }).eq('id', payload.lead_id as string);
          }
        } else {
          acoes.push(`WhatsApp não enviado: ${envio.erro}`);
        }
      } else {
        acoes.push('Nenhum canal disponível (sem telefone nem canal_id)');
      }
    }

    // Handoff: notifica operador humano
    if (isHandoff && OPERADOR_WHATSAPP) {
      const horario = eHorarioComercial();
      const nomeCliente = (payload.nome as string | undefined) ?? telefone ?? canalId ?? 'Cliente';
      const intencao    = (payload.intencao as string | undefined) ?? '';
      const motivo      = resultado.motivo_handoff ?? 'Solicitado durante atendimento';

      let avisoOperador = `🔔 *HANDOFF — Atendimento Humano Necessário*\n\n`;
      avisoOperador    += `👤 *Cliente:* ${nomeCliente}\n`;
      if (telefone) avisoOperador += `📱 *Telefone:* ${telefone}\n`;
      if (intencao) avisoOperador += `🎯 *Intenção:* ${intencao}\n`;
      avisoOperador    += `📋 *Motivo:* ${motivo}\n\n`;
      avisoOperador    += `💬 *Última mensagem do cliente:*\n${(payload.mensagem as string | undefined) ?? '(sem mensagem registrada)'}\n\n`;
      if (payload.lead_id) avisoOperador += `🆔 Lead ID: ${payload.lead_id}`;

      if (!horario) {
        avisoOperador += `\n\n⏰ *Fora do horário comercial.* Retorne ao cliente no próximo dia útil após as 08h.`;
      }

      const envioOp = await enviarWhatsApp(workspace_id, OPERADOR_WHATSAPP, avisoOperador);
      acoes.push(envioOp.enviado
        ? `Operador notificado: ${OPERADOR_WHATSAPP} (horário comercial: ${horario ? 'sim' : 'não'})`
        : `Falha ao notificar operador: ${envioOp.erro}`);

      // Atualiza lead com flag de handoff
      if (payload.lead_id) {
        await sb.from('leads')
          .update({ status: 'em_atendimento', notas: `Handoff solicitado: ${motivo}` })
          .eq('id', payload.lead_id as string);
        acoes.push('Lead marcado para atendimento humano');
      }
    }

    await logEvento({
      task_id, escopo, agente: 'whatsapp-sdr',
      tipo_evento: isHandoff ? 'handoff' : 'concluido',
      urgencia, duracao_ms: Date.now() - inicio, workspace_id,
    });

    return new Response(
      JSON.stringify({ sucesso: true, mensagem, handoff: isHandoff, acoes_executadas: acoes }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEvento({ task_id, escopo, agente: 'whatsapp-sdr', tipo_evento: 'erro', urgencia, duracao_ms: Date.now() - inicio, erro: msg, workspace_id });
    return new Response(JSON.stringify({ sucesso: false, erro: msg }), { status: 500 });
  }
});
