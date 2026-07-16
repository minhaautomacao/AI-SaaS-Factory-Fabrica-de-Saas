// Funções puras do handoff humano (código de atendimento, link WhatsApp, mensagens).
// Sem dependência de Deno/Supabase — testável diretamente com Node (tsx).

export type CanalMeta = 'whatsapp' | 'instagram' | 'facebook';

const PREFIXO_CANAL: Record<CanalMeta, string> = {
  whatsapp: 'WA',
  instagram: 'INSTA',
  facebook: 'FB',
};

const WHATSAPP_OFICIAL = '5511982829083';

export function normalizarCanalAtendimento(canal: string): string {
  const chave = (canal ?? '').trim().toLowerCase() as CanalMeta;
  const prefixo = PREFIXO_CANAL[chave];
  if (!prefixo) throw new Error(`Canal não suportado para atendimento humano: ${canal}`);
  return prefixo;
}

// Últimos 4 caracteres alfanuméricos do identificador estável do cliente no canal.
// Fallback: zero à esquerda quando houver identificador parcial; sufixo de UUID quando ausente.
export function extrairIdentificadorCliente(identificador: string | null | undefined): string {
  const limpo = (identificador ?? '').replace(/[^a-zA-Z0-9]/g, '');
  if (limpo.length >= 4) return limpo.slice(-4).toUpperCase();
  if (limpo.length > 0) return limpo.toUpperCase().padStart(4, '0');
  return crypto.randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase();
}

export function gerarCodigoAtendimento(canal: string, identificadorCliente: string | null | undefined, sequencial: number): string {
  const prefixo = normalizarCanalAtendimento(canal);
  const bloco = extrairIdentificadorCliente(identificadorCliente);
  const seq = String(sequencial).padStart(4, '0');
  return `${prefixo}-${bloco}-${seq}`;
}

export function montarMensagemWhatsApp(canal: string, codigo: string): string {
  const chave = (canal ?? '').trim().toLowerCase();
  const origem = chave === 'instagram' ? 'Instagram' : chave === 'facebook' ? 'Facebook' : 'WhatsApp';
  return `Olá! Vim pelo ${origem}. Meu código de atendimento é ${codigo}.`;
}

// Contém somente canal de origem + código — nunca histórico, endereço, pagamento ou dados pessoais.
export function montarLinkWhatsAppOficial(canal: string, codigo: string): string {
  const mensagem = montarMensagemWhatsApp(canal, codigo);
  return `https://wa.me/${WHATSAPP_OFICIAL}?text=${encodeURIComponent(mensagem)}`;
}

export function montarMensagemTransicaoCliente(canal: string, codigo: string): string {
  const chave = (canal ?? '').trim().toLowerCase();
  if (chave === 'instagram' || chave === 'facebook') {
    return `Vou encaminhar seu atendimento para nossa equipe. Para continuar pelo WhatsApp sem precisar repetir tudo, clique no link abaixo e envie a mensagem com seu código: ${codigo}.`;
  }
  return `Seu atendimento será continuado pela nossa equipe. Seu código é: ${codigo}.`;
}

// Detecta pedido explícito de atendimento humano (gatilho de handoff).
export function clientePediuHumano(texto: string): boolean {
  return /\b(atendente|humano|pessoa|algu[e?]m|vendedor|consultor|falar com|chamar uma pessoa)\b/i.test(texto);
}

export type OrigemHandoff =
  | 'cliente_solicitou'
  | 'flora_sem_confianca'
  | 'limite_tecnico'
  | 'pagamento'
  | 'logistica'
  | 'administrativo'
  | 'manual';

// Classifica o motivo em texto livre (já usado hoje pelo webhook-meta) numa origem
// estruturada para métricas futuras, sem exigir alteração dos pontos de chamada existentes.
export function inferirOrigemHandoff(motivo: string | null | undefined): OrigemHandoff {
  const texto = (motivo ?? '').toLowerCase();
  if (/solicitou atendimento humano|pediu atendente|falar com/.test(texto)) return 'cliente_solicitou';
  if (/pagamento/.test(texto)) return 'pagamento';
  if (/frete|entrega|log[ií]stica/.test(texto)) return 'logistica';
  if (/falha t[eé?]cnica|instabilidade|erro t[eé?]cnico/.test(texto)) return 'limite_tecnico';
  return 'manual';
}
