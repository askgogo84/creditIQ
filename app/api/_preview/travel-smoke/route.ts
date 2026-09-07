import { NextRequest, NextResponse } from 'next/server'
import { searchFlightAwards } from '@/lib/award-inventory/flight-orchestrator'
import { AwardToolHotelProvider } from '@/lib/award-inventory/providers/awardtool'
import { flightSourceForProgrammeId } from '@/lib/redemption-rails/programme-resolver'
import { buildRedemption, pickBestAwardOnly, type UserCard } from '@/lib/fusion-core'
import type { SeatsAeroResult } from '@/lib/seats-aero'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

function plusDays(days: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function sanitizedAttempts(attempts: Array<{ source: string; configured: boolean; state: string; freshness: string | null }>) {
  return attempts.map(({ source, configured, state, freshness }) => ({ source, configured, state, freshness }))
}

export async function GET(req: NextRequest) {
  if (process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const date = plusDays(21)
  const awardQueries = [
    { label: 'BLR-SIN-business', origin: 'BLR', destination: 'SIN', date, cabin: 'business' as const, adults: 1 },
    { label: 'BLR-BOM-economy', origin: 'BLR', destination: 'BOM', date, cabin: 'economy' as const, adults: 1 },
  ]

  const started = Date.now()
  const [awardA, awardB, cashResponse, hotelProperties] = await Promise.all([
    searchFlightAwards(awardQueries[0]),
    searchFlightAwards(awardQueries[1]),
    fetch(new URL(`/api/flights/search?from=BLR&to=SIN&date_from=${date}&date_to=${date}&cabin=business`, req.url), { cache: 'no-store' })
      .then(async response => ({ status: response.status, body: await response.json().catch(() => ({})) })),
    new AwardToolHotelProvider().listSupportedProperties({ destination: 'Bangkok' }),
  ])

  const awards = [awardA, awardB]
  const awardSummaries = awards.map((result, index) => ({
    label: awardQueries[index].label,
    status: result.status,
    authority: result.pricingAuthority,
    optionCount: result.options.length,
    programmes: [...new Set(result.options.map(option => option.programmeId))],
    lowestMiles: result.options.length ? Math.min(...result.options.map(option => option.miles)) : null,
    attempts: sanitizedAttempts(result.attempts),
  }))

  const firstLiveOption = awards.flatMap(result => result.options).find(option => option.evidence.freshness === 'LIVE') ?? null
  const syntheticCards: UserCard[] = [
    { bank: 'Axis Bank', card_name: 'Axis Atlas', card_last4: '0001', points_balance: 150000, points_currency: 'EDGE Miles', selfEntered: true },
    { bank: 'HDFC Bank', card_name: 'HDFC Infinia Metal Edition', card_last4: '0002', points_balance: 150000, points_currency: 'Reward Points', selfEntered: true },
  ]

  let wallet: Record<string, unknown> = { tested: false, reason: 'No live award option returned on the smoke routes.' }
  if (firstLiveOption) {
    const source = flightSourceForProgrammeId(firstLiveOption.programmeId)
    if (source) {
      const legacyAward: SeatsAeroResult = {
        available: true,
        mileageCost: firstLiveOption.miles,
        remainingSeats: 1,
        airlines: '',
        isDirect: firstLiveOption.segments.length === 1,
        source,
        date,
        id: firstLiveOption.providerResultId,
        originAirport: firstLiveOption.origin,
        destinationAirport: firstLiveOption.destination,
        dataSource: 'estimated',
        yMileageCost: firstLiveOption.cabin === 'economy' ? firstLiveOption.miles : 0,
        jMileageCost: firstLiveOption.cabin === 'business' ? firstLiveOption.miles : 0,
      }
      const paths = buildRedemption(syntheticCards, legacyAward, 0)
      const best = pickBestAwardOnly(paths)
      wallet = {
        tested: true,
        programmeId: firstLiveOption.programmeId,
        transferSource: source,
        totalCards: paths.length,
        transferableCards: paths.filter(path => path.status === 'ok').length,
        affordableCards: paths.filter(path => path.status === 'ok' && path.canAfford).length,
        bestCard: best?.cardName ?? null,
        bestPointsNeeded: best?.cardPointsNeeded ?? null,
      }
    }
  }

  const cashBody = cashResponse.body as Record<string, unknown>
  const cashFlights = Array.isArray(cashBody.flights) ? cashBody.flights : []
  const cash = {
    httpStatus: cashResponse.status,
    source: cashBody.source ?? null,
    rows: cashFlights.length,
    requestedCabin: cashBody.requestedCabin ?? null,
    cashCabinVerified: cashBody.cashCabinVerified ?? null,
    attempts: Array.isArray(cashBody.attempts)
      ? cashBody.attempts.map((attempt: any) => ({ provider: attempt.provider, ok: attempt.ok, loaded: attempt.loaded, status: attempt.status ?? null }))
      : [],
  }

  const hotels = {
    provider: 'awardtool',
    freshness: 'CACHED',
    destination: 'Bangkok',
    count: hotelProperties.length,
    programmes: [...new Set(hotelProperties.map(property => property.programmeId))],
    withPointsRange: hotelProperties.filter(property => property.observedPointsMin != null || property.observedPointsMedian != null).length,
  }

  const awardToolOperational = awardSummaries.some(summary => summary.attempts.some(attempt => attempt.source === 'awardtool' && attempt.configured && !['ERROR', 'UNAVAILABLE'].includes(attempt.state)))
  const liveAwardReturned = awardSummaries.some(summary => summary.authority === 'DATE_SPECIFIC_LIVE' && summary.optionCount > 0)
  const cashOperational = cash.httpStatus === 200 && cash.rows > 0
  const hotelOperational = hotels.count > 0
  const walletOperational = wallet.tested === true && Number(wallet.transferableCards || 0) > 0

  return NextResponse.json({
    previewOnly: true,
    date,
    elapsedMs: Date.now() - started,
    pass: awardToolOperational && cashOperational && hotelOperational,
    gates: { awardToolOperational, liveAwardReturned, cashOperational, hotelOperational, walletOperational },
    awards: awardSummaries,
    cash,
    wallet,
    hotels,
  })
}
