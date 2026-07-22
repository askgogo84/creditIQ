import { NextRequest, NextResponse } from 'next/server'

// Travelpayouts cheapest fares API
// Docs: https://support.travelpayouts.com/hc/en-us/articles/203956163
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const origin = searchParams.get('origin') || 'DEL'
  const destination = searchParams.get('destination') || ''
  const currency = 'INR'
  const token = process.env.TRAVELPAYOUTS_TOKEN || ''

  if (!token) {
    return NextResponse.json({ error: 'Travelpayouts token not configured' }, { status: 500 })
  }

  try {
    const url = new URL('https://api.travelpayouts.com/v1/prices/cheap')
    url.searchParams.set('origin', origin)
    if (destination) url.searchParams.set('destination', destination)
    url.searchParams.set('currency', currency)
    // Token goes in the X-Access-Token header ONLY — never the query string, which
    // would leak it into edge/access logs (same fix as cron/refresh-fares).

    const res = await fetch(url.toString(), {
      headers: { 'X-Access-Token': token },
      next: { revalidate: 3600 }, // cache 1 hour
    })

    if (!res.ok) {
      throw new Error(`Travelpayouts API error: ${res.status}`)
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
