# Skill: Configurar WhatsApp

## Descrição
Configura a integração com WhatsApp Business usando Evolution API (self-hosted) ou Z-API (cloud). Conecta ao número da empresa, configura webhooks e integra com o Agente SDR.

## Quando usar
- Na Etapa 5 do `pipeline-novo-saas.md`
- Ao adicionar WhatsApp a um SaaS existente
- Ao trocar de provedor de WhatsApp

---

## Escolha do provedor

| Critério | Evolution API | Z-API |
|---|---|---|
| Custo | Gratuito (self-hosted) | A partir de R$ 80/mês |
| Hospedagem | Render, Railway ou VPS | Cloud (zero configuração) |
| Controle | Total | Limitado ao plano |
| Múltiplos números | Ilimitado | Conforme plano |
| Suporte | Comunidade | Suporte oficial |
| **Quando usar** | Controle máximo + custo zero | Velocidade de setup + sem infra |

**Recomendação para MVP**: Z-API (mais rápido para validar). Evolution API para escala.

---

## Opção A — Z-API (cloud, recomendado para MVP)

### 1. Criar instância
1. Acessar [z-api.io](https://z-api.io) → Criar conta
2. New Instance → copiar:
   - **Instance ID**: `[id]`
   - **Instance Token**: `[token]`
   - **Client Token**: `[client-token]`

### 2. Conectar número
1. No painel Z-API → QR Code
2. Abrir WhatsApp no celular → Dispositivos Conectados → Conectar dispositivo
3. Escanear o QR Code
4. Status deve mudar para "Conectado"

### 3. Variáveis de ambiente
```env
WHATSAPP_PROVIDER=zapi
ZAPI_INSTANCE_ID=[instance-id]
ZAPI_INSTANCE_TOKEN=[instance-token]
ZAPI_CLIENT_TOKEN=[client-token]
ZAPI_BASE_URL=https://api.z-api.io/instances/[instance-id]/token/[instance-token]
```

### 4. Configurar webhook
No painel Z-API → Webhook → On Message Received:
```
URL: https://[dominio-do-saas]/api/whatsapp/webhook
```

---

## Opção B — Evolution API (self-hosted)

### 1. Deploy no Render
1. Acessar [render.com](https://render.com) → New Web Service
2. Deploy from Docker Image: `atendai/evolution-api:latest`
3. Variáveis de ambiente:
```env
AUTHENTICATION_TYPE=apikey
AUTHENTICATION_API_KEY=[gerar-chave-segura]
DATABASE_CONNECTION_URI=postgresql://[supabase-connection-string]
REDIS_URI=redis://[upstash-url]
WEBHOOK_GLOBAL_URL=https://[dominio-do-saas]/api/whatsapp/webhook
WEBHOOK_GLOBAL_ENABLED=true
```

### 2. Criar instância
```bash
curl -X POST https://[evolution-url]/instance/create \
  -H 'apikey: [api-key]' \
  -H 'Content-Type: application/json' \
  -d '{"instanceName": "[nome-do-saas]", "qrcode": true}'
```

### 3. Conectar número
```bash
# Obter QR Code
curl https://[evolution-url]/instance/connect/[nome-do-saas] \
  -H 'apikey: [api-key]'
```
Escanear o QR Code retornado com o WhatsApp do número da empresa.

### 4. Variáveis de ambiente
```env
WHATSAPP_PROVIDER=evolution
EVOLUTION_API_URL=https://[evolution-url]
EVOLUTION_API_KEY=[api-key]
EVOLUTION_INSTANCE=[nome-do-saas]
```

---

## Endpoint de webhook (ambos os provedores)

Criar `src/app/api/whatsapp/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { queueUrgente } from '@/lib/queues'

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Normalizar payload entre provedores
  const mensagem = normalizarMensagem(body)

  if (!mensagem) {
    return NextResponse.json({ ok: true })
  }

  // Ignorar mensagens próprias (enviadas pelo sistema)
  if (mensagem.fromMe) {
    return NextResponse.json({ ok: true })
  }

  // Enfileirar para o Agente SDR processar
  await queueUrgente.add('sdr:mensagem_recebida', {
    agente: 'sdr',
    acao: 'mensagem_recebida',
    payload: {
      telefone: mensagem.telefone,
      nome: mensagem.nome,
      texto: mensagem.texto,
      midia: mensagem.midia,
      timestamp: mensagem.timestamp,
      canal: 'whatsapp',
    },
  })

  return NextResponse.json({ ok: true })
}

function normalizarMensagem(body: Record<string, unknown>) {
  // Z-API
  if (body.phone) {
    return {
      telefone: body.phone as string,
      nome: (body.senderName as string) || '',
      texto: (body.text as Record<string, string>)?.message || '',
      fromMe: body.fromMe as boolean,
      timestamp: body.momment as number,
      midia: null,
    }
  }

  // Evolution API
  if (body.data) {
    const data = body.data as Record<string, unknown>
    const key = data.key as Record<string, unknown>
    const message = data.message as Record<string, unknown>
    return {
      telefone: key?.remoteJid as string,
      nome: (data.pushName as string) || '',
      texto: (message?.conversation as string) || '',
      fromMe: key?.fromMe as boolean,
      timestamp: data.messageTimestamp as number,
      midia: null,
    }
  }

  return null
}
```

---

## Função de envio de mensagem

Criar `lib/whatsapp/enviar.ts`:

```typescript
interface MensagemWhatsApp {
  telefone: string
  texto?: string
  imagem?: string
  documento?: string
  legenda?: string
}

export async function enviarMensagem(mensagem: MensagemWhatsApp): Promise<boolean> {
  const provider = process.env.WHATSAPP_PROVIDER

  if (provider === 'zapi') {
    return enviarZAPI(mensagem)
  } else if (provider === 'evolution') {
    return enviarEvolution(mensagem)
  }

  throw new Error('WHATSAPP_PROVIDER não configurado')
}

async function enviarZAPI(mensagem: MensagemWhatsApp): Promise<boolean> {
  const url = `${process.env.ZAPI_BASE_URL}/send-text`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Token': process.env.ZAPI_CLIENT_TOKEN!,
    },
    body: JSON.stringify({
      phone: mensagem.telefone,
      message: mensagem.texto,
    }),
  })
  return response.ok
}

async function enviarEvolution(mensagem: MensagemWhatsApp): Promise<boolean> {
  const url = `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.EVOLUTION_API_KEY!,
    },
    body: JSON.stringify({
      number: mensagem.telefone,
      text: mensagem.texto,
    }),
  })
  return response.ok
}
```

---

## Verificação final

```bash
# 1. Testar envio
curl -X POST http://localhost:3000/api/whatsapp/enviar \
  -H 'Content-Type: application/json' \
  -d '{"telefone":"5511999999999","texto":"Teste de integração WhatsApp ✅"}'

# 2. Testar recebimento — enviar mensagem para o número conectado
# Verificar no dashboard do Upstash se o job foi enfileirado

# 3. Verificar no log do orquestrador se o SDR processou a mensagem
```

✅ WhatsApp configurado e integrado com o Agente SDR.
