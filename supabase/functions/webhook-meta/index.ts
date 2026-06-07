/**
 * webhook-meta
 *
 * Recebe webhooks da Meta Graph API para:
 *   - Instagram: DMs e comentários em posts
 *   - Facebook: DMs (Messenger) e comentários em posts
 *
 * Variáveis de ambiente necessárias:
 *   META_VERIFY_TOKEN       → token de verificação definido no Meta Developer Console
 *   META_APP_SECRET         → App Secret do Meta Developer App (para validar assinatura)
 *   FACTORY_SECRET          → token do orquestrador
 *   SAAS_WORKSPACE_ID       → workspace_id da floricultura na Fábrica
 *   SUPABASE_URL            → auto-injetado
 *   SUPABASE_SERVICE_ROLE_KEY → auto-injetado
 *
 * URL pública desta função (configurar no Meta Developer Console):
 *   https://ebeapnydeiwuewxatuuw.supabase.co/functions/v1/webhook-meta
 */

const VERIFY_TOKEN   = Deno.env.get('META_VERIFY_TOKEN') ?? '';
const APP_SECRET     = Deno.env.get('META_APP_SECRET') ?? '';
const FACTORY_SECRET = Deno.env.get('FACTORY_SECRET') ?? '';
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const WORKSPACE_ID   = Deno.env.get('SAAS_WORKSPACE_ID') ?? '';
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL') ?? '';
const IG_TOKEN       = Deno.env.get('META_IG_ACCESS_TOKEN') ?? '';
const WHATSAPP_NUM   = '5511912808282'; // número de teste — substituir pelo oficial quando validado

// ── Validação de assinatura HMAC-SHA256 ──────────────────────────────────────

async function validarAssinatura(body: string, signature: string | null): Promise<boolean> {
  if (!APP_SECRET || !signature) return true; // sem secret configurado: permite (dev)
  try {
    const expected = signature.replace('sha256=', '');
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(APP_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
    const hex = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex === expected;
  } catch {
    return false;
  }
}

// ── Extração de eventos Meta ─────────────────────────────────────────────────

interface MetaEvento {
  canal: 'instagram' | 'facebook';
  tipo: 'dm' | 'comentario';
  canal_id: string;       // ID do usuário Meta
  nome: string | null;
  mensagem: string;
  post_id?: string;       // para comentários
  timestamp: string;
}

function extrairEventos(body: Record<string, unknown>): MetaEvento[] {
  const eventos: MetaEvento[] = [];
  const entries = body['entry'] as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(entries)) return eventos;

  for (const entry of entries) {
    // ── Instagram DMs ────────────────────────────────────────────────────────
    const messaging = entry['messaging'] as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(messaging)) {
      for (const msg of messaging) {
        const sender = msg['sender'] as Record<string, unknown> | undefined;
        const message = msg['message'] as Record<string, unknown> | undefined;
        if (!sender || !message) continue;

        const texto = (message['text'] as string) ?? '';
        if (!texto) continue;

        // Detecta canal pelo objeto de entrada (Instagram usa 'instagram' no objeto 'id')
        const canal: 'instagram' | 'facebook' = String(entry['id'] ?? '').startsWith('17') ? 'instagram' : 'facebook';

        eventos.push({
          canal,
          tipo: 'dm',
          canal_id: String(sender['id'] ?? ''),
          nome: null, // nome não vem no webhook; buscar via Graph API se necessário
          mensagem: texto,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // ── Facebook/Instagram Comentários ───────────────────────────────────────
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

        eventos.push({
          canal,
          tipo: 'comentario',
          canal_id: String(from?.['id'] ?? ''),
          nome: (from?.['name'] as string) ?? null,
          mensagem: msg,
          post_id: (val['post_id'] as string) ?? undefined,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  return eventos;
}

// ── Resposta automática no Instagram DM ─────────────────────────────────────

async function responderInstagramDM(recipientId: string, mensagem: string): Promise<void> {
  if (!IG_TOKEN) {
    console.warn('[webhook-meta] META_IG_ACCESS_TOKEN não configurado — resposta ignorada');
    return;
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${IG_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: mensagem },
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
    console.error(`[webhook-meta] falha ao responder DM: ${e}`);
  }
}

const MSG_BOAS_VINDAS = `Olá! 🌸 Obrigada pelo contato com a Enemeop Flores!\n\nPara um atendimento mais rápido e personalizado, nos chame no WhatsApp:\n👉 wa.me/${WHATSAPP_NUM}\n\nEm breve nossa equipe também responde por aqui. 💐`;

// ── Envia lead ao orquestrador ───────────────────────────────────────────────

async function enviarAoOrquestrador(evento: MetaEvento): Promise<void> {
  const authKey = FACTORY_SECRET || SERVICE_KEY;
  if (!authKey || !SUPABASE_URL) return;

  await fetch(`${SUPABASE_URL}/functions/v1/orquestrador`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authKey}`,
    },
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
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type' },
    });
  }

  // ── GET: verificação de webhook (Meta exige este handshake) ──────────────
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode      = url.searchParams.get('hub.mode');
    const token     = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
      console.log('[webhook-meta] verificação Meta aceita');
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // ── POST: recebe eventos ─────────────────────────────────────────────────
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const rawBody = await req.text();

  // Valida assinatura
  const signature = req.headers.get('x-hub-signature-256');
  const valido = await validarAssinatura(rawBody, signature);
  if (!valido) {
    console.error('[webhook-meta] assinatura inválida');
    return new Response('Forbidden', { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response('ok', { status: 200 }); // sempre 200 para Meta não reenviar
  }

  const objeto = body['object'] as string | undefined;
  console.log(`[webhook-meta] objeto=${objeto} entries=${JSON.stringify(body['entry']).slice(0, 100)}`);

  const eventos = extrairEventos(body);
  console.log(`[webhook-meta] ${eventos.length} evento(s) extraído(s)`);

  // Processa em paralelo, falha silenciosa por evento
  await Promise.allSettled(
    eventos.map(async (ev) => {
      try {
        // Resposta automática imediata no Instagram DM
        if (ev.canal === 'instagram' && ev.tipo === 'dm') {
          await responderInstagramDM(ev.canal_id, MSG_BOAS_VINDAS);
        }
        await enviarAoOrquestrador(ev);
        console.log(`[webhook-meta] lead enviado | canal=${ev.canal} tipo=${ev.tipo} canal_id=${ev.canal_id}`);
      } catch (e) {
        console.error(`[webhook-meta] erro ao processar evento: ${e}`);
      }
    }),
  );

  // Meta exige sempre 200 para não reenviar o evento
  return new Response('ok', { status: 200 });
});
