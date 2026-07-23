export async function POST(request) {
  try {
    const body  = await request.json()
    const query = typeof body.query === 'string' ? body.query.slice(0, 200) : ''
    const page  = Math.max(1, Math.min(Number(body.page)  || 1,  100))
    const count = Math.max(1, Math.min(Number(body.count) || 20,  50))

    const url = new URL('https://www.locatel.com.ve/api/intelligent-search/product_search/trade-policy/1')
    url.searchParams.set('query',  query)
    url.searchParams.set('page',   String(page))
    url.searchParams.set('count',  String(count))
    url.searchParams.set('locale', 'es-VE')
    url.searchParams.set('an',     'locatelvenezuela')

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept':     'application/json',
      },
      signal: AbortSignal.timeout(8000),
    })

    const data = await res.json()

    const products = (data.products ?? []).map(p => ({
      productId:   p.productId,
      productName: p.productName,
      brand:       p.brand,
      items: (p.items ?? []).slice(0, 1).map(item => ({
        images: (item.images ?? []).slice(0, 1).map(img => ({ imageUrl: img.imageUrl })),
        sellers: (item.sellers ?? []).slice(0, 1).map(s => ({
          commertialOffer: {
            Price:     s.commertialOffer?.Price     ?? 0,
            ListPrice: s.commertialOffer?.ListPrice ?? 0,
          },
        })),
      })),
    }))

    return Response.json({ products, recordsFiltered: data.recordsFiltered ?? 0 })
  } catch {
    return Response.json({ error: 'Error al buscar en Locatel' }, { status: 500 })
  }
}
