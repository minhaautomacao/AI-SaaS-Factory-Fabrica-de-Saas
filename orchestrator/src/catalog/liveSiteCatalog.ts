/**
 * Catálogo ao vivo — Enemeop Flores
 *
 * Busca produtos diretamente em www.enemeopflores.com.br em tempo real.
 * Nunca usa catálogo fixo, dados em memória ou produtos inventados.
 * Retorna somente o que for encontrado no site no momento da consulta.
 *
 * Variáveis de ambiente:
 *   LIVE_CATALOG_CACHE_TTL_SECONDS  TTL do cache em segundos (default: 120)
 */

import { parse } from 'node-html-parser'

const BASE_URL             = 'https://www.enemeopflores.com.br'
const CATEGORY_TIMEOUT_MS  = 10_000   // timeout para páginas de categoria (mais lentas)
const DETAIL_TIMEOUT_MS    = 5_000    // timeout para páginas individuais de produto
const MAX_FROM_CATEGORY    = 12       // produtos lidos por página de categoria
const MAX_TO_DETAIL        = 5        // páginas individuais abertas por busca

// Cache TTL configurável via env — default 120s (2 minutos)
function getCacheTTL(): number {
  const raw = process.env.LIVE_CATALOG_CACHE_TTL_SECONDS
  const parsed = raw ? parseInt(raw, 10) : NaN
  return isNaN(parsed) || parsed < 0 ? 120_000 : parsed * 1_000
}

// ── Tipos públicos ────────────────────────────────────────────────────────────

export type LiveProduct = {
  name: string
  url: string
  price?: number
  description?: string
  colors: string[]
  flowers: string[]
  category?: string
}

export type SearchLiveProductsParams = {
  query: string
  occasion?: string
  budget?: number
  color?: string
  limit?: number
}

// ── Log estruturado ───────────────────────────────────────────────────────────

type CatalogLogLevel = 'INFO' | 'WARN' | 'ERROR'

function log(level: CatalogLogLevel, event: string, data?: Record<string, unknown>): void {
  const entry = {
    ts:    new Date().toISOString(),
    src:   'Catalog',
    level,
    event,
    ...data,
  }
  if (level === 'ERROR') console.error(JSON.stringify(entry))
  else if (level === 'WARN') console.warn(JSON.stringify(entry))
  else console.log(JSON.stringify(entry))
}

// ── Cache em memória (por processo) ──────────────────────────────────────────

const _cache = new Map<string, { data: LiveProduct[]; ts: number }>()

function cacheGet(key: string): LiveProduct[] | null {
  const entry = _cache.get(key)
  if (!entry) return null
  const ttl = getCacheTTL()
  if (Date.now() - entry.ts > ttl) { _cache.delete(key); return null }
  return entry.data
}

function cacheSet(key: string, data: LiveProduct[]): void {
  _cache.set(key, { data, ts: Date.now() })
}

// ── Mapeamento ocasião → categorias ──────────────────────────────────────────

const OCCASION_CATEGORIES: Array<{ keys: string[]; paths: string[] }> = [
  { keys: ['noiva', 'casamento'],
    paths: ['/categoria/buques-de-noiva/'] },
  { keys: ['namorad', 'namorado', 'namorada', 'amor', 'valentine', 'paixão', 'paixao'],
    paths: ['/categoria/buques-de-flores/', '/categoria/ramalhetes/'] },
  { keys: ['mãe', 'mae', 'mamã', 'mama', 'minha mãe', 'para minha mae'],
    paths: ['/categoria/maternidade/', '/categoria/arranjos-florais/'] },
  { keys: ['maternidade', 'bebê', 'bebe', 'nasciment', 'recém-nascid', 'recem-nascid'],
    paths: ['/categoria/maternidade/'] },
  { keys: ['luto', 'faleciment', 'condolênc', 'condolencia', 'velório', 'velorio', 'enterro', 'funeral'],
    paths: ['/categoria/condolencias/'] },
  { keys: ['aniversário', 'aniversario', 'aniversário', 'parabéns', 'parabens', 'aniver'],
    paths: ['/categoria/arranjos-florais/', '/categoria/buques-de-flores/'] },
  { keys: ['orquídea', 'orquidea', 'orquídeas', 'orquideas', 'phalaenopsis'],
    paths: ['/categoria/arranjos-de-orquidea/', '/categoria/plantadas/'] },
  { keys: ['kit', 'cesta', 'vinho', 'chocolate', 'presente com chocolat'],
    paths: ['/categoria/kits/'] },
  { keys: ['corporativo', 'empresa', 'escritório', 'escritorio', 'corporativ'],
    paths: ['/categoria/arranjos-florais/'] },
]

