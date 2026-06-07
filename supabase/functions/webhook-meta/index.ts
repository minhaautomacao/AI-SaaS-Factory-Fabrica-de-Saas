/**
 * webhook-meta — Agente de Vendas com Memória de Conversa
 *
 * Fluxo completo por fase:
 *   descoberta        → entende o que o cliente quer (explora catálogo)
 *   interesse         → produto definido, coleta detalhes (data, endereço)
 *   proposta          → apresenta valor e forma de pagamento
 *   aguardando_pag    → link de pagamento enviado
 *   concluido         → pagamento confirmado, pedido agendado
 *
 * Variáveis de ambiente:
 *   META_VERIFY_TOKEN, META_APP_SECRET, META_IG_ACCESS_TOKEN
 *   FACTORY_SECRET, SAAS_WORKSPACE_ID
 *   GROQ_API_KEY (ou ANTHROPIC_API_KEY como fallback)
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injetados)
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const VERIFY_TOKEN   = Deno.env.get('META_VERIFY_TOKEN') ?? '';
const APP_SECRET     = Deno.env.get('META_APP_SECRET') ?? '';
const FACTORY_SECRET = Deno.env.get('FACTORY_SECRET') ?? '';
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const WORKSPACE_ID   = Deno.env.get('SAAS_WORKSPACE_ID') ?? '';
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL') ?? '';
const IG_TOKEN       = Deno.env.get('META_IG_ACCESS_TOKEN') ?? '';
const WHATSAPP_NUM   = '5511912808282';

// ── Catálogo de produtos (extraído de enemeopflores.com.br) ──────────────────

const CATALOGO = `
CATEGORIAS DISPONÍVEIS:
- Buquês e Ramalhetes
- Arranjos Florais
- Buquês de Noiva
- Flores no Vaso
- Orquídeas
- Flores para Maternidade
- Condolências (coroas, arranjos)
- Kits Presentes
- Presentes e Decoração

PRODUTOS COM PREÇO:
- Ramalhete 3 Rosas + Chocolates: R$ 95
- Ramalhete Girassol e Alstroemêrias: R$ 70
- Buquê Rosas no Vaso de Vidro: R$ 295
- Buquê 12 Rosas Rosa Nacionais: R$ 370
- Buquê com Lírios Rosa: R$ 395
- Buquê 24 Rosas Vermelhas: R$ 560
- Buquê Tulipas: R$ 790
- Buquê Tulipas Brancas Noiva: R$ 720

INFORMAÇÕES OPERACIONAIS:
- Endereço: Rua Costa Aguiar 1184, Ipiranga, São Paulo
- Funcionamento: Seg–Sex 9h–19h | Sáb 9h–19h | Dom e Feriados 9h30–14h
- Entrega: até 3h após confirmação de pagamento
- Área: São Paulo e Grande SP
- Atuando desde 1997
- Personalização de arranjos sob encomenda disponível
`.trim();

// ── Supabase client ──────────────────────────────────────────────────────────

function getDb() {
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Mensagem { role: 'user' | 'assistant'; content: string; ts: string; }

interface Conversa {
  id: string;
  canal_id: string;
  canal: string;
  fase: string;
  historico: Mensagem[];
  pedido_info: Record<string, unknown> | null;
  lead_id: string | null;
}

// ── Gerenciamento de conversa ────────────────────────────────────────────────

async function buscarOuCriarConversa(canalId: string, canal: string): Promise<Conversa> {
  const db = getDb();
  const { data } = await db
    .from('conversas')
    .select('*')
    .eq('canal_id', canalId)
    .eq('canal', canal)
    .single();

  if (data) return data as Conversa;

  const { data: nova } = await db
    .from('conversas')
    .insert({ canal_id: canalId, canal, workspace_id: WORKSPACE_ID || null })
    .select('*')
    .single();

  return nova as Conversa;
}

async function salvarConversa(id: string, updates: Partial<Conversa>): Promise<void> {
  const db = getDb();
  await db.from('conversas').update({ ...updates, atualizado_em: new Date().toISOString() }).eq('id', id);
}

// ── Prompt do agente de vendas ───────────────────────────────────────────────

function buildSystemPrompt(fase: string, pedidoInfo: Record<string, unknown> | null): string {
  return `Você é a Flor, consultora de vendas da Enemeop Flores (São Paulo, desde 1997).
Você responde DMs no Instagram como uma florista experiente, calorosa e focada em fechar vendas.

CATÁLOGO ATUAL:
${CATALOGO}

FASE ATUAL DA CONVERSA: ${fase}
${pedidoInfo ? `PEDIDO EM ANDAMENTO: ${JSON.stringify(pedidoInfo)}` : ''}

REGRAS DE COMPORTAMENTO:
- Responda em até 3 frases curtas (máximo 280 caracteres)
- Tom: amigável, feminino, entusiasmado com flores — como quem realmente ama o que faz
- Não direcione ao WhatsApp antes de entender o que o cliente quer
- Explore as necessidades: ocasião, flores preferidas, orçamento, data de entrega
- Use perguntas abertas para descobrir mais (uma pergunta por vez)
- Quando souber o que o cliente quer: apresente opções com preços do catálogo
- Quando o cliente aceitar uma proposta: informe que vai gerar o link de pagamento PIX
- Use no máximo 1 emoji por mensagem
- Português brasileiro natural

COMPORTAMENTO POR FASE:
- descoberta: faça perguntas para entender a ocasião e preferências
- interesse: explore detalhes do produto escolhido (tamanho, cor, data)
- proposta: apresente o valor, confirme endereço e data de entrega
- aguardando_pagamento: aguarde confirmação, não repita proposta

RETORNE APENAS O TEXTO DA RESPOSTA — sem prefixo, sem aspas, sem JSON.`;
}

// ── Análise de fase ──────────────────────────────────────────────────────────

function buildFasePrompt(historico: Mensagem[], ultimaMensagem: string, faseAtual: string): string {
  return `Você analisa conversas de venda de floricultura.
Com base no histórico e última mensagem, determine:
1. A nova fase da conversa
2. Se há pedido definido, extraia os detalhes

Fases possíveis: descoberta | interesse | proposta | aguardando_pagamento | concluido | perdido

Histórico resumido: ${historico.slice(-4).map(m => `${m.role}: ${m.content}`).join(' | ')}
Última mensagem do cliente: "${ultimaMensagem}"
Fase atual: ${faseAtual}

Retorne APENAS JSON válido:
{
  "nova_fase": "string",
  "pedido_info": { "produto": "", "quantidade": 1, "data_entrega": "", "endereco": "", "valor": 0 } | null,
  "pronto_para_pagamento": false
}`;
}

// ── Chamada IA ───────────────────────────────────────────────────────────────

async function chamarIA(systemPrompt: string, mensagens: Array<{role: string; content: string}>, maxTokens = 120): Promise<string | null> {
  const groqKey = Deno.env.get('GROQ_API_KEY');
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: maxTokens,
          messages: [{ role: 'system', content: systemPrompt }, ...mensagens],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return (data.choices?.[0]?.message?.content as string)?.trim() ?? null;
      }
    } catch (e) { console.error('[ia] Groq falhou:', e); }
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (anthropicKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: mensagens,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return (data.content?.[0]?.text as string)?.trim() ?? null;
      }
    } catch (e) { console.error('[ia] Anthropic falhou:', e); }
  }

  return null;
}

// ── Gerar link de pagamento (PIX Mercado Pago — estrutura pronta) ─────────────

async function gerarLinkPagamento(pedidoInfo: Record<string, unknown>): Promise<string | null> {
  // TODO: integrar Mercado Pago quando credenciais estiverem disponíveis
  // Por ora retorna null → agente usa WhatsApp como fallback
  const mpToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
  if (!mpToken) return null;

  try {
    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mpToken}` },
      body: JSON.stringify({
        items: [{ title: String(pedidoInfo['produto'] ?? 'Arranjo Floral'), quantity: 1, unit_price: Number(pedidoInfo['valor'] ?? 0) }],
        payment_methods: { default_payment_method_id: 'pix' },
        statement_descriptor: 'Enemeop Flores',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.init_point as string;
    }
  } catch (e) { console.error('[pagamento] Mercado Pago falhou:', e); }
  return null;
}

// ── Processar DM com memória completa ────────────────────────────────────────

const MSG_FALLBACK = `Olá! Obrigada pelo contato com a Enemeop Flores 🌸 Me conta, qual é a ocasião? Vou ajudar a escolher o arranjo perfeito!`;

async function processarDM(canalId: string, canal: string, mensagemCliente: string): Promise<void> {
  if (!IG_TOKEN) return;

  // 1. Buscar ou criar conversa
  const conversa = await buscarOuCriarConversa(canalId, canal);

  // Não responder se já está em fase terminal
  if (conversa.fase === 'concluido') return;

  // 2. Adicionar mensagem do cliente ao histórico
  const novaMsg: Mensagem = { role: 'user', content: mensagemCliente, ts: new Date().toISOString() };
  const historico = [...(conversa.historico ?? []), novaMsg].slice(-20); // máx 20 mensagens

  // 3. Analisar fase (em paralelo com geração de resposta)
  const [respostaIA, analiseRaw] = await Promise.all([
    chamarIA(
      buildSystemPrompt(conversa.fase, conversa.pedido_info),
      historico.map(m => ({ role: m.role, content: m.content })),
      150,
    ),
    chamarIA(
      buildFasePrompt(historico, mensagemCliente, conversa.fase),
      [{ role: 'user', content: mensagemCliente }],
      200,
    ),
  ]);

  // 4. Processar análise de fase
  let novaFase = conversa.fase;
  let pedidoInfo = conversa.pedido_info ?? null;
  let prontoParaPagamento = false;

  if (analiseRaw) {
    try {
      const analise = JSON.parse(analiseRaw.replace(/```json\n?|\n?```/g, '').trim());
      novaFase = analise.nova_fase ?? conversa.fase;
      if (analise.pedido_info?.produto) pedidoInfo = analise.pedido_info;
      prontoParaPagamento = analise.pronto_para_pagamento ?? false;
    } catch { /* mantém fase atual */ }
  }

  // 5. Determinar resposta final
  let respostaFinal = respostaIA ?? MSG_FALLBACK;

  // 6. Se pronto para pagamento: tentar gerar link PIX
  if (prontoParaPagamento && pedidoInfo) {
    const linkPagamento = await gerarLinkPagamento(pedidoInfo);
    if (linkPagamento) {
      respostaFinal = `Perfeito! Seu arranjo: ${pedidoInfo['produto']}. Para finalizar, acesse o link de pagamento PIX: ${linkPagamento} ✅`;
      novaFase = 'aguardando_pagamento';
    } else {
      // Fallback: WhatsApp para fechamento
      respostaFinal = `Ótimo! Vamos finalizar seu pedido 🌸 Me chama no WhatsApp para confirmar os detalhes e gerar o PIX: wa.me/${WHATSAPP_NUM}`;
      novaFase = 'proposta';
    }
  }

  // 7. Adicionar resposta ao histórico
  const msgAssistente: Mensagem = { role: 'assistant', content: respostaFinal, ts: new Date().toISOString() };
  const historicoFinal = [...historico, msgAssistente].slice(-20);

  // 8. Salvar conversa atualizada
  await salvarConversa(conversa.id, {
    historico: historicoFinal,
    fase: novaFase,
    pedido_info: pedidoInfo ?? undefined,
  } as Partial<Conversa>);

  // 9. Enviar resposta no Instagram DM
  console.log(`[webhook-meta] ${canalId} | fase: ${conversa.fase}→${novaFase} | resposta: ${respostaFinal.slice(0, 60)}`);

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${IG_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: canalId },
        message: { text: respostaFinal },
        messaging_type: 'RESPONSE',
      }),
    });
    if (!res.ok) console.error(`[webhook-meta] erro DM: ${await res.text()}`);
  } catch (e) { console.error(`[webhook-meta] falha DM: ${e}`); }
}

