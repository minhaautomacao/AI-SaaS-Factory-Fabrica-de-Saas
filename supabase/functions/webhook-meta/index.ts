/**
 * webhook-meta
 *
 * Recebe webhooks da Meta Graph API para:
 *   - Instagram: DMs e comentários em posts
 *   - Facebook: DMs (Messenger) e comentários em posts
 *
 * Fluxo para cada evento recebido:
 *   1. Valida assinatura HMAC
 *   2. Extrai eventos (DM ou comentário, Instagram ou Facebook)
 *   3. Envia ao orquestrador → captacao-leads (cria lead no Supabase)
 *   4. Classifica intenção com Groq
 *   5. Se intenção ≥ média: gera resposta com IA e responde NO MESMO CANAL
 *      - DM Instagram/Facebook: /me/messages via Graph API
 *      - Comentário: /{comment_id}/replies via Graph API
 *      - WhatsApp: via whatsapp-sdr (se telefone disponível)
 *
 * Variáveis de ambiente necessárias:
 *   META_VERIFY_TOKEN         → token de verificação do Meta Developer Console
 *   META_APP_SECRET           → App Secret para validar assinatura HMAC
 *   META_PAGE_ACCESS_TOKEN    → Page Access Token (long-lived) para enviar respostas
 *   GROQ_API_KEY              → para classificação e geração de resposta com IA
 *   FACTORY_SECRET            → token do orquestrador
 *   SAAS_WORKSPACE_ID         → workspace_id da floricultura
 *   SUPABASE_URL              → auto-injetado
 *   SUPABASE_SERVICE_ROLE_KEY → auto-injetado
 */

import { enviarDMMeta, responderComentarioMeta, buscarNomeUsuarioMeta } from '../_shared/meta.ts'

const VERIFY_TOKEN    = Deno.env.get('META_VERIFY_TOKEN') ?? ''
const APP_SECRET      = Deno.env.get('META_APP_SECRET') ?? ''
const PAGE_TOKEN      = Deno.env.get('META_PAGE_ACCESS_TOKEN') ?? ''
const GROQ_API_KEY    = Deno.env.get('GROQ_API_KEY') ?? ''
const FACTORY_SECRET  = Deno.env.get('FACTORY_SECRET') ?? ''
const SERVICE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const WORKSPACE_ID    = Deno.env.get('SAAS_WORKSPACE_ID') ?? ''
const SUPABASE_URL    = Deno.env.get('SUPABASE_URL') ?? ''

// IDs próprios do negócio — ignora mensagens enviadas pela página para si mesma
const NOSSA_PAGINA_ID = Deno.env.get('META_PAGE_ID') ?? ''
const NOSSO_IG_ID     = Deno.env.get('META_INSTAGRAM_ID') ?? '17841402064363907'

// ── Validação de assinatura HMAC-SHA256 ──────────────────────────────────────

