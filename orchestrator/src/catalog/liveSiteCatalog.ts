/**
 * Catálogo ao vivo — Enemeop Flores
 *
 * Busca produtos diretamente em www.enemeopflores.com.br.
 * Nunca usa catálogo fixo, dados em memória ou produtos inventados.
 * Retorna somente o que for encontrado no site no momento da consulta.
 */

import { parse } from 'node-html-parser'

const BASE_URL = 'https://www.enemeopflores.com.br'
const FETCH_TIMEOUT_MS  = 6_000
const CACHE_TTL_MS      = 10 * 60 * 1_000   // 10 minutos
const MAX_FROM_CATEGORY = 10                  // produtos considerados por categoria
const MAX_TO_DETAIL     = 5                   // páginas individuais abertas por busca

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

// ── Cache em memória (por processo) ──────────────────────────────────────────

const _cache = new Map<string, { data: LiveProduct[]; ts: number }>()

function cacheGet(key: string): LiveProduct[] | null {
  const entry = _cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL_MS) { _cache.delete(key); return null }
  return entry.data
}

function cacheSet(key: string, data: LiveProduct[]): void {
  _cache.set(key, { data, ts: Date.now() })
}

// ── Mapeamento ocasião → categorias ──────────────────────────────────────────

const OCCASION_CATEGORIES: Array<{ keys: string[]; paths: string[] }> = [
  { keys: ['noiva', 'casamento'],                           paths: ['/categoria/buques-de-noiva/'] },
  { keys: ['namorad', 'amor', 'namorad', 'valentine'],      paths: ['/categoria/buques-de-flores/', '/categoria/ramalhetes/'] },
  { keys: ['mãe', 'mae', 'mamã', 'mama'],                   paths: ['/categoria/maternidade/', '/categoria/arranjos-florais/'] },
  { keys: ['maternidade', 'bebê', 'bebe', 'nasciment'],     paths: ['/categoria/maternidade/'] },
  { keys: ['luto', 'faleciment', 'condolênc', 'saudade'],   paths: ['/categoria/condolencias/'] },
  { keys: ['aniversário', 'aniversario', 'parabéns', 'parabens'], paths: ['/categoria/arranjos-florais/', '/categoria/buques-de-flores/'] },
  { keys: ['orquídea', 'orquidea'],                          paths: ['/categoria/arranjos-de-orquidea/', '/categoria/plantadas/'] },
  { keys: ['kit', 'cesta', 'vinho', 'chocolate'],            paths: ['/categoria/kits/'] },
  { keys: ['corporativo', 'empresa', 'escritório'],          paths: ['/categoria/arranjos-florais/'] },
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
  'rosa', 'girassol', 'alstroemêria', 'alstroemeria', 'alstroemérias',
  'orquídea', 'orquidea', 'orquídeas', 'orquideas',
  'lírio', 'lirio', 'lírios', 'lirios',
  'tulipa', 'tulipas',
  'hortênsia', 'hortensia',
  'lisianthus', 'ruscus', 'calla', 'snapdragon', 'junco',
  'flores do campo', 'flores desidratadas', 'flores secas',
  'pelúcia', 'ferrero',
]

// ── Utilitários ───────────────────────────────────────────────────────────────

async function fetchHtml(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'EnemeoPFlores-SDR/1.0' },
    })
    if (!res.ok) { console.warn(`[Catalog] HTTP ${res.status} — ${url}`); return null }
    return await res.text()
  } catch (e) {
    console.warn(`[Catalog] Falha ao buscar ${url}:`, e instanceof Error ? e.message : e)
    return null
  } finally {
    clearTimeout(timer)
  }
}

