import 'dotenv/config'
import { iniciarWorkers } from './workers/orquestrador.js'

console.log('=== Fábrica de SaaS — Orquestrador Central ===')
console.log(`Ambiente: ${process.env.NODE_ENV ?? 'development'}`)
console.log(`Iniciando em: ${new Date().toLocaleString('pt-BR')}`)
console.log('')

iniciarWorkers()

console.log('')
console.log('[Orquestrador] Aguardando eventos nas filas BullMQ...')
