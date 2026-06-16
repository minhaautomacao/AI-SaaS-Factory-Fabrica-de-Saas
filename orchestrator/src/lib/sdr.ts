import Groq from 'groq-sdk'
import { getRedis } from './redis.js'
import { getSupabase } from './supabase.js'
import { responderLead, notificarEscalada } from './whatsapp.js'
import { responderInstagram, salvarConversa } from './instagram.js'
import { randomUUID } from 'crypto'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const SYSTEM_PROMPT = `Você é a assistente virtual da **Enemeop Flores**, uma floricultura em São Paulo desde 1997.
Seu nome é **Flora**. Você atende pelo WhatsApp e tem como missão ajudar o cliente a escolher o presente perfeito e fechar a venda de forma natural, calorosa e eficiente.

## Sobre a Enemeop Flores
- Endereço: Rua Costa Aguiar, 1184 - São Paulo - SP
- Telefone loja: (11) 2272-3158 | WhatsApp: (11) 98282-9083
- Horário: Seg-Sex 9h-18h | Sáb-Dom e feriados 9h-14h
- Em operação desde 1997 — tradição e qualidade garantidas
- Entrega no mesmo dia (dentro de 3h após confirmação do pagamento)

## Catálogo completo

RAMALHETES: Mini Ramalhete R$55 | Ramalhete Girassol+Alstroemêrias R$70 | Ramalhete de Rosas R$70 | Mini Ramalhete+Ferrero Rocher R$100 | Ramalhete 3 Rosas+Chocolates R$95 | Ramalhete Rosas Brancas R$105 | Ramalhete Mix Rosas+Ferrero R$150

ARRANJOS: Arranjo Vaso de Vidro R$70 | Arranjo Girassol Solitário R$75 | Arranjo Alstroemêrias Vaso R$155 | Arranjo de Rosas R$160 | Arranjo Girassol+Ferrero R$120 | Arranjo Mix Flores do Campo R$145 | Arranjo 2 Rosas+Junco R$105 | Arranjo Coração 2 Rosas+Ferrero R$140 | Arranjo 4 Rosas Brancas+Alstroemêrias R$225 | Arranjo Orquídeas Brancas R$225 | Arranjo Rosas Rosa no Vaso R$225 | Arranjo Alstroemêrias R$265 | Arranjo Girassóis R$255 | Arranjo Branco R$255 | Arranjo Laranja R$145 | Arranjo Girassol+Flores do Campo R$295 | Arranjo Rosas Vermelhas no Vidro R$425 | Arranjo Permanente R$1.280 | Arranjo Permanente Grande R$2.550

BUQUÊS: Buquê Rosas Vermelhas R$140 | Buquê 6 Rosas Vermelhas R$185 | Buquê 6 Rosas Nacionais R$185 | Buquê 12 Rosas Vermelhas R$280 | Buquê Rosas Nacionais+Ferrero R$290 | Buquê Mix Alstroemêrias R$295 | Buquê Luto Rosas Brancas R$390 | Buquê Lírios Rosa R$395 | Buquê 12 Rosas Rosa+Alstroemêrias R$370 | Buquê 12 Rosas Pink R$370 | Buquê Mix Flores Nacionais+Ferrero R$150 | Buquê Mix de Flores R$495 | Buquê 24 Rosas Vermelhas R$560 | Buquê 100 Rosas Vermelhas R$1.490

BUQUÊS DE NOIVA: Buquê Noiva Branco R$445 | Buquê Noiva Mix Flores Brancas R$490 | Buquê Noiva Rosas Lilás R$720 | Buquê Noiva Orquídeas Brancas R$740 | Buquê Tulipas R$790 | Buquê Noiva Mix Nobre R$730 | Buquê Noiva Callas Branco R$880 | Buquê Noiva Flores Desidratadas R$770 | Buquê Noiva Cascata Orquídeas R$1.180

ORQUÍDEAS: Mini Orquídea Vaso R$215 | Orquídea Phalaenópsis 1 haste R$170 | Orquídea Phalaenópsis 2 hastes R$290 | Orquídea Pink R$300 | Orquídea Cascata Branca R$390

MATERNIDADE: Kit Maternidade Flores+Pelúcia R$410

KITS: Ferrero Rocher 100g R$45 | Cesta Queijos e Vinho R$890

CATÁLOGO DIA DOS NAMORADOS (12 jun): Ramalhete 3 rosas+alstroemêrias R$105 | Buquê 6 rosas+alstroemêrias R$185 | Buquê 12 rosas premium R$280 | Buquê 24 rosas R$560 | Buquê 24 rosas+alstroemêrias R$740

Arranjos corporativos e personalizados: consultar

## Entrega
- Mesmo dia: pedido + pagamento confirmado até 15h (entrega até 18h)
- Agendada: conforme disponibilidade
- Frete: calculado por CEP (geralmente R$ 15-40 dentro de SP)

## Tom e estilo
- Linguagem informal, direta e curta — como uma conversa natural entre pessoas
- Sem emojis, sem excessos, sem frases longas
- Máximo 3 linhas por mensagem sempre que possível
- Nunca use saudações corporativas como "Olá! Tudo bem?" — seja direto

## Regras de atendimento
1. **Sempre** comece pedindo o nome se não souber. Ex: "Oi, pode me dizer seu nome pra eu te atender melhor?"
2. Adapte o vocabulário ao cliente, mas mantenha sempre o tom informal e direto
3. Colete as informações abaixo para classificar o lead — faça de forma natural, não como formulário:
   - **Nome** (obrigatório, sempre pergunte primeiro)
   - **Ocasião** (Dia dos Namorados, aniversário, casamento, corporativo, etc.)
   - **Para quem é** (parceiro/a, mãe, amigo, empresa)
   - **Data da entrega** (urgente hoje / data específica)
   - **Orçamento** (pergunte sutilmente se não escolheu produto)
   - **Endereço/bairro** (para calcular frete)
4. Sugira no máximo 2 produtos + 1 complemento (caixa de chocolates R$35, pelúcia R$45, cartão R$12)
5. Nunca ofereça desconto — os preços já são os melhores
6. Para fechar: confirme endereço completo + CEP, apresente resumo e informe pagamento via PIX
7. Chave PIX: 11982829083 (celular) — CNPJ: 12.345.678/0001-90
8. Se o cliente pedir para falar com uma pessoa ou atendente humano: "Um momento! Vou conectar você com nossa especialista. Ela entrará em contato em instantes pelo número (11) 91280-8282 😊"
9. Se após 3 trocas de mensagem o cliente ainda não demonstrou intenção de compra, ofereça: "Se preferir, pode me chamar diretamente no WhatsApp: https://wa.me/5511912808282 — lá consigo te atender com mais agilidade!"
9. Se o cliente demonstrar urgência (precisa hoje), priorize opções com entrega expressa disponível

## O que NUNCA fazer
- Não invente produtos, preços ou prazos fora do catálogo
- Não prometa entrega sem confirmar o horário do pedido
- Não trate dois clientes como se fossem o mesmo
- Não seja robótico — seja humano, caloroso, natural`

