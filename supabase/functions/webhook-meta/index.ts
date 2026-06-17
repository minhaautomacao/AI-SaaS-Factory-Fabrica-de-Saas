/**
 * webhook-meta — Agente de Vendas com Memória de Conversa
 *
 * Fluxo completo por fase:
 *   descoberta        → entende o que o cliente quer (explora catálogo)
 *   interesse         → produto definido, coleta detalhes (data, endereço)
 *   proposta          → apresenta valor e forma de pagamento
 *   aguardando_pag    → link de pagamento enviado
 *   concluido         → pagamento confirmado, pedido agendado
 *
 * Variáveis de ambiente:
 *   META_VERIFY_TOKEN, META_APP_SECRET, META_IG_ACCESS_TOKEN
 *   FACTORY_SECRET, SAAS_WORKSPACE_ID
 *   GROQ_API_KEY (ou ANTHROPIC_API_KEY como fallback)
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injetados)
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const VERIFY_TOKEN   = Deno.env.get('META_VERIFY_TOKEN') ?? '';
const APP_SECRET     = Deno.env.get('META_APP_SECRET') ?? '';
const FACTORY_SECRET = Deno.env.get('FACTORY_SECRET') ?? '';
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const WORKSPACE_ID   = Deno.env.get('SAAS_WORKSPACE_ID') ?? '';
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL') ?? '';
const IG_TOKEN       = Deno.env.get('META_IG_ACCESS_TOKEN') ?? '';
const PAGE_TOKEN     = Deno.env.get('META_PAGE_ACCESS_TOKEN') ?? '';
const WHATSAPP_NUM   = '5511912808282';

// ── Catálogo de produtos (extraído de enemeopflores.com.br) ──────────────────

const CATALOGO = `
SOBRE A ENEMEOP FLORES:
Fundada em 1997 por Clean Espindula e Luis Evangelista. "ENEMEOP" vem do Tupi-Guarani e significa "perfume das flores".
Missão: "Prover produtos e serviços com alta qualidade e estilo próprio, garantindo a excelência no atendimento."
Localização: Rua Costa Aguiar, 1184 — Ipiranga, São Paulo, SP.
Telefone: (11) 98282-9083 / (11) 2272-3158.
Funcionamento: Seg–Sáb 9h–19h | Dom e Feriados 9h30–14h.
Entrega: até 3h após confirmação de pagamento. Área: São Paulo e Grande SP.
Entrega disponível: Seg–Sex 9h–18h | Sáb, Dom e Feriados 9h–14h.

CATÁLOGO COMPLETO DE PRODUTOS:

RAMALHETES (opções compactas, presentes rápidos):
- Mini Ramalhete (Mod.28): R$ 55
- Ramalhete Girassol e Alstroemêrias (051): R$ 70
- Ramalhete de Rosas (030): R$ 70
- Mini Ramalhete + Ferrero Rocher (Mod.29): R$ 100
- Ramalhete 3 Rosas + Chocolates (094): R$ 95
- Ramalhete Rosas Brancas (057): R$ 105
- Ramalhete 3 Rosas Nacionais Rosa (Mod.31): R$ 105
- Ramalhete Mix Rosas + Ferrero Rocher (081): R$ 150

ARRANJOS FLORAIS (em vaso, para decoração e presentes):
- Modelo 01 – Arranjo no Vaso de Vidro: R$ 70
- Arranjo Girassol Solitário (Mod.09): R$ 75
- Arranjo Flores Luto Hortênsias (Mod.17): R$ 155
- Arranjo com Alstroemêrias no Vaso de Vidro (027): R$ 155
- Arranjo de Rosas (Mod.07): R$ 160
- Arranjo Girassol em Vaso + Ferrero Rocher (010): R$ 120
- Arranjo Mix Flores do Campo (Mod.08): R$ 145
- Arranjo Girassol no Vaso (011): R$ 135
- Arranjo 2 Rosas Nacionais e Junco (002): R$ 105
- Arranjo Coração 2 Rosas + Ferrero Rocher (003): R$ 140
- Arranjo 4 Rosas Brancas e Alstroemêrias (006): R$ 225
- Arranjo Orquídeas Brancas Frente Única (012): R$ 225
- Arranjo Orquídeas Pink Vaso de Vidro (013): R$ 225
- Arranjo Orquídeas Brancas e Ruscus (014): R$ 225
- Arranjo Rosas Rosa no Vaso (Mod.05): R$ 225
- Arranjo de Alstroemêrias (Mod.24): R$ 265
- Arranjo Girassóis (Mod.26): R$ 255
- Mini Arranjo Branco (Mod.16): R$ 220
- Arranjo Branco (Mod.19): R$ 255
- Arranjo Laranja (Mod.20): R$ 145
- Arranjo Girassol e Flores do Campo (Mod.25): R$ 295
- Arranjo Rosas Vermelhas Nacionais no Vidro (Mod.18): R$ 425
- Buquê de Rosas no Vaso de Vidro (004): R$ 295
- Buquê 12 Rosas Rosa no Vaso de Vidro (Mod.58): R$ 425
- Arranjo Exclusivo Orquídeas Cymbidium (Mod.22): R$ 225
- Arranjo Orquídeas Cymbidium Amarelas (Mod.23): R$ 225
- Arranjo Permanente (Mod.15): R$ 1.280
- Arranjo Permanente Grande (Mod.14): R$ 2.550

BUQUÊS DE FLORES (os mais pedidos):
- Buquê de Rosas Vermelhas (032): R$ 140
- Buquê 6 Rosas Vermelhas Nacionais (Mod.35): R$ 185
- Buquê 6 Rosas Nacionais (Mod.44): R$ 185
- Buquê de Rosas Vermelhas + Coração (Mod.59): R$ 205
- Buquê Rosas Nacionais Vermelhas (Mod.43): R$ 245
- Buquê de Rosas Brancas (Mod.55): R$ 280
- Buquê 12 Rosas Vermelhas (033): R$ 280
- Buquê Rosas Nacionais + Ferrero Rocher (Mod.36): R$ 290
- Buquê Mix Alstroemêrias (Mod.40): R$ 295
- Buquê Mix Flores com Girassóis e Campo (054): R$ 295
- Buquê Luto Rosas Brancas (Mod.50): R$ 390
- Buquê com Lírios Rosa (093): R$ 395
- Buquê Luxuoso Alstroemêrias Coloridas (061): R$ 395
- Buquê 12 Rosas Rosa Nacionais e Alstroemêrias (045/046): R$ 370
- Buquê 12 Rosas Pink Nacionais (Mod.38): R$ 370
- Buquê 12 Rosas Nacionais Rosa (Mod.41): R$ 370
- Buquê Mix Flores Nacionais + Ferrero (Mod.37): R$ 150
- Buquê Especial Rosas e Juncos (Mod.48): R$ 420
- Buquê Mix Flores Nobre + Vinho Importado (Mod.60): R$ 425
- Buquê Mix de Flores (Mod.42): R$ 495
- Buquê 24 Rosas Vermelhas (034): R$ 560
- Buquê de Noiva Rosas Pink (062): R$ 565
- Buquê Mix Flores Nobre (039): R$ 590
- Buquê Mix de Flores (047): R$ 745
- Buquê 12 Girassóis Premium (052): R$ 435
- Buquê 100 Rosas Vermelhas (056): R$ 1.490

BUQUÊS DE NOIVA (para casamentos e formaturas):
- Buquê Noiva Natural Branco (Mod.74): R$ 445
- Buquê Noiva Mix Flores Brancas (Mod.78): R$ 490
- Buquê Noiva (Mod.73/065): R$ 590
- Buquê Noiva Noiva Rosas Lilás (Mod.75): R$ 720
- Buquê Noiva Orquídeas Brancas M (066): R$ 740
- Buquê Noiva Orquídeas e Juncos (068): R$ 740
- Buquê Tulipas Brancas Noiva (094): R$ 720
- Buquê Tulipas (067): R$ 790
- Buquê Noiva Natural Rosas Brancas e Spray (Mod.76): R$ 570
- Buquê Noiva Mix Nobre (Mod.70): R$ 730
- Buquê Noiva com Callas Branco (Mod.71): R$ 880
- Buquê Noiva Mix (069): R$ 640
- Buquê Noiva com Ervas e Flores (077): R$ 645
- Buquê Noiva Flores Desidratadas (080): R$ 770
- Buquê Noiva Mix Flores Nobres (079): R$ 980
- Buquê Noiva Cascata de Orquídeas (063): R$ 1.180
- Buquê Noiva Flores Brancas e Folhagens (064): R$ 670

ORQUÍDEAS (ótimas para decoração duradoura):
- Mini Orquídea no Vaso de Vidro (Mod.87): R$ 215
- Orquídea Phalaenópsis Mescla pequena 2 hastes (Mod.90): R$ 145
- Orquídea Phalaenópsis Mescla em Vaso (Mod.89): R$ 195
- Orquídea Branca Phalaenópsis 1 haste (083): R$ 170
- Orquídea Phalaenópsis Pink 1 haste (Mod.91): R$ 225
- Orquídea Phalaenópsis Branca 1 haste (Mod.92): R$ 290
- Orquídea Phalaenópsis Branca 2 hastes (084): R$ 290
- Orquídea Phalaenópsis Pink (Mod.85): R$ 300
- Orquídea Phalaenópsis Pink no Vaso de Vidro (Mod.88): R$ 315
- Orquídea Phalaenópsis Cascata Branca 2 hastes (Mod.86): R$ 390
- Arranjo Orquídeas Brancas Frente Única (012): R$ 225

MATERNIDADE E BEBÊ:
- Kit Maternidade Flores e Pelúcia (Mod.21): R$ 410
- Buquê Mix Flores Nobres Maternidade (Mod.49): R$ 980

KITS E PRESENTES:
- Ferrero Rocher 100g: R$ 45
- Cesta de Queijos e Vinho Especial (082): R$ 890

FORMAS DE PAGAMENTO: Cartão de crédito, PIX, online seguro.
PERSONALIZAÇÃO: arranjos sob encomenda disponíveis — cliente descreve e a equipe cria.

CATÁLOGO ESPECIAL — DIA DOS NAMORADOS (12 de junho):
Dois catálogos exclusivos com rosas vermelhas nacionais, embalagem kraft+celofane, cartão Enemeop incluído.

Catálogo 1 — com alstroemárias (mais volumoso e elaborado):
- Ramalhete 3 rosas vermelhas + alstroemárias e folhagens: R$ 105
- Buquê 6 rosas + alstroemárias e folhagens: R$ 185
- Buquê 12 rosas nacionais premium: R$ 280
- Buquê 24 rosas nacionais: R$ 560
- Buquê 24 rosas + alstroemárias e folhagens (grandioso): R$ 740

Catálogo 2 — versão clássica e elegante:
- Ramalhete 3 rosas vermelhas: R$ 70
- Buquê 6 rosas vermelhas: R$ 140
- Buquê 12 rosas nacionais: R$ 280
- Buquê 24 rosas nacionais: R$ 560

INSTRUÇÃO DIA DOS NAMORADOS: Se o cliente mencionar namorado(a), presente romântico ou a data 12 de junho, apresente esses produtos como linha especial. Em momento natural da conversa, ofereça enviar o catálogo visual pelo WhatsApp.
`.trim();

// ── Supabase client ──────────────────────────────────────────────────────────

function getDb() {
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

async function buscarConfigDB(chave: string): Promise<string> {
  try {
    const db = getDb();
    const { data } = await db.from('funcao_configs').select('valor').eq('chave', chave).single();
    return (data?.valor as string) ?? '';
  } catch { return ''; }
}

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Mensagem { role: 'user' | 'assistant'; content: string; ts: string; }

interface Conversa {
  id: string;
  canal_id: string;
  canal: string;
  fase: string;
  historico: Mensagem[];
  pedido_info: Record<string, unknown> | null;
  lead_id: string | null;
  nome_cliente: string | null;
}

// ── Busca nome do cliente via Instagram Graph API ────────────────────────────

async function buscarNomeCliente(canalId: string): Promise<string | null> {
  const token = IG_TOKEN || await buscarConfigDB('META_IG_ACCESS_TOKEN');
  if (!token) return null;
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${canalId}?fields=name&access_token=${token}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const nome = (data.name as string)?.split(' ')[0] ?? null; // só o primeiro nome
    return nome;
  } catch {
    return null;
  }
}

// ── Gerenciamento de conversa ────────────────────────────────────────────────

async function buscarOuCriarConversa(canalId: string, canal: string): Promise<Conversa> {
  const db = getDb();
  const { data } = await db
    .from('conversas')
    .select('*')
    .eq('canal_id', canalId)
    .eq('canal', canal)
    .single();

  if (data) return data as Conversa;

  const { data: nova } = await db
    .from('conversas')
    .insert({ canal_id: canalId, canal, workspace_id: WORKSPACE_ID || null })
    .select('*')
    .single();

  return nova as Conversa;
}

async function salvarConversa(id: string, updates: Partial<Conversa>): Promise<void> {
  const db = getDb();
  await db.from('conversas').update({ ...updates, atualizado_em: new Date().toISOString() }).eq('id', id);
}

// ── Prompt do agente de vendas ───────────────────────────────────────────────

function buildSystemPrompt(fase: string, pedidoInfo: Record<string, unknown> | null, nomeCliente: string | null): string {
  const nome = nomeCliente ?? null;
  return `Você é uma consultora virtual especializada em atendimento premium para floricultura. Representa a Enemeop Flores — floricultura no Ipiranga, São Paulo, desde 1997. Seu nome é Flor.

${nome ? `O cliente se chama ${nome}. Use o nome de forma natural e moderada durante a conversa, sem repetição excessiva. Exemplo: "${nome}, me conta um pouco sobre a ocasião."` : ''}

${CATALOGO}

FASE ATUAL DA CONVERSA: ${fase}
${pedidoInfo ? `PEDIDO EM ANDAMENTO: ${JSON.stringify(pedidoInfo)}` : ''}

IDENTIDADE E COMPORTAMENTO:
Você age como uma atendente real experiente — natural, humana, fluida, educada, sofisticada e acolhedora. Nunca parece um robô, um FAQ ou telemarketing. Não usa respostas mecânicas, não exagera simpatia, não usa diminutivos desnecessários, não usa frases prontas repetitivas. No máximo 1 emoji por mensagem, somente se fizer sentido real.

OBJETIVO DA CONVERSA:
Descobrir, na ordem certa e fazendo UMA pergunta por vez:
1. Qual é a ocasião (aniversário, namoro, casamento, maternidade, condolências, agradecimento, etc.)
2. Para quem é (esposa, mãe, namorado, cliente, empresa, etc.)
3. Perfil da pessoa presenteada (delicada, sofisticada, alegre, romântica, clássica)
4. Preferências (flores, cores, estilo, tamanho)
5. Data e horário da entrega
6. Região da entrega
7. Faixa de valor (pergunte com naturalidade quando fizer sentido, não como primeiro tema)

COMO CONDUZIR:
- Faça uma pergunta por vez, de forma leve — nunca despeje várias perguntas
- Adapte o tom ao perfil do cliente conforme a conversa avança
- Observe sinais emocionais e perceba urgência
- Oriente, compare opções e explique diferenças — não apenas liste produtos
- Interprete o sentimento: clientes românticos → rosas/tulipas premium; clientes discretos → tons claros e elegantes; clientes alegres → girassóis e flores vibrantes; condolências → brancos e sofisticados; maternidade → tons suaves

RECOMENDAÇÃO:
Apresente até 3 opções com preços do catálogo, explicando as diferenças. Sugira upgrade natural (cartão personalizado, chocolates, vaso, tamanho maior) sem pressionar. Se houver objeção de preço, ofereça alternativas equivalentes sem desvalorizar os produtos.

QUANDO O CLIENTE DECIDIR COMPRAR — colete:
nome completo, telefone, endereço completo, CEP, complemento, nome do presenteado, mensagem do cartão, data da entrega, período (manhã/tarde), forma de pagamento.
Após coletar tudo: informe que vai gerar o link de pagamento PIX.

ESCALONAMENTO PARA HUMANO:
Se houver reclamação, problema de pagamento, cliente irritado, personalização muito complexa ou negociação fora do padrão — informe que vai acionar uma atendente humana.

OBJETIVO FINAL:
O cliente deve sentir que foi ouvido, compreendido, recebeu ajuda verdadeira e está comprando algo especial e significativo — não que falou com um robô.

RETORNE APENAS O TEXTO DA RESPOSTA — sem aspas, sem prefixo, sem JSON.`;
}

// ── Análise de fase ──────────────────────────────────────────────────────────

function buildFasePrompt(historico: Mensagem[], ultimaMensagem: string, faseAtual: string): string {
  return `Você analisa conversas de venda de floricultura.
Com base no histórico e última mensagem, determine:
1. A nova fase da conversa
2. Se há pedido definido, extraia os detalhes
3. Se o cliente mencionou o próprio nome (ex: "me chamo Ana", "sou a Maria", "aqui é o João"), extraia

Fases possíveis: descoberta | interesse | proposta | aguardando_pagamento | concluido | perdido

Histórico: ${historico.slice(-4).map(m => `${m.role}: ${m.content}`).join(' | ')}
Última mensagem do cliente: "${ultimaMensagem}"
Fase atual: ${faseAtual}

Retorne APENAS JSON válido:
{
  "nova_fase": "string",
  "pedido_info": { "produto": "", "quantidade": 1, "data_entrega": "", "endereco": "", "valor": 0 } | null,
  "pronto_para_pagamento": false,
  "nome_cliente": null
}`;
}

// ── Chamada IA ───────────────────────────────────────────────────────────────

async function chamarIA(systemPrompt: string, mensagens: Array<{role: string; content: string}>, maxTokens = 120): Promise<string | null> {
  const groqKey = Deno.env.get('GROQ_API_KEY') || await buscarConfigDB('GROQ_API_KEY');
  if (groqKey) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) await new Promise(r => setTimeout(r, 1500));
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            max_tokens: maxTokens,
            messages: [{ role: 'system', content: systemPrompt }, ...mensagens],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          return (data.choices?.[0]?.message?.content as string)?.trim() ?? null;
        }
        if (res.status !== 429) { console.error(`[ia] Groq ${res.status}`); break; }
        console.warn('[ia] Groq rate limit, aguardando retry...');
      } catch (e) { console.error('[ia] Groq falhou:', e); break; }
    }
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY') || await buscarConfigDB('ANTHROPIC_API_KEY');
  if (anthropicKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: mensagens,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return (data.content?.[0]?.text as string)?.trim() ?? null;
      }
      console.error(`[ia] Anthropic ${res.status}: ${await res.text()}`);
    } catch (e) { console.error('[ia] Anthropic falhou:', e); }
  }

  return null;
}

// ── Gerar link de pagamento (PIX Mercado Pago — estrutura pronta) ─────────────

async function gerarLinkPagamento(pedidoInfo: Record<string, unknown>): Promise<string | null> {
  // TODO: integrar Mercado Pago quando credenciais estiverem disponíveis
  // Por ora retorna null → agente usa WhatsApp como fallback
  const mpToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
  if (!mpToken) return null;

  try {
    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mpToken}` },
      body: JSON.stringify({
        items: [{ title: String(pedidoInfo['produto'] ?? 'Arranjo Floral'), quantity: 1, unit_price: Number(pedidoInfo['valor'] ?? 0) }],
        payment_methods: { default_payment_method_id: 'pix' },
        statement_descriptor: 'Enemeop Flores',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.init_point as string;
    }
  } catch (e) { console.error('[pagamento] Mercado Pago falhou:', e); }
  return null;
}

// ── Processar DM com memória completa ────────────────────────────────────────

const MSG_FALLBACK = `Oi! Pra qual ocasião é?`;

async function processarDM(canalId: string, canal: string, mensagemCliente: string): Promise<void> {
  const igToken = IG_TOKEN || await buscarConfigDB('META_IG_ACCESS_TOKEN');
  if (!igToken) return;

  // 1. Buscar ou criar conversa
  const conversa = await buscarOuCriarConversa(canalId, canal);
  if (conversa.fase === 'concluido') return;

  // 2. Buscar nome do cliente (só na primeira mensagem da conversa)
  let nomeCliente = conversa.nome_cliente ?? null;
  if (!nomeCliente && conversa.historico.length === 0) {
    nomeCliente = await buscarNomeCliente(canalId);
    if (nomeCliente) {
      await salvarConversa(conversa.id, { nome_cliente: nomeCliente } as Partial<Conversa>);
    }
  }

  // 3. Adicionar mensagem do cliente ao histórico
  const novaMsg: Mensagem = { role: 'user', content: mensagemCliente, ts: new Date().toISOString() };
  const historico = [...(conversa.historico ?? []), novaMsg].slice(-20);

  // 4. Gerar resposta (sequencial para não sobrecarregar Groq rate limit)
  const respostaIA = await chamarIA(
    buildSystemPrompt(conversa.fase, conversa.pedido_info, nomeCliente),
    historico.map(m => ({ role: m.role, content: m.content })),
    350,
  );
  const analiseRaw = await chamarIA(
    buildFasePrompt(historico, mensagemCliente, conversa.fase),
    [{ role: 'user', content: mensagemCliente }],
    200,
  );

  // 5. Processar análise de fase
  let novaFase = conversa.fase;
  let pedidoInfo = conversa.pedido_info ?? null;
  let prontoParaPagamento = false;

  if (analiseRaw) {
    try {
      const analise = JSON.parse(analiseRaw.replace(/```json\n?|\n?```/g, '').trim());
      novaFase = analise.nova_fase ?? conversa.fase;
      if (analise.pedido_info?.produto) pedidoInfo = analise.pedido_info;
      prontoParaPagamento = analise.pronto_para_pagamento ?? false;

      // Captura nome do cliente detectado na conversa
      const nomeDetectado = (analise.nome_cliente as string | null)?.trim() || null;
      if (nomeDetectado && !nomeCliente) {
        nomeCliente = nomeDetectado;
        const db = getDb();
        // Salva em conversas e em leads (por canal_id)
        await Promise.allSettled([
          salvarConversa(conversa.id, { nome_cliente: nomeDetectado }),
          db.from('leads').update({ nome: nomeDetectado }).eq('canal_id', canalId).is('nome', null),
        ]);
      }
    } catch { /* mantém fase atual */ }
  }

  // 5. Determinar resposta final
  let respostaFinal = respostaIA ?? MSG_FALLBACK;

  // 6. Se pronto para pagamento: tentar gerar link PIX
  if (prontoParaPagamento && pedidoInfo) {
    const linkPagamento = await gerarLinkPagamento(pedidoInfo);
    if (linkPagamento) {
      respostaFinal = `Perfeito! Seu arranjo: ${pedidoInfo['produto']}. Para finalizar, acesse o link de pagamento PIX: ${linkPagamento} ✅`;
      novaFase = 'aguardando_pagamento';
    } else {
      // Fallback: WhatsApp para fechamento
      respostaFinal = `Ótimo! Vamos finalizar seu pedido 🌸 Me chama no WhatsApp para confirmar os detalhes e gerar o PIX: wa.me/${WHATSAPP_NUM}`;
      novaFase = 'proposta';
    }
  }

  // 7. Adicionar resposta ao histórico
  const msgAssistente: Mensagem = { role: 'assistant', content: respostaFinal, ts: new Date().toISOString() };
  const historicoFinal = [...historico, msgAssistente].slice(-20);

  // 8. Salvar conversa atualizada
  await salvarConversa(conversa.id, {
    historico: historicoFinal,
    fase: novaFase,
    pedido_info: pedidoInfo ?? undefined,
  } as Partial<Conversa>);

  // 9. Enviar resposta no Instagram DM
  console.log(`[webhook-meta] ${canalId} | fase: ${conversa.fase}→${novaFase} | resposta: ${respostaFinal.slice(0, 60)}`);

  try {
    const pageToken = PAGE_TOKEN || await buscarConfigDB('META_PAGE_ACCESS_TOKEN');
    const dmToken = pageToken || igToken;
    const res = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${dmToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: canalId },
        message: { text: respostaFinal },
        messaging_type: 'RESPONSE',
      }),
    });
    if (!res.ok) console.error(`[webhook-meta] erro DM: ${await res.text()}`);
    else console.log(`[webhook-meta] DM enviado para ${canalId}`);
  } catch (e) { console.error(`[webhook-meta] falha DM: ${e}`); }
}

