/**
 * logistica — Cálculo de frete e logística de entregas
 *
 * Fluxo:
 *   1. Claude analisa a situação logística
 *   2. Se payload tem dados de frete E Melhor Envio configurado → calcula frete real
 *   3. Notifica cliente via WhatsApp quando necessário
 *
 * Credenciais necessárias (workspace_credentials):
 *   tipo='logistica': melhor_envio_token, cep_origem
 *   tipo='evolution'/'whatsapp': para notificações WhatsApp
 *
 * Payload esperado:
 *   telefone          — telefone do cliente
 *   cep_destino       — CEP de entrega (para cálculo Melhor Envio)
 *   peso_kg           — peso do pacote
 *   valor_declarado   — valor declarado para seguro
 *   largura_cm        — dimensões (opcional, default 15)
 *   altura_cm
 *   comprimento_cm
 */

import { callClaude } from '../_shared/anthropic.ts';
import { logEvento } from '../_shared/logger.ts';
import { enviarWhatsApp } from '../_shared/whatsapp.ts';
import { buscarTodasCredenciais } from '../_shared/credentials.ts';
import type { OrquestradorPayload } from '../_shared/types.ts';

const SYSTEM_PROMPT = `Você é o agente de Logística da Fábrica de SaaS.
Analise a situação de entrega. Retorne JSON:
{
  "acao": "calcular_frete"|"agendar_coleta"|"redirecionar_entrega"|"contatar_transportadora"|"nenhuma",
  "transportadora_sugerida": string|null,
  "prazo_estimado_dias": number|null,
  "mensagem_cliente": "mensagem WhatsApp para o cliente (máx 200 chars) ou null",
  "notificar_cliente": boolean,
  "instrucoes_operador": "instruções internas para o operador",
  "acoes": ["ações executadas"]
}`;

// Calcula frete via Melhor Envio API
async function calcularFreteReal(
  token: string,
  cepOrigem: string,
  cepDestino: string,
  peso: number,
  valorDeclarado: number,
  dimensoes: { largura: number; altura: number; comprimento: number },
): Promise<{ transportadoras: Array<{ nome: string; preco: number; prazo: number }> } | null> {
  try {
    const resp = await fetch('https://www.melhorenvio.com.br/api/v2/me/shipment/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Fabrica de SaaS (minhaautomacao10@gmail.com)',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        from: { postal_code: cepOrigem.replace(/\D/g, '') },
        to:   { postal_code: cepDestino.replace(/\D/g, '') },
        products: [{
          id: 'produto',
          width:    dimensoes.largura,
          height:   dimensoes.altura,
          length:   dimensoes.comprimento,
          weight:   peso,
          insurance_value: valorDeclarado,
          quantity: 1,
        }],
      }),
    });

    if (!resp.ok) return null;
    const data = await resp.json() as Array<{ name: string; price: string; delivery_time: number; error?: string }>;

    return {
      transportadoras: data
        .filter((t) => !t.error && t.price)
        .map((t) => ({
          nome:  t.name,
          preco: parseFloat(t.price),
          prazo: t.delivery_time,
        }))
        .sort((a, b) => a.preco - b.preco),
    };
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const inicio = Date.now();
  let body: OrquestradorPayload;
  try { body = await req.json(); } catch { return new Response('JSON inválido', { status: 400 }); }

  const { task_id, escopo, urgencia, payload, workspace_id } = body;
  const acoes: string[] = [];
  type FreteResult = { transportadoras: Array<{ nome: string; preco: number; prazo: number }> } | null;
  let freteReal: FreteResult = null;

  try {
    // Tenta cálculo real de frete se dados disponíveis
    const logCreds = await buscarTodasCredenciais(workspace_id, 'logistica');
    const cepDestino = payload.cep_destino as string | undefined;
    const peso       = Number(payload.peso_kg ?? 0.5);
    const valorDec   = Number(payload.valor_declarado ?? 50);

    if (logCreds['melhor_envio_token'] && logCreds['cep_origem'] && cepDestino) {
      freteReal = await calcularFreteReal(
        logCreds['melhor_envio_token'],
        logCreds['cep_origem'],
        cepDestino,
        peso,
        valorDec,
        {
          largura:     Number(payload.largura_cm    ?? 15),
          altura:      Number(payload.altura_cm     ?? 10),
          comprimento: Number(payload.comprimento_cm ?? 20),
        },
      );
      if (freteReal) {
        acoes.push(`Frete calculado via Melhor Envio: ${freteReal.transportadoras.length} opções`);
      }
    }

    // Claude analisa com contexto real
    const contexto = JSON.stringify({ ...payload, frete_calculado: freteReal }, null, 2);
    const resposta = await callClaude(SYSTEM_PROMPT, `Situação logística:\n${contexto}`);
    const resultado = JSON.parse(resposta);

    acoes.push(`Análise: ${resultado.acao}`);

    // Notificação WhatsApp
    if (resultado.notificar_cliente && resultado.mensagem_cliente) {
      const telefone = payload.telefone as string | undefined;
      const envio = await enviarWhatsApp(workspace_id, telefone, resultado.mensagem_cliente);
      acoes.push(envio.enviado
        ? `Cliente notificado via WhatsApp (${envio.provedor})`
        : `Notificação não enviada: ${envio.erro}`);
    }

    await logEvento({ task_id, escopo, agente: 'logistica', tipo_evento: 'concluido', urgencia, duracao_ms: Date.now() - inicio, workspace_id });
    return new Response(
      JSON.stringify({ sucesso: true, acao: resultado.acao, frete: freteReal, acoes_executadas: acoes }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEvento({ task_id, escopo, agente: 'logistica', tipo_evento: 'erro', urgencia, duracao_ms: Date.now() - inicio, erro: msg, workspace_id });
    return new Response(JSON.stringify({ sucesso: false, erro: msg }), { status: 500 });
  }
});
