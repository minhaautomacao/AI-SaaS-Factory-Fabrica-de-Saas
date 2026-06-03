/**
 * Cliente Evolution API — envio de mensagens WhatsApp
 *
 * Variáveis necessárias no .env:
 *   EVOLUTION_API_URL      ex: https://evolution.seu-dominio.com
 *   EVOLUTION_API_KEY      chave de autenticação
 *   EVOLUTION_INSTANCE     nome da instância (ex: floricultura)
 *   CARLOS_WHATSAPP        número do operador para escaladas (ex: 5511999999999)
 */

const API_URL  = process.env.EVOLUTION_API_URL ?? ''
const API_KEY  = process.env.EVOLUTION_API_KEY ?? ''
const INSTANCE = process.env.EVOLUTION_INSTANCE ?? 'floricultura'
const CARLOS   = process.env.CARLOS_WHATSAPP ?? ''

interface EnviarMensagemOpts {
  numero: string      // formato: 5511999999999 (sem +, sem espaços)
  mensagem: string
  instance?: string   // sobrescreve EVOLUTION_INSTANCE se necessário
}

interface EvolutionResponse {
  key?: { id: string }
  status?: string
  error?: string
}

export async function enviarMensagem(opts: EnviarMensagemOpts): Promise<boolean> {
  if (!API_URL || !API_KEY) {
    console.warn('[WhatsApp] EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurados — mensagem ignorada')
    return false
  }

  const instance = opts.instance ?? INSTANCE
  const url = `${API_URL}/message/sendText/${instance}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
      },
      body: JSON.stringify({
        number: opts.numero,
        text: opts.mensagem,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[WhatsApp] Erro HTTP ${res.status}: ${body}`)
      return false
    }

    const data = await res.json() as EvolutionResponse
    if (data.error) {
      console.error('[WhatsApp] Erro na API:', data.error)
      return false
    }

    console.log(`[WhatsApp] Mensagem enviada para ${opts.numero} — id: ${data.key?.id ?? 'N/A'}`)
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
