const GAMA_BASE  = 'https://api.cl94ncbhsi-excelsior1-p1-public.model-t.cc.commerce.ondemand.com/occ/v2/egb2c-spa/products/search'
const WAREHOUSES = ['S007', 'S008', 'S010']
// Fields must be passed pre-encoded exactly as the site sends them — the API is strict about format
const FIELDS = 'products(score%2CbaseProduct%2CtaxWithDiscount(formattedValue%2Cvalue)%2CseoName%2Ccode%2Cname%2Csummary%2Cconfigurable%2CconfiguratorType%2Cmultidimensional%2Cprice(FULL)%2Cimages(FULL)%2Cstock(FULL)%2CaverageRating%2CvariantOptions%2CvatAmountPrice(formattedValue)%2CtotalWithVatPrice(formattedValue%2Cvalue)%2CtotalPriceWithNoDiscount(formattedValue)%2CbasePriceWithDiscount(formattedValue)%2Ccategories(code%2Cname)%2Cpromotions(code%2Cname%2Cmessage%2CpromotionType%2ClabelColor%2ClabelTextColor))%2Cfacets%2Cbreadcrumbs%2Cpagination(DEFAULT)%2Csorts(DEFAULT)%2CfreeTextSearch%2CcurrentQuery'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept':     'application/json',
  'Origin':     'https://gamaenlinea.com',
  'Referer':    'https://gamaenlinea.com/',
}

function parseRef(str) {
  if (!str) return null
  const n = parseFloat(str.replace('Ref.', '').replace(',', '.').trim())
  return isNaN(n) ? null : n
}

function mapProduct(p) {
  const img = p.images?.find(i => i.format === 'product' && i.imageType === 'PRIMARY')
    ?? p.images?.find(i => i.imageType === 'PRIMARY')
  const regularPrice    = p.price?.value ?? 0
  const discountedPrice = parseRef(p.basePriceWithDiscount?.formattedValue)
  return {
    code:            p.code,
    name:            p.name ?? '',
    regularPrice,
    discountedPrice: discountedPrice !== null && discountedPrice < regularPrice ? discountedPrice : null,
    imageUrl:        img ? `https://egb2c.cl94ncbhsi-excelsior1-p1-public.model-t.cc.commerce.ondemand.com${img.url}` : '',
    inStock:         p.stock?.stockLevelStatus === 'inStock',
  }
}

async function searchWarehouse(query, page, pageSize, warehouse) {
  const url = `${GAMA_BASE}?fields=${FIELDS}&query=${encodeURIComponent(query)}&pageSize=${pageSize}&currentPage=${page}&lang=es&curr=REF&warehouse=${warehouse}`
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
  return res.json()
}

export async function POST(request) {
  try {
    const body     = await request.json()
    const query    = typeof body.query === 'string' ? body.query.slice(0, 200) : ''
    const page     = Math.max(0, Math.min(Number(body.page)     || 0,  100))
    const pageSize = Math.max(1, Math.min(Number(body.pageSize) || 30,  50))

    // Search all warehouses in parallel
    const results = await Promise.allSettled(
      WAREHOUSES.map(w => searchWarehouse(query, page, pageSize, w))
    )

    // Merge and deduplicate by product code
    // Priority: inStock > outOfStock, then first warehouse found (S007 is primary)
    const seen = new Map()
    let maxTotal = 0

    for (const result of results) {
      if (result.status !== 'fulfilled') continue
      const data = result.value
      if (data.pagination?.totalResults > maxTotal) maxTotal = data.pagination.totalResults

      for (const p of data.products ?? []) {
        const mapped = mapProduct(p)
        if (!seen.has(mapped.code)) {
          seen.set(mapped.code, mapped)
        } else {
          // Replace only if new entry is inStock and existing is not
          const existing = seen.get(mapped.code)
          if (mapped.inStock && !existing.inStock) {
            seen.set(mapped.code, mapped)
          }
        }
      }
    }

    const products = Array.from(seen.values())

    return Response.json({
      products,
      totalResults: maxTotal,
      currentPage:  page,
      totalPages:   Math.ceil(maxTotal / pageSize),
    })
  } catch {
    return Response.json({ error: 'Error al buscar en Gama' }, { status: 500 })
  }
}
