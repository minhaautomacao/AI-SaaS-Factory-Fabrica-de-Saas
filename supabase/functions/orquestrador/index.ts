import { logEvento } from '../_shared/logger.ts';
import type { NomeAgente, OrquestradorPayload } from '../_shared/types.ts';

const ROTEAMENTO: Record<string, NomeAgente[]> = {
  'novo-lead':                   ['captacao-leads', 'whatsapp-sdr'],
  'mensagem-recebida':           ['whatsapp-sdr'],
  'lead-qualificado':            ['whatsapp-sdr'],
  'pagamento-recebido':          ['financeiro', 'logistica'],
  'pedido-criado':               ['operacional', 'logistica'],
  'pedido-confirmado':           ['operacional', 'logistica', 'estoque'],
  'solicitacao-frete':           ['logistica'],
  'status-entrega-atualizado':   ['rastreamento', 'whatsapp-sdr'],
  'tentativa-entrega-falha':     ['rastreamento', 'logistica', 'whatsapp-sdr'],
  'entrega-concluida':           ['pos-venda', 'financeiro', 'estoque'],
  'devolucao-solicitada':        ['pos-venda', 'logistica', 'financeiro'],
  'pagamento-expirado':          ['financeiro', 'whatsapp-sdr'],
  'cobranca-pendente':           ['financeiro'],
  'extrato-recebido':            ['conciliacao'],
  'analise-periodica':           ['inteligencia'],
  'campanha-solicitada':         ['marketing'],
  'cliente-inativo-detectado':   ['marketing', 'whatsapp-sdr'],
  'ruptura-estoque':             ['estoque', 'operacional'],
  'mercadoria-recebida':         ['estoque'],
  'alerta-operacional':          ['operacional', 'inteligencia'],
  'feedback-cliente':            ['pos-venda', 'marketing'],
  'relatorio-solicitado':        ['inteligencia'],
  'novo-saas-solicitado':        ['agente-dev'],
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

async function chamarAgente(agente: NomeAgente, payload: OrquestradorPayload): Promise<void> {
  await fetch(`${SUPABASE_URL}/functions/v1/${agente}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify(payload),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.includes(SERVICE_KEY) && SERVICE_KEY !== '') {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });
  }

  let body: OrquestradorPayload;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
  }

  const { tipo, escopo = 'producao', urgencia = 'normal', task_id, workspace_id } = body;
  if (!tipo || !task_id) {
    return new Response(JSON.stringify({ error: 'tipo e task_id são obrigatórios' }), { status: 400 });
  }

  const agentes = ROTEAMENTO[tipo];
  if (!agentes || agentes.length === 0) {
    return new Response(JSON.stringify({ ok: true, agentes_acionados: [], aviso: `Tipo "${tipo}" não mapeado` }), { status: 200 });
  }

  await logEvento({ task_id, escopo, agente: 'captacao-leads', tipo_evento: 'acionado', urgencia, workspace_id });

  // Chamar agentes em paralelo
  await Promise.allSettled(agentes.map(a => chamarAgente(a, body)));

  return new Response(
    JSON.stringify({ ok: true, agentes_acionados: agentes }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
