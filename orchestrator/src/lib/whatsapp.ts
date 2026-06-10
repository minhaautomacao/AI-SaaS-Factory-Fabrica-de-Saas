/**
 * Cliente Z-API — envio de mensagens WhatsApp
 *
 * Variáveis necessárias no .env:
 *   ZAPI_INSTANCE_ID   ID da instância Z-API
 *   ZAPI_TOKEN         Token da instância Z-API
 *   CARLOS_WHATSAPP    número do operador para escaladas (ex: 5511999999999)
 */

const ZAPI_INSTANCE     = process.env.ZAPI_INSTANCE_ID ?? ''
const ZAPI_TOKEN        = process.env.ZAPI_TOKEN ?? ''
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN ?? ''
const CARLOS            = process.env.CARLOS_WHATSAPP ?? ''

interface EnviarMensagemOpts {
  numero: string      // formato: 5511999999999 (sem +, sem espaços)
  mensagem: string
  instance?: string
}

interface ZApiResponse {
  zaapId?: string
  messageId?: string
  id?: string
  error?: string
}

export async function enviarMensagem(opts: EnviarMensagemOpts): Promise<boolean> {
  if (!ZAPI_INSTANCE || !ZAPI_TOKEN) {
    console.warn('[WhatsApp] ZAPI_INSTANCE_ID ou ZAPI_TOKEN não configurados — mensagem ignorada')
    return false
  }

  const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Client-Token': ZAPI_CLIENT_TOKEN },
      body: JSON.stringify({
        phone: opts.numero,
        message: opts.mensagem,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[WhatsApp] Erro HTTP ${res.status}: ${body}`)
      return false
    }

    const data = await res.json() as ZApiResponse
    if (data.error) {
      console.error('[WhatsApp] Erro na API:', data.error)
      return false
    }

    const msgId = data.zaapId ?? data.messageId ?? data.id ?? 'N/A'
    console.log(`[WhatsApp] Mensagem enviada para ${opts.numero} — id: ${msgId}`)
    return true
  } catch (err) {
    console.error('[WhatsApp] Falha na requisição:', err)
    return false
  }
}

// Notifica Carlos sobre escalada crítica
export async function notificarEscalada(taskId: string, tipo: string, motivo: string): Promise<void> {
  if (!CARLOS) {
    console.warn('[WhatsApp] CARLOS_WHATSAPP não configurado — escalada só registrada em log')
    return
  }

  const mensagem = [
    '🚨 *Escalada — requer sua atenção*',
    '',
    `*Tipo:* ${tipo}`,
    `*Motivo:* ${motivo}`,
    `*Task ID:* ${taskId}`,
    '',
    'Verifique o dashboard da Fábrica para mais detalhes.',
  ].join('\n')

  await enviarMensagem({ numero: CARLOS, mensagem })
}

// Responde um lead via WhatsApp (SDR)
export async function responderLead(opts: {
  numero: string
  mensagem: string
  instance?: string
}): Promise<boolean> {
  return enviarMensagem(opts)
}
