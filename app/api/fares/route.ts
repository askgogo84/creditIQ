// app/api/fares/route.ts
// Public read of the cron-populated cached_fares table.
//   GET /api/fares?origin=Bangalore&destination=Bangkok[&depart_date=YYYY-MM-DD]
// Resolves names/airports -> TP city codes, returns fares sorted cheapest-first
// with found_at (freshness anchor) and a per-row `stale` flag.
//
// Honesty contract: `stale` is TP's expires_at < now. The UI DEMOTES stale fares
// to estimates (no gold badge) — freshness is a demotion here, not a caveat.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normalizeToCity, airlineName } from '@/lib/fares'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DATE_WINDOW_DAYS = 2

function shiftDate(ymd: string, deltaDays: number): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!m) return null
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  if (isNaN(d.getTime())) return null
  d.setUTCDate(d.getUTCDate() + deltaDays)
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const origin = normalizeToCity(searchParams.get('origin'))
  const destination = normalizeToCity(searchParams.get('destination'))
  const departParam = (searchParams.get('depart_date') || '').trim()

  if (!origin || !destination) {
    return NextResponse.json({ error: 'origin and destination required' }, { status: 400 })
  }

  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false },
        // Force fresh reads: without this, Next caches supabase-js's internal
        // fetch and serves stale fares — fatal for a freshness-labelled feature.
        global: { fetch: (input: any, init?: any) => fetch(input, { ...init, cache: 'no-store' }) },
      },
    )

    let q = sb
      .from('cached_fares')
      .select('origin, destination, depart_date, return_date, airline, flight_number, price_inr, source, expires_at, found_at')
      .eq('origin', origin)
      .eq('destination', destination)

    // Only constrain by date when a concrete YYYY-MM-DD is supplied (±2 days).
    const lo = departParam ? shiftDate(departParam, -DATE_WINDOW_DAYS) : null
    const hi = departParam ? shiftDate(departParam, DATE_WINDOW_DAYS) : null
    if (lo && hi) q = q.gte('depart_date', lo).lte('depart_date', hi)

    const { data, error } = await q.order('price_inr', { ascending: true }).limit(10)
    if (error) return NextResponse.json({ origin, destination, fares: [] })

    const now = Date.now()
    const fares = (data || []).map((r: any) => ({
      price_inr: r.price_inr,
      airline: r.airline,
      airlineName: airlineName(r.airline),
      flight_number: r.flight_number,
      depart_date: r.depart_date,
      return_date: r.return_date,
      found_at: r.found_at,
      source: r.source,
      expires_at: r.expires_at,
      stale: !!r.expires_at && new Date(r.expires_at).getTime() < now,
    }))

    return NextResponse.json({ origin, destination, fares })
  } catch {
    // Never fail the trip page on a cache read — degrade to "no cached fares".
    return NextResponse.json({ origin, destination, fares: [] })
  }
}