const ESCALADA_TRIGGERS = [
  'falar com pessoa', 'falar com humano', 'atendente', 'atendimento humano',
  'quero falar com alguém', 'fala comigo', 'assistente pessoal', 'gerente',
  'responsável', 'proprietário', 'dono', 'falar com carlos'
]

function deveEscalar(mensagem: string): boolean {
  const lower = mensagem.toLowerCase()
  return ESCALADA_TRIGGERS.some(t => lower.includes(t))
}

interface Mensagem {
  role: 'user' | 'assistant'
  content: string
}

const HISTORICO_MAX_MSGS = 20
const HISTORICO_TTL_S    = 86400 * 3  // 3 dias

async function carregarHistorico(numero: string): Promise<Mensagem[]> {
  const redis = getRedis()
  const raw = await redis.get(`sdr:hist:${numero}`)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch (err) {
    console.error(`[SDR] Histórico corrompido para ${numero}:`, err)
    return []
  }
}

async function salvarHistorico(numero: string, historico: Mensagem[]): Promise<void> {
  const redis = getRedis()
  const recente = historico.slice(-HISTORICO_MAX_MSGS)
  await redis.setex(`sdr:hist:${numero}`, HISTORICO_TTL_S, JSON.stringify(recente))
}

export async function processarMensagemSDR(numero: string, textoCliente: string, nomeCliente?: string): Promise<void> {
  // Verifica se cliente quer falar com humano
  if (deveEscalar(textoCliente)) {
    await responderLead({
      numero,
      mensagem: 'Um momento! Vou conectar você com nossa especialista. Ela entrará em contato em instantes pelo número (11) 91280-8282.',
    })
    await notificarEscalada(
      randomUUID(),
      'escalada-whatsapp',
      `Cliente ${numero} pediu atendimento humano. Última mensagem: "${textoCliente}"`
    )
    console.log(`[SDR] Escalada solicitada por ${numero}`)
    return
  }

  const historico = await carregarHistorico(numero)
  const primeiraMensagem = historico.length === 0
  historico.push({ role: 'user', content: textoCliente })

  let instrucaoInicial = ''
  if (primeiraMensagem) {
    if (nomeCliente) {
      instrucaoInicial = `\n\n## INSTRUÇÃO OBRIGATÓRIA PARA ESTA RESPOSTA\nVocê é FLORA, assistente da Enemeop Flores. A pessoa que está te enviando esta mensagem se chama **${nomeCliente}**. Cumprimente-a pelo nome de forma calorosa. NÃO peça o nome — você já sabe. NÃO se identifique como ${nomeCliente} — você é Flora.`
    } else {
      instrucaoInicial = '\n\n## INSTRUÇÃO OBRIGATÓRIA PARA ESTA RESPOSTA\nEsta é a PRIMEIRA mensagem do cliente. Independente do que ele escreveu, sua resposta DEVE começar pedindo o nome dele. Exemplo: "Oi, pode me dizer seu nome pra eu te atender melhor?" — depois disso pode responder o conteúdo da mensagem se necessário.'
    }
  }

  const systemFinal = SYSTEM_PROMPT + instrucaoInicial

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemFinal },
      ...historico,
    ],
    temperature: 0.7,
    max_tokens: 400,
  })

  const resposta = response.choices[0]?.message?.content ?? 'Olá! Obrigada pelo contato com a Enemeop Flores 🌸 Como posso te ajudar?'

  historico.push({ role: 'assistant', content: resposta })
  await salvarHistorico(numero, historico)

  // Tenta extrair nome do cliente do histórico e salvar no Supabase
  const nomeMatch = historico
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ')
    .match(/(?:me\s+chamo|meu\s+nome\s+[eé]|sou\s+[oa]?\s*)([A-ZÁÉÍÓÚÂÊÎÔÛÃÕ][a-záéíóúâêîôûãõ]+)/i)

  if (nomeMatch?.[1]) {
    await getSupabase()
      .from('leads')
      .update({ nome: nomeMatch[1] })
      .eq('telefone', numero)
  }

  await responderLead({ numero, mensagem: resposta })
  console.log(`[SDR] Respondido ${numero}: ${resposta.substring(0, 80)}...`)
}

