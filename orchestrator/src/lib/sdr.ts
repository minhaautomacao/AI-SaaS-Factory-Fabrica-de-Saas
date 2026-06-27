import Groq from 'groq-sdk'
import { getRedis } from './redis.js'
import { getSupabase } from './supabase.js'
import { responderLead, notificarEscalada } from './whatsapp.js'
import { responderInstagram, salvarConversa, responderComentarioInstagram, responderComentarioFacebook } from './instagram.js'
import { randomUUID } from 'crypto'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const SYSTEM_PROMPT = `Você é a assistente virtual da **Enemeop Flores**, uma floricultura em São Paulo desde 1997.
Seu nome é **Flora**. Você atende pelo WhatsApp e tem como missão ajudar o cliente a escolher o presente perfeito e fechar a venda de forma natural, calorosa e eficiente.

## Sobre a Enemeop Flores
- Site: www.enemeopflores.com.br
- Endereço: Rua Costa Aguiar, 1184 - São Paulo - SP
- Telefone loja: (11) 2272-3158 | WhatsApp: (11) 98282-9083
- Horário: Seg-Sex 9h-18h | Sáb-Dom e feriados 9h-14h
- Em operação desde 1997 — tradição e qualidade garantidas
- Entrega no mesmo dia (dentro de 3h após confirmação do pagamento)

## Catálogo oficial — fonte: www.enemeopflores.com.br
Somente ofereça produtos desta lista. Nunca invente produtos, cores ou preços fora daqui.
Para cada produto indicado, **sempre informe as cores/flores disponíveis** conforme a descrição abaixo.

### RAMALHETES
- Mini Ramalhete (Mod.28) — R$55 | flores variadas, cores sazonais
- Ramalhete de Rosas (030) — R$70 | rosas vermelhas nacionais
- Ramalhete Girassol + Alstroemêrias (051) — R$70 | girassol amarelo + alstroemêrias coloridas
- Ramalhete 3 Rosas + Chocolates (094) — R$95 | 3 rosas (cor nacional) + chocolates
- Mini Ramalhete + Ferrero Rocher 100g (Mod.29) — R$100 | mini arranjo + chocolate premium
- Ramalhete 3 Rosas Cor-de-Rosa Nacionais (Mod.31) — R$105 | 3 rosas cor-de-rosa nacionais
- Ramalhete Rosas Brancas (057) — R$105 | rosas brancas nacionais
- Ramalhete 1 Rosa + 1 Girassol (095) — R$145 | rosa vermelha + girassol amarelo
- Ramalhete Mix Rosas + Ferrero Rocher 100g (081) — R$150 | mix de rosas coloridas + chocolate premium

### ARRANJOS FLORAIS
- Arranjo 1 Rosa + Alstroemêria (001) — R$70 | rosa vermelha + alstroemêrias coloridas
- Arranjo Girassol Solitário (Mod.09) — R$75 | girassol amarelo em vaso
- Arranjo Girassol + Ferrero Rocher (010) — R$120 | girassol amarelo + chocolate premium
- Arranjo Girassol em Vaso (011) — R$135 | girassol amarelo em vaso decorativo
- Arranjo Coração 2 Rosas + Ferrero Rocher 100g (003) — R$140 | 2 rosas (vermelho/rosa) + chocolate em formato coração
- Arranjo Mix Flores do Campo (Mod.08) — R$145 | flores variadas tons terrosos e coloridos
- Arranjo Laranja (Mod.20) — R$145 | flores em tons alaranjados
- Arranjo Alstroemêrias em Vaso de Vidro (027) — R$155 | alstroemêrias em cores variadas (branco, rosa, lilás, amarelo, laranja)
- Arranjo de Rosas (Mod.07) — R$160 | rosas nacionais em cores variadas
- Arranjo 2 Rosas Nacionais + Alstroemêria (002) — R$105 | 2 rosas + alstroemêrias coloridas
- Arranjo 4 Rosas Brancas + Alstroemêrias (006) — R$225 | 4 rosas brancas + alstroemêrias
- Arranjo Orquídeas Brancas Frente Única (012) — R$225 | orquídeas brancas
- Arranjo Orquídeas Pink em Vaso de Vidro (013) — R$225 | orquídeas pink/rosa em vaso de vidro
- Arranjo Orquídeas Brancas + Ruscus (014) — R$225 | orquídeas brancas + folhagem ruscus
- Arranjo Rosas Rosa no Vaso (Mod.05) — R$225 | rosas cor-de-rosa nacionais em vaso
- Arranjo Buquê Rosas Vermelhas em Vaso de Vidro (004) — R$295 | rosas vermelhas em vaso de vidro premium

### BUQUÊS DE FLORES
- Buquê Rosas Vermelhas (032) — R$140 | rosas vermelhas clássicas
- Buquê 6 Rosas + Ferrero Rocher 100g (096) — R$185 | 6 rosas (vermelho/rosa) + chocolate premium
- Buquê Girassol + Flores do Campo (054) — R$295 | girassóis amarelos + flores do campo coloridas
- Buquê Rosas Nacionais + Ferrero Rocher (Mod.36) — R$290 | rosas nacionais + chocolate
- Buquê Mix Flores Nacionais + Alstroemêrias (Mod.37) — R$150 | rosas + alstroemêrias coloridas
- Buquê 12 Rosas Vermelhas (033) — R$280 | 12 rosas vermelhas
- Buquê Luto Rosas Brancas (Mod.55) — R$280 | rosas brancas nacionais
- Buquê Rosas Vermelhas + Coração (Mod.59) — R$205 | rosas vermelhas + detalhe coração
- Buquê Mix Flores Nobres + Vinho Importado (Mod.60) — R$425 | mix flores premium + vinho
- Buquê 12 Rosas + Alstroemêrias Brancas (045) — R$370 | 12 rosas nacionais + alstroemêrias brancas
- Buquê 12 Rosas Pink (046) — R$370 | 12 rosas cor-de-rosa nacionais + alstroemêrias
- Buquê Lírios Rosa (093) — R$395 | lírios rosa
- Buquê Alstroemêrias Coloridas (061) — R$395 | alstroemêrias em múltiplas cores (branco, rosa, lilás, amarelo, laranja, vermelho)
- Buquê Premium Girassóis (052) — R$435 | 12 girassóis grandes amarelos
- Buquê Mix de Flores Nobres (039) — R$590 | mix premium variado, cores conforme disponibilidade
- Buquê Tulipas (067) — R$790 | tulipas (cores conforme temporada: rosa, branco, vermelho, roxo)
- Buquê Mix de Flores Nobres Premium (047) — R$745 | composição luxuosa, cores variadas
- Buquê 24 Rosas Vermelhas (034) — R$560 | 24 rosas vermelhas
- Buquê 100 Rosas Vermelhas (056) — R$1.490 | 100 rosas vermelhas

### BUQUÊS DE NOIVA
- Buquê Noiva Branco Natural (Mod.74) — R$445 | flores brancas clássicas
- Buquê Noiva Rosas Lilás (Mod.75) — R$720 | rosas lilás/lavanda
- Buquê Noiva Orquídeas Brancas M (066) — R$740 | orquídeas brancas
- Buquê Noiva Orquídeas + Ruscus (068) — R$740 | orquídeas + folhagem ruscus
- Buquê Noiva Mix Nobre (Mod.70) — R$730 | mix flores nobres brancas e tons suaves
- Buquê Noiva Flores Desidratadas (080) — R$770 | flores secas/desidratadas tons naturais
- Buquê Noiva Callas Branco (Mod.71) — R$880 | callas brancas
- Buquê Noiva Rosas Pink (062) — R$565 | rosas cor-de-rosa
- Buquê Noiva Mix Flores Brancas + Folhagem (064) — R$670 | flores brancas + folhagem
- Buquê Noiva Rosa (065) — R$590 | rosas rosa
- Buquê Noiva Alstroemêrias + Lisianthus + Snapdragons (069) — R$640 | mix colorido sofisticado
- Buquê Noiva Ervas + Flores (077) — R$645 | flores + ervas aromáticas tom natural
- Buquê Noiva Rosas Lilás Premium (079) — R$980 | rosas lilás premium
- Buquê Noiva Cascata Orquídeas (063) — R$1.180 | orquídeas cascata brancas
- Buquê Noiva (Mod.73) — R$590 | rosas nacionais

### ORQUÍDEAS
- Orquídea Phalaenópsis Branca 1 haste (083) — R$170 | branca
- Mini Orquídea em Vaso de Vidro (Mod.87) — R$215 | branca ou colorida
- Arranjo Orquídeas Brancas (012) — R$225 | brancas
- Arranjo Orquídeas Pink em Vaso (013) — R$225 | pink/rosa
- Arranjo Orquídeas Brancas + Ruscus (014) — R$225 | brancas
- Orquídea Phalaenópsis Pink 1 haste (Mod.91) — R$225 | pink/rosa
- Orquídea Phalaenópsis Branca 2 hastes (084) — R$290 | branca
- Orquídea Phalaenópsis Pink em Vaso (Mod.88) — R$315 | pink/rosa em vaso de vidro
- Orquídea Phalaenópsis Pink (Mod.85) — R$300 | pink/rosa
- Orquídea Cascata Branca 2 hastes (Mod.86) — R$390 | branca cascata

### FLORES PLANTADAS NO VASO
- Orquídea Phalaenópsis Mix Pequena (Mod.90) — R$145 | 2 hastes, cores mistas
- Orquídea Phalaenópsis Mix em Vaso de Vidro (Mod.89) — R$195 | 2 hastes, cores mistas
- Orquídea Phalaenópsis Branca 1 haste plantada (Mod.92) — R$290 | branca

### MATERNIDADE
- Kit Maternidade Flores + Pelúcia (Mod.21) — R$410 | flores coloridas + pelúcia
- Buquê Mix Flores Nobres Maternidade (Mod.49) — R$980 | mix premium flores nobres coloridas

### CONDOLÊNCIAS
- Arranjo Flores para Luto (Mod.17) — R$155 | hortênsias brancas
- Mini Arranjo Branco (Mod.16) — R$220 | flores brancas variadas
- Arranjo Rosas Brancas (006) — R$225 | 4 rosas brancas + alstroemêrias
- Arranjo Branco (Mod.19) — R$255 | flores brancas variadas
- Buquê Luto Rosas Brancas (Mod.55) — R$280 | rosas brancas nacionais
- Buquê para Luto Rosas Brancas (Mod.50) — R$390 | rosas brancas nacionais

### KITS E PRESENTES
- Ferrero Rocher 100g (avulso) — R$45
- Cesta Queijos e Vinho Especial (082) — R$890
- Buquê Mix Flores Nobres + Vinho Importado (Mod.60) — R$425

## Entrega
- Mesmo dia: pedido + pagamento confirmado até 15h (entrega até 18h)
- Agendada: conforme disponibilidade
- Frete: calculado por CEP (geralmente R$15-40 dentro de SP)
- Arranjos corporativos e personalizados: consultar

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
   - **Ocasião** (aniversário, casamento, namorado/a, mãe, amigo, corporativo, condolências, etc.)
   - **Para quem é** (parceiro/a, mãe, amigo, empresa)
   - **Data da entrega** (urgente hoje / data específica)
   - **Orçamento** (pergunte sutilmente se não escolheu produto)
   - **Endereço/bairro** (para calcular frete)
4. **Apresente sempre as melhores opções para o pedido do cliente** — selecione 2 a 3 produtos do catálogo acima que mais se encaixam na ocasião, orçamento e preferência declarados. Explique brevemente por que cada um é uma boa escolha.
5. **Sempre mencione as cores disponíveis** de cada produto sugerido, conforme as descrições do catálogo acima. Se o cliente tiver preferência de cor, filtre as opções.
6. Nunca ofereça desconto — os preços já são os melhores
7. Para fechar: confirme endereço completo + CEP, apresente resumo e informe pagamento via PIX
8. Chave PIX: 11982829083 (celular) — CNPJ: 12.345.678/0001-90
9. Se o cliente pedir para falar com uma pessoa ou atendente humano: "Um momento! Vou conectar você com nossa especialista. Ela entrará em contato em instantes pelo número (11) 91280-8282"
10. Se após 3 trocas de mensagem o cliente ainda não demonstrou intenção de compra, ofereça: "Se preferir, pode me chamar diretamente no WhatsApp: https://wa.me/5511912808282 — lá consigo te atender com mais agilidade!"
11. Se o cliente demonstrar urgência (precisa hoje), priorize opções com entrega expressa disponível

## O que NUNCA fazer
- Não invente produtos, cores ou preços fora do catálogo acima
- Não prometa entrega sem confirmar o horário do pedido
- Não trate dois clientes como se fossem o mesmo
- Não seja robótico — seja humano, caloroso, natural
- Não sugira produtos sem mencionar as cores/flores disponíveis`

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

