/**
 * webhook-whatsapp — Recebe mensagens do Z-API e responde com IA + fotos dos produtos
 *
 * Quando a IA sugere ou o cliente confirma um produto, a foto real é enviada via Z-API.
 * Fotos e códigos ficam na tabela catalogo_produtos.
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

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Mensagem { role: 'user' | 'assistant'; content: string; ts: string; }
interface Conversa { id: string; canal_id: string; canal: string; fase: string; historico: Mensagem[]; pedido_info: Record<string, unknown> | null; lead_id: string | null; nome_cliente: string | null; }
interface Produto { codigo: string; nome: string; preco: number; foto_url: string; }

// ── Catálogo (codigos para a IA usar) ─────────────────────────────────────────

// Catálogo compacto com códigos — a IA usa esses códigos no JSON de resposta
const CATALOGO_IA = `
ENEMEOP FLORES — Ipiranga, SP, desde 1997. Seg–Sáb 9h–19h | Dom/Feriados 10h–14h.
Entrega até 3h após pagamento. São Paulo e Grande SP.

PRODUTOS (use o CÓDIGO exato no campo codigos_produtos):
RAMALHETES:
  M28 Mini Ramalhete R$55 | 051 Ramalhete Girassol+Alstroemêrias R$70 | M30 Ramalhete Rosas R$70
  094 3 Rosas+Chocolates R$95 | M29 Mini Ramalhete+Ferrero R$100 | 057 Rosas Brancas R$105
  M31 3 Rosas Nacionais Rosa R$105 | 081 Mix Rosas+Ferrero R$150

BUQUÊS:
  032 Buquê Rosas Vermelhas R$140 | M35 6 Rosas Vermelhas R$185 | M44 6 Rosas Nacionais R$185
  M59 Buquê Rosas+Coração R$205 | M43 Rosas Nacionais Vermelhas R$245 | M55 Rosas Brancas R$280
  033 12 Rosas Vermelhas R$280 | M36 Rosas+Ferrero R$290 | M40 Mix Alstroemêrias R$295
  054 Mix Girassóis+Flores R$295 | M50 Luto Rosas Brancas R$390 | 093 Lírios Rosa R$395
  061 Luxuoso Alstroemêrias R$395 | 045 12 Rosas Rosa+Alstroemêrias R$370
  M38 12 Rosas Pink R$370 | M41 12 Rosas Nacionais Rosa R$370 | M48 Rosas e Juncos R$420
  M60 Mix Flores+Vinho R$425 | M42 Mix Flores R$495 | 034 24 Rosas Vermelhas R$560
  062 Noiva Rosas Pink R$565 | 039 Mix Flores Nobre R$590 | 052 12 Girassóis Premium R$435
  056 100 Rosas Vermelhas R$1490

ARRANJOS:
  M01 Arranjo Vaso Vidro R$70 | M09 Girassol Solitário R$75 | 002 2 Rosas+Junco R$105
  010 Girassol+Ferrero R$120 | 011 Girassol no Vaso R$135 | 003 Coração 2 Rosas+Ferrero R$140
  M08 Mix Flores do Campo R$145 | M20 Arranjo Laranja R$145 | 027 Alstroemêrias no Vaso R$155
  M17 Luto Hortênsias R$155 | M07 Arranjo de Rosas R$160 | 006 4 Rosas Brancas+Alstroemêrias R$225
  012 Orquídeas Brancas Frente Única R$225 | 013 Orquídeas Pink Vaso R$225
  014 Orquídeas Brancas+Ruscus R$225 | M05 Rosas Pink no Vaso R$225
  M18 Rosas Vermelhas no Vidro R$425 | 004 Buquê Rosas no Vaso R$295

ORQUÍDEAS:
  M90 Phalaenópsis Mescla Pequena R$145 | M89 Phalaenópsis Mescla no Vaso R$195
  083 Orquídea Branca 1 haste R$170 | M91 Phalaenópsis Pink 1 haste R$225
  M87 Mini Orquídea no Vaso R$215 | M92 Phalaenópsis Branca 1 haste R$290
  084 Phalaenópsis Branca 2 hastes R$290 | M85 Phalaenópsis Pink R$300
  M88 Phalaenópsis Pink no Vaso R$315 | M86 Phalaenópsis Cascata Branca R$390

KITS: ferrero Ferrero Rocher 100g R$45 | 082 Cesta Queijos+Vinho R$890

FORMAS DE PAGAMENTO: Cartão, PIX, online.
PERSONALIZAÇÃO: encomendas sob medida disponíveis.
`.trim();

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

// ── Busca fotos no banco ──────────────────────────────────────────────────────

async function buscarProdutos(codigos: string[]): Promise<Produto[]> {
  if (!codigos || codigos.length === 0) return [];
  const { data } = await getDb()
    .from('catalogo_produtos')
    .select('codigo, nome, preco, foto_url')
    .in('codigo', codigos)
    .eq('ativo', true)
    .not('foto_url', 'is', null);
  return (data ?? []) as Produto[];
}

// ── IA ────────────────────────────────────────────────────────────────────────

function buildSystemPrompt(fase: string, pedidoInfo: Record<string, unknown> | null, nomeCliente: string | null): string {
  return `Você é Flor, consultora virtual da Enemeop Flores (São Paulo, desde 1997).
Atendimento 100% por WhatsApp — nunca mencione ligação telefônica.
${nomeCliente ? `Cliente: ${nomeCliente}.` : ''}

${CATALOGO_IA}

FASE ATUAL: ${fase}
${pedidoInfo ? `PEDIDO EM ANDAMENTO: ${JSON.stringify(pedidoInfo)}` : ''}

COMPORTAMENTO:
- Natural, humana, acolhedora. Máx 1 emoji por mensagem. Nunca parece robô.
- Faça UMA pergunta por vez. Descubra: ocasião → perfil → produto → data → endereço → pagamento.
- Ao sugerir produtos: apresente até 3 opções com nome e preço, explique as diferenças.
- HANDOFF: se cliente pedir atendente humano, diga "em breve um de nossos atendentes continuará o atendimento por aqui".

FOTOS DE PRODUTOS — MUITO IMPORTANTE:
Quando você inclui um código em "codigos_produtos", o sistema envia a foto automaticamente para o cliente pelo WhatsApp.
NUNCA diga que não pode enviar fotos. SEMPRE inclua os códigos quando mencionar produtos — a foto aparece sozinha.

FORMATO DE RESPOSTA — retorne SEMPRE JSON válido:
{
  "mensagem": "texto para o cliente (máx 300 chars)",
  "codigos_produtos": ["codigo1", "codigo2"],
  "fase": "descoberta|interesse|proposta|aguardando_pagamento|concluido|perdido"
}

REGRA OBRIGATÓRIA para codigos_produtos:
- Se está SUGERINDO produtos: coloque os códigos de TODOS os produtos mencionados (máx 3) — a foto será enviada automaticamente
- Se cliente CONFIRMOU um produto específico: coloque apenas o código desse produto — a foto será enviada automaticamente
- Se não está mencionando produto nenhum: array vazio []
Use EXATAMENTE os códigos do catálogo (ex: "033", "M07", "032", "051", "M28").
Exemplo: ao sugerir "Mini Ramalhete" e "Ramalhete Girassol", inclua ["M28", "051"].`;
}

async function chamarIA(systemPrompt: string, mensagens: Array<{role: string; content: string}>, maxTokens = 400): Promise<string | null> {
  const groqKey = Deno.env.get('GROQ_API_KEY') || await buscarConfigDB('GROQ_API_KEY');
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: systemPrompt }, ...mensagens],
        }),
      });
      if (res.ok) return ((await res.json()).choices?.[0]?.message?.content as string)?.trim() ?? null;
      console.error('[ia] Groq status:', (await res.text()).slice(0, 200));
    } catch (e) { console.error('[ia] Groq erro:', e); }
  }
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY') || await buscarConfigDB('ANTHROPIC_API_KEY');
  if (anthropicKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001', max_tokens: maxTokens,
          system: systemPrompt + '\nRetorne APENAS o JSON, sem texto adicional.',
          messages: mensagens,
        }),
      });
      if (res.ok) return ((await res.json()).content?.[0]?.text as string)?.trim() ?? null;
    } catch {}
  }
  return null;
}

// ── Normalização de telefone ──────────────────────────────────────────────────

function normalizarTelefone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // Já tem código do país 55 e tem 12-13 dígitos → correto
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  // Número brasileiro sem código do país (10-11 dígitos) → adiciona 55
  if (digits.length >= 10 && digits.length <= 11) return `55${digits}`;
  return digits;
}

// ── Envio Z-API ───────────────────────────────────────────────────────────────

async function enviarTexto(phone: string, message: string): Promise<void> {
  await fetch(`https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Client-Token': ZAPI_CLIENT },
    body: JSON.stringify({ phone, message }),
  }).catch(e => console.error('[zapi] falha texto:', e));
}

async function enviarImagem(phone: string, imageUrl: string, caption: string): Promise<void> {
  await fetch(`https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Client-Token': ZAPI_CLIENT },
    body: JSON.stringify({ phone, image: imageUrl, caption }),
  }).catch(e => console.error('[zapi] falha imagem:', e));
}

// ── Processar mensagem ────────────────────────────────────────────────────────

async function processarMensagem(phone: string, nomeRemetente: string | null, texto: string): Promise<void> {
  const conversa = await buscarOuCriarConversa(phone);
  if (conversa.fase === 'concluido') return;

  const novaMsg: Mensagem = { role: 'user', content: texto, ts: new Date().toISOString() };
  const historico = [...(conversa.historico ?? []), novaMsg].slice(-20);
  const nomeCliente = conversa.nome_cliente ?? nomeRemetente ?? null;

  const respostaRaw = await chamarIA(
    buildSystemPrompt(conversa.fase, conversa.pedido_info, nomeCliente),
    historico.map(m => ({ role: m.role, content: m.content })),
    400,
  );

  let mensagem = 'Olá! Como posso te ajudar hoje? 🌸';
  let codigosProdutos: string[] = [];
  let novaFase = conversa.fase;

  if (respostaRaw) {
    try {
      const parsed = JSON.parse(respostaRaw.replace(/```json\n?|\n?```/g, '').trim());
      mensagem       = parsed.mensagem ?? mensagem;
      codigosProdutos = Array.isArray(parsed.codigos_produtos) ? parsed.codigos_produtos.slice(0, 3) : [];
      novaFase       = parsed.fase ?? conversa.fase;
    } catch {
      // se falhou o parse, usa o texto cru como mensagem
      mensagem = respostaRaw.slice(0, 400);
    }
  }

  const msgAssistente: Mensagem = { role: 'assistant', content: mensagem, ts: new Date().toISOString() };

  // Busca fotos dos produtos antes de enviar
  const produtos = await buscarProdutos(codigosProdutos);

  // Envia tudo em sequência para manter ordem no WhatsApp
  await enviarTexto(phone, mensagem);
  for (const produto of produtos) {
    if (produto.foto_url) {
      const caption = `${produto.nome} — R$ ${Number(produto.preco).toFixed(2).replace('.', ',')}`;
      await enviarImagem(phone, produto.foto_url, caption);
    }
  }

  await Promise.all([
    salvarConversa(conversa.id, {
      historico: [...historico, msgAssistente].slice(-20),
      fase: novaFase,
      nome_cliente: nomeCliente ?? undefined,
    }),
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

  console.log(`[webhook-whatsapp] ${phone} | ${conversa.fase}->${novaFase} | fotos: ${produtos.length} | ${mensagem.slice(0, 60)}`);
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

  const phoneRaw      = String(body['phone'] ?? '');
  const nomeRemetente = (body['senderName'] ?? body['chatName'] ?? null) as string | null;

  if (!phoneRaw) return new Response('ok', { status: 200 });

  const phone = normalizarTelefone(phoneRaw);
  console.log(`[webhook-whatsapp] recebido de ${phoneRaw} → normalizado: ${phone}`);

  EdgeRuntime.waitUntil(processarMensagem(phone, nomeRemetente, texto));

  return new Response('ok', { status: 200 });
});
