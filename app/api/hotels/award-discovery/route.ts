import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { AwardToolHotelProvider } from '@/lib/award-inventory/providers/awardtool'
import { fetchOfficialLoyaltyProperties } from '@/lib/hotels/loyalty-catalog/official'
import { fetchAdditionalOfficialLoyaltyProperties } from '@/lib/hotels/loyalty-catalog/official-extra'
import { fetchLiveJsonLoyaltyProperties } from '@/lib/hotels/loyalty-catalog/live-json'

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
  const searchInput = { destination: query, checkInDate, checkOutDate, adults: guestCount }

  try {
    // Priority order:
    // 1) public first-party JSON/search endpoints (most reliable identity source)
    // 2) first-party HTML/SSR catalogue extraction
    // 3) cached award index for historical points observations and blocked chains
    const [liveJson, coreOfficial, extraOfficial, cachedRaw] = await Promise.all([
      fetchLiveJsonLoyaltyProperties(searchInput),
      fetchOfficialLoyaltyProperties(searchInput),
      fetchAdditionalOfficialLoyaltyProperties(searchInput),
      cachedProvider.isConfigured()
        ? cachedProvider.listSupportedProperties({ destination: query }).catch(() => [])
        : Promise.resolve([]),
    ])
    const official = [...coreOfficial, ...extraOfficial, ...liveJson]

    const merged = new Map<string, any>()
    for (const property of cachedRaw) {
      merged.set(propertyKey(property), {
        ...property,
        source: 'CACHED_INDEX',
        sourceName: 'AwardTool historical award index',
        sourceUrl: null,
      })
    }
    for (const property of official) {
      const key = propertyKey(property)
      const cached = merged.get(key)
      merged.set(key, {
        ...cached,
        ...property,
        observedPointsMin: property.observedPointsMin ?? cached?.observedPointsMin ?? null,
        observedPointsMedian: property.observedPointsMedian ?? cached?.observedPointsMedian ?? null,
        observedPointsMax: property.observedPointsMax ?? cached?.observedPointsMax ?? null,
        awardAvailabilityPercent: property.awardAvailabilityPercent ?? cached?.awardAvailabilityPercent ?? null,
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
    const liveJsonKeys = new Set(liveJson.map(property => propertyKey(property)))
    const liveJsonCount = properties.filter(property => liveJsonKeys.has(propertyKey(property))).length
    const byProgramme = properties.reduce<Record<string, number>>((acc, property) => {
      const key = String(property.programmeId || 'unknown')
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    console.info('hotel loyalty discovery', {
      destination: query,
      liveJsonCount,
      officialCount,
      cachedCount,
      byProgramme,
    })

    return NextResponse.json({
      status: properties.length
        ? officialCount
          ? cachedCount ? 'FIRST_PARTY_PLUS_CACHED_DISCOVERY' : 'FIRST_PARTY_DISCOVERY'
          : 'CACHED_DISCOVERY'
        : 'NO_MATCHING_PROPERTIES',
      pricingAuthority: properties.length ? 'DISCOVERY_ONLY' : 'NONE',
      provider: officialCount ? 'hotel-programme-sites' : cachedCount ? 'awardtool' : 'none',
      freshness: liveJsonCount ? 'LIVE_JSON_CATALOGUE' : officialCount ? 'LIVE_CATALOGUE_IDENTITY' : cachedCount ? 'CACHED' : 'NONE',
      destination: query,
      properties,
      sourceSummary: {
        liveJson: liveJsonCount,
        firstParty: officialCount,
        cachedIndex: cachedCount,
        byProgramme,
      },
      fetchedAt: new Date().toISOString(),
      reason: properties.length
        ? officialCount
          ? `${officialCount} properties were discovered from hotel programme sources (${liveJsonCount} from live JSON endpoints); cached award observations are merged only where useful. Current award price still requires programme verification before transfer.`
          : 'Cached loyalty-property catalogue returned while first-party programme sources produced no parseable properties for this destination.'
        : 'No loyalty properties were returned by first-party programme sources or the cached award index for this destination.',
    })
  } catch (error) {
    console.error('hotel award discovery failed', error)
    return NextResponse.json({ error: 'hotel award discovery unavailable' }, { status: 502 })
  }
}
