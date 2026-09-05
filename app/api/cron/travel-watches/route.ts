import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminOrCron } from '@/lib/admin-auth'
import { searchAwardAvailability } from '@/lib/seats-aero'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

function plusDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const denied = await requireAdminOrCron(req)
  if (denied) return denied

  const db = sb()
  const { data: watches, error } = await db
    .from('travel_watches')
    .select('id,user_id,origin,destination,cabin,target_date,flex_days,nonstop_only,last_state,best_award_miles,best_programme,best_date')
    .eq('status', 'ACTIVE')
    .gte('target_date', new Date().toISOString().slice(0, 10))
    .order('target_date', { ascending: true })
    .limit(50)

  if (error) return NextResponse.json({ ok: false, error: 'watch list failed' }, { status: 500 })

  const summary = { watches: watches?.length || 0, checked: 0, changed: 0, errors: 0 }
  const base = new URL(req.url).origin

  for (const watch of watches || []) {
    try {
      const flex = Number(watch.flex_days) || 0
      const fromDate = plusDays(watch.target_date, -flex)
      const toDate = plusDays(watch.target_date, flex)
      const cabin = watch.cabin === 'premium_economy' ? 'economy' : watch.cabin
      const awards = await searchAwardAvailability(watch.origin, watch.destination, fromDate, toDate, undefined, cabin)
      const filteredAwards = watch.nonstop_only ? awards.filter(item => item.isDirect) : awards
      const bestAward = filteredAwards.sort((a, b) => a.mileageCost - b.mileageCost)[0] || null

      let cashPrice: number | null = null
      let cashSource: string | null = null
      try {
        const url = new URL('/api/flights/search', base)
        url.searchParams.set('from', watch.origin)
        url.searchParams.set('to', watch.destination)
        url.searchParams.set('date_from', watch.target_date)
        url.searchParams.set('date_to', watch.target_date)
        url.searchParams.set('cabin', cabin)
        const cashRes = await fetch(url.toString(), { cache: 'no-store' })
        const cash = await cashRes.json().catch(() => ({}))
        const fares = Array.isArray(cash.flights) ? cash.flights.filter((row: any) => Number(row?.price) > 0) : []
        fares.sort((a: any, b: any) => Number(a.price) - Number(b.price))
        if (fares[0]) cashPrice = Number(fares[0].price)
        cashSource = cash.source || null
      } catch {
        // Cash is a benchmark only; an award watch should still refresh when cash fails.
      }

      const state = bestAward ? 'VERIFY_FIRST' : cashPrice ? 'CASH_BETTER' : 'NO_RESULT'
      const changed = state !== watch.last_state
        || Number(bestAward?.mileageCost || 0) !== Number(watch.best_award_miles || 0)
        || String(bestAward?.source || '') !== String(watch.best_programme || '')
        || String(bestAward?.date || '') !== String(watch.best_date || '')

      const patch = {
        last_checked_at: new Date().toISOString(),
        last_state: state,
        best_award_miles: bestAward?.mileageCost || null,
        best_cash_minor: cashPrice ? Math.round(cashPrice * 100) : null,
        best_programme: bestAward?.source || null,
        best_date: bestAward?.date || null,
        last_result: {
          decision: state,
          background_watch: true,
          award: bestAward ? {
            source: bestAward.source,
            miles: bestAward.mileageCost,
            date: bestAward.date,
            seats: bestAward.remainingSeats,
            direct: bestAward.isDirect,
          } : null,
          cash: cashPrice ? { price: cashPrice, provider: cashSource } : null,
          evidence_note: 'Background discovery only. Open the Dream Trip for wallet-aware verification before any transfer or booking.',
        },
        ...(changed ? { last_notified_at: new Date().toISOString() } : {}),
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await db.from('travel_watches').update(patch).eq('id', watch.id).eq('user_id', watch.user_id)
      if (updateError) summary.errors++
      else {
        summary.checked++
        if (changed) summary.changed++
      }
    } catch {
      summary.errors++
    }
  }

  await db.from('cron_logs').insert({
    job_name: 'travel-watches',
    status: summary.errors === 0 ? 'success' : summary.checked > 0 ? 'partial' : 'error',
    details: summary,
    ran_at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true, ...summary })
}
