export async function GET() {
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      next: { revalidate: 3600 },
    })
    const data = await res.json()
    const rate = data.promedio ?? data.venta ?? null
    return Response.json({ rate, fecha: data.fechaActualizacion ?? null })
  } catch {
    return Response.json({ rate: null }, { status: 500 })
  }
}
