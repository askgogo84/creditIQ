import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'crypto'
import { requireAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const service = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function validToken(token: string) {
  return /^[A-Za-z0-9_-]{40,80}$/.test(token)
}

function safePayload(raw: any) {
  if (!raw || typeof raw !== 'object') return null
  if (!['FLIGHT', 'HOTEL'].includes(raw.sourceType)) return null
  const title = String(raw.title || '').trim().slice(0, 240)
  if (!title) return null
  return {
    version: 1,
    sourceType: raw.sourceType,
    sourceRef: String(raw.sourceRef || '').slice(0, 240),
    title,
    selection: raw.selection && typeof raw.selection === 'object' ? raw.selection : {},
    redemptionSnapshot: raw.redemptionSnapshot && typeof raw.redemptionSnapshot === 'object' ? raw.redemptionSnapshot : {},
    sourceSnapshot: raw.sourceSnapshot && typeof raw.sourceSnapshot === 'object' ? raw.sourceSnapshot : {},
    expectedCashMinor: Number.isFinite(Number(raw.expectedCashMinor)) ? Math.max(0, Math.round(Number(raw.expectedCashMinor))) : null,
    currency: String(raw.currency || 'INR').toUpperCase().slice(0, 3),
    notes: raw.notes ? String(raw.notes).slice(0, 1000) : null,
    consumerCreatedAt: new Date().toISOString(),
    safety: {
      state: 'CLIENT_HANDOFF_UNVERIFIED',
      instruction: 'Corporate Travel Desk must re-verify inventory, pricing, transfer terms and approval before booking or moving points.',
    },
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res
  const raw = await req.json().catch(() => null)
  const payload = safePayload(raw)
  if (!payload) return NextResponse.json({ error: 'invalid travel handoff' }, { status: 400 })

  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
  const { error } = await service().from('corporate_travel_handoffs').insert({
    user_id: gate.userId,
    token_hash: tokenHash,
    payload,
    expires_at: expiresAt,
  })
  if (error) return NextResponse.json({ error: 'could not create corporate handoff' }, { status: 500 })

  const businessBase = (process.env.CREDITIQ_BUSINESS_URL || 'https://business.creditiq.app').replace(/\/$/, '')
  return NextResponse.json({
    handoff_url: `${businessBase}/dashboard/travel-intake?handoff=${encodeURIComponent(token)}`,
    expires_at: expiresAt,
  }, { status: 201 })
}

// Token-protected server-to-server read. A 256-bit random URL token acts like a
// short-lived magic link; the user id is never returned. Business stores the token
// hash as an idempotency key, so repeated accepts cannot create duplicate requests.
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token') || ''
  if (!validToken(token)) return NextResponse.json({ error: 'invalid handoff token' }, { status: 400 })
  const db = service()
  const now = new Date().toISOString()
  const { data, error } = await db
    .from('corporate_travel_handoffs')
    .select('id,payload,expires_at,created_at')
    .eq('token_hash', hashToken(token))
    .gt('expires_at', now)
    .maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'handoff expired or unavailable' }, { status: 404 })

  void db.from('corporate_travel_handoffs').update({ accessed_at: now }).eq('id', data.id)
  return NextResponse.json({
    payload: data.payload,
    created_at: data.created_at,
    expires_at: data.expires_at,
  }, {
    headers: { 'Cache-Control': 'no-store, private' },
  })
}
