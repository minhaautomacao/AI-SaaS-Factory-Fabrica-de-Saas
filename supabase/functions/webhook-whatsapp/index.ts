/**
 * webhook-whatsapp — Recebe mensagens do Z-API e responde com IA
 *
 * Mesmo agente de vendas do webhook-meta (Instagram), adaptado para WhatsApp.
 * Mantém memória de conversa por número de telefone na tabela `conversas`.
 *
 * URL configurada no Z-API:
 *   https://gftnjvdvzgjkhwxnxnwl.supabase.co/functions/v1/webhook-whatsapp
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL') ?? '';
const WORKSPACE_ID  = Deno.env.get('SAAS_WORKSPACE_ID') ?? 'enemeop-flores';
const ZAPI_INSTANCE = Deno.env.get('ZAPI_INSTANCE_ID')   ?? '3F4B4EBCBF57819B4C199EBEB687E09D';
const ZAPI_TOKEN    = Deno.env.get('ZAPI_TOKEN')          ?? '23A3BBB9EBFED71EB53E773B';
const ZAPI_CLIENT   = Deno.env.get('ZAPI_CLIENT_TOKEN')   ?? 'F85b5a2e44844413db35105bfc68493d1S';

function getDb() {
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

async function buscarConfigDB(chave: string): Promise<string> {
  try {
    const { data } = await getDb().from('funcao_configs').select('valor').eq('chave', chave).single();
    return (data?.valor as string) ?? '';
  } catch { return ''; }
}

// ── Catálogo resumido (completo no webhook-meta) ──────────────────────────────

const CATALOGO = `
ENEMEOP FLORES — Ipiranga, São Paulo, desde 1997.
Funcionamento: Seg–Sáb 9h–19h | Dom e Feriados 10h–14h.
Entrega: até 3h após pagamento. São Paulo e Grande SP.

PRODUTOS (principais):
Ramalhetes: Mini R$55 | Rosas R$70 | 3 Rosas+Chocolates R$95 | Mix+Ferrero R$150
Buquês: Rosas Vermelhas R$140 | 6 Rosas R$185 | 12 Rosas R$280 | 24 Rosas R$560 | Mix Flores R$295-R$745
Arranjos: Vaso Vidro R$70 | Girassol R$75-R$135 | Rosas R$160 | Orquídeas R$225
Orquídeas: 1 haste R$170-R$290 | 2 hastes R$290-R$390
Buquês Noiva: a partir de R$445
Kits: Ferrero 100g R$45 | Cesta Queijos+Vinho R$890

FORMAS DE PAGAMENTO: Cartão, PIX, online.
PERSONALIZAÇÃO: encomendas sob medida disponíveis.
`.trim();

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Mensagem { role: 'user' | 'assistant'; content: string; ts: string; }
interface Conversa { id: string; canal_id: string; canal: string; fase: string; historico: Mensagem[]; pedido_info: Record<string, unknown> | null; lead_id: string | null; nome_cliente: string | null; }

// ── Memória de conversa ───────────────────────────────────────────────────────

async function buscarOuCriarConversa(canalId: string): Promise<Conversa> {
  const db = getDb();
  const { data } = await db.from('conversas').select('*').eq('canal_id', canalId).eq('canal', 'whatsapp').single();
  if (data) return data as Conversa;
  const { data: nova } = await db.from('conversas')
    .insert({ canal_id: canalId, canal: 'whatsapp', workspace_id: WORKSPACE_ID })
    .select('*').single();
  return nova as Conversa;
}

async function salvarConversa(id: string, updates: Partial<Conversa>): Promise<void> {
  await getDb().from('conversas').update({ ...updates, atualizado_em: new Date().toISOString() }).eq('id', id);
}

// ── IA ────────────────────────────────────────────────────────────────────────

function buildSystemPrompt(fase: string, pedidoInfo: Record<string, unknown> | null, nomeCliente: string | null): string {
  return `Você é Flor, consultora virtual da Enemeop Flores (floricultura em São Paulo desde 1997).
Atendimento 100% por WhatsApp — nunca mencione ligação telefônica.
${nomeCliente ? `Cliente: ${nomeCliente}.` : ''}

${CATALOGO}

FASE: ${fase}
${pedidoInfo ? `PEDIDO: ${JSON.stringify(pedidoInfo)}` : ''}

COMPORTAMENTO: Natural, humana, acolhedora, sofisticada. Máx 1 emoji por mensagem. Nunca parece robô.
Faça UMA pergunta por vez. Objetivo: entender ocasião, produto ideal, data, endereço e fechar pedido.
Quando o cliente decidir: colete nome, endereço, CEP, destinatário, data, período, pagamento.
HANDOFF: se cliente pedir atendente humano ou situação complexa, diga que "em breve um de nossos atendentes continuará o atendimento por aqui".
Retorne APENAS o texto da resposta, sem aspas, sem prefixo, sem JSON.`;
}

function buildFasePrompt(historico: Mensagem[], ultimaMensagem: string, faseAtual: string): string {
  return `Analise a conversa de venda de floricultura e retorne JSON:
{
  "nova_fase": "descoberta|interesse|proposta|aguardando_pagamento|concluido|perdido",
  "pedido_info": {"produto": "", "quantidade": 1, "data_entrega": "", "endereco": "", "valor": 0} | null,
  "pronto_para_pagamento": false,
  "nome_cliente": null
}
Historico: ${historico.slice(-4).map(m => `${m.role}: ${m.content}`).join(' | ')}
Ultima mensagem: "${ultimaMensagem}"
Fase atual: ${faseAtual}`;
}

async function chamarIA(systemPrompt: string, mensagens: Array<{role: string; content: string}>, maxTokens = 150): Promise<string | null> {
  const groqKey = Deno.env.get('GROQ_API_KEY') || await buscarConfigDB('GROQ_API_KEY');
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({ model: 'llama-3.1-8b-instant', max_tokens: maxTokens, messages: [{ role: 'system', content: systemPrompt }, ...mensagens] }),
      });
      if (res.ok) return ((await res.json()).choices?.[0]?.message?.content as string)?.trim() ?? null;
    } catch {}
  }
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY') || await buscarConfigDB('ANTHROPIC_API_KEY');
  if (anthropicKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: maxTokens, system: systemPrompt, messages: mensagens }),
      });
      if (res.ok) return ((await res.json()).content?.[0]?.text as string)?.trim() ?? null;
    } catch {}
  }
  return null;
}

// ── Enviar via Z-API ──────────────────────────────────────────────────────────

async function enviarZAPI(phone: string, message: string): Promise<void> {
  await fetch(`https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Client-Token': ZAPI_CLIENT },
    body: JSON.stringify({ phone, message }),
  }).catch(e => console.error('[zapi] falha envio:', e));
}

// ── Processar mensagem ────────────────────────────────────────────────────────

async function processarMensagem(phone: string, nomeRemetente: string | null, texto: string): Promise<void> {
  const conversa = await buscarOuCriarConversa(phone);
  if (conversa.fase === 'concluido') return;

  const novaMsg: Mensagem = { role: 'user', content: texto, ts: new Date().toISOString() };
  const historico = [...(conversa.historico ?? []), novaMsg].slice(-20);
  const nomeCliente = conversa.nome_cliente ?? nomeRemetente ?? null;

  const [respostaIA, analiseRaw] = await Promise.all([
    chamarIA(buildSystemPrompt(conversa.fase, conversa.pedido_info, nomeCliente), historico.map(m => ({ role: m.role, content: m.content })), 350),
    chamarIA(buildFasePrompt(historico, texto, conversa.fase), [{ role: 'user', content: texto }], 200),
  ]);

  let novaFase = conversa.fase;
  let pedidoInfo = conversa.pedido_info ?? null;

  if (analiseRaw) {
    try {
      const analise = JSON.parse(analiseRaw.replace(/```json\n?|\n?```/g, '').trim());
      novaFase = analise.nova_fase ?? conversa.fase;
      if (analise.pedido_info?.produto) pedidoInfo = analise.pedido_info;
      if (analise.nome_cliente && !conversa.nome_cliente) {
        await salvarConversa(conversa.id, { nome_cliente: analise.nome_cliente });
      }
    } catch {}
  }

  const respostaFinal = respostaIA ?? 'Olá! Como posso te ajudar hoje? 🌸';
  const msgAssistente: Mensagem = { role: 'assistant', content: respostaFinal, ts: new Date().toISOString() };

  await Promise.all([
    salvarConversa(conversa.id, {
      historico: [...historico, msgAssistente].slice(-20),
      fase: novaFase,
      pedido_info: pedidoInfo,
    }),
    enviarZAPI(phone, respostaFinal),
    fetch(`${SUPABASE_URL}/functions/v1/captacao-leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_KEY}` },
      body: JSON.stringify({
        tipo: 'mensagem-recebida', task_id: crypto.randomUUID(), escopo: 'producao',
        urgencia: 'normal', workspace_id: WORKSPACE_ID,
        payload: { canal: 'whatsapp', canal_id: phone, telefone: phone, nome: nomeCliente, mensagem: texto },
      }),
    }).catch(() => {}),
  ]);

  console.log(`[webhook-whatsapp] ${phone} | ${conversa.fase}->${novaFase} | ${respostaFinal.slice(0, 60)}`);
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'GET') return new Response('webhook-whatsapp ok', { status: 200 });
  if (req.method !== 'POST') return new Response('ok', { status: 200 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return new Response('ok', { status: 200 }); }

  if (body['fromMe'] === true) return new Response('ok', { status: 200 });

  const texto: string = (body['text'] as Record<string, string> | null)?.['message']
    ?? (body['message'] as string | null)
    ?? '';

  if (!texto) return new Response('ok', { status: 200 });

  const phone         = String(body['phone'] ?? '');
  const nomeRemetente = (body['senderName'] ?? body['chatName'] ?? null) as string | null;

  if (!phone) return new Response('ok', { status: 200 });

  EdgeRuntime.waitUntil(processarMensagem(phone, nomeRemetente, texto));

  return new Response('ok', { status: 200 });
});
