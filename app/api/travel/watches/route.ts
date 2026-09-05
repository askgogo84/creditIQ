import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const URL_ENV = () => process.env.NEXT_PUBLIC_SUPABASE_URL!
const SVC = () => process.env.SUPABASE_SERVICE_ROLE_KEY!
const service = () => createClient(URL_ENV(), SVC(), { auth: { persistSession: false } })

const WATCH_SELECT = 'id,label,origin,destination,cabin,travellers,target_date,flex_days,nonstop_only,preferred_programmes,target_points,target_cash_minor,alert_channel,status,last_checked_at,last_state,best_award_miles,best_cash_minor,best_programme,best_date,last_result,created_at,updated_at'

function airport(value: unknown) {
  const v = String(value || '').trim().toUpperCase()
  return /^[A-Z]{3}$/.test(v) ? v : null
}

function date(value: unknown) {
  const v = String(value || '')
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
}

function plusDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function parseCreate(raw: any) {
  const origin = airport(raw?.origin)
  const destination = airport(raw?.destination)
  const targetDate = date(raw?.target_date)
  const cabin = ['economy', 'premium_economy', 'business', 'first'].includes(raw?.cabin) ? raw.cabin : 'business'
  const flexDays = [0, 3, 7].includes(Number(raw?.flex_days)) ? Number(raw.flex_days) : 3
  const travellers = Math.max(1, Math.min(9, Number(raw?.travellers) || 1))
  if (!origin || !destination || origin === destination || !targetDate) return null
  return {
    label: String(raw?.label || `${origin} → ${destination}`).trim().slice(0, 120) || `${origin} → ${destination}`,
    origin,
    destination,
    cabin,
    travellers,
    target_date: targetDate,
    flex_days: flexDays,
    nonstop_only: raw?.nonstop_only === true,
    preferred_programmes: Array.isArray(raw?.preferred_programmes) ? raw.preferred_programmes.map(String).slice(0, 10) : [],
    target_points: Number.isFinite(Number(raw?.target_points)) && Number(raw.target_points) > 0 ? Math.round(Number(raw.target_points)) : null,
    target_cash_minor: Number.isFinite(Number(raw?.target_cash_minor)) && Number(raw.target_cash_minor) > 0 ? Math.round(Number(raw.target_cash_minor)) : null,
    alert_channel: ['APP', 'EMAIL', 'WHATSAPP', 'BOTH'].includes(raw?.alert_channel) ? raw.alert_channel : 'APP',
  }
}

function summarizeRows(rows: any[]) {
  const awards = rows.filter(row => row?.award && Number(row.award.mileageCost) > 0)
    .sort((a, b) => Number(a.award.mileageCost) - Number(b.award.mileageCost))
  const cash = rows.filter(row => Number(row?.price) > 0)
    .sort((a, b) => Number(a.price) - Number(b.price))
  const bestAward = awards[0] || null
  const bestCash = cash[0] || null
  const affordable = awards.some(row => Array.isArray(row.redemption) && row.redemption.some((option: any) => option?.status === 'ok' && option?.canAfford))

  let state: 'VERIFY_FIRST' | 'WAIT' | 'CASH_BETTER' | 'NO_RESULT' = 'NO_RESULT'
  if (bestAward) state = affordable ? 'VERIFY_FIRST' : 'WAIT'
  else if (bestCash) state = 'CASH_BETTER'

  return {
    state,
    bestAward,
    bestCash,
    snapshot: {
      decision: state,
      award: bestAward ? {
        programme: bestAward.award.program,
        source: bestAward.award.source,
        miles: bestAward.award.mileageCost,
        date: bestAward.award.date,
        seats: bestAward.award.seats,
        direct: bestAward.award.isDirect,
        trip: bestAward.award.trip,
        wallet_routes: Array.isArray(bestAward.redemption) ? bestAward.redemption.slice(0, 5) : [],
      } : null,
      cash: bestCash ? {
        provider: bestCash.provider || null,
        price: bestCash.price,
        departure: bestCash.departure,
        airline: bestCash.airline,
        cabin_verified: bestCash.cashFareVerifiedForCabin === true,
      } : null,
      checked_at: new Date().toISOString(),
      evidence_note: 'A watch result is discovery evidence. Award space and irreversible transfers must be directly verified before action.',
    },
  }
}

