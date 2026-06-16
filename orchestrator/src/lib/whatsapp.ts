/**
 * Cliente Z-API — envio de mensagens WhatsApp
 *
 * Variáveis de ambiente necessárias:
 *   ZAPI_INSTANCE_ID    ID da instância (Painel Z-API > Instância > ID)
 *   ZAPI_TOKEN          Token da instância (Painel Z-API > Instância > Token)
 *   ZAPI_CLIENT_TOKEN   Client-Token da conta (Painel Z-API > Minha Conta)
 *   CARLOS_WHATSAPP     Número do operador para escaladas (ex: 5511999999999)
 */

const ZAPI_BASE         = 'https://api.z-api.io'
const ZAPI_INSTANCE_ID  = process.env.ZAPI_INSTANCE_ID ?? ''
const ZAPI_TOKEN        = process.env.ZAPI_TOKEN ?? ''
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN ?? ''
const CARLOS            = process.env.CARLOS_WHATSAPP ?? ''

interface EnviarMensagemOpts {
  numero: string   // formato: 5511999999999 (sem +, sem espaços)
  mensagem: string
}

export async function enviarMensagem(opts: EnviarMensagemOpts): Promise<boolean> {
  if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
    console.warn('[WhatsApp] ZAPI_INSTANCE_ID ou ZAPI_TOKEN não configurados — mensagem ignorada')
    return false
  }

  const url = `${ZAPI_BASE}/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': ZAPI_CLIENT_TOKEN,
      },
      body: JSON.stringify({
        phone: opts.numero,
        message: opts.mensagem,
      }),
    })

    if (!res.ok) {
      console.error(`[WhatsApp] Erro HTTP ${res.status}: ${await res.text()}`)
      return false
    }

    const data = await res.json() as { zaapId?: string; error?: string }
    if (data.error) {
      console.error('[WhatsApp] Erro na API:', data.error)
      return false
    }

    console.log(`[WhatsApp] Mensagem enviada para ${opts.numero} — zaapId: ${data.zaapId ?? 'N/A'}`)
    return true
  } catch (err) {
    console.error('[WhatsApp] Falha na requisição:', err)
    return false
  }
}

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
  ].join('\n')

  await enviarMensagem({ numero: CARLOS, mensagem })
}

export async function responderLead(opts: { numero: string; mensagem: string }): Promise<boolean> {
  return enviarMensagem(opts)
}
