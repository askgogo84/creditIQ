import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { findAirIndiaMaharajaGuide } from '@/lib/data/air-india-maharaja-guide'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res

  const params = new URL(req.url).searchParams
  const from = (params.get('from') || '').trim().toUpperCase()
  const to = (params.get('to') || '').trim().toUpperCase()
  if (!from || !to) return NextResponse.json({ error: 'from and to are required' }, { status: 400 })

  const airIndia = findAirIndiaMaharajaGuide(from, to)
  return NextResponse.json({
    route: { from, to },
    guides: airIndia ? [airIndia] : [],
    policy: 'PUBLISHED_GUIDE_NOT_AVAILABILITY',
  })
}
