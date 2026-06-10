import 'dotenv/config'
import { createServer } from 'http'
import { iniciarWorkers } from './workers/orquestrador.js'

console.log('=== Fábrica de SaaS — Orquestrador Central ===')
console.log(`Ambiente: ${process.env.NODE_ENV ?? 'development'}`)
console.log(`Iniciando em: ${new Date().toLocaleString('pt-BR')}`)
console.log('')

iniciarWorkers()

// Servidor HTTP mínimo para satisfazer o Render (Web Service requer porta aberta)
const PORT = process.env.PORT ?? 3000
createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }))
}).listen(PORT, () => {
  console.log(`[Orquestrador] Health check em http://0.0.0.0:${PORT}`)
})

console.log('')
console.log('[Orquestrador] Aguardando eventos nas filas BullMQ...')
