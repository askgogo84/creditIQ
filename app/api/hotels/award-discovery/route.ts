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
      reason: 'AwardTool hotel discovery is not configured.',
    }, { status: 503 })
  }

  try {
    const properties = (await provider.listSupportedProperties({ destination: query }))
      .sort((a, b) => {
        const availability = (b.awardAvailabilityPercent ?? -1) - (a.awardAvailabilityPercent ?? -1)
        if (availability !== 0) return availability
        return (a.observedPointsMin ?? Number.MAX_SAFE_INTEGER) - (b.observedPointsMin ?? Number.MAX_SAFE_INTEGER)
      })
      .slice(0, 60)

    return NextResponse.json({
      status: properties.length ? 'CACHED_DISCOVERY' : 'NO_MATCHING_PROPERTIES',
      pricingAuthority: properties.length ? 'DISCOVERY_ONLY' : 'NONE',
      provider: 'awardtool',
      freshness: 'CACHED',
      destination: query,
      properties,
      fetchedAt: new Date().toISOString(),
      reason: properties.length
        ? 'AwardTool cached property/points ranges returned. These are discovery evidence, not date-specific bookable rooms.'
        : 'AwardTool returned no cached properties matching this destination.',
    })
  } catch (error) {
    console.error('hotel award discovery failed', error)
    return NextResponse.json({ error: 'hotel award discovery unavailable' }, { status: 502 })
  }
}
