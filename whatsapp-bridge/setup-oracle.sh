#!/bin/bash
# Script de setup do WhatsApp Bridge na Oracle Cloud VM
# Executar como: bash setup-oracle.sh

set -e
source ~/.nvm/nvm.sh 2>/dev/null || true

echo "=== Setup WhatsApp Bridge — Enemeop Flores ==="

# Deps do sistema
which git &>/dev/null || sudo dnf install -y git

# Diretório da aplicação
APP_DIR=/home/opc/whatsapp-bridge
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Instalar dependências (arquivos já copiados via SCP ou clonar)
if [ ! -f package.json ]; then
  echo "ERRO: package.json não encontrado em $APP_DIR"
  echo "Copie os arquivos via SCP antes de rodar este script"
  exit 1
fi

npm install --omit=dev

# Configurar variáveis de ambiente
cat > /home/opc/whatsapp-bridge/.env << 'ENVEOF'
PORT=3000
UPSTASH_REDIS_URL_HTTP=https://legal-imp-145889.upstash.io
UPSTASH_REDIS_TOKEN=gQAAAAAAAjnhAAIgcDI0MWMxM2ZiMGZlYzE0NGFjOWI1ODhiZGQzNzViODVhZA
EVOLUTION_INSTANCE=floricultura
ORCHESTRATOR_WEBHOOK=https://enemeop-orchestrator.onrender.com/webhook/whatsapp
ENVEOF

echo "=== Iniciando com PM2 ==="
pm2 delete whatsapp-bridge 2>/dev/null || true
pm2 start index.js --name whatsapp-bridge --env-file .env
pm2 save
pm2 startup | tail -1

echo ""
echo "=== PRONTO ==="
echo "Bridge rodando na porta 3000"
echo "Verifique o QR code em: http://150.230.72.149:3000/qr"
echo "Status: curl http://150.230.72.149:3000/"
