import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { AwardToolHotelProvider } from '@/lib/award-inventory/providers/awardtool'
import { fetchOfficialLoyaltyProperties } from '@/lib/hotels/loyalty-catalog/official'

export const runtime = 'nodejs'
export const maxDuration = 20
export const dynamic = 'force-dynamic'

function destination(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim()
  return v && v.length <= 160 ? v : null
}

function date(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
}

function adults(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.max(1, Math.min(9, Math.round(n))) : 2
}

function propertyKey(property: { programmeId?: string | null; name?: string | null }) {
  return `${String(property.programmeId || '').toLowerCase()}:${String(property.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '')}`
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res

  const body = await req.json().catch(() => ({}))
  const query = destination(body.destination)
  if (!query) return NextResponse.json({ error: 'destination is required' }, { status: 400 })

  const checkInDate = date(body.checkInDate ?? body.checkin)
  const checkOutDate = date(body.checkOutDate ?? body.checkout)
  const guestCount = adults(body.adults)
  const cachedProvider = new AwardToolHotelProvider()

  try {
    // First-party programme sites are the preferred property-identity source.
    // The cached award index is complementary: it contributes historical points
    // observations and fills programmes whose first-party adapter is not live yet.
    const [official, cachedRaw] = await Promise.all([
      fetchOfficialLoyaltyProperties({
        destination: query,
        checkInDate,
        checkOutDate,
        adults: guestCount,
      }),
      cachedProvider.isConfigured()
        ? cachedProvider.listSupportedProperties({ destination: query }).catch(() => [])
        : Promise.resolve([]),
    ])

    const merged = new Map<string, any>()
    for (const property of cachedRaw) {
      merged.set(propertyKey(property), {
        ...property,
        source: 'CACHED_INDEX',
        sourceName: 'AwardTool historical award index',
        sourceUrl: null,
      })
    }
    // Official property identity wins. Preserve cached observed award ranges when
    // the same property is present in both sources.
    for (const property of official) {
      const key = propertyKey(property)
      const cached = merged.get(key)
      merged.set(key, {
        ...cached,
        ...property,
        observedPointsMin: cached?.observedPointsMin ?? property.observedPointsMin,
        observedPointsMedian: cached?.observedPointsMedian ?? property.observedPointsMedian,
        observedPointsMax: cached?.observedPointsMax ?? property.observedPointsMax,
        awardAvailabilityPercent: cached?.awardAvailabilityPercent ?? property.awardAvailabilityPercent,
      })
    }

    const properties = [...merged.values()]
      .sort((a, b) => {
        const officialOrder = Number(b.source === 'FIRST_PARTY') - Number(a.source === 'FIRST_PARTY')
        if (officialOrder !== 0) return officialOrder
        const programme = String(a.programmeId || '').localeCompare(String(b.programmeId || ''))
        if (programme !== 0) return programme
        const availability = (b.awardAvailabilityPercent ?? -1) - (a.awardAvailabilityPercent ?? -1)
        if (availability !== 0) return availability
        return String(a.name || '').localeCompare(String(b.name || ''))
      })
      .slice(0, 300)

    const officialCount = properties.filter(property => property.source === 'FIRST_PARTY').length
    const cachedCount = properties.length - officialCount

    return NextResponse.json({
      status: properties.length
        ? officialCount
          ? cachedCount ? 'FIRST_PARTY_PLUS_CACHED_DISCOVERY' : 'FIRST_PARTY_DISCOVERY'
          : 'CACHED_DISCOVERY'
        : 'NO_MATCHING_PROPERTIES',
      pricingAuthority: properties.length ? 'DISCOVERY_ONLY' : 'NONE',
      provider: officialCount ? 'hotel-programme-sites' : cachedCount ? 'awardtool' : 'none',
      freshness: officialCount ? 'LIVE_CATALOGUE_IDENTITY' : cachedCount ? 'CACHED' : 'NONE',
      destination: query,
      properties,
      sourceSummary: {
        firstParty: officialCount,
        cachedIndex: cachedCount,
      },
      fetchedAt: new Date().toISOString(),
      reason: properties.length
        ? officialCount
          ? `${officialCount} properties were discovered from hotel programme sites; cached award observations are merged only where useful. Live award price still requires programme verification before transfer.`
          : 'Cached loyalty-property catalogue returned while first-party programme sources produced no parseable properties for this destination.'
        : 'No loyalty properties were returned by the first-party programme adapters or cached award index for this destination.',
    })
  } catch (error) {
    console.error('hotel award discovery failed', error)
    return NextResponse.json({ error: 'hotel award discovery unavailable' }, { status: 502 })
  }
}
