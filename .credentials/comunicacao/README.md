# Credenciais de Comunicação

> **NUNCA commitar valores reais nesta pasta.** Apenas os arquivos README.md são versionados.

## Como usar

Crie um arquivo `.env` local nesta pasta com as credenciais reais:

```env
# Slack (notificações internas)
SLACK_BOT_TOKEN=xoxb-...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_CHANNEL_ALERTAS=#alertas

# Discord (comunidade/suporte)
DISCORD_BOT_TOKEN=
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_GUILD_ID=
DISCORD_CHANNEL_SUPORTE=

# Telegram (notificações)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Intercom (suporte ao cliente — plano gratuito até 1 lugar)
INTERCOM_APP_ID=
INTERCOM_ACCESS_TOKEN=

# Crisp (alternativa gratuita ao Intercom)
NEXT_PUBLIC_CRISP_WEBSITE_ID=

# Typebot (chatbot gratuito — auto-hospedado)
TYPEBOT_API_TOKEN=
```

## Slack Webhook (alertas internos rápidos)

1. [api.slack.com/apps](https://api.slack.com/apps) → **Create New App**
2. **Incoming Webhooks → Activate**
3. **Add New Webhook to Workspace** → escolha o canal

```typescript
// lib/notificacoes.ts
export async function notificarSlack(mensagem: string, canal = process.env.SLACK_CHANNEL_ALERTAS) {
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    body: JSON.stringify({
      text: mensagem,
      channel: canal
    })
  })
}

// Exemplos de uso
await notificarSlack('🎉 Novo usuário cadastrado: joao@email.com')
await notificarSlack('💰 Nova assinatura Pro: R$ 97,00')
await notificarSlack('🔴 Erro crítico: ' + error.message)
```

## Telegram Bot (alertas pessoais)

1. Crie bot via [@BotFather](https://t.me/botfather) → `/newbot`
2. Guarde o token
3. Descubra seu Chat ID:
   - Envie mensagem para o bot
   - Acesse: `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Copie o `chat.id`

```typescript
export async function notificarTelegram(mensagem: string) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: mensagem,
      parse_mode: 'HTML'
    })
  })
}
```

## Crisp (chat de suporte gratuito)

1. Acesse [crisp.chat](https://crisp.chat) → plano gratuito
2. Copie o **Website ID**

```typescript
// components/CrispChat.tsx
'use client'
import { useEffect } from 'react'

export function CrispChat() {
  useEffect(() => {
    window.$crisp = []
    window.CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID!
    const script = document.createElement('script')
    script.src = 'https://client.crisp.chat/l.js'
    script.async = true
    document.head.appendChild(script)
  }, [])
  
  return null
}
```