// ── Responder comentário em post (Instagram ou Facebook) ────────────────────

async function processarComentario(evento: MetaEvento): Promise<void> {
  if (!evento.comment_id) return;
  const token = IG_TOKEN || await buscarConfigDB('META_IG_ACCESS_TOKEN');
  if (!token) return;

  const SYSTEM_COMENTARIO = `Você é a Flor, atendente da Enemeop Flores (floricultura em São Paulo desde 1997).
Alguém comentou numa publicação da loja. Responda de forma calorosa, humana e curta (máximo 2 linhas).
Nunca cite preços em comentários públicos. Se for elogio: agradeça e convide para o DM.
Se for dúvida sobre produto ou preço: responda brevemente e direcione ao DM para detalhes.
Se for pedido de encomenda: agradeça e peça para chamar no direct.
Português brasileiro natural. No máximo 1 emoji se fizer sentido.
RETORNE APENAS o texto da resposta, sem aspas, sem prefixo.`;

  const resposta = await chamarIA(
    SYSTEM_COMENTARIO,
    [{ role: 'user', content: evento.mensagem }],
    100,
  );

  if (!resposta) return;

  try {
    const endpoint = evento.canal === 'instagram'
      ? `https://graph.facebook.com/v19.0/${evento.comment_id}/replies`
      : `https://graph.facebook.com/v19.0/${evento.comment_id}/comments`;

    const res = await fetch(`${endpoint}?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: resposta }),
    });
    if (!res.ok) console.error(`[webhook-meta] erro comentario reply: ${await res.text()}`);
    else console.log(`[webhook-meta] comentario respondido: ${resposta.slice(0, 60)}`);
  } catch (e) {
    console.error(`[webhook-meta] falha comentario reply: ${e}`);
  }
}

// ── Validação de assinatura ──────────────────────────────────────────────────

async function validarAssinatura(body: string, signature: string | null): Promise<boolean> {
  if (!APP_SECRET || !signature) return true;
  try {
    const expected = signature.replace('sha256=', '');
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(APP_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
    const hex = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex === expected;
  } catch { return false; }
}

// ── Extração de eventos ──────────────────────────────────────────────────────

interface MetaEvento { canal: 'instagram' | 'facebook'; tipo: 'dm' | 'comentario'; canal_id: string; comment_id?: string; nome: string | null; mensagem: string; post_id?: string; timestamp: string; }

function extrairEventos(body: Record<string, unknown>): MetaEvento[] {
  const eventos: MetaEvento[] = [];
  const objectType = body['object'] as string | undefined; // 'instagram' | 'page'
  const entries = body['entry'] as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(entries)) return eventos;

  for (const entry of entries) {
    const messaging = entry['messaging'] as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(messaging)) {
      for (const msg of messaging) {
        const sender  = msg['sender']  as Record<string, unknown> | undefined;
        const message = msg['message'] as Record<string, unknown> | undefined;
        if (!sender || !message) continue;
        const texto = (message['text'] as string) ?? '';
        if (!texto) continue;
        const senderId = String(sender['id'] ?? '');
        const pageId   = String(entry['id'] ?? '');
        if (senderId === pageId) continue;
        const canal: 'instagram' | 'facebook' = objectType === 'instagram' ? 'instagram' : 'facebook';
        eventos.push({ canal, tipo: 'dm', canal_id: senderId, nome: null, mensagem: texto, timestamp: new Date().toISOString() });
      }
    }

    const changes = entry['changes'] as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(changes)) {
      for (const change of changes) {
        const field = change['field'] as string | undefined;
        if (field !== 'feed' && field !== 'comments' && field !== 'instagram_comments') continue;
        const val = change['value'] as Record<string, unknown> | undefined;
        if (!val) continue;
        const msg = ((val['message'] ?? val['text']) as string) ?? '';
        if (!msg) continue;
        const from = val['from'] as Record<string, unknown> | undefined;
        const canal: 'instagram' | 'facebook' = objectType === 'instagram' || field === 'instagram_comments' ? 'instagram' : 'facebook';
        const commentId = ((val['id'] ?? val['comment_id']) as string) ?? undefined;
        eventos.push({ canal, tipo: 'comentario', canal_id: String(from?.['id'] ?? ''), comment_id: commentId, nome: (from?.['name'] as string) ?? null, mensagem: msg, post_id: (val['post_id'] as string) ?? undefined, timestamp: new Date().toISOString() });
      }
    }
  }
  return eventos;
}

// ── Envia ao orquestrador (captura lead em paralelo) ─────────────────────────

async function enviarAoOrquestrador(evento: MetaEvento): Promise<void> {
  if (!SERVICE_KEY || !SUPABASE_URL) return;
  await fetch(`${SUPABASE_URL}/functions/v1/orquestrador`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({
      tipo: 'novo-lead',
      task_id: crypto.randomUUID(),
      escopo: 'producao',
      urgencia: 'normal',
      workspace_id: WORKSPACE_ID,
      payload: { canal: evento.canal, tipo_interacao: evento.tipo, canal_id: evento.canal_id, nome: evento.nome, mensagem: evento.mensagem, utm_source: evento.canal, timestamp: evento.timestamp },
    }),
  }).catch(() => {});
}

// ── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type' } });

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode'), token = url.searchParams.get('hub.verify_token'), challenge = url.searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) return new Response(challenge, { status: 200 });
    return new Response('Forbidden', { status: 403 });
  }

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const rawBody = await req.text();
  if (!await validarAssinatura(rawBody, req.headers.get('x-hub-signature-256'))) return new Response('Forbidden', { status: 403 });

  let body: Record<string, unknown>;
  try { body = JSON.parse(rawBody); } catch { return new Response('ok', { status: 200 }); }

  const eventos = extrairEventos(body);
  console.log(`[webhook-meta] ${eventos.length} evento(s)`);

  await Promise.allSettled(
    eventos.map(async (ev) => {
      if (ev.tipo === 'dm') {
        // Instagram e Facebook DMs recebem resposta da IA
        await Promise.allSettled([
          processarDM(ev.canal_id, ev.canal, ev.mensagem),
          enviarAoOrquestrador(ev),
        ]);
      } else if (ev.tipo === 'comentario') {
        // Comentários recebem resposta pública + captura de lead
        await Promise.allSettled([
          processarComentario(ev),
          enviarAoOrquestrador(ev),
        ]);
      }
    }),
  );

  return new Response('ok', { status: 200 });
});