const DEFAULT_CATEGORIES = [
  '/categoria/arranjos-florais/',
  '/categoria/buques-de-flores/',
  '/categoria/ramalhetes/',
]

// ── Listas de cores e flores para extração ───────────────────────────────────

const COLORS_PT = [
  'branca', 'branco', 'vermelha', 'vermelho', 'rosa', 'pink', 'cor-de-rosa',
  'amarela', 'amarelo', 'laranja', 'lilás', 'lilas', 'roxa', 'roxo',
  'colorida', 'colorido', 'mista', 'misto', 'multicolor', 'natural',
]

const FLOWERS_PT = [
  'rosa', 'rosas',
  'girassol', 'girassóis', 'girassois',
  'alstroemêria', 'alstroemeria', 'alstroemérias', 'alstromerias',
  'orquídea', 'orquidea', 'orquídeas', 'orquideas',
  'lírio', 'lirio', 'lírios', 'lirios',
  'tulipa', 'tulipas',
  'hortênsia', 'hortensia', 'hortênsias',
  'lisianthus', 'ruscus', 'calla', 'callas', 'snapdragon', 'junco',
  'flores do campo', 'flores desidratadas', 'flores secas',
  'pelúcia', 'pelucia', 'ferrero',
]

// ── Utilitários ───────────────────────────────────────────────────────────────

interface FetchResult {
  html: string | null
  timedOut: boolean
  httpStatus?: number
  error?: string
}

async function fetchHtml(url: string): Promise<FetchResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'EnemeoPFlores-SDR/1.0 (catalog-reader)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })
    clearTimeout(timer)
    if (!res.ok) {
      log('WARN', 'fetch_http_error', { url, status: res.status })
      return { html: null, timedOut: false, httpStatus: res.status }
    }
    const html = await res.text()
    return { html, timedOut: false, httpStatus: res.status }
  } catch (e) {
    clearTimeout(timer)
    const isAbort = e instanceof Error && e.name === 'AbortError'
    const msg = e instanceof Error ? e.message : String(e)
    if (isAbort) {
      log('WARN', 'fetch_timeout', { url, timeout_ms: FETCH_TIMEOUT_MS })
      return { html: null, timedOut: true, error: 'timeout' }
    }
    log('ERROR', 'fetch_error', { url, error: msg })
    return { html: null, timedOut: false, error: msg }
  }
}

/**
 * Extrai preço de texto bruto da bdi do WooCommerce.
 * Exemplos de entrada: "R$ 70,00", "R$ 1.490,00", "70,00"
 * Retorna número em float (70.0, 1490.0) ou undefined se não parseable.
 */
function parsePrice(rawText: string): number | undefined {
  // Remove tudo exceto dígitos, vírgula e ponto
  // Depois: se houver vírgula decimal (padrão BR), trata como separador decimal
  // Ex: "1.490,00" → strip tudo q não é dígito/vírgula/ponto → "1.490,00"
  //     → remove pontos de milhar → "1490,00" → troca vírgula por ponto → "1490.00"
  const stripped = rawText
    .replace(/[^\d.,]/g, '')          // mantém dígitos, vírgula e ponto
    .replace(/\.(?=\d{3}[,])/g, '')   // remove ponto de milhar (seguido de 3 dígitos + vírgula)
    .replace(',', '.')                 // vírgula decimal → ponto
  const n = parseFloat(stripped)
  return isNaN(n) || n <= 0 ? undefined : n
}

function extractColors(text: string): string[] {
  const lower = text.toLowerCase()
  return [...new Set(COLORS_PT.filter(c => lower.includes(c)))]
}

function extractFlowers(text: string): string[] {
  const lower = text.toLowerCase()
  return [...new Set(FLOWERS_PT.filter(f => lower.includes(f)))]
}

// ── Parsers de HTML ───────────────────────────────────────────────────────────

interface RawProduct {
  name: string
  url: string
  price?: number
  category: string
}