// ── Validação de assinatura ──────────────────────────────────────────────────

async function validarAssinatura(body: string, signature: string | null): Promise<boolean> {
  if (!APP_SECRET || !signature) return true;
  try {
    const expected = signature.replace('sha256=', '');
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(APP_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
    const hex = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex === expected;
  } catch { return false; }
}

// ── Extração de eventos ──────────────────────────────────────────────────────

interface MetaEvento { canal: 'instagram' | 'facebook'; tipo: 'dm' | 'comentario'; canal_id: string; nome: string | null; mensagem: string; post_id?: string; timestamp: string; }

function extrairEventos(body: Record<string, unknown>): MetaEvento[] {
  const eventos: MetaEvento[] = [];
  const entries = body['entry'] as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(entries)) return eventos;

  for (const entry of entries) {
    const messaging = entry['messaging'] as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(messaging)) {
      for (const msg of messaging) {
        const sender  = msg['sender']  as Record<string, unknown> | undefined;
        const message = msg['message'] as Record<string, unknown> | undefined;
        if (!sender || !message) continue;
        const texto = (message['text'] as string) ?? '';
        if (!texto) continue;
        const canal: 'instagram' | 'facebook' = String(entry['id'] ?? '').startsWith('17') ? 'instagram' : 'facebook';
        eventos.push({ canal, tipo: 'dm', canal_id: String(sender['id'] ?? ''), nome: null, mensagem: texto, timestamp: new Date().toISOString() });
      }
    }

    const changes = entry['changes'] as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(changes)) {
      for (const change of changes) {
        const field = change['field'] as string | undefined;
        if (field !== 'feed' && field !== 'comments' && field !== 'instagram_comments') continue;
        const val = change['value'] as Record<string, unknown> | undefined;
        if (!val) continue;
        const msg = (val['message'] as string) ?? '';
        if (!msg) continue;
        const from = val['from'] as Record<string, unknown> | undefined;
        const canal: 'instagram' | 'facebook' = field === 'instagram_comments' ? 'instagram' : 'facebook';
        eventos.push({ canal, tipo: 'comentario', canal_id: String(from?.['id'] ?? ''), nome: (from?.['name'] as string) ?? null, mensagem: msg, post_id: (val['post_id'] as string) ?? undefined, timestamp: new Date().toISOString() });
      }
    }
  }
  return eventos;
}

