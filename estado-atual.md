# Estado Atual — Fábrica de SaaS

> Atualizado em: 2026-06-10

## Projeto ativo: Enemeop Flores

### Infraestrutura em produção

| Componente | URL/Info | Status |
|---|---|---|
| App (painel admin) | https://enemeop-flores-three.vercel.app | ✅ Online |
| Supabase | https://gftnjvdvzgjkhwxnxnwl.supabase.co | ✅ Ativo |
| Webhook Instagram | via Supabase Edge Function | ✅ Ativo |
| Pipeline leads | DM Instagram → Supabase | ✅ Funcional |
| Render WhatsApp Bridge | https://enemeop-whatsapp-bridge.onrender.com | ⚠️ Online mas desconectado (Frankfurt bloqueado pelo WhatsApp) |
| Oracle Cloud VM | IP: 150.230.72.149 (São Paulo) | ⚠️ VM criada, SSH ok, Node.js instalando |

---

## Sessão 2026-06-10 — O que foi feito

### WhatsApp Bridge — histórico completo

1. **Problema raiz descoberto**: Render Oregon e Render Frankfurt têm IPs bloqueados pelo WhatsApp
2. **Solução**: Baileys bridge com auth persistido no Upstash Redis
3. **QR Code escaneado com sucesso** localmente — número `5511912808282` conectado
4. **Credenciais enviadas ao Redis** (`baileys:floricultura:creds` + keys)
5. **`whatsapp-bridge/`** criado e deployado no Render Frankfurt — mas bloqueado pelo WhatsApp
6. **Oracle Cloud Free Tier** criado em São Paulo (IP: 150.230.72.149) para contornar o bloqueio
7. **SSH funcionando** com chave `C:\Users\NOTEBOOK\Desktop\ssh-key-2026-06-10.key`
8. **Node.js instalado** via nodesource — `dnf install nodejs git` completou (exit 0)

### Estado atual da VM Oracle

- **IP público**: `150.230.72.149` (São Paulo — não bloqueado pelo WhatsApp)
- **Usuário SSH**: `opc`
- **Chave SSH**: `C:\Users\NOTEBOOK\Desktop\ssh-key-2026-06-10.key`
- **Node.js**: instalado (path pode precisar de `/usr/bin/node`)
- **Pendente**: clonar repo, instalar deps, configurar PM2, abrir porta no firewall Oracle

---

## Próximo passo IMEDIATO (continuar amanhã)

### 1. Verificar Node.js e instalar o bridge na VM Oracle

```bash
ssh -i "C:\Users\NOTEBOOK\Desktop\ssh-key-2026-06-10.key" opc@150.230.72.149
```

Na VM, rodar:
```bash
# Verificar node
node --version || /usr/bin/node --version

# Clonar repo
git clone https://github.com/minhaautomacao/AI-SaaS-Factory-Fabrica-de-Saas /opt/app

# Instalar bridge
cd /opt/app/whatsapp-bridge
npm install

# Configurar variáveis
export UPSTASH_REDIS_URL_HTTP=https://legal-imp-145889.upstash.io
export UPSTASH_REDIS_TOKEN=gQAAAAAAAjnhAAIgcDI0MWMxM2ZiMGZlYzE0NGFjOWI1ODhiZGQzNzViODVhZA
export EVOLUTION_INSTANCE=floricultura
export ORCHESTRATOR_WEBHOOK=https://gftnjvdvzgjkhwxnxnwl.supabase.co/functions/v1/webhook-meta
export PORT=3000

# Testar
node index.js
```

### 2. Instalar PM2 para rodar 24/7

```bash
sudo npm install -g pm2
pm2 start index.js --name whatsapp-bridge \
  --env UPSTASH_REDIS_URL_HTTP=https://legal-imp-145889.upstash.io \
  --env UPSTASH_REDIS_TOKEN=gQAAAAAAAjnhAAIgcDI0MWMxM2ZiMGZlYzE0NGFjOWI1ODhiZGQzNzViODVhZA \
  --env EVOLUTION_INSTANCE=floricultura \
  --env ORCHESTRATOR_WEBHOOK=https://gftnjvdvzgjkhwxnxnwl.supabase.co/functions/v1/webhook-meta \
  --env PORT=3000
pm2 startup
pm2 save
```

### 3. Abrir porta 3000 no firewall Oracle

Na console Oracle: **Networking → VCN → subnet → Security List → Add Ingress Rule**
- Source: `0.0.0.0/0`
- Port: `3000`
- Protocol: TCP

### 4. Confirmar WhatsApp conectado

```bash
curl http://150.230.72.149:3000/
# Esperado: { "connected": true }
```

### 5. Atualizar URL no orquestrador

Mudar `EVOLUTION_API_URL` para `http://150.230.72.149:3000` em:
- `orchestrator/.env`
- Variáveis de ambiente do Render (serviço enemeop-evolution ou orquestrador)

---

## Credenciais relevantes

| Credencial | Valor |
|---|---|
| VM Oracle IP | 150.230.72.149 |
| VM SSH user | opc |
| VM SSH key | `C:\Users\NOTEBOOK\Desktop\ssh-key-2026-06-10.key` |
| Redis URL | https://legal-imp-145889.upstash.io |
| Redis Token | gQAAAAAAAjnhAAIgcDI0MWMxM2ZiMGZlYzE0NGFjOWI1ODhiZGQzNzViODVhZA |
| WhatsApp número | 5511912808282 |
| Render Bridge URL | https://enemeop-whatsapp-bridge.onrender.com (Frankfurt, bloqueado) |