function parseCategoryPage(html: string, categorySlug: string): RawProduct[] {
  const root = parse(html)
  const results: RawProduct[] = []

  const items = root.querySelectorAll('li.product')
  log('INFO', 'category_products_found', { slug: categorySlug, count: items.length })

  for (const item of items.slice(0, MAX_FROM_CATEGORY)) {
    const link  = item.querySelector('a.woocommerce-LoopProduct-link')
    const title = item.querySelector('.woocommerce-loop-product__title')

    // Preço: preferir preço promocional (ins) sobre preço regular
    const salePriceEl    = item.querySelector('.price ins .woocommerce-Price-amount bdi')
    const regularPriceEl = item.querySelector('.price .woocommerce-Price-amount bdi')
    const priceEl        = salePriceEl ?? regularPriceEl

    const url  = link?.getAttribute('href')?.trim()
    const name = title?.innerText?.trim()
    if (!url || !name) continue

    const priceRaw = priceEl?.innerText ?? ''
    results.push({
      name,
      url,
      price: priceRaw ? parsePrice(priceRaw) : undefined,
      category: categorySlug,
    })
  }

  return results
}

async function fetchProductDetail(raw: RawProduct): Promise<LiveProduct> {
  log('INFO', 'product_page_open', { name: raw.name, url: raw.url })

  const { html, timedOut, error } = await fetchHtml(raw.url)

  if (!html) {
    // Fallback: usa nome e preço da listagem, extrai cores/flores do nome
    log('WARN', 'product_detail_fallback', { name: raw.name, timedOut, error })
    return {
      name:     raw.name,
      url:      raw.url,
      price:    raw.price,
      colors:   extractColors(raw.name),
      flowers:  extractFlowers(raw.name),
      category: raw.category,
    }
  }

  const root = parse(html)

  // Preço na página de detalhe (mais confiável que listagem)
  const salePriceEl    = root.querySelector('.entry-summary .price ins .woocommerce-Price-amount bdi')
  const regularPriceEl = root.querySelector('.entry-summary .price .woocommerce-Price-amount bdi')
  const priceEl        = salePriceEl ?? regularPriceEl
  const price          = priceEl ? parsePrice(priceEl.innerText) : raw.price

  // Descrição: curta (resumo woo) ou longa (tab descrição)
  const shortDesc = root.querySelector('.woocommerce-product-details__short-description')?.innerText?.trim()
  const longDesc  = root.querySelector('#tab-description')?.innerText?.trim()
                 ?? root.querySelector('.woocommerce-Tabs-panel--description')?.innerText?.trim()

  // Limita a 500 caracteres para não explodir o contexto do LLM
  const description = (shortDesc || longDesc || '').replace(/\s+/g, ' ').trim().substring(0, 500) || undefined

  const allText = `${raw.name} ${description ?? ''}`

  const detail: LiveProduct = {
    name:        raw.name,
    url:         raw.url,
    price,
    description: description || undefined,
    colors:      extractColors(allText),
    flowers:     extractFlowers(allText),
    category:    raw.category,
  }

  log('INFO', 'product_detail_read', {
    name:    detail.name,
    price:   detail.price,
    colors:  detail.colors,
    flowers: detail.flowers,
    has_desc: !!detail.description,
  })

  return detail
}

// ── Seleção de categorias ─────────────────────────────────────────────────────

function selectCategoryPaths(params: SearchLiveProductsParams): string[] {
  const text = `${params.query} ${params.occasion ?? ''}`.toLowerCase()
  const paths = new Set<string>()

  for (const { keys, paths: catPaths } of OCCASION_CATEGORIES) {
    if (keys.some(k => text.includes(k))) {
      catPaths.forEach(p => paths.add(p))
    }
  }

  if (paths.size === 0) DEFAULT_CATEGORIES.forEach(p => paths.add(p))

  // Máx 2 categorias para manter latência sob controle (≤ 2 requisições de categoria)
  return Array.from(paths).slice(0, 2)
}

// ── Pontuação de relevância ───────────────────────────────────────────────────

