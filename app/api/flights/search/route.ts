import { NextRequest, NextResponse } from 'next/server'

// Kiwi Tequila live flight search
// Docs: https://tequila.kiwi.com/portal/docs/tequila-api/search_api
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') || 'DEL'
  const to = searchParams.get('to') || 'BOM'
  const dateFrom = searchParams.get('date_from') || ''
  const dateTo = searchParams.get('date_to') || ''
  const adults = searchParams.get('adults') || '1'
  const cabinClass = searchParams.get('cabin') || 'M' // M=economy, C=business, F=first
  const apiKey = process.env.KIWI_TEQUILA_API_KEY || ''

  if (!apiKey) {
    return NextResponse.json({ error: 'Kiwi API key not configured' }, { status: 500 })
  }

  try {
    const url = new URL('https://api.tequila.kiwi.com/v2/search')
    url.searchParams.set('fly_from', from)
    url.searchParams.set('fly_to', to)
    if (dateFrom) url.searchParams.set('date_from', dateFrom)
    if (dateTo) url.searchParams.set('date_to', dateTo)
    url.searchParams.set('adults', adults)
    url.searchParams.set('selected_cabins', cabinClass)
    url.searchParams.set('curr', 'INR')
    url.searchParams.set('limit', '5')
    url.searchParams.set('sort', 'price')
    url.searchParams.set('max_stopovers', '2')

    const res = await fetch(url.toString(), {
      headers: { 'apikey': apiKey },
    })

    if (!res.ok) {
      throw new Error(`Kiwi API error: ${res.status}`)
    }

    const data = await res.json()

    // Normalize response
    const flights = (data.data || []).map((f: any) => ({
      id: f.id,
      price: f.price,
      airline: f.airlines?.[0] || 'Unknown',
      from: f.flyFrom,
      to: f.flyTo,
      departure: f.local_departure,
      arrival: f.local_arrival,
      duration: Math.round(f.duration?.total / 3600),
      stops: f.route?.length - 1 || 0,
      bookingLink: f.deep_link,
      currency: 'INR',
    }))

    return NextResponse.json({ flights, currency: 'INR' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