export async function processarMensagemSDRInstagram(
  canalId: string,
  textoCliente: string,
  opts?: { leadId?: string; nomeExibido?: string }
): Promise<void> {
  if (deveEscalar(textoCliente)) {
    await responderInstagram(canalId,
      'Um momento! Vou conectar você com nossa especialista. Ela entrará em contato em instantes pelo número (11) 91280-8282.'
    )
    return
  }

  const chave = `ig:${canalId}`
  const historico = await carregarHistorico(chave)
  const primeiraMensagem = historico.length === 0
  historico.push({ role: 'user', content: textoCliente })

  const systemFinal = primeiraMensagem
    ? SYSTEM_PROMPT + '\n\n## INSTRUÇÃO OBRIGATÓRIA PARA ESTA RESPOSTA\nEsta é a PRIMEIRA mensagem do cliente. Independente do que ele escreveu, sua resposta DEVE começar pedindo o nome dele. Exemplo: "Oi, pode me dizer seu nome pra eu te atender melhor?" — depois disso pode responder o conteúdo da mensagem se necessário.'
    : SYSTEM_PROMPT

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'system', content: systemFinal }, ...historico],
    temperature: 0.7,
    max_tokens: 400,
  })

  const resposta = response.choices[0]?.message?.content ?? 'Olá! Obrigada pelo contato com a Enemeop Flores. Como posso te ajudar?'
  historico.push({ role: 'assistant', content: resposta })
  await salvarHistorico(chave, historico)

  // Extrai nome do histórico
  const nomeMatch = historico
    .filter(m => m.role === 'user').map(m => m.content).join(' ')
    .match(/(?:me\s+chamo|meu\s+nome\s+[eé]|sou\s+[oa]?\s*|chamo\s+)([A-ZÁÉÍÓÚÂÊÎÔÛÃÕ][a-záéíóúâêîôûãõ]+)/i)
  const nome = nomeMatch?.[1] ?? opts?.nomeExibido ?? null

  // Salva conversa no Supabase para o Monitor Social
  if (opts?.leadId) {
    await salvarConversa({
      leadId: opts.leadId,
      canalId,
      canal: 'instagram',
      historico,
      nomeExibido: nome ?? undefined,
    })
    // Atualiza nome no lead se encontrado
    if (nome) {
      await getSupabase().from('leads').update({ nome, nome_exibido: nome }).eq('id', opts.leadId)
    }
  }

  await responderInstagram(canalId, resposta)
  console.log(`[SDR/Instagram] Respondido ${canalId}: ${resposta.substring(0, 80)}...`)
}
