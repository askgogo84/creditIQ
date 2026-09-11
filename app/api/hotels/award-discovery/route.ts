import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { AwardToolHotelProvider } from '@/lib/award-inventory/providers/awardtool'

export const runtime = 'nodejs'
export const maxDuration = 20
export const dynamic = 'force-dynamic'

function destination(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim()
  return v && v.length <= 160 ? v : null
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res

  const body = await req.json().catch(() => ({}))
  const query = destination(body.destination)
  if (!query) return NextResponse.json({ error: 'destination is required' }, { status: 400 })

  const provider = new AwardToolHotelProvider()
  if (!provider.isConfigured()) {
    return NextResponse.json({
      status: 'PROVIDER_UNAVAILABLE',
      pricingAuthority: 'NONE',
      properties: [],
      reason: 'Loyalty-property discovery is not configured.',
    }, { status: 503 })
  }

  try {
    const properties = (await provider.listSupportedProperties({ destination: query }))
      .sort((a, b) => {
        const programme = String(a.programmeId || '').localeCompare(String(b.programmeId || ''))
        if (programme !== 0) return programme
        const availability = (b.awardAvailabilityPercent ?? -1) - (a.awardAvailabilityPercent ?? -1)
        if (availability !== 0) return availability
        return (a.observedPointsMin ?? Number.MAX_SAFE_INTEGER) - (b.observedPointsMin ?? Number.MAX_SAFE_INTEGER)
      })
      // Property discovery is the primary hotel-redemption surface, not a tiny
      // teaser list. Keep a generous ceiling so a destination can show all of
      // its Marriott/Accor/Hilton/IHG/etc. properties rather than only a few.
      .slice(0, 250)

    return NextResponse.json({
      status: properties.length ? 'CACHED_DISCOVERY' : 'NO_MATCHING_PROPERTIES',
      pricingAuthority: properties.length ? 'DISCOVERY_ONLY' : 'NONE',
      provider: 'awardtool',
      freshness: 'CACHED',
      destination: query,
      properties,
      fetchedAt: new Date().toISOString(),
      reason: properties.length
        ? 'Destination loyalty-property catalogue returned. Property identity is used for redemption discovery; current award availability and points price must still be verified with the hotel programme before transfer.'
        : 'No loyalty properties are currently cached for this destination.',
    })
  } catch (error) {
    console.error('hotel award discovery failed', error)
    return NextResponse.json({ error: 'hotel award discovery unavailable' }, { status: 502 })
  }
}
