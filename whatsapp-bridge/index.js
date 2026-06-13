const { default: makeWASocket, DisconnectReason, BufferJSON, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.UPSTASH_REDIS_URL_HTTP;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_TOKEN;
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'floricultura';
const ORCHESTRATOR_WEBHOOK = process.env.ORCHESTRATOR_WEBHOOK || '';
const AUTH_DIR = path.resolve(__dirname, 'auth_state');

const USE_REDIS = !!(REDIS_URL && REDIS_TOKEN);
if (!USE_REDIS) console.warn('[Bridge] UPSTASH não configurado — usando auth local em ./auth_state');

let sock = null;
let currentQR = null;     // base64 PNG do QR code atual (se não conectado)
let connected = false;

const app = express();
app.use(express.json());

// ── Redis ──────────────────────────────────────────────────────────

async function redisGet(key) {
  const r = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  const data = await r.json();
  return data.result;
}

async function redisSet(key, value) {
  await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
}

// ── Auth state — Redis (preferencial) ou arquivo local ────────────

async function getAuthState() {
  if (USE_REDIS) return useRedisAuthState();

  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
  return useMultiFileAuthState(AUTH_DIR);
}

async function useRedisAuthState() {
  const credsRaw = await redisGet(`baileys:${INSTANCE}:creds`).catch(() => null);

  const initialCreds = credsRaw
    ? JSON.parse(credsRaw, BufferJSON.reviver)
    : null;

  const state = {
    creds: initialCreds ?? { noiseKey: null }, // se null, Baileys vai gerar novo par e mostrar QR
    keys: {
      get: async (type, ids) => {
        const data = {};
        for (const id of ids) {
          const raw = await redisGet(`baileys:${INSTANCE}:key:${type}:${id}`).catch(() => null);
          data[id] = raw ? JSON.parse(raw, BufferJSON.reviver) : undefined;
        }
        return data;
      },
      set: async (data) => {
        for (const [type, ids] of Object.entries(data)) {
          for (const [id, value] of Object.entries(ids ?? {})) {
            if (value) await redisSet(
              `baileys:${INSTANCE}:key:${type}:${id}`,
              JSON.stringify(value, BufferJSON.replacer)
            );
          }
        }
      },
    },
  };

  const saveCreds = async () => {
    await redisSet(`baileys:${INSTANCE}:creds`, JSON.stringify(state.creds, BufferJSON.replacer));
  };

  return { state, saveCreds };
}

// ── HTTP API (compatível com Evolution API) ────────────────────────

app.get('/', (req, res) => {
  res.json({
    status: 200,
    message: 'WhatsApp Bridge — Enemeop Flores',
    connected,
    instance: INSTANCE,
    qr_available: !connected && !!currentQR,
  });
});

// QR code em HTML — abre no browser para escanear
app.get('/qr', (req, res) => {
  if (connected) return res.send('<h2>✅ WhatsApp já está conectado!</h2>');
  if (!currentQR) return res.send('<h2>⏳ Aguardando QR code... recarregue em 5s</h2><script>setTimeout(()=>location.reload(),5000)</script>');
  res.send(`
    <html><body style="font-family:sans-serif;text-align:center;padding:40px">
      <h2>Escaneie o QR code com o WhatsApp</h2>
      <p>Abra WhatsApp → Configurações → Dispositivos vinculados → Vincular dispositivo</p>
      <img src="${currentQR}" style="width:300px;height:300px"/>
      <p><small>Atualizando em 30s...</small></p>
      <script>setTimeout(()=>location.reload(),30000)</script>
    </body></html>
  `);
});

// Status Evolution API compatível
app.get('/instance/connectionState/:instance', (req, res) => {
  res.json({ instance: { instanceName: req.params.instance, state: connected ? 'open' : 'close' } });
});

app.get('/instance/fetchInstances', (req, res) => {
  res.json([{ instance: { instanceName: INSTANCE, state: connected ? 'open' : 'close' } }]);
});

// Envia mensagem — aceita formato Evolution API: { number, textMessage: { text } }
// e também formato simples: { number, text }
app.post('/message/sendText/:instance', async (req, res) => {
  try {
    if (!sock || !connected) return res.status(503).json({ error: 'WhatsApp desconectado' });

    const { number, text, textMessage } = req.body;
    const textoFinal = text ?? textMessage?.text;
    if (!number || !textoFinal) return res.status(400).json({ error: 'number e text são obrigatórios' });

    const jid = number.includes('@') ? number : `${number}@s.whatsapp.net`;
    const sent = await sock.sendMessage(jid, { text: textoFinal });
    console.log(`[Bridge] ✓ Enviado para ${number}: ${textoFinal.substring(0, 60)}`);
    res.json({ zaapId: sent?.key?.id ?? 'ok', id: sent?.key?.id });
  } catch (e) {
    console.error('[Bridge] Erro ao enviar:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── WhatsApp ───────────────────────────────────────────────────────

async function startWA() {
  console.log('[Bridge] Iniciando conexão WhatsApp...');
  const { state, saveCreds } = await getAuthState();

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: require('pino')({ level: 'warn' }),
    browser: ['Enemeop Flores', 'Chrome', '120.0.0'],
    connectTimeoutMs: 60_000,
    keepAliveIntervalMs: 30_000,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      // Gera QR como data URL PNG para exibir no browser via /qr
      try {
        const QRCode = require('qrcode');
        currentQR = await QRCode.toDataURL(qr);
        console.log('[Bridge] QR code gerado — acesse http://localhost:' + PORT + '/qr para escanear');
      } catch {
        currentQR = null;
        console.log('[Bridge] QR (terminal):', qr);
      }
    }

    if (connection === 'open') {
      connected = true;
      currentQR = null;
      console.log('[Bridge] ✅ WhatsApp conectado e pronto!');
    }

    if (connection === 'close') {
      connected = false;
      sock = null;
      const code = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      console.log(`[Bridge] Conexão fechada (código: ${code}) ${loggedOut ? '— sessão encerrada' : '— reconectando em 5s'}`);
      if (!loggedOut) setTimeout(startWA, 5000);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' || !ORCHESTRATOR_WEBHOOK) return;
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      const text = msg.message?.conversation
        || msg.message?.extendedTextMessage?.text
        || msg.message?.imageMessage?.caption
        || '';
      if (!text) continue;

      console.log(`[Bridge] ← ${msg.key.remoteJid}: ${text.substring(0, 80)}`);
      try {
        await fetch(ORCHESTRATOR_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'messages.upsert',
            instance: INSTANCE,
            data: { key: msg.key, message: msg.message, pushName: msg.pushName },
          }),
        });
      } catch (e) {
        console.error('[Bridge] Erro ao notificar orquestrador:', e.message);
      }
    }
  });
}

app.listen(PORT, () => {
  console.log(`[Bridge] Servidor HTTP na porta ${PORT}`);
  startWA();
});
