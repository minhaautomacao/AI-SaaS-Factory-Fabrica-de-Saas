/**
 * webhook-meta
 *
 * Recebe webhooks da Meta (Instagram DMs, comentários, Facebook Messenger).
 * Para cada DM do Instagram: gera resposta inteligente via IA e responde na hora.
 *
 * Variáveis de ambiente:
 *   META_VERIFY_TOKEN, META_APP_SECRET, META_IG_ACCESS_TOKEN
 *   FACTORY_SECRET, SAAS_WORKSPACE_ID
 *   GROQ_API_KEY (ou ANTHROPIC_API_KEY como fallback)
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injetados)
 */

const VERIFY_TOKEN   = Deno.env.get('META_VERIFY_TOKEN') ?? '';
const APP_SECRET     = Deno.env.get('META_APP_SECRET') ?? '';
const FACTORY_SECRET = Deno.env.get('FACTORY_SECRET') ?? '';
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const WORKSPACE_ID   = Deno.env.get('SAAS_WORKSPACE_ID') ?? '';
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL') ?? '';
const IG_TOKEN       = Deno.env.get('META_IG_ACCESS_TOKEN') ?? '';
const WHATSAPP_NUM   = '5511912808282';

// ── SDR IA — prompt da atendente virtual ────────────────────────────────────

const SDR_SYSTEM = `Você é a Flor, atendente virtual da Enemeop Flores, floricultura em São Paulo.
Seu papel: responder mensagens de clientes no Instagram de forma calorosa, humana e eficiente.

SOBRE A ENEMEOP FLORES:
- Floricultura com entrega em São Paulo e Grande SP
- Especialidades: buquês, arranjos, coroas, flores do campo, orquídeas, suculentas
- Atende eventos: casamentos, formaturas, aniversários, corporativos
- Personalização de arranjos sob encomenda
- Contato WhatsApp para pedidos: wa.me/${WHATSAPP_NUM}

REGRAS:
- Responda em até 3 frases curtas (máx. 300 caracteres no total)
- Tom: amigável, feminino, profissional — como uma florista apaixonada pelo que faz
- Para dúvidas de preço ou pedidos: indique o WhatsApp para negociação
- Para perguntas sobre produtos: responda diretamente com entusiasmo
- Para agendamento de entrega: direcione ao WhatsApp
- Nunca invente preços específicos — diga que depende do arranjo e convide para o WhatsApp
- Use no máximo 1 emoji por resposta
- Português brasileiro natural, sem formalidade excessiva

Retorne APENAS o texto da resposta, sem aspas, sem prefixo.`;

// ── Chamada IA (Groq prioritário, Anthropic fallback) ───────────────────────

async function gerarResposta(mensagemCliente: string): Promise<string | null> {
  const groqKey = Deno.env.get('GROQ_API_KEY');
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 150,
          messages: [
            { role: 'system', content: SDR_SYSTEM },
            { role: 'user', content: mensagemCliente },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return (data.choices?.[0]?.message?.content as string)?.trim() ?? null;
      }
    } catch (e) {
      console.error('[webhook-meta] Groq falhou:', e);
    }
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (anthropicKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 150,
          system: SDR_SYSTEM,
          messages: [{ role: 'user', content: mensagemCliente }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return (data.content?.[0]?.text as string)?.trim() ?? null;
      }
    } catch (e) {
      console.error('[webhook-meta] Anthropic falhou:', e);
    }
  }

  return null;
}

// ── Resposta no Instagram DM ─────────────────────────────────────────────────

const MSG_FALLBACK = `Olá! Obrigada pelo contato com a Enemeop Flores 🌸 Para atendimento personalizado, nos chame no WhatsApp: wa.me/${WHATSAPP_NUM}`;

async function responderInstagramDM(recipientId: string, mensagemCliente: string): Promise<void> {
  if (!IG_TOKEN) {
    console.warn('[webhook-meta] META_IG_ACCESS_TOKEN não configurado');
    return;
  }

  const resposta = await gerarResposta(mensagemCliente) ?? MSG_FALLBACK;
  console.log(`[webhook-meta] resposta IA para ${recipientId}: ${resposta.slice(0, 80)}...`);

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${IG_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: resposta },
        messaging_type: 'RESPONSE',
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`[webhook-meta] erro ao responder DM: ${err}`);
    } else {
      console.log(`[webhook-meta] DM respondido para ${recipientId}`);
    }
  } catch (e) {
    console.error(`[webhook-meta] falha ao enviar DM: ${e}`);
  }
}

// ── Validação de assinatura HMAC-SHA256 ──────────────────────────────────────

async function validarAssinatura(body: string, signature: string | null): Promise<boolean> {
  if (!APP_SECRET || !signature) return true;
  try {
    const expected = signature.replace('sha256=', '');
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(APP_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
    const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
    const hex = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex === expected;
  } catch { return false; }
}

// ── Extração de eventos Meta ─────────────────────────────────────────────────

interface MetaEvento {
  canal: 'instagram' | 'facebook';
  tipo: 'dm' | 'comentario';
  canal_id: string;
  nome: string | null;
  mensagem: string;
  post_id?: string;
  timestamp: string;
}

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

// ── Envia lead ao orquestrador ───────────────────────────────────────────────

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
      payload: {
        canal: evento.canal,
        tipo_interacao: evento.tipo,
        canal_id: evento.canal_id,
        nome: evento.nome,
        mensagem: evento.mensagem,
        post_id: evento.post_id ?? null,
        utm_source: evento.canal,
        timestamp: evento.timestamp,
      },
    }),
  });
}

// ── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type' } });
  }

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode      = url.searchParams.get('hub.mode');
    const token     = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const rawBody = await req.text();
  const valido = await validarAssinatura(rawBody, req.headers.get('x-hub-signature-256'));
  if (!valido) return new Response('Forbidden', { status: 403 });

  let body: Record<string, unknown>;
  try { body = JSON.parse(rawBody); } catch { return new Response('ok', { status: 200 }); }

  const eventos = extrairEventos(body);
  console.log(`[webhook-meta] ${eventos.length} evento(s)`);

  await Promise.allSettled(
    eventos.map(async (ev) => {
      try {
        // DMs do Instagram: resposta inteligente via IA + captura do lead em paralelo
        if (ev.canal === 'instagram' && ev.tipo === 'dm') {
          await Promise.allSettled([
            responderInstagramDM(ev.canal_id, ev.mensagem),
            enviarAoOrquestrador(ev),
          ]);
        } else {
          await enviarAoOrquestrador(ev);
        }
        console.log(`[webhook-meta] processado | canal=${ev.canal} tipo=${ev.tipo}`);
      } catch (e) {
        console.error(`[webhook-meta] erro: ${e}`);
      }
    }),
  );

  return new Response('ok', { status: 200 });
});