export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res
  const { data, error } = await service().from('travel_watches').select(WATCH_SELECT).eq('user_id', gate.userId).order('created_at', { ascending: false }).limit(50)
  if (error) return NextResponse.json({ error: 'could not load travel watches' }, { status: 500 })
  return NextResponse.json({ watches: data ?? [] })
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res
  const raw = await req.json().catch(() => null)
  if (!raw) return NextResponse.json({ error: 'invalid json' }, { status: 400 })

  if (raw.action === 'check') {
    const id = String(raw.id || '')
    const sb = service()
    const { data: watch, error } = await sb.from('travel_watches').select(WATCH_SELECT).eq('id', id).eq('user_id', gate.userId).maybeSingle()
    if (error || !watch) return NextResponse.json({ error: 'watch not found' }, { status: 404 })

    const flex = Number(watch.flex_days) || 0
    const dateFrom = plusDays(watch.target_date, -flex)
    const dateTo = plusDays(watch.target_date, flex)
    const auth = req.headers.get('authorization') || ''
    const base = new URL(req.url).origin
    const fusion = await fetch(new URL('/api/flights/fusion', base), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({
        from: watch.origin,
        to: watch.destination,
        date_from: dateFrom,
        date_to: dateTo,
        cash_date: watch.target_date,
        cabin: watch.cabin === 'premium_economy' ? 'economy' : watch.cabin,
      }),
      cache: 'no-store',
    })
    const data = await fusion.json().catch(() => ({}))
    if (!fusion.ok || data.error) return NextResponse.json({ error: data.error || 'watch check failed' }, { status: 502 })

    const rows = Array.isArray(data.flights) ? data.flights : []
    const filtered = watch.nonstop_only ? rows.filter((row: any) => (row?.award?.trip?.stops ?? row?.stops) === 0) : rows
    const summary = summarizeRows(filtered)
    const patch = {
      last_checked_at: new Date().toISOString(),
      last_state: summary.state,
      best_award_miles: summary.bestAward ? Number(summary.bestAward.award.mileageCost) : null,
      best_cash_minor: summary.bestCash ? Math.round(Number(summary.bestCash.price) * 100) : null,
      best_programme: summary.bestAward?.award?.program || null,
      best_date: summary.bestAward?.award?.date || null,
      last_result: { ...summary.snapshot, route: data.route, counts: data.counts, cash_source: data.cashSource || null },
      updated_at: new Date().toISOString(),
    }
    const { data: updated, error: updateError } = await sb.from('travel_watches').update(patch).eq('id', id).eq('user_id', gate.userId).select(WATCH_SELECT).single()
    if (updateError) return NextResponse.json({ error: 'could not save watch result' }, { status: 500 })
    return NextResponse.json({ watch: updated })
  }

  const parsed = parseCreate(raw)
  if (!parsed) return NextResponse.json({ error: 'origin, destination and target_date are required' }, { status: 400 })
  const { data, error } = await service().from('travel_watches').insert({ user_id: gate.userId, ...parsed }).select(WATCH_SELECT).single()
  if (error || !data) return NextResponse.json({ error: 'could not create travel watch' }, { status: 500 })
  return NextResponse.json({ watch: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res
  const raw = await req.json().catch(() => null)
  const id = String(raw?.id || '')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (['ACTIVE', 'PAUSED', 'BOOKED', 'CANCELLED'].includes(raw?.status)) patch.status = raw.status
  if ([0, 3, 7].includes(Number(raw?.flex_days))) patch.flex_days = Number(raw.flex_days)
  if (raw?.target_date && date(raw.target_date)) patch.target_date = raw.target_date
  if (typeof raw?.nonstop_only === 'boolean') patch.nonstop_only = raw.nonstop_only
  if (['APP', 'EMAIL', 'WHATSAPP', 'BOTH'].includes(raw?.alert_channel)) patch.alert_channel = raw.alert_channel
  const { data, error } = await service().from('travel_watches').update(patch).eq('id', id).eq('user_id', gate.userId).select(WATCH_SELECT).maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'watch not found or update failed' }, { status: 404 })
  return NextResponse.json({ watch: data })
}

export async function DELETE(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res
  const id = new URL(req.url).searchParams.get('id') || ''
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await service().from('travel_watches').delete().eq('id', id).eq('user_id', gate.userId)
  if (error) return NextResponse.json({ error: 'could not delete watch' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
