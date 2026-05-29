/**
 * financeiro — Processamento de eventos financeiros
 *
 * Fluxo:
 *   1. Claude analisa o evento financeiro
 *   2. Se ação requer notificação ao cliente → envia WhatsApp
 *   3. Registra no banco quando necessário
 *
 * Credenciais necessárias (workspace_credentials):
 *   tipo='mercadopago': access_token (para verificar pagamentos)
 *   tipo='stripe':      secret_key (para verificar pagamentos Stripe)
 *   tipo='evolution'/'whatsapp': para notificações WhatsApp
 *
 * Payload esperado:
 *   telefone        — telefone do cliente (para notificações)
 *   cliente_nome    — nome do cliente
 *   valor           — valor da transação
 *   tipo_evento     — pagamento_recebido | cobranca_pendente | pagamento_expirado | etc.
 */

import { callClaude } from '../_shared/anthropic.ts';
import { logEvento } from '../_shared/logger.ts';
import { enviarWhatsApp } from '../_shared/whatsapp.ts';
import { buscarCredencial } from '../_shared/credentials.ts';
import type { OrquestradorPayload } from '../_shared/types.ts';

const SYSTEM_PROMPT = `Você é o agente Financeiro da Fábrica de SaaS.
Analise eventos financeiros e retorne JSON:
{
  "acao": "registrar_pagamento"|"gerar_cobranca"|"marcar_inadimplente"|"notificar_vencimento"|"nenhuma",
  "valor": number|null,
  "mensagem_cliente": "mensagem WhatsApp para o cliente (máx 250 chars) ou null",
  "notificar_cliente": boolean,
  "notas": "observação financeira para o operador",
  "acoes": ["ações executadas"],
  "alertas": ["alertas importantes"]
}
Nunca conceda desconto sem aprovação humana explícita.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const inicio = Date.now();
  let body: OrquestradorPayload;
  try { body = await req.json(); } catch { return new Response('JSON inválido', { status: 400 }); }

  const { task_id, escopo, urgencia, payload, workspace_id } = body;
  const acoes: string[] = [];

  try {
    // Enriquece contexto com provedor de pagamento configurado
    const temMP     = !!(await buscarCredencial(workspace_id, 'mercadopago', 'access_token'));
    const temStripe = !!(await buscarCredencial(workspace_id, 'stripe', 'secret_key'));
    const contexto  = JSON.stringify({
      ...payload,
      _provedores_configurados: { mercadopago: temMP, stripe: temStripe },
    }, null, 2);

    const resposta = await callClaude(SYSTEM_PROMPT, `Evento financeiro:\n${contexto}`);
    const resultado = JSON.parse(resposta);

    acoes.push(`Análise: ${resultado.acao}`);
    if (resultado.notas) acoes.push(resultado.notas);

    // Notificação WhatsApp ao cliente
    if (resultado.notificar_cliente && resultado.mensagem_cliente) {
      const telefone = payload.telefone as string | undefined;
      const envio = await enviarWhatsApp(workspace_id, telefone, resultado.mensagem_cliente);
      if (envio.enviado) {
        acoes.push(`Cliente notificado via WhatsApp (${envio.provedor})`);
      } else {
        acoes.push(`Notificação não enviada: ${envio.erro}`);
      }
    }

    await logEvento({ task_id, escopo, agente: 'financeiro', tipo_evento: 'concluido', urgencia, duracao_ms: Date.now() - inicio, workspace_id });
    return new Response(
      JSON.stringify({ sucesso: true, acao: resultado.acao, acoes_executadas: acoes, alertas: resultado.alertas ?? [] }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEvento({ task_id, escopo, agente: 'financeiro', tipo_evento: 'erro', urgencia, duracao_ms: Date.now() - inicio, erro: msg, workspace_id });
    return new Response(JSON.stringify({ sucesso: false, erro: msg }), { status: 500 });
  }
});
