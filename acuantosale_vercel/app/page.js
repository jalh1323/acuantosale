'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ProductCard from '@/components/ProductCard'

const HITS_PER_PAGE = 30
const TABS = ['FTD', 'LCT', 'GMA', 'LVB']

// ── Relevance filter ─────────────────────────────────────────────────────────

function toPlain(str) {
  return str.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9\s]/g, '')
}

function stemEs(word) {
  // Only strip final 's' so "leches" → "leche", not "lech"
  if (word.length > 4 && word.endsWith('s')) return word.slice(0, -1)
  return word
}

function filterByRelevance(products, query) {
  const qWords = toPlain(query).split(/\s+/).filter(w => w.length > 2)
  if (qWords.length === 0) return products
  const qStems = qWords.map(stemEs)
  return products.filter(p => {
    const nameStems = toPlain(p.name).split(/\s+/).map(stemEs)
    return qStems.some(qs => nameStems.includes(qs))
  })
}

// ── Normalization ─────────────────────────────────────────────────────────────

function normalizeFarmatodo(hits) {
  return hits.map(p => {
    const cityOffer = p.offerPriceByCity?.find(o => o.cityCode === 'CCS')
    let priceBs = p.fullPrice
    let discountLabel = ''
    if (p.offerPrice > 0) {
      priceBs = p.offerPrice
      discountLabel = p.offerText || ''
    } else if (cityOffer?.offerPrice > 0) {
      priceBs = cityOffer.offerPrice
      discountLabel = cityOffer.offerText || ''
    }
    return {
      id: p.objectID,
      name: p.mediaDescription,
      brand: p.marca,
      imageUrl: p.mediaImageUrl,
      priceBs,
      fullPriceBs: p.fullPrice,
      discountLabel,
      requiresPrescription: p.requirePrescription === 'true',
      store: 'farmatodo',
    }
  })
}

function normalizeLuvebras(products) {
  return (products ?? []).map(p => ({
    id:           `lvb_${p.id}`,
    name:         p.name,
    brand:        '',
    imageUrl:     p.imageUrl,
    priceBs:      null,
    fullPriceBs:  null,
    priceUsd:     p.priceUsd,
    fullPriceUsd: p.fullPriceUsd,
    discountLabel: '',
    requiresPrescription: false,
    store:        'luvebras',
    inStock:      p.inStock,
  }))
}

function normalizeGama(products) {
  return (products ?? []).map(p => ({
    id: `gama_${p.code}`,
    name: p.name.replace(/<[^>]+>/g, ''),
    brand: '',
    imageUrl: p.imageUrl,
    priceBs: null,
    fullPriceBs: null,
    priceUsd: p.discountedPrice ?? p.regularPrice,
    fullPriceUsd: p.regularPrice,
    discountLabel: '',
    requiresPrescription: false,
    store: 'gama',
    inStock: p.inStock,
  }))
}