async function validarAssinatura(body: string, signature: string | null): Promise<boolean> {
  if (!APP_SECRET || !signature) return true
  try {
    const expected = signature.replace('sha256=', '')
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(APP_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
    const hex = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('')
    return hex === expected
  } catch {
    return false
  }
}

// ── Tipos ────────────────────────────────────────────────────────────────────

interface MetaEvento {
  canal: 'instagram' | 'facebook'
  tipo: 'dm' | 'comentario'
  canal_id: string
  nome: string | null
  mensagem: string
  comment_id?: string
  post_id?: string
  timestamp: string
  // ID de quem enviou — para evitar loop (não responder a nós mesmos)
  sender_id: string
}

// ── Extração de eventos ──────────────────────────────────────────────────────

function extrairEventos(body: Record<string, unknown>): MetaEvento[] {
  const eventos: MetaEvento[] = []
  const entries = body['entry'] as Array<Record<string, unknown>> | undefined
  if (!Array.isArray(entries)) return eventos

  for (const entry of entries) {
    const entryId = String(entry['id'] ?? '')

    // ── DMs (Instagram Messaging / Facebook Messenger) ───────────────────────
    const messaging = entry['messaging'] as Array<Record<string, unknown>> | undefined
    if (Array.isArray(messaging)) {
      for (const msg of messaging) {
        const sender    = msg['sender'] as Record<string, unknown> | undefined
        const recipient = msg['recipient'] as Record<string, unknown> | undefined
        const message   = msg['message'] as Record<string, unknown> | undefined
        if (!sender || !message) continue

        const senderId = String(sender['id'] ?? '')
        const texto    = (message['text'] as string) ?? ''
        if (!texto) continue

        // Ignora eco das próprias mensagens enviadas pela página
        if (senderId === NOSSA_PAGINA_ID || senderId === NOSSO_IG_ID) continue
        if (String(recipient?.['id'] ?? '') === senderId) continue

        const canal: 'instagram' | 'facebook' = entryId === NOSSO_IG_ID ? 'instagram' : 'facebook'

        eventos.push({
          canal,
          tipo: 'dm',
          canal_id: senderId,
          sender_id: senderId,
          nome: null,
          mensagem: texto,
          timestamp: new Date().toISOString(),
        })
      }
    }

    // ── Comentários (feed / comments / instagram_comments) ───────────────────
    const changes = entry['changes'] as Array<Record<string, unknown>> | undefined
    if (Array.isArray(changes)) {
      for (const change of changes) {
        const field = change['field'] as string | undefined
        if (field !== 'feed' && field !== 'comments' && field !== 'instagram_comments') continue

        const val  = change['value'] as Record<string, unknown> | undefined
        if (!val) continue

        const msg  = (val['message'] as string) ?? ''
        if (!msg) continue

        const from      = val['from'] as Record<string, unknown> | undefined
        const senderId  = String(from?.['id'] ?? '')
        const commentId = String(val['id'] ?? val['comment_id'] ?? '')
        const canal: 'instagram' | 'facebook' = field === 'instagram_comments' ? 'instagram' : 'facebook'

        // Ignora comentários feitos pela própria página
        if (senderId === NOSSA_PAGINA_ID || senderId === NOSSO_IG_ID) continue

        eventos.push({
          canal,
          tipo: 'comentario',
          canal_id: senderId,
          sender_id: senderId,
          nome: (from?.['name'] as string) ?? null,
          mensagem: msg,
          comment_id: commentId || undefined,
          post_id: (val['post_id'] as string) ?? undefined,
          timestamp: new Date().toISOString(),
        })
      }
    }
  }

  return eventos
}

// ── Classificação + geração de resposta com Groq ────────────────────────────

const SYSTEM_RESPOSTA = `Você é o atendente virtual da Enemeop Flores, floricultura especializada em:
casamentos, eventos corporativos, batizados, aniversários, presentes e entregas same-day.

Analise a mensagem recebida e retorne JSON:
{
  "intencao": "urgente" | "alta" | "media" | "baixa" | "nenhuma",
  "segmento": "casamento" | "corporativo" | "batizado" | "aniversario" | "funebres" | "presente" | "decoracao" | "outro",
  "deve_responder": true | false,
  "resposta": "mensagem de resposta natural (máx 300 chars, tom caloroso, em português)"
}

Regras para resposta:
- deve_responder = true apenas se a pessoa está pedindo informação, fazendo pergunta ou demonstrando intenção de compra
- A resposta deve ser natural, não parecer robô
- Não invente preços — se perguntarem, diga que vai verificar e peça para chamar no WhatsApp
- Sempre inclua CTA suave para WhatsApp: "Me chama no WhatsApp para a gente ver o melhor arranjo pra você 🌸"
- Se for reclamação: "Sinto muito pelo ocorrido! Por favor me chama no WhatsApp para resolver"
- Se for elogio: agradeça com entusiasmo e convide para voltar
- intencao = "nenhuma" e deve_responder = false para spam, bots, conteúdo irrelevante`

async function classificarEResponder(evento: MetaEvento): Promise<{
  intencao: string
  segmento: string
  deve_responder: boolean
  resposta: string
}> {
  if (!GROQ_API_KEY) {
    return {
      intencao: 'media',
      segmento: 'outro',
      deve_responder: true,
      resposta: 'Oi! Obrigada pelo contato com a Enemeop Flores 🌸 Me chama no WhatsApp para a gente te ajudar melhor!',
    }
  }

  const contexto = `Canal: ${evento.canal} (${evento.tipo})
Nome: ${evento.nome ?? 'não identificado'}
Mensagem: ${evento.mensagem}`

  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 512,
        messages: [
          { role: 'system', content: SYSTEM_RESPOSTA },
          { role: 'user', content: contexto },
        ],
      }),
    })

    if (!resp.ok) throw new Error(`Groq ${resp.status}`)
    const data = await resp.json()
    const texto = (data.choices[0].message.content as string).replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(texto)
  } catch {
    return {
      intencao: 'media',
      segmento: 'outro',
      deve_responder: true,
      resposta: 'Oi! Obrigada pelo contato com a Enemeop Flores 🌸 Me chama no WhatsApp para te ajudarmos melhor!',
    }
  }
}

