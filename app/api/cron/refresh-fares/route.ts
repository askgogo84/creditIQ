// app/api/cron/refresh-fares/route.ts
// Daily job: fetch cheapest Travelpayouts fares for our top India routes over the
// next 3 months and upsert them into cached_fares. Read back by /api/fares.
// Registered in vercel.json; gated by CRON_SECRET (requireAdminOrCron). Can also
// be triggered manually to warm the cache immediately after deploy (see below).
//
// Manual warm (PowerShell):
//   $env:CRON = "<CRON_SECRET>"
//   curl.exe -H "Authorization: Bearer $env:CRON" https://www.creditiq.app/api/cron/refresh-fares
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminOrCron } from '@/lib/admin-auth'
import { TP_CHEAP_ENDPOINT, TOP_ROUTES, nextMonths } from '@/lib/fares'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

const MONTHS_AHEAD = 3
const THROTTLE_MS = 250 // be a good citizen against the TP data API

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const ymd = (iso: string | null | undefined): string | null =>
  iso && typeof iso === 'string' && iso.length >= 10 ? iso.slice(0, 10) : null

interface FareRow {
  origin: string
  destination: string
  depart_date: string
  return_date: string | null
  airline: string | null
  flight_number: string | null
  price_inr: number
  source: string
  expires_at: string | null
  found_at: string
}

export async function GET(req: NextRequest) {
  const denied = await requireAdminOrCron(req)
  if (denied) return denied

  const token = process.env.TRAVELPAYOUTS_TOKEN || ''
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const summary = { routes: TOP_ROUTES.length, calls: 0, upserted: 0, empty: 0, errors: 0 }

  if (!token) {
    // Startup env-check already logs MISSING ENV; record it in cron_logs too.
    await sb.from('cron_logs').insert({
      job_name: 'refresh-fares', status: 'error',
      details: { error: 'TRAVELPAYOUTS_TOKEN missing' }, ran_at: new Date().toISOString(),
    })
    return NextResponse.json({ ok: false, reason: 'no_token' }, { status: 503 })
  }

  const months = nextMonths(MONTHS_AHEAD)

  for (const [origin, destination] of TOP_ROUTES) {
    for (const month of months) {
      const nowIso = new Date().toISOString()
      try {
        const url = new URL(TP_CHEAP_ENDPOINT)
        url.searchParams.set('origin', origin)
        url.searchParams.set('destination', destination)
        url.searchParams.set('depart_date', month) // YYYY-MM: cheapest within the month
        url.searchParams.set('currency', 'INR')
        url.searchParams.set('token', token)

        const res = await fetch(url.toString(), { headers: { 'X-Access-Token': token } })
        summary.calls++
        if (!res.ok) { summary.errors++; await sleep(THROTTLE_MS); continue }

        const data = await res.json()
        const entries = data?.data?.[destination]
        if (!entries || typeof entries !== 'object') { summary.empty++; await sleep(THROTTLE_MS); continue }

        const rows: FareRow[] = []
        for (const k of Object.keys(entries)) {
          const e = entries[k] || {}
          const price = Math.round(Number(e.price))
          const depart = ymd(e.departure_at)
          if (!(price > 0) || !depart) continue
          rows.push({
            origin,
            destination,
            depart_date: depart,
            return_date: ymd(e.return_at),
            airline: e.airline ?? null,
            flight_number: e.flight_number != null ? String(e.flight_number) : null,
            price_inr: price,
            source: 'travelpayouts',
            expires_at: typeof e.expires_at === 'string' ? e.expires_at : null,
            found_at: nowIso,
          })
        }

        if (rows.length) {
          const { error } = await sb
            .from('cached_fares')
            .upsert(rows, { onConflict: 'origin,destination,depart_date,return_date,source' })
          if (error) summary.errors++
          else summary.upserted += rows.length
        } else {
          summary.empty++
        }
      } catch {
        summary.errors++
      }
      await sleep(THROTTLE_MS)
    }
  }

  const status = summary.errors === 0 ? 'success' : summary.upserted > 0 ? 'partial' : 'error'
  await sb.from('cron_logs').insert({
    job_name: 'refresh-fares', status, details: summary, ran_at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true, ...summary })
}
