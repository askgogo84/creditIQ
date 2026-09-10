import { NextRequest, NextResponse } from 'next/server'
import { GET as searchCashFlights } from '@/app/api/flights/search/route'
import { verifyGogoServiceRequest } from '@/lib/gogo-service-auth'
import { airlineDisplayName, cashSourceCabinVerified } from '@/lib/flights/fusion-match'
import { findAirIndiaMaharajaGuide } from '@/lib/data/air-india-maharaja-guide'
import { loadDecisionPortfolio, type DecisionWalletCard } from '@/lib/wallet/decision-portfolio'
import { buildWalletRailMatrix, type WalletRailCardInput } from '@/lib/redemption-rails/matrix'
import { programmeIdForFlightCarrier } from '@/lib/redemption-rails/programme-resolver'
import { buildTravelDecisionContract } from '@/lib/travel/decision-contract'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

type Cabin = 'economy' | 'premium_economy' | 'business' | 'first'

type BridgeBody = {
  userLinkId?: string | null
  type?: string
  origin?: string
  destination?: string
  departDate?: string
  returnDate?: string | null
  cabin?: string
  adults?: number
  limit?: number
  preferences?: Record<string, unknown> | null
}

function normalizeCabin(raw: unknown): Cabin {
  const value = String(raw || 'economy').toLowerCase().replace(/[ -]+/g, '_')
  if (value === 'premium_economy' || value === 'business' || value === 'first') return value
  return 'economy'
}

function safeIata(raw: unknown) {
  const value = String(raw || '').trim().toUpperCase()
  return /^[A-Z]{3}$/.test(value) ? value : ''
}

function safeIsoDay(raw: unknown) {
  const value = String(raw || '').trim()
  return /^20\d{2}-\d{2}-\d{2}$/.test(value) ? value : ''
}

function safeCashMinor(raw: unknown) {
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0) return null
  const minor = Math.round(value * 100)
  return Number.isSafeInteger(minor) ? minor : null
}

function decisionRailCards(portfolio: DecisionWalletCard[]): WalletRailCardInput[] {
  return portfolio.map((card, index) => ({
    walletKey: `${card.source}:${card.bank}:${card.last4 ?? card.cardName ?? index}`,
    bank: card.bank,
    cardName: card.cardName ?? `Unidentified ${card.bank} card`,
    pointsBalance: card.points,
    balanceVerified: card.verified,
  }))
}

function publishedGuideFor(programmeId: string | null, from: string, to: string, cabin: Cabin) {
  if (programmeId !== 'air-india-maharaja' || cabin === 'first' || cabin === 'premium_economy') return null
  const guide = findAirIndiaMaharajaGuide(from, to)
  if (!guide) return null
  const points = cabin === 'business' ? guide.businessPoints : guide.economyPoints
  if (points == null) return null
  return { ...guide, points, cabin }
}

