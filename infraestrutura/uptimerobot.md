# UptimeRobot — Configuração Gratuita

## Visão geral

Serviço de monitoramento que verifica se seu site/API está online a cada 5 minutos. Envia alertas por email, Telegram, Slack e WhatsApp quando algo cai. O plano gratuito já resolve 100% das necessidades iniciais.

## Limites do plano gratuito

| Recurso | Limite |
|---|---|
| Monitores | 50 |
| Intervalo de verificação | 5 minutos |
| Alertas por email | Ilimitados |
| Histórico | 1 mês |
| Status page pública | 1 |
| Integrações | Email, Slack, Telegram, Webhook |

## Configuração passo a passo

### 1. Criar conta

1. Acesse [uptimerobot.com](https://uptimerobot.com)
2. **Register for FREE**
3. Confirme o email

### 2. Criar monitor HTTP(S)

1. Dashboard → **+ Add New Monitor**
2. Configure:
   - **Monitor Type**: HTTP(S)
   - **Friendly Name**: Nome do seu SaaS
   - **URL**: `https://meuapp.com.br`
   - **Monitoring Interval**: 5 minutes
3. **Create Monitor**

### 3. Configurar alertas

**My Settings → Alert Contacts → Add Alert Contact**:

**Email** (já configurado por padrão):
- Alertas quando sair do ar e quando voltar

**Telegram**:
1. Crie um bot via [@BotFather](https://t.me/botfather)
2. Guarde o token do bot
3. Descubra seu chat ID via `https://api.telegram.org/bot<TOKEN>/getUpdates`
4. No UptimeRobot: Alert Contact Type → Telegram

**Webhook (para qualquer integração)**:
```
POST https://meu-servidor.com/webhook/alerta
Body: {"monitorURL": "...", "alertType": "down", "alertFriendlyName": "..."}
```

### 4. Status Page pública

Útil para informar usuários durante incidentes:

1. **Status Pages → Create Status Page**
2. Configure:
   - Nome da página
   - Domínio customizado (ex: `status.meuapp.com.br`)
   - Selecione quais monitores mostrar
3. Compartilhe o link com usuários

No Cloudflare, adicione CNAME:
```
status → stats.uptimerobot.com
```

## Monitores essenciais para um SaaS

### Monitor 1: Aplicação principal
```
URL: https://meuapp.com.br
Tipo: HTTP(S)
Intervalo: 5 min
Keyword: "meuapp" (verifica se o texto existe na página)
```

### Monitor 2: API de saúde
```
URL: https://api.meuapp.com.br/health
Tipo: HTTP(S)
Intervalo: 5 min
HTTP Method: GET
Expected Status: 200
```

### Monitor 3: Supabase (evitar pausa automática)
```
URL: https://xxxx.supabase.co/rest/v1/
Tipo: HTTP(S)
Intervalo: 3 dias (use cron job externo para isso)
Headers: apikey: sua-anon-key
```

Para manter o Supabase ativo, crie um Cron Job no Render que faz ping a cada 3 dias:

```typescript
// scripts/ping-supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

async function ping() {
  const { data, error } = await supabase.from('profiles').select('id').limit(1)
  console.log('Ping Supabase:', error ? 'ERRO' : 'OK')
}

ping()
```

### Monitor 4: Render (evitar sleep)
```
URL: https://meu-backend.onrender.com/health
Tipo: HTTP(S)
Intervalo: 10 min
```

## Alertas recomendados

Configure para receber alerta quando:
- Site ficar offline por mais de 1 verificação (5 min)
- Tempo de resposta ultrapassar 5 segundos
- Certificado SSL expirar em menos de 30 dias

**SSL Expiry Monitor** (separado):
1. **+ Add New Monitor**
2. **Monitor Type**: SSL/TLS Expiry
3. URL: seu domínio
4. Alerta quando restar: 30 dias

## Webhook de alerta personalizado

Para enviar notificações no seu próprio sistema:

```typescript
// api/webhook/uptime.ts
export async function POST(req: Request) {
  const body = await req.json()
  
  if (body.alertType === 'down') {
    // Enviar email para equipe
    await enviarEmail({
      para: 'time@empresa.com',
      assunto: `🔴 ALERTA: ${body.alertFriendlyName} está fora do ar`,
      corpo: `Monitor: ${body.monitorURL}\nHorário: ${new Date().toLocaleString('pt-BR')}`
    })
    
    // Notificar no Slack/Discord
    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      body: JSON.stringify({ text: `🔴 ${body.alertFriendlyName} caiu!` })
    })
  }
  
  return Response.json({ ok: true })
}
```

## Quando migrar para o Pro ($7/mês)

- Intervalo de 1 minuto (vs 5 min no gratuito)
- Histórico de 6 meses
- Status pages ilimitadas
- Verificações de múltiplas localizações globais
- Relatórios em PDF
