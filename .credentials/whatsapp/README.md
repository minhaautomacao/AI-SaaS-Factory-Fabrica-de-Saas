# Credenciais WhatsApp

> **NUNCA commitar valores reais nesta pasta.** Apenas os arquivos README.md são versionados.

## Como usar

Crie um arquivo `.env` local nesta pasta com as credenciais reais:

```env
# Evolution API (self-hosted)
EVOLUTION_API_URL=https://evolution.meuapp.com.br
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE_NAME=

# Z-API (SaaS)
ZAPI_INSTANCE_ID=
ZAPI_TOKEN=
ZAPI_CLIENT_TOKEN=

# WhatsApp Business API (Meta oficial)
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=

# Twilio (fallback)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

## Opções de integração

### Evolution API (recomendado — gratuito self-hosted)
- Self-hosted no Render ou Railway
- Suporte a múltiplas instâncias
- Webhook em tempo real
- [Documentação](https://doc.evolution-api.com)

```bash
# Deploy no Render com Docker
# Image: atendai/evolution-api:latest
```

### Z-API (pago, mas simples)
- $30/mês por número
- Não precisa de servidor
- Ideal para começar rápido
- [zapi.io](https://zapi.io)

### Meta Business API (oficial)
- Necessário aprovação da Meta
- Ideal para volume alto
- Custo por mensagem (fora da janela de 24h)
- [developers.facebook.com/docs/whatsapp](https://developers.facebook.com/docs/whatsapp)

## Exemplo de uso (Evolution API)

```typescript
// lib/whatsapp.ts
const EVOLUTION_URL = process.env.EVOLUTION_API_URL
const API_KEY = process.env.EVOLUTION_API_KEY
const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME

export async function enviarMensagem(telefone: string, mensagem: string) {
  const response = await fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY!
    },
    body: JSON.stringify({
      number: telefone, // formato: 5511999999999
      text: mensagem
    })
  })
  return response.json()
}
```
