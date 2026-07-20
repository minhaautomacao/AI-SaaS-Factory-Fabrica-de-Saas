import 'dotenv/config'
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { iniciarWorkers } from './workers/orquestrador.js'

console.log('=== Fábrica de SaaS — Orquestrador Central ===')
console.log(`Ambiente: ${process.env.NODE_ENV ?? 'development'}`)
console.log(`Iniciando em: ${new Date().toLocaleString('pt-BR')}`)
console.log('')

if (process.env.WORKERS_ENABLED !== 'false') {
  iniciarWorkers()
} else {
  console.log('[Orquestrador] WORKERS_ENABLED=false — workers BullMQ desativados')
}

const PORT = process.env.PORT ?? 3000
createServer(async (req: IncomingMessage, res: ServerResponse) => {
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
})

console.log('')
console.log('[Orquestrador] Aguardando eventos nas filas BullMQ...')
