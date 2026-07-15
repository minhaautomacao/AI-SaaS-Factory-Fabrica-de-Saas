import 'dotenv/config'
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { iniciarWorkers } from './workers/orquestrador.js'
import { iniciarWorkerLogistica } from './workers/logistica.js'
import { getSupabase } from './lib/supabase.js'
import { processarMensagemSDR } from './lib/sdr.js'
import { extrairMensagemZApi } from './lib/whatsapp.js'

console.log('=== Fábrica de SaaS — Orquestrador Central ===')
console.log(`Ambiente: ${process.env.NODE_ENV ?? 'development'}`)
console.log(`Iniciando em: ${new Date().toLocaleString('pt-BR')}`)
console.log('')

if (process.env.WORKERS_ENABLED !== 'false') {
  iniciarWorkers()
  iniciarWorkerLogistica()
} else {
  console.log('[Orquestrador] WORKERS_ENABLED=false — workers BullMQ desativados (webhooks ativos)')
}

function lerBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => { data += chunk })
    req.on('end', () => resolve(data))
  })
}

const PORT = process.env.PORT ?? 3000
const META_EDGE_WEBHOOK_URL = process.env.META_EDGE_WEBHOOK_URL
  ?? 'https://gftnjvdvzgjkhwxnxnwl.supabase.co/functions/v1/webhook-meta'

async function encaminharParaWebhookMetaPrincipal(rawBody: string): Promise<void> {
  const resposta = await fetch(META_EDGE_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: rawBody,
  })

  if (!resposta.ok) {
    const detalhe = await resposta.text().catch(() => '')
    throw new Error(`webhook-meta ${resposta.status}: ${detalhe.slice(0, 200)}`)
  }
}

createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === 'POST' && req.url === '/webhook/whatsapp') {
    try {
      const raw = await lerBody(req)
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        res.writeHead(400)
        res.end(JSON.stringify({ error: 'invalid_json' }))
        return
      }

      // Z-API webhook: { type, phone, fromMe, text: { message }, senderName, ... }
      const msg = extrairMensagemZApi(parsed)
      if (msg) {
        const { numero, texto, nome } = msg
        console.log(`[Webhook/WhatsApp] Mensagem de ${nome ? nome + ' ' : ''}${numero}: ${texto.substring(0, 80)}`)

        const sb = getSupabase()
        const { data: leadExistente } = await sb
          .from('leads')
          .select('id')
          .eq('telefone', numero)
          .single()

        const { error } = await sb
          .from('leads')
          .upsert(
            {
              telefone: numero,
              canal: 'whatsapp',
              ultimo_contato: new Date().toISOString(),
              intencao: 'pesquisando',
              ...(nome ? { nome } : {}),
              ...(!leadExistente ? { mensagem_inicial: texto, status: 'novo' } : {}),
            },
            { onConflict: 'telefone' }
          )
        if (error) console.error('[Webhook/WhatsApp] Erro ao salvar lead:', error.message)

        processarMensagemSDR(numero, texto, nome).catch(e =>
          console.error('[Webhook/WhatsApp] Erro no SDR:', e)
        )
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ received: true }))
    } catch (err) {
      console.error('[Webhook/WhatsApp] Erro inesperado:', err)
      res.writeHead(500)
      res.end(JSON.stringify({ error: 'internal' }))
    }
    return
  }

  // ── Webhook Instagram / Meta ──────────────────────────────────────
  if (req.url?.startsWith('/webhook/instagram') || req.url?.startsWith('/webhook/meta')) {
    // Verificação do webhook (GET)
    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://localhost')
      const mode      = url.searchParams.get('hub.mode')
      const token     = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')
      const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN ?? 'enemeop_flores_2026'
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        res.writeHead(200)
        res.end(challenge ?? '')
      } else {
        res.writeHead(403)
        res.end('Forbidden')
      }
      return
    }

    // Recebe eventos Instagram/Facebook e encaminha para o webhook Meta principal.
    // O processamento antigo do orchestrator enviava o cliente para WhatsApp e interrompia o fluxo da Flora.
    if (req.method === 'POST') {
      try {
        const raw = await lerBody(req)
        await encaminharParaWebhookMetaPrincipal(raw)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ received: true, forwarded: true }))
      } catch (err) {
        console.error('[Webhook/Meta] Erro ao encaminhar para webhook principal:', err)
        res.writeHead(500)
        res.end(JSON.stringify({ error: 'forward_failed' }))
      }
      return
    }
  }

  // Health check leve — usado pelo keep-alive do GitHub Actions
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end('{"ok":true}')
    return
  }

  res.writeHead(404)
  res.end('')
}).listen(PORT, () => {
  console.log(`[Orquestrador] Servidor em http://0.0.0.0:${PORT}`)
  console.log(`[Orquestrador] Webhook WhatsApp (Z-API): POST /webhook/whatsapp`)
})

console.log('')
console.log('[Orquestrador] Aguardando eventos nas filas BullMQ...')
