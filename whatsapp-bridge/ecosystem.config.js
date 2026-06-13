module.exports = {
  apps: [{
    name: 'whatsapp-bridge',
    script: 'index.js',
    restart_delay: 5000,
    max_restarts: 20,
    env: {
      NODE_ENV: 'production',
      PORT: '3000',
      UPSTASH_REDIS_URL_HTTP: 'https://legal-imp-145889.upstash.io',
      UPSTASH_REDIS_TOKEN: 'gQAAAAAAAjnhAAIgcDI0MWMxM2ZiMGZlYzE0NGFjOWI1ODhiZGQzNzViODVhZA',
      EVOLUTION_INSTANCE: 'floricultura',
      ORCHESTRATOR_WEBHOOK: 'https://enemeop-orchestrator.onrender.com/webhook/whatsapp',
    },
  }],
}