// ── Envia ao orquestrador (captura lead em paralelo) ─────────────────────────

async function enviarAoOrquestrador(evento: MetaEvento): Promise<void> {
  const authKey = FACTORY_SECRET || SERVICE_KEY;
  if (!authKey || !SUPABASE_URL) return;
  await fetch(`${SUPABASE_URL}/functions/v1/orquestrador`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
    body: JSON.stringify({
      tipo: 'novo-lead',
      task_id: crypto.randomUUID(),
      escopo: 'producao',
      urgencia: 'normal',
      workspace_id: WORKSPACE_ID,
      payload: { canal: evento.canal, tipo_interacao: evento.tipo, canal_id: evento.canal_id, nome: evento.nome, mensagem: evento.mensagem, utm_source: evento.canal, timestamp: evento.timestamp },
    }),
  }).catch(() => {});
}

// ── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type' } });

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode'), token = url.searchParams.get('hub.verify_token'), challenge = url.searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) return new Response(challenge, { status: 200 });
    return new Response('Forbidden', { status: 403 });
  }

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const rawBody = await req.text();
  if (!await validarAssinatura(rawBody, req.headers.get('x-hub-signature-256'))) return new Response('Forbidden', { status: 403 });

  let body: Record<string, unknown>;
  try { body = JSON.parse(rawBody); } catch { return new Response('ok', { status: 200 }); }

  const eventos = extrairEventos(body);
  console.log(`[webhook-meta] ${eventos.length} evento(s)`);

  await Promise.allSettled(
    eventos.map(async (ev) => {
      if (ev.canal === 'instagram' && ev.tipo === 'dm') {
        await Promise.allSettled([
          processarDM(ev.canal_id, ev.canal, ev.mensagem),
          enviarAoOrquestrador(ev),
        ]);
      } else {
        await enviarAoOrquestrador(ev);
      }
    }),
  );

  return new Response('ok', { status: 200 });
});
