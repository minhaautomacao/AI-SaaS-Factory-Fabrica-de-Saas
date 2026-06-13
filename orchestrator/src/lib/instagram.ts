/**
 * Instagram Graph API — envio de mensagens DM e salvamento de conversas
 *
 * Variáveis necessárias:
 *   INSTAGRAM_ACCESS_TOKEN   token de acesso do app Meta (Page/User token com instagram_manage_messages)
 *   INSTAGRAM_PAGE_ID        ID da página do Instagram (ex: 17841402064363907)
 */

import { getSupabase } from './supabase.js'

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN ?? ''
const PAGE_ID      = process.env.INSTAGRAM_PAGE_ID ?? '17841402064363907'

export async function responderInstagram(recipientId: string, texto: string): Promise<boolean> {
  if (!ACCESS_TOKEN) {
    console.warn('[Instagram] INSTAGRAM_ACCESS_TOKEN não configurado — resposta não enviada')
    return false
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${PAGE_ID}/messages?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: texto },
          messaging_type: 'RESPONSE',
        }),
      }
    )
    const data = await res.json() as { message_id?: string; error?: { message: string } }
    if (data.error) {
      console.error('[Instagram] Erro Graph API:', data.error.message)
      return false
    }
    console.log(`[Instagram] ✓ Respondido ${recipientId} — id: ${data.message_id}`)
    return true
  } catch (e) {
    console.error('[Instagram] Falha ao enviar:', e)
    return false
  }
}

export async function salvarConversa(opts: {
  leadId: string
  canalId: string
  canal: 'instagram' | 'facebook' | 'whatsapp'
  historico: { role: string; content: string }[]
  fase?: string
  intencao?: string
  nomeExibido?: string
}): Promise<void> {
  const { leadId, canalId, canal, historico, fase, intencao, nomeExibido } = opts
  const sb = getSupabase()

  const { error } = await sb.from('conversas').upsert({
    lead_id:      leadId,
    canal_id:     canalId,
    canal,
    mensagens:    historico,
    fase:         fase ?? 'descoberta',
    intencao,
    nome_exibido: nomeExibido,
    atualizado_em: new Date().toISOString(),
  }, { onConflict: 'canal_id' })

  if (error) console.error('[Instagram] Erro ao salvar conversa:', error.message)
}
