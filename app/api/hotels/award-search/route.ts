import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { searchHotelAwards } from '@/lib/award-inventory/orchestrator'
import { hotelAwardProgramme } from '@/lib/award-inventory/programme-registry'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

function date(value: unknown): string | null {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

function programme(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  return /^[a-z0-9-]{2,80}$/.test(v) ? v : null
}

function boundedText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim()
  return v && v.length <= max ? v : null
}

function int(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  return Number.isSafeInteger(n) && n >= min && n <= max ? n : fallback
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res

  const body = await req.json().catch(() => ({}))
  const programmeId = programme(body.programmeId)
  const destination = boundedText(body.destination, 160)
  const checkInDate = date(body.checkInDate)
  const checkOutDate = date(body.checkOutDate)

  if (!programmeId || !hotelAwardProgramme(programmeId)) {
    return NextResponse.json({ error: 'unsupported hotel loyalty programme' }, { status: 400 })
  }
  if (!destination || !checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
    return NextResponse.json({ error: 'destination and valid check-in/check-out dates are required' }, { status: 400 })
  }

  try {
    // Only bounded travel fields are forwarded. Body userId, passwords, loyalty
    // credentials, OTPs and security answers are ignored by construction.
    const result = await searchHotelAwards({
      programmeId,
      destination,
      checkInDate,
      checkOutDate,
      numberOfRooms: int(body.numberOfRooms, 1, 2, 1) as 1 | 2,
      numberOfAdults: int(body.numberOfAdults, 1, 4, 2),
      numberOfKids: int(body.numberOfKids, 0, 4, 0),
    })

    if (result.status === 'PENDING') return NextResponse.json(result, { status: 202 })
    if (result.status === 'DIRECT_REQUIRED') return NextResponse.json(result, { status: 409 })
    if (result.status === 'PROVIDER_UNAVAILABLE') return NextResponse.json(result, { status: 503 })
    return NextResponse.json(result)
  } catch (error) {
    console.error('hotel award orchestration failed', error)
    return NextResponse.json({ error: 'hotel award provider orchestration failed' }, { status: 502 })
  }
}
