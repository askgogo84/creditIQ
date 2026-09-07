import { searchFlightAwards } from '../lib/award-inventory/flight-orchestrator'
import { AwardToolHotelProvider } from '../lib/award-inventory/providers/awardtool'
import { buildRedemption, pickBestAwardOnly, type UserCard } from '../lib/fusion-core'
import type { SeatsAeroResult } from '../lib/seats-aero'
import { searchSkyscannerFlights, skyscannerFlightsConfigured } from '../lib/flights/providers/skyscanner-live'
import { searchAmadeusFlights, amadeusFlightsConfigured } from '../lib/flights/providers/amadeus'

function plusDays(days: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

async function cashSmoke(date: string) {
  if (skyscannerFlightsConfigured()) {
    try {
      const result = await searchSkyscannerFlights({ from: 'BLR', to: 'BOM', date, cabin: 'economy', adults: 1 })
      if (result.flights.length) return { source: 'skyscanner-live', rows: result.flights.length, responseOk: true, verified: true }
    } catch {}
  }
  if (amadeusFlightsConfigured()) {
    try {
      const result = await searchAmadeusFlights({ from: 'BLR', to: 'BOM', date, cabin: 'economy', adults: 1, max: 20 })
      if (result.flights.length) return { source: 'amadeus', rows: result.flights.length, responseOk: true, verified: true }
    } catch {}
  }
  const token = process.env.TRAVELPAYOUTS_TOKEN || ''
  if (!token) return { source: 'none', rows: 0, responseOk: false, verified: false }
  try {
    const url = new URL('https://api.travelpayouts.com/aviasales/v3/prices_for_dates')
    url.searchParams.set('origin', 'BLR')
    url.searchParams.set('destination', 'BOM')
    url.searchParams.set('one_way', 'true')
    url.searchParams.set('direct', 'false')
    url.searchParams.set('currency', 'inr')
    url.searchParams.set('sorting', 'price')
    url.searchParams.set('unique', 'false')
    url.searchParams.set('limit', '20')
    url.searchParams.set('page', '1')
    url.searchParams.set('token', token)
    const response = await fetch(url, { cache: 'no-store' })
    const body = await response.json().catch(() => ({})) as any
    const rows = Array.isArray(body?.data) ? body.data.length : 0
    return { source: 'travelpayouts-v3', rows, responseOk: response.ok, verified: false, httpStatus: response.status }
  } catch {
    return { source: 'travelpayouts-v3', rows: 0, responseOk: false, verified: false }
  }
}

async function main() {
  const date = plusDays(21)
  const started = Date.now()
  const queries = [
    { label: 'BLR-SIN-business', origin: 'BLR', destination: 'SIN', date, cabin: 'business' as const, adults: 1 },
    { label: 'DEL-LHR-economy', origin: 'DEL', destination: 'LHR', date, cabin: 'economy' as const, adults: 1 },
  ]

  const [awardA, awardB, cash, hotels] = await Promise.all([
    searchFlightAwards(queries[0]),
    searchFlightAwards(queries[1]),
    cashSmoke(date),
    new AwardToolHotelProvider().listSupportedProperties(),
  ])

  const awards = [awardA, awardB].map((result, index) => ({
    label: queries[index].label,
    status: result.status,
    authority: result.pricingAuthority,
    options: result.options.length,
    programmes: [...new Set(result.options.map(option => option.programmeId))],
    attempts: result.attempts.map(attempt => ({ source: attempt.source, configured: attempt.configured, state: attempt.state, freshness: attempt.freshness })),
  }))

  const syntheticAward: SeatsAeroResult = {
    available: true,
    mileageCost: 50000,
    remainingSeats: 1,
    airlines: 'SQ',
    isDirect: true,
    source: 'singapore',
    date,
    id: 'synthetic-wallet-smoke',
    originAirport: 'BLR',
    destinationAirport: 'SIN',
    dataSource: 'estimated',
    yMileageCost: 35000,
    jMileageCost: 50000,
  }
  const cards: UserCard[] = [
    { bank: 'Axis Bank', card_name: 'Axis Atlas', card_last4: '0001', points_balance: 150000, points_currency: 'EDGE Miles', selfEntered: true },
    { bank: 'HDFC Bank', card_name: 'HDFC Infinia Metal Edition', card_last4: '0002', points_balance: 150000, points_currency: 'Reward Points', selfEntered: true },
  ]
  const redemption = buildRedemption(cards, syntheticAward, 0)
  const best = pickBestAwardOnly(redemption)
  const wallet = {
    transferableCards: redemption.filter(item => item.status === 'ok').length,
    affordableCards: redemption.filter(item => item.status === 'ok' && item.canAfford).length,
    bestCard: best?.cardName ?? null,
    bestPointsNeeded: best?.cardPointsNeeded ?? null,
  }

  const awardtoolAttempts = awards.flatMap(item => item.attempts.filter(attempt => attempt.source === 'awardtool'))
  const awardToolOperational = awardtoolAttempts.length > 0 && awardtoolAttempts.every(attempt => attempt.configured) && awardtoolAttempts.some(attempt => !['ERROR', 'UNAVAILABLE'].includes(attempt.state))
  const liveAwardReturned = awards.some(item => item.authority === 'DATE_SPECIFIC_LIVE' && item.options > 0)
  const cashOperational = cash.responseOk && cash.rows > 0
  const hotelOperational = hotels.length > 0
  const walletOperational = wallet.transferableCards > 0 && wallet.affordableCards > 0

  const result = {
    date,
    elapsedMs: Date.now() - started,
    gates: { awardToolOperational, liveAwardReturned, cashOperational, hotelOperational, walletOperational },
    awards,
    cash,
    hotels: {
      count: hotels.length,
      programmes: [...new Set(hotels.map(hotel => hotel.programmeId))],
      withPointsRange: hotels.filter(hotel => hotel.observedPointsMin != null || hotel.observedPointsMedian != null).length,
    },
    wallet,
  }

  console.log(`TRAVEL_PROD_SMOKE_RESULT=${JSON.stringify(result)}`)
  if (!awardToolOperational || !cashOperational || !hotelOperational || !walletOperational) process.exit(1)
}

main().catch(error => {
  console.error(`TRAVEL_PROD_SMOKE_FATAL=${error instanceof Error ? error.message : 'unknown error'}`)
  process.exit(1)
})