function parsePrice(text: string): number | undefined {
  const cleaned = text.replace(/[^0-9,]/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? undefined : n
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

  for (const item of root.querySelectorAll('li.product').slice(0, MAX_FROM_CATEGORY)) {
    const link  = item.querySelector('a.woocommerce-LoopProduct-link')
    const title = item.querySelector('.woocommerce-loop-product__title')
    // Price: prefer sale price (ins) over regular
    const priceEl = item.querySelector('.price ins .woocommerce-Price-amount bdi')
                 ?? item.querySelector('.price .woocommerce-Price-amount bdi')

    const url  = link?.getAttribute('href')?.trim()
    const name = title?.innerText?.trim()
    if (!url || !name) continue

    results.push({
      name,
      url,
      price: priceEl ? parsePrice(priceEl.innerText) : undefined,
      category: categorySlug,
    })
  }

  return results
}

async function fetchProductDetail(raw: RawProduct): Promise<LiveProduct> {
  const html = await fetchHtml(raw.url)

  // Fallback: sem HTML, usa só o que veio da listagem
  if (!html) {
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

  // Preço da página de detalhe (mais confiável)
  const priceEl = root.querySelector('.entry-summary .price ins .woocommerce-Price-amount bdi')
               ?? root.querySelector('.entry-summary .price .woocommerce-Price-amount bdi')
  const price = priceEl ? parsePrice(priceEl.innerText) : raw.price

  // Descrição curta (woo) ou longa
  const shortDesc = root.querySelector('.woocommerce-product-details__short-description')?.innerText?.trim()
  const longDesc  = root.querySelector('#tab-description')?.innerText?.trim()
  const description = (shortDesc || longDesc || '').substring(0, 400) || undefined

  const allText = `${raw.name} ${description ?? ''}`

  return {
    name:        raw.name,
    url:         raw.url,
    price,
    description: description || undefined,
    colors:      extractColors(allText),
    flowers:     extractFlowers(allText),
    category:    raw.category,
  }
}

// ── Seleção de categorias ─────────────────────────────────────────────────────

function selectCategoryPaths(params: SearchLiveProductsParams): string[] {
  const text = `${params.query} ${params.occasion ?? ''}`.toLowerCase()
  const paths = new Set<string>()

  for (const { keys, paths: catPaths } of OCCASION_CATEGORIES) {
    if (keys.some(k => text.includes(k))) catPaths.forEach(p => paths.add(p))
  }

  if (paths.size === 0) DEFAULT_CATEGORIES.forEach(p => paths.add(p))

  return Array.from(paths).slice(0, 2) // máx 2 categorias para manter latência baixa
}

// ── Pontuação de relevância ───────────────────────────────────────────────────

function scoreProduct(raw: RawProduct, params: SearchLiveProductsParams): number {
  let score = 0
  const name  = raw.name.toLowerCase()
  const query = params.query.toLowerCase()

  for (const word of query.split(/\s+/)) {
    if (word.length > 3 && name.includes(word)) score += 2
  }

  if (params.budget && raw.price) {
    if (raw.price <= params.budget)         score += 3
    if (raw.price > params.budget * 1.25)   score -= 3
  }

  if (params.color) {
    const cl = params.color.toLowerCase()
    if (name.includes(cl)) score += 4
  }

  return score
}

// ── Função principal exportada ────────────────────────────────────────────────

export async function searchLiveProductsFromSite(
  params: SearchLiveProductsParams,
): Promise<LiveProduct[]> {
  const cacheKey = JSON.stringify(params)
  const cached = cacheGet(cacheKey)
  if (cached) {
    console.log('[Catalog] Cache hit —', params.query.substring(0, 40))
    return cached
  }

  const limit         = params.limit ?? 3
  const categoryPaths = selectCategoryPaths(params)
  console.log('[Catalog] Consultando categorias:', categoryPaths)

  // Busca todas as categorias em paralelo
  const categoryResults = await Promise.allSettled(
    categoryPaths.map(async path => {
      const html = await fetchHtml(`${BASE_URL}${path}`)
      if (!html) return []
      const slug = path.replace('/categoria/', '').replace(/\//g, '')
      return parseCategoryPage(html, slug)
    })
  )

  const rawProducts: RawProduct[] = []
  for (const r of categoryResults) {
    if (r.status === 'fulfilled') rawProducts.push(...r.value)
  }

  if (rawProducts.length === 0) {
    console.warn('[Catalog] Nenhum produto encontrado nas categorias selecionadas')
    return []
  }

  // Ordena por relevância antes de abrir páginas individuais
  const topCandidates = rawProducts
    .map(p => ({ p, score: scoreProduct(p, params) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_TO_DETAIL)
    .map(({ p }) => p)

  // Abre páginas individuais em paralelo para coletar descrição, cores e flores
  const detailResults = await Promise.allSettled(
    topCandidates.map(p => fetchProductDetail(p))
  )

  const detailed: LiveProduct[] = []
  for (const r of detailResults) {
    if (r.status === 'fulfilled') detailed.push(r.value)
    else console.warn('[Catalog] Falha ao detalhar produto:', r.reason)
  }

  // Reordena com dados completos (cor confirmada no detalhe tem peso maior)
  const final = detailed
    .map(p => {
      let score = scoreProduct(
        { name: p.name, url: p.url, price: p.price, category: p.category ?? '' },
        params,
      )
      if (params.color) {
        const cl = params.color.toLowerCase()
        if (p.colors.some(c => c.includes(cl))) score += 4
        if ((p.description ?? '').toLowerCase().includes(cl)) score += 2
      }
      return { p, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p)

  cacheSet(cacheKey, final)
  console.log(`[Catalog] Retornando ${final.length} produto(s) para: "${params.query}"`)
  return final
}
