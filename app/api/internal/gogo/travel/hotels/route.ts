import { NextRequest, NextResponse } from 'next/server'
import { verifyGogoServiceRequest } from '@/lib/gogo-service-auth'
import {
  createHotelSearch,
  skyscannerHotelsConfigured,
} from '@/lib/hotels/providers/skyscanner-live'
import {
  bookingDemandConfigured,
  searchBookingDemandHotels,
} from '@/lib/hotels/providers/booking-demand'
import {
  hotelbedsConfigured,
  hotelbedsConfigurationState,
  searchHotelbedsHotels,
} from '@/lib/hotels/providers/hotelbeds-hbx'
import { loadDecisionPortfolio, type DecisionWalletCard } from '@/lib/wallet/decision-portfolio'
import { buildWalletRailMatrix, type WalletRailCardInput } from '@/lib/redemption-rails/matrix'
import { programmeIdForHotelChain } from '@/lib/redemption-rails/programme-resolver'
import { buildTravelDecisionContract } from '@/lib/travel/decision-contract'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

type Attempt = { provider: string; ok: boolean; loaded: number; note: string }

type BridgeBody = {
  userLinkId?: string | null
  type?: string
  destination?: string
  checkin?: string
  checkout?: string
  adults?: number
  rooms?: number
  limit?: number
  preferences?: Record<string, unknown> | null
}

