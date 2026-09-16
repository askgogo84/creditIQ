import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { AwardToolPanoramaProvider } from '@/lib/award-inventory/providers/awardtool-panorama'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res

  try {
    const body = await req.json() as Record<string, unknown>
    const origin = text(body.origin)
    const destination = text(body.destination)
    const from = typeof body.from === 'string' ? body.from.trim() : ''
    const to = typeof body.to === 'string' ? body.to.trim() : ''

    if (!origin || !destination || !from || !to) {
      return NextResponse.json({ error: 'origin, destination, from and to are required' }, { status: 400 })
    }

    const provider = new AwardToolPanoramaProvider()
    if (!provider.isConfigured()) {
      return NextResponse.json({ configured: false, options: [], verification_required: true, note: 'AwardTool is not configured.' }, { status: 503 })
    }

    const options = await provider.searchFlexible(origin, destination, from, to)
    return NextResponse.json({
      configured: true,
      source: 'awardtool-panorama-route-data',
      freshness: 'CACHED',
      verification_required: true,
      options,
      note: options.length
        ? 'Panorama is cached discovery only. Shortlisted dates/programmes must be verified with AwardTool Real-Time or direct programme checkout before transfer or booking.'
        : 'Empty Panorama discovery is not proof that no award exists. Run Real-Time or direct programme verification for the selected date/programme.',
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AwardTool Panorama discovery failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