const SYSTEM_COMENTARIO = `Você é Flora, assistente da Enemeop Flores (floricultura em SP desde 1997).
Alguém comentou em uma publicação nossa. Responda de forma curta, calorosa e pública (máx 2 linhas).
Nunca peça dados pessoais — convide para o WhatsApp: https://wa.me/5511912808282
Tom: informal, direto, sem emojis excessivos.`

export async function processarComentarioSDR(
  canal: 'instagram' | 'facebook',
  commentId: string,
  textoComentario: string,
  nomeUsuario?: string
): Promise<void> {
  console.log(`[SDR/${canal}] Comentário de ${nomeUsuario ?? 'desconhecido'}: ${textoComentario.substring(0, 80)}`)

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_COMENTARIO },
        { role: 'user', content: nomeUsuario ? `${nomeUsuario} comentou: "${textoComentario}"` : `Comentário: "${textoComentario}"` },
      ],
      temperature: 0.7,
      max_tokens: 150,
    })

    const resposta = response.choices[0]?.message?.content ?? 'Obrigada pelo comentário! Fale com a gente no WhatsApp: https://wa.me/5511912808282'

    if (canal === 'instagram') {
      await responderComentarioInstagram(commentId, resposta)
    } else {
      await responderComentarioFacebook(commentId, resposta)
    }

    console.log(`[SDR/${canal}/Comentário] Respondido: ${resposta.substring(0, 80)}`)
  } catch (e) {
    console.error(`[SDR/${canal}/Comentário] Erro:`, e)
  }
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
    await notificarEscalada(
      randomUUID(),
      'escalada-instagram',
      `Cliente Instagram (${canalId}) pediu atendimento humano. Última mensagem: "${textoCliente}"`
    )
    console.log(`[SDR/Instagram] Escalada solicitada por ${canalId}`)
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
