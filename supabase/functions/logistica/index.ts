/**
 * logistica — Cálculo de frete e logística de entregas
 *
 * Transportadoras suportadas (configurar em workspace_credentials, tipo='logistica'):
 *   Melhor Envio  → melhor_envio_token + cep_origem
 *   Lalamove      → lalamove_key + lalamove_secret
 *
 * Payload esperado:
 *   cep_destino       — CEP de entrega
 *   cep_origem        — CEP de origem (fallback se não configurado em credenciais)
 *   peso_kg           — peso do pacote (default 0.5)
 *   valor_declarado   — valor para seguro (default 50)
 *   largura_cm        — dimensões (default 15)
 *   altura_cm         — (default 10)
 *   comprimento_cm    — (default 20)
 *   telefone          — telefone do cliente para notificação WhatsApp
 *   lat_origem / lng_origem / lat_destino / lng_destino — coordenadas para Lalamove
 *   endereco_origem / endereco_destino                  — endereços para Lalamove
 */

import { callClaude } from '../_shared/anthropic.ts';
import { logEvento } from '../_shared/logger.ts';
import { enviarWhatsApp } from '../_shared/whatsapp.ts';
import { consultarFretes } from '../_shared/transportadoras.ts';
import type { OrquestradorPayload } from '../_shared/types.ts';

const SYSTEM_PROMPT = `Você é o agente de Logística da Fábrica de SaaS.
Analise a situação de entrega e as opções de frete disponíveis. Retorne JSON:
{
  "acao": "calcular_frete"|"agendar_coleta"|"redirecionar_entrega"|"contatar_transportadora"|"nenhuma",
  "transportadora_escolhida": string|null,
  "servico_escolhido": string|null,
  "preco_frete": number|null,
  "prazo_estimado_dias": number|null,
  "mensagem_cliente": "mensagem WhatsApp para o cliente (máx 200 chars) ou null",
  "notificar_cliente": boolean,
  "instrucoes_operador": "instruções internas para o operador",
  "acoes": ["ações executadas"]
}
Prefira a opção mais barata que atenda o prazo. Para floricultura, Lalamove (moto) é ideal para entregas no mesmo dia.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const inicio = Date.now();
  let body: OrquestradorPayload;
  try { body = await req.json(); } catch { return new Response('JSON inválido', { status: 400 }); }

  const { task_id, escopo, urgencia, payload, workspace_id } = body;
  const acoes: string[] = [];

  try {
    const cepDestino = payload.cep_destino as string | undefined;

    let fretes = null;
    if (cepDestino) {
      const dadosFrete = {
        cep_origem:    (payload.cep_origem as string | undefined) ?? '',
        cep_destino:   cepDestino,
        peso_kg:       Number(payload.peso_kg       ?? 0.5),
        valor_declarado: Number(payload.valor_declarado ?? 50),
        largura_cm:    Number(payload.largura_cm    ?? 15),
        altura_cm:     Number(payload.altura_cm     ?? 10),
        comprimento_cm: Number(payload.comprimento_cm ?? 20),
      };

      const lalamoveOpts = {
        lat_origem:       payload.lat_origem       as string | undefined,
        lng_origem:       payload.lng_origem       as string | undefined,
        lat_destino:      payload.lat_destino      as string | undefined,
        lng_destino:      payload.lng_destino      as string | undefined,
        endereco_origem:  payload.endereco_origem  as string | undefined,
        endereco_destino: payload.endereco_destino as string | undefined,
      };

      fretes = await consultarFretes(workspace_id, dadosFrete, lalamoveOpts);

      if (fretes.transportadoras_consultadas.length > 0) {
        acoes.push(`Fretes consultados: ${fretes.transportadoras_consultadas.join(', ')} — ${fretes.opcoes.length} opções`);
      }
      if (Object.keys(fretes.erros).length > 0) {
        acoes.push(`Erros: ${JSON.stringify(fretes.erros)}`);
      }
    }

    const contexto = JSON.stringify({ ...payload, fretes_disponiveis: fretes }, null, 2);
    const resposta = await callClaude(SYSTEM_PROMPT, `Situação logística:\n${contexto}`);
    const jsonStr = resposta.replace(/```json\n?|\n?```/g, '').trim();
    const resultado = JSON.parse(jsonStr);

    acoes.push(`Análise: ${resultado.acao}`);

    if (resultado.notificar_cliente && resultado.mensagem_cliente) {
      const telefone = payload.telefone as string | undefined;
      const envio = await enviarWhatsApp(workspace_id, telefone, resultado.mensagem_cliente);
      acoes.push(envio.enviado
        ? `Cliente notificado via WhatsApp (${envio.provedor})`
        : `Notificação não enviada: ${envio.erro}`);
    }

    await logEvento({ task_id, escopo, agente: 'logistica', tipo_evento: 'concluido', urgencia, duracao_ms: Date.now() - inicio, workspace_id });

    return new Response(
      JSON.stringify({ sucesso: true, acao: resultado.acao, fretes, acoes_executadas: acoes }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEvento({ task_id, escopo, agente: 'logistica', tipo_evento: 'erro', urgencia, duracao_ms: Date.now() - inicio, erro: msg, workspace_id });
    return new Response(JSON.stringify({ sucesso: false, erro: msg }), { status: 500 });
  }
});