function scoreProduct(
  p: { name: string; price?: number; colors?: string[]; description?: string; category: string },
  params: SearchLiveProductsParams,
): number {
  let score = 0
  const name  = p.name.toLowerCase()
  const query = params.query.toLowerCase()

  // Palavras da query presentes no nome
  for (const word of query.split(/\s+/)) {
    if (word.length > 3 && name.includes(word)) score += 2
  }

  // Compatibilidade de orçamento
  if (params.budget && p.price) {
    if (p.price <= params.budget)          score += 4
    if (p.price <= params.budget * 0.8)    score += 2  // bem abaixo do budget = ótimo
    if (p.price > params.budget * 1.25)    score -= 4  // muito acima
  }

  // Cor solicitada
  if (params.color) {
    const cl = params.color.toLowerCase()
    if (name.includes(cl)) score += 5
    if (p.colors?.some(c => c.includes(cl))) score += 3
    if ((p.description ?? '').toLowerCase().includes(cl)) score += 2
  }

  return score
}

// ── Função principal exportada ────────────────────────────────────────────────

export async function searchLiveProductsFromSite(
  params: SearchLiveProductsParams,
): Promise<LiveProduct[]> {
  const t0       = Date.now()
  const cacheKey = JSON.stringify(params)
  const cached   = cacheGet(cacheKey)

  if (cached) {
    log('INFO', 'cache_hit', {
      query:    params.query,
      occasion: params.occasion,
      budget:   params.budget,
      color:    params.color,
      cached_count: cached.length,
      ttl_s: Math.round(getCacheTTL() / 1000),
    })
    return cached
  }

  const limit         = params.limit ?? 3
  const categoryPaths = selectCategoryPaths(params)

  log('INFO', 'search_start', {
    query:      params.query,
    occasion:   params.occasion,
    budget:     params.budget,
    color:      params.color,
    categories: categoryPaths,
    limit,
  })

  // ── Etapa 1: buscar listagens de categorias em paralelo ───────────────────
  const categoryResults = await Promise.allSettled(
    categoryPaths.map(async path => {
      const url = `${BASE_URL}${path}`
      const { html, timedOut, error, httpStatus } = await fetchHtml(url)
      if (!html) {
        log('WARN', 'category_fetch_failed', { path, timedOut, error, httpStatus })
        return []
      }
      const slug = path.replace('/categoria/', '').replace(/\//g, '')
      return parseCategoryPage(html, slug)
    })
  )

  const rawProducts: RawProduct[] = []
  for (const r of categoryResults) {
    if (r.status === 'fulfilled') rawProducts.push(...r.value)
    else log('ERROR', 'category_promise_rejected', { reason: String(r.reason) })
  }

  if (rawProducts.length === 0) {
    log('WARN', 'no_products_in_categories', {
      categories: categoryPaths,
      elapsed_ms: Date.now() - t0,
    })
    return []
  }

  // ── Etapa 2: pontuar e selecionar top candidatos ───────────────────────────
  const topCandidates = rawProducts
    .map(p => ({ p, score: scoreProduct(p, params) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_TO_DETAIL)

  log('INFO', 'candidates_selected', {
    total_found:    rawProducts.length,
    pages_to_open:  topCandidates.length,
    top_names:      topCandidates.map(c => c.p.name),
  })

  // ── Etapa 3: abrir páginas individuais em paralelo ────────────────────────
  const t1 = Date.now()
  const detailResults = await Promise.allSettled(
    topCandidates.map(({ p }) => fetchProductDetail(p))
  )
  const detailElapsed = Date.now() - t1

  const detailed: LiveProduct[] = []
  let detailErrors = 0
  for (const r of detailResults) {
    if (r.status === 'fulfilled') detailed.push(r.value)
    else { detailErrors++; log('WARN', 'detail_promise_rejected', { reason: String(r.reason) }) }
  }

  log('INFO', 'detail_pages_done', {
    pages_opened:  topCandidates.length,
    pages_ok:      detailed.length,
    pages_error:   detailErrors,
    elapsed_ms:    detailElapsed,
  })

  // ── Etapa 4: reordenar com dados completos e retornar top N ───────────────
  const final = detailed
    .map(p => ({
      p,
      score: scoreProduct(
        { name: p.name, price: p.price, colors: p.colors, description: p.description, category: p.category ?? '' },
        params,
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p)

  const elapsed = Date.now() - t0

  log('INFO', 'search_done', {
    query:        params.query,
    occasion:     params.occasion,
    budget:       params.budget,
    color:        params.color,
    result_count: final.length,
    result_names: final.map(p => p.name),
    elapsed_ms:   elapsed,
    ttl_s:        Math.round(getCacheTTL() / 1000),
  })

  cacheSet(cacheKey, final)
  return final
}
