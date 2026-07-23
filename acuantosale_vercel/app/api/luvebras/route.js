const GQL_URL    = 'https://api.tuarmi.com/graphql'
const STORE_ID   = '9ad0305a-c342-4a48-a029-6282c1edca91'
const ROOT_CAT   = 'c3a2b3b1-c1bc-431d-8f81-c069cd28d56a'

const QUERY = `
query SearchProducts($data: SearchProductsInput) {
  searchProducts(data: $data) {
    total
    count
    results {
      id
      name { es }
      masterVariant {
        availability { isOnStock }
        prices {
          value { centAmount currencyCode }
          discounted { value { centAmount } }
        }
        images { url }
      }
    }
  }
}`

export async function POST(request) {
  try {
    const body    = await request.json()
    const query   = typeof body.query === 'string' ? body.query.slice(0, 200) : ''
    const page    = Math.max(1, Math.min(Number(body.page)    || 1,  100))
    const perPage = Math.max(1, Math.min(Number(body.perPage) || 30,  50))

    const res = await fetch(GQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'Origin':          'https://www.automercadosluvebras.com',
        'Referer':         'https://www.automercadosluvebras.com/',
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'country':         'VEN',
        'ctauthorization': 'null',
        'usertype':        'CLIENT',
        'x-client-host':  'www.automercadosluvebras.com',
      },
      body: JSON.stringify({
        operationName: 'SearchProducts',
        variables: {
          data: {
            page,
            perPage,
            onlyAvailable: false,
            store:         STORE_ID,
            withoutExtras: 'luvebras',
            name:          query,
            categories:    [ROOT_CAT],
            sortBy:        { direction: 'desc', field: 'categories_orderHint' },
          },
        },
        query: QUERY,
      }),
      signal: AbortSignal.timeout(8000),
    })

    const data = await res.json()
    const raw  = data?.data?.searchProducts

    const products = (raw?.results ?? []).map(p => {
      const mv          = p.masterVariant
      const price       = mv?.prices?.[0]
      const centAmount  = price?.discounted?.value?.centAmount ?? price?.value?.centAmount ?? 0
      const fullCents   = price?.value?.centAmount ?? 0
      return {
        id:          p.id,
        name:        p.name?.es ?? '',
        priceUsd:    centAmount / 100,
        fullPriceUsd: fullCents / 100,
        imageUrl:    mv?.images?.[0]?.url ?? '',
        inStock:     mv?.availability?.isOnStock ?? true,
      }
    })

    return Response.json({ products, total: raw?.total ?? 0 })
  } catch {
    return Response.json({ error: 'Error al buscar en Luvebras' }, { status: 500 })
  }
}
