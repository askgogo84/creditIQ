import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { searchFlightAwards } from '@/lib/award-inventory/flight-orchestrator'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

function airport(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim().toUpperCase()
  return /^[A-Z]{3}$/.test(v) ? v : null
}
function date(value: unknown): string | null {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}
function programme(value: unknown): string | null {
  if (value == null || value === '') return null
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  return /^[a-z0-9-]{2,80}$/.test(v) ? v : null
}
function adults(value: unknown): number {
  const n = Number(value)
  return Number.isSafeInteger(n) && n >= 1 && n <= 4 ? n : 1
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res

  const body = await req.json().catch(() => ({}))
  const origin = airport(body.origin)
  const destination = airport(body.destination)
  const travelDate = date(body.date)
  const cabin = ['economy', 'premium-economy', 'business', 'first'].includes(body.cabin) ? body.cabin : null
  const programmeId = programme(body.programmeId)

  if (!origin || !destination || origin === destination || !travelDate || !cabin) {
    return NextResponse.json({ error: 'valid origin, destination, date and cabin are required' }, { status: 400 })
  }
  if (body.programmeId != null && !programmeId) {
    return NextResponse.json({ error: 'invalid programmeId' }, { status: 400 })
  }

  try {
    // The bearer identity is the authentication/abuse boundary. Any body userId
    // is intentionally ignored and is never forwarded to award providers.
    const result = await searchFlightAwards({
      origin, destination, date: travelDate, cabin, adults: adults(body.adults),
      ...(programmeId ? { programmeIds: [programmeId] } : {}),
    })
    const status = result.status === 'PENDING_LIVE' ? 202 : result.status === 'PROVIDER_UNAVAILABLE' ? 503 : 200
    return NextResponse.json(result, { status })
  } catch (error) {
    console.error('flight award orchestrator failed', error)
    return NextResponse.json({ error: 'flight award search unavailable' }, { status: 502 })
  }
}