function compactWallet(portfolio: DecisionWalletCard[]) {
  return portfolio.map((card) => ({
    source: card.source,
    bank: card.bank,
    cardName: card.cardName,
    points: card.points,
    pointsCurrency: card.pointsCurrency,
    verified: card.verified,
    observedAt: card.observedAt,
  }))
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  if (!verifyGogoServiceRequest(req, rawBody)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: BridgeBody
  try {
    body = JSON.parse(rawBody || '{}') as BridgeBody
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const origin = safeIata(body.origin)
  const destination = safeIata(body.destination)
  const departDate = safeIsoDay(body.departDate)
  const returnDate = body.returnDate ? safeIsoDay(body.returnDate) : ''
  const cabin = normalizeCabin(body.cabin)
  const adults = Number.isFinite(Number(body.adults)) ? Math.max(1, Math.min(9, Number(body.adults))) : 1
  const limit = Number.isFinite(Number(body.limit)) ? Math.max(1, Math.min(20, Number(body.limit))) : 8
  const userLinkId = typeof body.userLinkId === 'string' && body.userLinkId.trim().length <= 200
    ? body.userLinkId.trim()
    : ''

  if (body.type && body.type !== 'flight') {
    return NextResponse.json({ error: 'type must be flight' }, { status: 400 })
  }
  if (!origin || !destination || !departDate) {
    return NextResponse.json({ error: 'origin, destination and departDate are required' }, { status: 400 })
  }
  if (origin === destination) {
    return NextResponse.json({ error: 'origin and destination must differ' }, { status: 400 })
  }
  if (body.returnDate && !returnDate) {
    return NextResponse.json({ error: 'returnDate must be YYYY-MM-DD when provided' }, { status: 400 })
  }

  const searchUrl = new URL('/api/flights/search', req.nextUrl.origin)
  searchUrl.searchParams.set('from', origin)
  searchUrl.searchParams.set('to', destination)
  searchUrl.searchParams.set('date_from', departDate)
  searchUrl.searchParams.set('date_to', departDate)
  searchUrl.searchParams.set('cabin', cabin)

  const cashResponse = await searchCashFlights(new NextRequest(searchUrl))
  const cashPayload = await cashResponse.json().catch(() => ({} as any))
  const coverage = cashPayload?.coverage ?? null
  const source = typeof cashPayload?.source === 'string' ? cashPayload.source : 'none'
  const mode = String(coverage?.mode || 'UNAVAILABLE')
  const live = mode === 'PROVIDER_COMPLETE' || mode === 'PROVIDER_WINDOW'
  const cashCabinVerified = cashSourceCabinVerified(source, cashPayload?.cashCabinVerified)
  const rawFlights = Array.isArray(cashPayload?.flights) ? cashPayload.flights.slice(0, limit) : []

  let portfolio: DecisionWalletCard[] = []
  let walletError = false
  if (userLinkId) {
    try {
      portfolio = await loadDecisionPortfolio(userLinkId)
    } catch (error) {
      walletError = true
      console.error('gogo flight bridge wallet load failed', error)
    }
  }
  const railCards = decisionRailCards(portfolio)

  const flights = rawFlights.map((flight: any) => {
    const displayAirline = airlineDisplayName(flight.airline)
    const programmeId = programmeIdForFlightCarrier(flight.airline) ?? programmeIdForFlightCarrier(displayAirline)
    const guide = publishedGuideFor(programmeId, origin, destination, cabin)
    const cashMinor = safeCashMinor(flight.price)
    const matrix = buildWalletRailMatrix(railCards, 'flight', programmeId)
    const decision = buildTravelDecisionContract({
      matrix,
      pricing: {
        travelKind: 'flight',
        programmeId,
        programmePointsRequired: guide?.points ?? null,
        awardTaxesMinor: null,
        awardTaxesCurrency: null,
        cashPriceMinor: cashMinor,
        cashCurrency: cashMinor == null ? null : 'INR',
      },
      inventory: {
        state: live ? 'AVAILABLE' : mode === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'UNKNOWN',
        selection: {
          id: flight.id,
          from: origin,
          to: destination,
          departure: flight.departure,
          cabin,
          airline: displayAirline,
        },
      },
      awardStatus: guide ? 'DISCOVERY_ONLY' : 'NOT_FOUND',
      cashSource: source,
      awardSource: guide ? 'air-india-published-guide' : null,
      awardPricingAuthority: guide ? 'PUBLISHED_GUIDE_DISCOVERY' : null,
      provenance: {
        cashFareVerifiedForCabin: cashCabinVerified || cabin === 'economy',
        cashCoverageMode: mode,
        linkedWallet: Boolean(userLinkId),
        walletCards: portfolio.length,
        guideAsOf: guide?.asOf ?? null,
        guideSourceUrl: guide?.sourceUrl ?? null,
        guideAvailability: guide?.availability ?? null,
      },
    })

    return {
      id: flight.id,
      price: Number.isFinite(Number(flight.price)) ? Number(flight.price) : null,
      currency: 'INR',
      airline: displayAirline,
      airlineCode: flight.airline,
      from: flight.from || origin,
      to: flight.to || destination,
      departure: flight.departure || null,
      arrival: flight.arrival || null,
      duration: flight.duration ?? null,
      durationSeconds: flight.durationSeconds ?? null,
      stops: flight.stops ?? null,
      bookingLink: flight.bookingLink || null,
      provider: flight.provider || source,
      cashCabin: flight.cashCabin || cabin,
      live,
      cashFareVerifiedForCabin: cashCabinVerified || cabin === 'economy',
      awardGuide: guide ? {
        programme: guide.programme,
        points: guide.points,
        cabin: guide.cabin,
        asOf: guide.asOf,
        sourceUrl: guide.sourceUrl,
        availability: guide.availability,
        note: guide.note,
      } : null,
      redemption: decision.searchSummary ?? null,
    }
  })

  return NextResponse.json({
    contract: 'gogo-creditiq-travel-v1',
    type: 'flight',
    request: {
      origin,
      destination,
      departDate,
      returnDate: returnDate || null,
      cabin,
      adults,
      preferences: body.preferences ?? null,
    },
    inventory: {
      state: live ? 'LIVE_PROVIDER' : mode === 'PARTIAL_FALLBACK' ? 'DISCOVERY_ONLY' : 'UNAVAILABLE',
      live,
      source,
      fetchedAt: coverage?.fetched_at || new Date().toISOString(),
      coverage,
      attempts: Array.isArray(cashPayload?.attempts) ? cashPayload.attempts : [],
    },
    identity: {
      linked: Boolean(userLinkId),
      pointsAware: Boolean(userLinkId) && !walletError,
      walletCards: portfolio.length,
      verifiedBalances: portfolio.filter((card) => card.verified).length,
      error: walletError ? 'wallet unavailable' : null,
    },
    wallet: compactWallet(portfolio),
    flights,
    bookingPolicy: {
      mode: 'provider_handoff',
      requiresRepriceBeforeBooking: true,
      irreversiblePointsTransferAllowed: false,
    },
  }, { status: cashResponse.status >= 500 && !rawFlights.length ? 503 : 200 })
}
