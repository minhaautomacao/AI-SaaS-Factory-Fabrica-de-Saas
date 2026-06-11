/**
 * Cliente Evolution API — envio de mensagens WhatsApp
 *
 * Variáveis necessárias no .env:
 *   EVOLUTION_API_URL      URL base da Evolution API (ex: https://enemeop-evolution.onrender.com)
 *   EVOLUTION_API_KEY      apikey da instância Evolution
 *   EVOLUTION_INSTANCE     nome da instância (ex: floricultura)
 *   CARLOS_WHATSAPP        número do operador para escaladas (ex: 5511999999999)
 */

const EVOLUTION_URL      = process.env.EVOLUTION_API_URL ?? 'https://enemeop-evolution.onrender.com'
const EVOLUTION_API_KEY  = process.env.EVOLUTION_API_KEY ?? 'enemeop_evo_key_2026'
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE ?? 'floricultura'
const CARLOS             = process.env.CARLOS_WHATSAPP ?? ''

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
  if (!EVOLUTION_URL || !EVOLUTION_API_KEY) {
    console.warn('[WhatsApp] EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurados — mensagem ignorada')
    return false
  }

  const instance = opts.instance ?? EVOLUTION_INSTANCE
  const url = `${EVOLUTION_URL}/message/sendText/${instance}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
      body: JSON.stringify({
        number: opts.numero,
        textMessage: { text: opts.mensagem },
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
