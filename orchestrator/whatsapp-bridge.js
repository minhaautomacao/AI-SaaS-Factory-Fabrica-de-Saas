const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const express = require('express');
const fs = require('fs');
const path = require('path');

const AUTH_DIR = path.join(__dirname, 'baileys-auth');
const PORT = 3333;
const ORCHESTRATOR_WEBHOOK = process.env.ORCHESTRATOR_WEBHOOK || 'https://gftnjvdvzgjkhwxnxnwl.supabase.co/functions/v1/webhook-meta';

let sock = null;
const app = express();
app.use(express.json());

// ── API compatível com Evolution API ──────────────────────────────

// Status da instância
app.get('/instance/connectionState/:instance', (req, res) => {
  res.json({ instance: { instanceName: req.params.instance, state: sock ? 'open' : 'close' } });
});

app.get('/instance/fetchInstances', (req, res) => {
  res.json({ name: 'floricultura', connectionStatus: sock ? 'open' : 'close', number: '5511912808282' });
});

// Enviar mensagem de texto
app.post('/message/sendText/:instance', async (req, res) => {
  try {
    const { number, text } = req.body;
    if (!sock) return res.status(503).json({ error: 'WhatsApp desconectado' });
    const jid = number.includes('@') ? number : `${number}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text });
    res.json({ key: { remoteJid: jid }, message: { conversation: text } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Enviar mídia/imagem
app.post('/message/sendMedia/:instance', async (req, res) => {
  try {
    const { number, mediatype, caption, media } = req.body;
    if (!sock) return res.status(503).json({ error: 'WhatsApp desconectado' });
    const jid = number.includes('@') ? number : `${number}@s.whatsapp.net`;
    const buf = Buffer.from(media, 'base64');
    await sock.sendMessage(jid, { image: buf, caption: caption || '' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 200, message: 'WhatsApp Bridge rodando!', connected: !!sock, number: '5511912808282' });
});

// ── Baileys ───────────────────────────────────────────────────────

async function forwardToOrchestrator(data) {
  try {
    const response = await fetch(ORCHESTRATOR_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    console.log('Encaminhado ao orquestrador:', response.status);
  } catch (e) {
    console.error('Erro ao encaminhar:', e.message);
  }
}

async function startWA() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: require('pino')({ level: 'silent' }),
    browser: ['Evolution API', 'Chrome', '10.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      const from = msg.key.remoteJid;
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      console.log(`📨 Mensagem de ${from}: ${text}`);
      await forwardToOrchestrator({
        event: 'messages.upsert',
        instance: 'floricultura',
        data: { key: msg.key, message: msg.message, pushName: msg.pushName }
      });
    }
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log(`Conexão fechada (${code}). Reconectando...`);
      sock = null;
      if (code !== DisconnectReason.loggedOut) setTimeout(startWA, 5000);
    }
    if (connection === 'open') {
      console.log('✅ WhatsApp conectado! Número: 5511912808282');
    }
  });
}

app.listen(PORT, () => {
  console.log(`🚀 WhatsApp Bridge rodando em http://localhost:${PORT}`);
  console.log(`📡 Expondo via túnel...`);
});

startWA().catch(console.error);
