import axios from 'axios'
import * as cheerio from 'cheerio'

export interface ResultadoScraping {
  url: string
  titulo?: string
  descricao?: string
  dados: Record<string, unknown>
  coletado_em: string
  erro?: string
}

export interface ProdutoConcorrente {
  nome: string
  preco?: number
  preco_texto?: string
  descricao?: string
  imagem_url?: string
  disponivel: boolean
  url_produto?: string
}

export interface PostHashtag {
  id?: string
  texto: string
  curtidas?: number
  comentarios?: number
  usuario?: string
  url?: string
  tem_intencao_compra: boolean
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9',
}

// Raspa página HTML estática e retorna o DOM parseado
async function buscarHtml(url: string): Promise<cheerio.CheerioAPI> {
  const { data } = await axios.get(url, { headers: HEADERS, timeout: 10_000 })
  return cheerio.load(data)
}

// Extrai produtos de um site concorrente de floricultura
// Adapte os seletores CSS conforme o layout do site-alvo
export async function rasparConcorrente(
  url: string,
  seletores: {
    produto: string
    nome: string
    preco: string
    disponivel?: string
    imagem?: string
    link?: string
  }
): Promise<ResultadoScraping & { produtos: ProdutoConcorrente[] }> {
  const coletado_em = new Date().toISOString()

  try {
    const $ = await buscarHtml(url)
    const produtos: ProdutoConcorrente[] = []

    $(seletores.produto).each((_, el) => {
      const $el = $(el)
      const preco_texto = $el.find(seletores.preco).first().text().trim()
      const preco = extrairPreco(preco_texto)

      produtos.push({
        nome: $el.find(seletores.nome).first().text().trim(),
        preco,
        preco_texto,
        imagem_url: seletores.imagem ? $el.find(seletores.imagem).first().attr('src') : undefined,
        url_produto: seletores.link ? resolverUrl(url, $el.find(seletores.link).first().attr('href')) : undefined,
        disponivel: seletores.disponivel
          ? $el.find(seletores.disponivel).length === 0
          : true,
      })
    })

    return {
      url,
      titulo: $('title').text().trim(),
      dados: { total_produtos: produtos.length },
      coletado_em,
      produtos,
    }
  } catch (erro) {
    return {
      url,
      dados: {},
      coletado_em,
      produtos: [],
      erro: String(erro),
    }
  }
}

// Busca resultados do Google para palavras-chave locais
export async function rasparGoogleLocal(
  query: string,
  cidade = 'São Paulo'
): Promise<ResultadoScraping & { resultados: Array<{ titulo: string; url: string; snippet: string }> }> {
  const coletado_em = new Date().toISOString()
  const q = encodeURIComponent(`${query} ${cidade}`)
  const url = `https://www.google.com/search?q=${q}&hl=pt-BR&gl=BR&num=10`

  try {
    const $ = await buscarHtml(url)
    const resultados: Array<{ titulo: string; url: string; snippet: string }> = []

    $('div.g').each((_, el) => {
      const $el = $(el)
      const titulo = $el.find('h3').first().text().trim()
      const snippet = $el.find('div[data-sncf], .VwiC3b').first().text().trim()
      const href = $el.find('a').first().attr('href') || ''
      const urlLimpa = href.startsWith('/url?q=') ? decodeURIComponent(href.slice(7).split('&')[0]) : href

      if (titulo) resultados.push({ titulo, url: urlLimpa, snippet })
    })

    return {
      url,
      dados: { query, cidade, total: resultados.length },
      coletado_em,
      resultados,
    }
  } catch (erro) {
    return {
      url,
      dados: { query, cidade },
      coletado_em,
      resultados: [],
      erro: String(erro),
    }
  }
}

// Monitora avaliações do Google Meu Negócio via página pública
export async function rasparAvaliacoesGMB(
  urlGMB: string
): Promise<ResultadoScraping & { avaliacoes: Array<{ autor: string; nota: number; texto: string; data?: string }> }> {
  const coletado_em = new Date().toISOString()

  try {
    const $ = await buscarHtml(urlGMB)
    const avaliacoes: Array<{ autor: string; nota: number; texto: string; data?: string }> = []

    // Seletores do Google Maps — podem mudar com atualizações do Google
    $('[data-review-id]').each((_, el) => {
      const $el = $(el)
      const autor = $el.find('[class*="d4r55"]').text().trim()
      const notaTexto = $el.find('[aria-label*="estrela"]').attr('aria-label') || ''
      const nota = parseInt(notaTexto) || 0
      const texto = $el.find('[class*="wiI7pd"]').text().trim()
      const data = $el.find('[class*="rsqaWe"]').text().trim()

      if (autor) avaliacoes.push({ autor, nota, texto, data })
    })

    return {
      url: urlGMB,
      dados: { total_avaliacoes: avaliacoes.length },
      coletado_em,
      avaliacoes,
    }
  } catch (erro) {
    return {
      url: urlGMB,
      dados: {},
      coletado_em,
      avaliacoes: [],
      erro: String(erro),
    }
  }
}

// Varredura de hashtag no Instagram via scraping público (sem API)
// Nota: Instagram limita scraping — use a Graph API quando possível
export async function rasparHashtagInstagram(
  hashtag: string
): Promise<ResultadoScraping & { posts: PostHashtag[] }> {
  const coletado_em = new Date().toISOString()
  const url = `https://www.instagram.com/explore/tags/${encodeURIComponent(hashtag)}/`

  try {
    const { data } = await axios.get(url, {
      headers: {
        ...HEADERS,
        Accept: 'text/html,application/xhtml+xml',
      },
      timeout: 10_000,
    })

    // Instagram carrega dados em JSON embedado no HTML
    const match = data.match(/"hashtag":\{[^}]+\}/)
    const posts: PostHashtag[] = []

    if (match) {
      try {
        const json = JSON.parse(`{${match[0]}}`)
        const edges = json?.hashtag?.edge_hashtag_to_media?.edges || []

        for (const edge of edges) {
          const node = edge.node
          const texto = node?.edge_media_to_caption?.edges?.[0]?.node?.text || ''
          posts.push({
            id: node.id,
            texto,
            curtidas: node.edge_liked_by?.count,
            comentarios: node.edge_media_to_comment?.count,
            url: `https://www.instagram.com/p/${node.shortcode}/`,
            tem_intencao_compra: detectarIntencaoCompra(texto),
          })
        }
      } catch {
        // JSON mal formado — retorna lista vazia
      }
    }

    return {
      url,
      dados: { hashtag, total_posts: posts.length },
      coletado_em,
      posts,
    }
  } catch (erro) {
    return {
      url,
      dados: { hashtag },
      coletado_em,
      posts: [],
      erro: String(erro),
    }
  }
}

// --- Utilitários ---

function extrairPreco(texto: string): number | undefined {
  if (!texto) return undefined
  const match = texto.replace(/\./g, '').replace(',', '.').match(/[\d.]+/)
  return match ? parseFloat(match[0]) : undefined
}

function resolverUrl(base: string, href?: string): string | undefined {
  if (!href) return undefined
  if (href.startsWith('http')) return href
  try {
    return new URL(href, base).toString()
  } catch {
    return undefined
  }
}

function detectarIntencaoCompra(texto: string): boolean {
  const palavras = [
    'quero comprar', 'quanto custa', 'tem disponível', 'onde comprar',
    'preciso de', 'orçamento', 'encomenda', 'entreg', 'preço',
    'alguém indica', 'boa floricultura', 'flores para',
  ]
  const lower = texto.toLowerCase()
  return palavras.some(p => lower.includes(p))
}
