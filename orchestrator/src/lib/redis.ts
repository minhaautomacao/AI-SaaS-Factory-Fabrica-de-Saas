import { Redis } from 'ioredis'

function criarConexaoRedis() {
  const url = process.env.UPSTASH_REDIS_URL
  const token = process.env.UPSTASH_REDIS_TOKEN

  if (!url || !token) {
    throw new Error('UPSTASH_REDIS_URL e UPSTASH_REDIS_TOKEN são obrigatórios')
  }

  // Upstash Redis usa TLS — configuração padrão para REST+TLS
  const client = new Redis(url, {
    password: token,
    tls: { rejectUnauthorized: false },
    maxRetriesPerRequest: null,   // obrigatório para BullMQ
    enableReadyCheck: false,
  })

  client.on('error', (err) => {
    console.error('[Redis] Erro de conexão:', err.message)
  })

  client.on('connect', () => {
    console.log('[Redis] Conectado ao Upstash')
  })

  return client
}

// Singleton — reutiliza a mesma conexão
let _redis: Redis | null = null

export function getRedis(): Redis {
  if (!_redis) {
    _redis = criarConexaoRedis()
  }
  return _redis
}
