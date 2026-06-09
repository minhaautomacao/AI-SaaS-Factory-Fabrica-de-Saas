const { default: makeWASocket, DisconnectReason, BufferJSON } = require('@whiskeysockets/baileys');
const express = require('express');

const PORT = process.env.PORT || 3333;
const REDIS_URL = process.env.UPSTASH_REDIS_URL_HTTP;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_TOKEN;
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'floricultura';
const ORCHESTRATOR_WEBHOOK = process.env.ORCHESTRATOR_WEBHOOK || '';

if (!REDIS_URL || !REDIS_TOKEN) {
  console.error('UPSTASH_REDIS_URL_HTTP e UPSTASH_REDIS_TOKEN são obrigatórios');
  process.exit(1);
}

let sock = null;
const app = express();
app.use(express.json());

// ── Redis ──────────────────────────────────────────────────────────

async function redisGet(key) {
  const r = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
  });
  const data = await r.json();
  return data.result;
}

async function redisSet(key, value) {
  await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(value)
  });
}

// ── Auth state no Redis ────────────────────────────────────────────

async function useRedisAuthState() {
  const credsRaw = await redisGet(`baileys:${INSTANCE}:creds`);
  if (!credsRaw) {
    console.error('Sem credenciais no Redis. Rode upload-creds-redis.js primeiro.');
    process.exit(1);
  }

  const state = {
    creds: JSON.parse(credsRaw, BufferJSON.reviver),
    keys: {
      get: async (type, ids) => {
        const data = {};
        for (const id of ids) {
          const raw = await redisGet(`baileys:${INSTANCE}:key:${type}:${id}`);
          data[id] = raw ? JSON.parse(raw, BufferJSON.reviver) : undefined;
        }
        return data;
      },
      set: async (data) => {
        for (const [type, ids] of Object.entries(data)) {
          for (const [id, value] of Object.entries(ids ?? {})) {
            if (value) await redisSet(`baileys:${INSTANCE}:key:${type}:${id}`, JSON.stringify(value, BufferJSON.replacer));
          }
        }
      }
    }
  };

  const saveCreds = async () => {
    await redisSet(`baileys:${INSTANCE}:creds`, JSON.stringify(state.creds, BufferJSON.replacer));
  };

  return { state, saveCreds };
}

// ── HTTP API ───────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ status: 200, message: 'WhatsApp Bridge', connected: !!sock, instance: INSTANCE });
});

app.get('/instance/connectionState/:instance', (req, res) => {
  res.json({ instance: { instanceName: req.params.instance, state: sock ? 'open' : 'close' } });
});

app.get('/instance/fetchInstances', (req, res) => {
  res.json({ name: INSTANCE, connectionStatus: sock ? 'open' : 'close' });
});

app.post('/message/sendText/:instance', async (req, res) => {
  try {
    if (!sock) return res.status(503).json({ error: 'desconectado' });
    const { number, text } = req.body;
    const jid = number.includes('@') ? number : `${number}@s.whatsapp.net`;
    const sent = await sock.sendMessage(jid, { text });
    res.json(sent);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── WhatsApp ───────────────────────────────────────────────────────

async function startWA() {
  const { state, saveCreds } = await useRedisAuthState();

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: require('pino')({ level: 'silent' }),
    browser: ['Chrome (Linux)', '', ''],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' || !ORCHESTRATOR_WEBHOOK) return;
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      console.log(`MSG ${msg.key.remoteJid}: ${text}`);
      try {
        await fetch(ORCHESTRATOR_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'messages.upsert', instance: INSTANCE, data: { key: msg.key, message: msg.message, pushName: msg.pushName } })
        });
      } catch (e) { console.error('Webhook error:', e.message); }
    }
  });

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') console.log('✅ WhatsApp conectado!');
    if (connection === 'close') {
      sock = null;
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log(`Fechado (${code})`);
      if (code !== DisconnectReason.loggedOut) setTimeout(startWA, 5000);
    }
  });
}

app.listen(PORT, () => console.log(`Bridge porta ${PORT}`));
startWA();
