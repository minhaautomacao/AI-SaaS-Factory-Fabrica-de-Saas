/**
 * meta.ts — Envio de mensagens via Meta Graph API
 *
 * Suporta:
 *   - Instagram DM (resposta a mensagem recebida)
 *   - Facebook Messenger DM
 *   - Resposta a comentário no Instagram
 *   - Resposta a comentário no Facebook
 *
 * Variável necessária:
 *   META_PAGE_ACCESS_TOKEN — token de acesso da página (long-lived)
 *   META_INSTAGRAM_ID      — ID do perfil profissional do Instagram (opcional para DMs)
 */

const GRAPH_URL = 'https://graph.facebook.com/v21.0'

export interface ResultadoMeta {
  enviado: boolean
  id?: string
  erro?: string
  canal: string
}

// Envia DM pelo Instagram ou Facebook Messenger
export async function enviarDMMeta(
  pageToken: string,
  recipientId: string,
  texto: string,
  canal: 'instagram' | 'facebook',
): Promise<ResultadoMeta> {
  // Instagram usa /me/messages com recipient IGSID
  // Facebook Messenger usa /me/messages com PSID
  const endpoint = `${GRAPH_URL}/me/messages`

  try {
    const resp = await fetch(`${endpoint}?access_token=${pageToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: texto },
        messaging_type: 'RESPONSE',
      }),
    })

    const data = await resp.json()

    if (!resp.ok || data.error) {
      return { enviado: false, canal, erro: data.error?.message ?? `HTTP ${resp.status}` }
    }

    return { enviado: true, canal, id: data.message_id }
  } catch (e) {
    return { enviado: false, canal, erro: String(e) }
  }
}

// Responde a um comentário no Instagram ou Facebook
export async function responderComentarioMeta(
  pageToken: string,
  commentId: string,
  texto: string,
  canal: 'instagram' | 'facebook',
): Promise<ResultadoMeta> {
  const endpoint = `${GRAPH_URL}/${commentId}/replies`

  try {
    const resp = await fetch(`${endpoint}?access_token=${pageToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: texto }),
    })

    const data = await resp.json()

    if (!resp.ok || data.error) {
      return { enviado: false, canal, erro: data.error?.message ?? `HTTP ${resp.status}` }
    }

    return { enviado: true, canal, id: data.id }
  } catch (e) {
    return { enviado: false, canal, erro: String(e) }
  }
}

// Busca o nome do usuário pelo ID (Instagram/Facebook)
export async function buscarNomeUsuarioMeta(
  pageToken: string,
  userId: string,
): Promise<string | null> {
  try {
    const resp = await fetch(
      `${GRAPH_URL}/${userId}?fields=name&access_token=${pageToken}`,
    )
    if (!resp.ok) return null
    const data = await resp.json()
    return data.name ?? null
  } catch {
    return null
  }
}