// ── Envia ao orquestrador ────────────────────────────────────────────────────

async function enviarAoOrquestrador(
  evento: MetaEvento,
  intencao: string,
  segmento: string,
): Promise<void> {
  const authKey = FACTORY_SECRET || SERVICE_KEY
  if (!authKey || !SUPABASE_URL) return

  await fetch(`${SUPABASE_URL}/functions/v1/orquestrador`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
    body: JSON.stringify({
      tipo: 'novo-lead',
      task_id: crypto.randomUUID(),
      escopo: 'producao',
      urgencia: intencao === 'urgente' ? 'critical' : 'normal',
      workspace_id: WORKSPACE_ID,
      payload: {
        canal: evento.canal,
        tipo_interacao: evento.tipo,
        canal_id: evento.canal_id,
        nome: evento.nome,
        mensagem: evento.mensagem,
        comment_id: evento.comment_id ?? null,
        post_id: evento.post_id ?? null,
        utm_source: evento.canal,
        intencao,
        segmento,
        timestamp: evento.timestamp,
      },
    }),
  }).catch(() => {})
}

// ── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type' },
    })
  }

  // GET: verificação de webhook (handshake Meta)
  if (req.method === 'GET') {
    const url       = new URL(req.url)
    const mode      = url.searchParams.get('hub.mode')
    const token     = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
      console.log('[webhook-meta] verificação Meta aceita')
      return new Response(challenge, { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
  }

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const rawBody = await req.text()

  const signature = req.headers.get('x-hub-signature-256')
  const valido = await validarAssinatura(rawBody, signature)
  if (!valido) {
    console.error('[webhook-meta] assinatura inválida')
    return new Response('Forbidden', { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = JSON.parse(rawBody) } catch {
    return new Response('ok', { status: 200 })
  }

  const objeto = body['object'] as string | undefined
  console.log(`[webhook-meta] objeto=${objeto}`)

  const eventos = extrairEventos(body)
  console.log(`[webhook-meta] ${eventos.length} evento(s)`)

  // Processa cada evento: classifica + responde + envia ao orquestrador
  await Promise.allSettled(eventos.map(async (ev) => {
    try {
      // 1. Busca nome se não veio no payload
      if (!ev.nome && PAGE_TOKEN) {
        ev.nome = await buscarNomeUsuarioMeta(PAGE_TOKEN, ev.canal_id).catch(() => null)
      }

      // 2. Classifica intenção e gera resposta
      const classificacao = await classificarEResponder(ev)
      console.log(`[webhook-meta] canal=${ev.canal} tipo=${ev.tipo} intencao=${classificacao.intencao} deve_responder=${classificacao.deve_responder}`)

      // 3. Responde no canal de origem (se deve responder e temos token)
      if (classificacao.deve_responder && classificacao.resposta && PAGE_TOKEN) {
        let resultado
        if (ev.tipo === 'dm') {
          resultado = await enviarDMMeta(PAGE_TOKEN, ev.canal_id, classificacao.resposta, ev.canal)
        } else if (ev.tipo === 'comentario' && ev.comment_id) {
          resultado = await responderComentarioMeta(PAGE_TOKEN, ev.comment_id, classificacao.resposta, ev.canal)
        }
        if (resultado) {
          console.log(`[webhook-meta] resposta enviada | enviado=${resultado.enviado} canal=${resultado.canal} ${resultado.erro ?? ''}`)
        }
      } else if (!PAGE_TOKEN) {
        console.warn('[webhook-meta] META_PAGE_ACCESS_TOKEN não configurado — resposta automática desativada')
      }

      // 4. Envia ao orquestrador para criar o lead no Supabase
      await enviarAoOrquestrador(ev, classificacao.intencao, classificacao.segmento)
    } catch (e) {
      console.error(`[webhook-meta] erro no evento: ${e}`)
    }
  }))

  // Meta exige sempre 200
  return new Response('ok', { status: 200 })
})