function normalizeLocatel(products) {
  return (products ?? []).map(p => {
    const item = p.items?.[0]
    const offer = item?.sellers?.[0]?.commertialOffer
    const listPrice = offer?.ListPrice ?? 0
    const price = offer?.Price ?? 0
    return {
      id: `locatel_${p.productId}`,
      name: p.productName,
      brand: p.brand,
      imageUrl: item?.images?.[0]?.imageUrl ?? '',
      priceBs: price,
      fullPriceBs: listPrice,
      discountLabel: '',
      requiresPrescription: false,
      store: 'locatel',
    }
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [query, setQuery]         = useState('')
  const [activeTab, setActiveTab] = useState('FTD')
  const [bcvRate, setBcvRate]     = useState(null)
  const [bcvFecha, setBcvFecha]   = useState(null)

  // FTD
  const [ftResults, setFtResults] = useState([])
  const [ftLoading, setFtLoading] = useState(false)

  // LCT
  const [ltResults, setLtResults]           = useState([])
  const [ltLoading, setLtLoading]           = useState(false)
  const [ltLoadingMore, setLtLoadingMore]   = useState(false)
  const [ltTotalRecords, setLtTotalRecords] = useState(0)
  const ltPageRef = useRef(1)

  // GMA
  const [gmResults, setGmResults]           = useState([])
  const [gmLoading, setGmLoading]           = useState(false)
  const [gmLoadingMore, setGmLoadingMore]   = useState(false)
  const [gmTotalRecords, setGmTotalRecords] = useState(0)
  const gmPageRef = useRef(0)

  // LVB
  const [lvResults, setLvResults]           = useState([])
  const [lvLoading, setLvLoading]           = useState(false)
  const [lvLoadingMore, setLvLoadingMore]   = useState(false)
  const [lvTotalRecords, setLvTotalRecords] = useState(0)
  const lvPageRef = useRef(1)


  const debounceRef  = useRef(null)
  const searchGenRef = useRef(0)

  useEffect(() => {
    fetch('/api/bcv')
      .then(r => r.json())
      .then(d => { setBcvRate(d.rate); setBcvFecha(d.fecha) })
      .catch(() => {})
  }, [])

  const searchFarmatodo = useCallback(async (q, p) => {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, page: p, hitsPerPage: HITS_PER_PAGE }),
    })
    if (!res.ok) throw new Error(`FTD ${res.status}`)
    return res.json()
  }, [])

  const searchLocatel = useCallback(async (q, p) => {
    const res = await fetch('/api/locatel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, page: p, count: HITS_PER_PAGE }),
    })
    if (!res.ok) throw new Error(`LCT ${res.status}`)
    return res.json()
  }, [])


  const searchLuvebras = useCallback(async (q, p) => {
    const res = await fetch('/api/luvebras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, page: p, perPage: HITS_PER_PAGE }),
    })
    if (!res.ok) throw new Error(`LVB ${res.status}`)
    return res.json()
  }, [])

  const searchGama = useCallback(async (q, p) => {
    const res = await fetch('/api/gama', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, page: p, pageSize: HITS_PER_PAGE }),
    })
    if (!res.ok) throw new Error(`GMA ${res.status}`)
    return res.json()
  }, [])

  const handleSearch = useCallback((q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) {
      setFtResults([])
      setLtResults([]); setLtTotalRecords(0)
      setGmResults([]); setGmTotalRecords(0)
      setLvResults([]); setLvTotalRecords(0)
      return
    }
    debounceRef.current = setTimeout(async () => {
      const gen = ++searchGenRef.current
      setFtLoading(true)
      setLtLoading(true)
      setGmLoading(true)
      setLvLoading(true)
      ltPageRef.current = 1
      gmPageRef.current = 0
      lvPageRef.current = 1

      const [ftData, ltData, gmData, lvData] = await Promise.allSettled([
        searchFarmatodo(q, 0),
        searchLocatel(q, 1),
        searchGama(q, 0),
        searchLuvebras(q, 1),
      ])

      if (gen !== searchGenRef.current) {
        setFtLoading(false); setLtLoading(false); setGmLoading(false); setLvLoading(false)
        return
      }

      if (ftData.status === 'fulfilled') {
        const r = ftData.value.results?.[0]
        if (r) setFtResults(normalizeFarmatodo(r.hits))
      }
      setFtLoading(false)

      if (ltData.status === 'fulfilled' && ltData.value.products) {
        setLtResults(normalizeLocatel(ltData.value.products))
        setLtTotalRecords(ltData.value.recordsFiltered ?? 0)
      }
      setLtLoading(false)

      if (gmData.status === 'fulfilled' && gmData.value.products) {
        setGmResults(normalizeGama(gmData.value.products))
        setGmTotalRecords(gmData.value.totalResults ?? 0)
      }
      setGmLoading(false)

      if (lvData.status === 'fulfilled' && lvData.value.products) {
        setLvResults(normalizeLuvebras(lvData.value.products))
        setLvTotalRecords(lvData.value.total ?? 0)
      }
      setLvLoading(false)
    }, 400)
  }, [searchFarmatodo, searchLocatel, searchGama, searchLuvebras])

  useEffect(() => { handleSearch(query) }, [query, handleSearch])

  const loadMoreLocatel = async () => {
    if (!query.trim()) return
    const next = ltPageRef.current + 1
    setLtLoadingMore(true)
    try {
      const data = await searchLocatel(query, next)
      if (data.products) {
        setLtResults(prev => {
          const seen = new Set(prev.map(p => p.id))
          return [...prev, ...normalizeLocatel(data.products).filter(p => !seen.has(p.id))]
        })
      }
      ltPageRef.current = next
    } catch (e) { console.error(e) }
    setLtLoadingMore(false)
  }


  const loadMoreLuvebras = async () => {
    if (!query.trim()) return
    const next = lvPageRef.current + 1
    setLvLoadingMore(true)
    try {
      const data = await searchLuvebras(query, next)
      if (data.products) {
        setLvResults(prev => {
          const seen = new Set(prev.map(p => p.id))
          return [...prev, ...normalizeLuvebras(data.products).filter(p => !seen.has(p.id))]
        })
        lvPageRef.current = next
      }
    } catch (e) { console.error(e) }
    setLvLoadingMore(false)
  }

  const loadMoreGama = async () => {
    if (!query.trim()) return
    const next = gmPageRef.current + 1
    setGmLoadingMore(true)
    try {
      const data = await searchGama(query, next)
      if (data.products) {
        setGmResults(prev => {
          const seen = new Set(prev.map(p => p.id))
          return [...prev, ...normalizeGama(data.products).filter(p => !seen.has(p.id))]
        })
        gmPageRef.current = next
      }
    } catch (e) { console.error(e) }
    setGmLoadingMore(false)
  }

  // ── Derived state ────────────────────────────────────────────────────────────

  const isFtd = activeTab === 'FTD'
  const isLct = activeTab === 'LCT'
  const isGma = activeTab === 'GMA'
  const isLvb = activeTab === 'LVB'

  const loading     = isFtd ? ftLoading : isLct ? ltLoading : isGma ? gmLoading : lvLoading
  const loadingMore = isLct ? ltLoadingMore : isGma ? gmLoadingMore : lvLoadingMore

  const ftFiltered = query ? filterByRelevance(ftResults, query) : ftResults
  const ltFiltered = query ? filterByRelevance(ltResults, query) : ltResults
  const gmFiltered = query ? filterByRelevance(gmResults, query) : gmResults
  const lvFiltered = query ? filterByRelevance(lvResults, query) : lvResults

  const products   = isFtd ? ftFiltered : isLct ? ltFiltered : isGma ? gmFiltered : lvFiltered
  const totalHits  = products.length
  const hasResults = products.length > 0
  const canLoadMore =
    isLct ? ltResults.length < ltTotalRecords :
    isGma ? gmResults.length < gmTotalRecords :
    isLvb ? lvResults.length < lvTotalRecords : false
  const handleLoadMore = isLct ? loadMoreLocatel : isGma ? loadMoreGama : loadMoreLuvebras

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700 shrink-0">A Cuánto Sale</span>
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-farmatodo-green focus:border-transparent pr-10"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-3">
            {TABS.map(tab => {
              const tabFiltered = tab === 'FTD' ? ftFiltered : tab === 'LCT' ? ltFiltered : tab === 'GMA' ? gmFiltered : lvFiltered
              const cnt        = tabFiltered.length
              const tabLoading = tab === 'FTD' ? ftLoading : tab === 'LCT' ? ltLoading : tab === 'GMA' ? gmLoading : lvLoading
              const isActive   = activeTab === tab
              const activeBg   = tab === 'FTD' ? 'bg-locatel-blue' : tab === 'LCT' ? 'bg-farmatodo-green' : tab === 'GMA' ? 'bg-gama-red' : 'bg-luvebras-green'
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? `${activeBg} text-white`
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {tab}
                  {query && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {tabLoading ? '…' : cnt.toLocaleString()}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* BCV bar */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">
              {totalHits > 0 && query && !loading && (
                <span>{totalHits.toLocaleString()} resultados</span>
              )}
            </p>
            {bcvRate ? (
              <p className="text-xs text-gray-400">
                Tasa BCV:{' '}
                <span className="font-semibold text-farmatodo-green">
                  Bs {bcvRate.toLocaleString('es-VE', { minimumFractionDigits: 2 })} / $
                </span>
                {bcvFecha && (
                  <span className="ml-1 text-gray-300">
                    · {new Date(bcvFecha).toLocaleDateString('es-VE')}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-xs text-gray-300">Cargando tasa BCV...</p>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Spinner */}
        {loading && (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-4 border-farmatodo-green border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && !query && (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🛒</p>
            <p className="text-gray-700 text-xl font-semibold">Comparador de precios de grandes cadenas</p>
          </div>
        )}

        {/* No results */}
        {!loading && query && !hasResults && (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-gray-500">
              Sin resultados para <strong>"{query}"</strong>
              <span className="text-gray-400"> en {activeTab}</span>
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && hasResults && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {products.map(product => (
                <ProductCard key={product.id} product={product} bcvRate={bcvRate} />
              ))}
            </div>
            {canLoadMore && (
              <div className="text-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="bg-farmatodo-green hover:bg-farmatodo-dark text-white font-semibold px-10 py-2.5 rounded-xl transition-colors disabled:opacity-60"
                >
                  {loadingMore ? 'Cargando...' : 'Ver más productos'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
