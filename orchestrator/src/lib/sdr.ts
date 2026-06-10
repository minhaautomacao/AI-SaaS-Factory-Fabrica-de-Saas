import Groq from 'groq-sdk'
import { getRedis } from './redis.js'
import { getSupabase } from './supabase.js'
import { responderLead, notificarEscalada } from './whatsapp.js'
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

## Catálogo atual (Dia dos Namorados 2026)
- Buquê pequeno 3 rosas + chocolates — R$ 95,00
- Buquê pequeno 1 rosa + 1 girassol — R$ 145,00
- Buquê 6 rosas + Ferrero Rocher 100g — R$ 185,00
- Buquê 12 rosas nacionais rosa + alstroeméria — R$ 370,00
- Buquê 24 rosas vermelhas — R$ 560,00
- Buquê de tulipas — R$ 790,00
- Buquê tulipas brancas (noiva) — R$ 720,00
- Buquê lírios rosa — R$ 395,00
- Arranjos corporativos e personalizados: consultar

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
8. Se o cliente pedir para falar com uma pessoa ou atendente humano: "Um momento! Vou conectar você com nossa especialista. Ela entrará em contato em instantes pelo número (11) 98282-9083 😊"
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

async function carregarHistorico(numero: string): Promise<Mensagem[]> {
  const redis = getRedis()
  const raw = await redis.get(`sdr:hist:${numero}`)
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

async function salvarHistorico(numero: string, historico: Mensagem[]): Promise<void> {
  const redis = getRedis()
  // Mantém no máximo 20 mensagens (10 turnos) para controlar tokens
  const recente = historico.slice(-20)
  await redis.setex(`sdr:hist:${numero}`, 86400 * 3, JSON.stringify(recente)) // 3 dias
}

export async function processarMensagemSDR(numero: string, textoCliente: string): Promise<void> {
  // Verifica se cliente quer falar com humano
  if (deveEscalar(textoCliente)) {
    await responderLead({
      numero,
      mensagem: 'Um momento! Vou conectar você com nossa especialista. Ela entrará em contato em instantes pelo número (11) 98282-9083 😊',
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

  const systemFinal = primeiraMensagem
    ? SYSTEM_PROMPT + '\n\n## INSTRUÇÃO OBRIGATÓRIA PARA ESTA RESPOSTA\nEsta é a PRIMEIRA mensagem do cliente. Independente do que ele escreveu, sua resposta DEVE começar pedindo o nome dele. Exemplo: "Oi, pode me dizer seu nome pra eu te atender melhor?" — depois disso pode responder o conteúdo da mensagem se necessário.'
    : SYSTEM_PROMPT

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
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
