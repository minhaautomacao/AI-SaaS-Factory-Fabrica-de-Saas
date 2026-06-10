import 'dotenv/config'
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { randomUUID } from 'crypto'
import { iniciarWorkers } from './workers/orquestrador.js'
import { getSupabase } from './lib/supabase.js'
import { processarMensagemSDR } from './lib/sdr.js'

console.log('=== Fábrica de SaaS — Orquestrador Central ===')
console.log(`Ambiente: ${process.env.NODE_ENV ?? 'development'}`)
console.log(`Iniciando em: ${new Date().toLocaleString('pt-BR')}`)
console.log('')

iniciarWorkers()

function lerBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => { data += chunk })
    req.on('end', () => resolve(data))
  })
}

const PORT = process.env.PORT ?? 3000
createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === 'POST' && req.url === '/webhook/whatsapp') {
    try {
      const raw = await lerBody(req)
      const payload = JSON.parse(raw)

      // Z-API envia mensagens recebidas com payload.text ou payload.message
      const texto = payload.text?.message ?? payload.message ?? ''
      const numero = payload.phone ?? payload.from ?? ''

      if (texto && numero) {
        console.log(`[Webhook] Mensagem recebida de ${numero}: ${texto.substring(0, 80)}`)

        // Salva/atualiza lead no Supabase
        const { error } = await getSupabase()
          .from('leads')
          .upsert(
            { telefone: numero, canal: 'whatsapp', ultimo_contato: new Date().toISOString(), intencao: 'pesquisando' },
            { onConflict: 'telefone' }
          )
        if (error) console.error('[Webhook] Erro ao salvar lead:', error.message)

        // SDR com IA responde naturalmente
        await processarMensagemSDR(numero, texto)
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ received: true }))
    } catch (err) {
      console.error('[Webhook] Erro ao processar payload:', err)
      res.writeHead(500)
      res.end(JSON.stringify({ error: 'internal' }))
    }
    return
  }

  // Health check
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }))
}).listen(PORT, () => {
  console.log(`[Orquestrador] Servidor em http://0.0.0.0:${PORT}`)
})

console.log('')
console.log('[Orquestrador] Aguardando eventos nas filas BullMQ...')