function clean(value: unknown, max = 500) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function finiteNumber(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function safeCashMinor(value: unknown): number | null {
  const n = finiteNumber(value)
  if (n == null || n < 0) return null
  const minor = Math.round(n * 100)
  return Number.isSafeInteger(minor) ? minor : null
}

function hotelName(hotel: any) {
  return clean(hotel?.hotelName || hotel?.name || hotel?.hotel?.name || hotel?.property?.name || 'Hotel', 180)
}

function hotelChain(hotel: any) {
  return clean(hotel?.chainName || hotel?.chain || hotel?.brand || hotel?.hotel?.chain || hotelName(hotel), 180)
}

function hotelCurrency(hotel: any) {
  return clean(hotel?.currency || hotel?.price?.currency || hotel?.totalPrice?.currency || 'INR', 8).toUpperCase() || 'INR'
}

function hotelCashAmount(hotel: any) {
  const candidates = [
    hotel?.totalPrice,
    hotel?.price?.amount,
    hotel?.price,
    hotel?.amount,
    hotel?.total,
    hotel?.minPrice,
  ]
  for (const candidate of candidates) {
    const n = finiteNumber(candidate)
    if (n != null && n >= 0) return n
  }
  return null
}

function hotelId(hotel: any, index: number, provider: string) {
  return clean(hotel?.id || hotel?.hotelId || hotel?.code || hotel?.propertyId || `${provider}-${index}`, 180)
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

function unavailable(attempts: Attempt[], identity: Record<string, unknown>, wallet: ReturnType<typeof compactWallet>) {
  return NextResponse.json({
    contract: 'gogo-creditiq-travel-v1',
    type: 'hotel',
    hotels: [],
    offers: [],
    source: 'creditiq',
    error: 'no live hotel provider is configured or responding',
    attempts,
    identity,
    wallet,
    bookingPolicy: {
      mode: 'provider_handoff',
      requiresRepriceBeforeBooking: true,
      irreversiblePointsTransferAllowed: false,
    },
    coverage: {
      provider: 'none',
      mode: 'UNAVAILABLE',
      loaded: 0,
      provider_total: null,
      has_more: false,
      fetched_at: new Date().toISOString(),
      hbx_configuration: hotelbedsConfigurationState(),
      note: 'CreditIQ returned no usable live hotel inventory for this request.',
    },
  }, { status: 503 })
}

function enrichHotels(params: {
  hotels: any[]
  provider: string
  destination: string
  checkin: string
  checkout: string
  portfolio: DecisionWalletCard[]
  linked: boolean
}) {
  const railCards = decisionRailCards(params.portfolio)
  return params.hotels.map((hotel, index) => {
    const name = hotelName(hotel)
    const chain = hotelChain(hotel)
    const programmeId = programmeIdForHotelChain(chain) ?? programmeIdForHotelChain(name)
    const cashAmount = hotelCashAmount(hotel)
    const currency = hotelCurrency(hotel)
    const matrix = buildWalletRailMatrix(railCards, 'hotel', programmeId)
    const decision = buildTravelDecisionContract({
      matrix,
      pricing: {
        travelKind: 'hotel',
        programmeId,
        programmePointsRequired: null,
        awardTaxesMinor: null,
        awardTaxesCurrency: null,
        cashPriceMinor: safeCashMinor(cashAmount),
        cashCurrency: cashAmount == null ? null : currency,
      },
      inventory: {
        state: 'AVAILABLE',
        selection: {
          id: hotelId(hotel, index, params.provider),
          destination: params.destination,
          checkin: params.checkin,
          checkout: params.checkout,
          hotelName: name,
          chainName: chain || null,
        },
      },
      awardStatus: programmeId ? 'DISCOVERY_ONLY' : 'NOT_APPLICABLE',
      cashSource: params.provider,
      awardSource: null,
      awardPricingAuthority: null,
      provenance: {
        linkedWallet: params.linked,
        walletCards: params.portfolio.length,
        hotelProgrammeResolved: programmeId,
        awardInventoryVerified: false,
        note: programmeId
          ? 'Hotel loyalty programme resolved from property/chain identity. Exact points-night pricing and award availability are not claimed without provider evidence.'
          : 'Independent/unmapped property: only sourced card-portal, voucher or cash rails may be considered.',
      },
    })

    return {
      ...hotel,
      id: hotelId(hotel, index, params.provider),
      hotelName: name,
      chainName: chain || null,
      loyaltyProgrammeId: programmeId,
      cashAmount,
      currency,
      redemption: decision.searchSummary ?? null,
    }
  })
}

function liveResponse(params: {
  hotels: any[]
  provider: string
  coverage: Record<string, unknown>
  attempts: Attempt[]
  destination: string
  checkin: string
  checkout: string
  adults: number
  rooms: number
  portfolio: DecisionWalletCard[]
  userLinkId: string
  walletError: boolean
}) {
  const hotels = enrichHotels({
    hotels: params.hotels,
    provider: params.provider,
    destination: params.destination,
    checkin: params.checkin,
    checkout: params.checkout,
    portfolio: params.portfolio,
    linked: Boolean(params.userLinkId),
  })
  const identity = {
    linked: Boolean(params.userLinkId),
    pointsAware: Boolean(params.userLinkId) && !params.walletError,
    walletCards: params.portfolio.length,
    verifiedBalances: params.portfolio.filter((card) => card.verified).length,
    error: params.walletError ? 'wallet unavailable' : null,
  }

  return NextResponse.json({
    contract: 'gogo-creditiq-travel-v1',
    type: 'hotel',
    request: {
      destination: params.destination,
      checkin: params.checkin,
      checkout: params.checkout,
      adults: params.adults,
      rooms: params.rooms,
    },
    inventory: {
      state: 'LIVE_PROVIDER',
      live: true,
      source: params.provider,
      fetchedAt: String(params.coverage.fetched_at || new Date().toISOString()),
      coverage: params.coverage,
      attempts: params.attempts,
    },
    source: params.provider,
    attempts: params.attempts,
    coverage: params.coverage,
    identity,
    wallet: compactWallet(params.portfolio),
    hotels,
    offers: hotels,
    bookingPolicy: {
      mode: 'provider_handoff',
      requiresRepriceBeforeBooking: true,
      irreversiblePointsTransferAllowed: false,
    },
  })
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

  const destination = typeof body.destination === 'string' ? body.destination.trim() : ''
  const checkin = typeof body.checkin === 'string' ? body.checkin.trim() : ''
  const checkout = typeof body.checkout === 'string' ? body.checkout.trim() : ''
  const adults = Number.isFinite(Number(body.adults)) ? Math.max(1, Math.min(9, Number(body.adults))) : 1
  const rooms = Number.isFinite(Number(body.rooms)) ? Math.max(1, Math.min(5, Number(body.rooms))) : 1
  const limit = Number.isFinite(Number(body.limit)) ? Math.max(1, Math.min(50, Number(body.limit))) : 20
  const userLinkId = typeof body.userLinkId === 'string' && body.userLinkId.trim().length <= 200
    ? body.userLinkId.trim()
    : ''

  if (body.type && body.type !== 'hotel') {
    return NextResponse.json({ error: 'type must be hotel' }, { status: 400 })
  }
  if (!destination || !/^20\d{2}-\d{2}-\d{2}$/.test(checkin) || !/^20\d{2}-\d{2}-\d{2}$/.test(checkout)) {
    return NextResponse.json({ error: 'destination, checkin and checkout are required' }, { status: 400 })
  }
  if (checkout <= checkin) {
    return NextResponse.json({ error: 'checkout must be after checkin' }, { status: 400 })
  }

  let portfolio: DecisionWalletCard[] = []
  let walletError = false
  if (userLinkId) {
    try {
      portfolio = await loadDecisionPortfolio(userLinkId)
    } catch (error) {
      walletError = true
      console.error('gogo hotel bridge wallet load failed', error)
    }
  }

  const attempts: Attempt[] = []

  if (bookingDemandConfigured()) {
    try {
      const result = await searchBookingDemandHotels({ destination, checkin, checkout, adults, rooms, limit, page: null })
      attempts.push({ provider: 'booking-demand', ok: true, loaded: result.offers.length, note: result.offers.length ? 'live Booking.com offers returned' : 'zero offers; trying next provider' })
      if (result.offers.length) {
        const coverage = {
          provider: 'booking-demand',
          mode: result.nextPage ? 'PROVIDER_PAGEABLE' : 'PROVIDER_COMPLETE',
          loaded: result.offers.length,
          provider_total: result.total,
          has_more: Boolean(result.nextPage),
          next_page: result.nextPage,
          fetched_at: new Date().toISOString(),
          destination_resolution: {
            resolver: result.destinationProxy.resolver,
            city: result.destinationProxy.city,
            iata: result.destinationProxy.iata,
            booking_city_id: result.destinationProxy.bookingCityId,
          },
          note: 'Live Booking.com Demand inventory returned through CreditIQ for AskGogo.',
        }
        return liveResponse({ hotels: result.offers, provider: 'booking-demand', coverage, attempts, destination, checkin, checkout, adults, rooms, portfolio, userLinkId, walletError })
      }
    } catch (error: any) {
      attempts.push({ provider: 'booking-demand', ok: false, loaded: 0, note: 'request failed; trying next provider' })
      console.error('gogo hotel bridge booking-demand failed', error?.message || error)
    }
  } else {
    attempts.push({ provider: 'booking-demand', ok: false, loaded: 0, note: 'not configured' })
  }

  if (skyscannerHotelsConfigured()) {
    try {
      const page = await createHotelSearch({ destination, checkin, checkout, adults, rooms, limit })
      attempts.push({ provider: 'skyscanner-hotels-live', ok: true, loaded: page.offers.length, note: page.offers.length ? 'live Skyscanner offers returned' : 'zero offers; trying next provider' })
      if (page.offers.length) {
        const coverage = {
          ...page.coverage,
          provider: 'skyscanner-hotels-live',
          fetched_at: (page.coverage as any)?.fetched_at || new Date().toISOString(),
          sessionToken: page.sessionToken,
          note: 'Live Skyscanner Hotels inventory returned through CreditIQ for AskGogo.',
        }
        return liveResponse({ hotels: page.offers, provider: 'skyscanner-hotels-live', coverage, attempts, destination, checkin, checkout, adults, rooms, portfolio, userLinkId, walletError })
      }
    } catch (error: any) {
      attempts.push({ provider: 'skyscanner-hotels-live', ok: false, loaded: 0, note: 'request failed; trying next provider' })
      console.error('gogo hotel bridge skyscanner failed', error?.message || error)
    }
  } else {
    attempts.push({ provider: 'skyscanner-hotels-live', ok: false, loaded: 0, note: 'not configured' })
  }

  if (hotelbedsConfigured()) {
    try {
      const page = await searchHotelbedsHotels({ destination, checkin, checkout, adults, rooms, limit })
      attempts.push({ provider: 'hotelbeds-hbx', ok: true, loaded: page.offers.length, note: page.offers.length ? `HBX ${page.environment} availability returned offers` : 'zero offers' })
      if (page.offers.length) {
        const coverage = {
          provider: 'hotelbeds-hbx',
          mode: 'PROVIDER_WINDOW',
          loaded: page.offers.length,
          provider_total: page.total,
          has_more: false,
          fetched_at: new Date().toISOString(),
          environment: page.environment,
          note: `HBX Hotelbeds ${page.environment} availability returned through CreditIQ for AskGogo.`,
        }
        return liveResponse({ hotels: page.offers, provider: 'hotelbeds-hbx', coverage, attempts, destination, checkin, checkout, adults, rooms, portfolio, userLinkId, walletError })
      }
    } catch (error: any) {
      attempts.push({ provider: 'hotelbeds-hbx', ok: false, loaded: 0, note: 'request failed' })
      console.error('gogo hotel bridge HBX failed', error?.message || error)
    }
  } else {
    attempts.push({ provider: 'hotelbeds-hbx', ok: false, loaded: 0, note: 'not configured' })
  }

  const identity = {
    linked: Boolean(userLinkId),
    pointsAware: Boolean(userLinkId) && !walletError,
    walletCards: portfolio.length,
    verifiedBalances: portfolio.filter((card) => card.verified).length,
    error: walletError ? 'wallet unavailable' : null,
  }
  return unavailable(attempts, identity, compactWallet(portfolio))
}
