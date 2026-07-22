export async function POST(request) {
  try {
    const body = await request.json()
    const query      = typeof body.query === 'string' ? body.query.slice(0, 200) : ''
    const page       = Math.max(0, Math.min(Number(body.page)        || 0,  100))
    const hitsPerPage = Math.max(1, Math.min(Number(body.hitsPerPage) || 20,  50))

    const res = await fetch(process.env.SEARCH_URL, {
      method: 'POST',
      headers: {
        'X-Algolia-Application-Id': process.env.SEARCH_APP_ID,
        'X-Algolia-Api-Key':        process.env.SEARCH_API_KEY,
        'Content-Type':             'application/json',
        'X-Country':                'VE',
      },
      body: JSON.stringify({
        requests: [{ indexName: process.env.SEARCH_INDEX, query, hitsPerPage, page }],
      }),
      signal: AbortSignal.timeout(8000),
    })

    const data = await res.json()
    const results = (data.results ?? []).map(r => ({
      hits:    r.hits    ?? [],
      nbHits:  r.nbHits  ?? 0,
      page:    r.page    ?? 0,
      nbPages: r.nbPages ?? 0,
    }))
    return Response.json({ results })
  } catch {
    return Response.json({ error: 'Error al buscar' }, { status: 500 })
  }
}
