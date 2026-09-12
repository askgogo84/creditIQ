import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CONCIERGE_STATUSES, opsTransition, type ConciergeOpsAction, type ConciergeStatus } from '@/lib/concierge/contract'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const OPS_ACTIONS = new Set<ConciergeOpsAction>([
  'CONFIRM_OPTION','REQUEST_APPROVAL','START_BOOKING','MARK_BOOKED','RECONCILE',
  'NEEDS_INFORMATION','PRICE_CHANGED','AWARD_UNAVAILABLE','FAIL',
])

function service() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
}

function authorised(req: NextRequest) {
  const expected = process.env.CONCIERGE_OPS_SECRET || ''
  if (!expected) return false
  const bearer = req.headers.get('authorization') || ''
  const supplied = bearer.startsWith('Bearer ') ? bearer.slice(7) : req.headers.get('x-concierge-ops-secret') || ''
  return supplied.length === expected.length && supplied === expected
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!authorised(req)) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'not found' }, { status: 404 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }

  const action = body?.action as ConciergeOpsAction
  if (!OPS_ACTIONS.has(action)) return NextResponse.json({ error: 'invalid action' }, { status: 400 })
  const actorId = typeof body?.actorId === 'string' && body.actorId.trim() ? body.actorId.trim().slice(0, 120) : 'ops'

  const sb = service()
  const { data: current, error: readError } = await sb.from('concierge_cases').select('id,status').eq('id', params.id).maybeSingle()
  if (readError) return NextResponse.json({ error: 'could not load case' }, { status: 500 })
  if (!current) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (!CONCIERGE_STATUSES.includes(current.status as ConciergeStatus)) return NextResponse.json({ error: 'invalid current state' }, { status: 409 })

  const next = opsTransition(current.status as ConciergeStatus, action)
  if (!next) return NextResponse.json({ error: 'action not allowed in current state' }, { status: 409 })

  if (action === 'CONFIRM_OPTION' && (!body?.verifiedRedemptionSnapshot || typeof body.verifiedRedemptionSnapshot !== 'object')) {
    return NextResponse.json({ error: 'verified redemption snapshot is required' }, { status: 400 })
  }
  if (action === 'MARK_BOOKED' && (typeof body?.bookingReference !== 'string' || !body.bookingReference.trim())) {
    return NextResponse.json({ error: 'booking reference is required' }, { status: 400 })
  }
  if (action === 'RECONCILE' && (!body?.reconciliation || typeof body.reconciliation !== 'object')) {
    return NextResponse.json({ error: 'reconciliation is required' }, { status: 400 })
  }

  const { data, error } = await sb.rpc('concierge_apply_ops_action', {
    p_case_id: params.id,
    p_actor_id: actorId,
    p_action: action,
    p_verified_redemption_snapshot: body?.verifiedRedemptionSnapshot ?? null,
    p_booking_reference: body?.bookingReference ?? null,
    p_reconciliation: body?.reconciliation ?? null,
    p_payload: body?.payload && typeof body.payload === 'object' ? body.payload : {},
  }).single()

  if (error || !data) return NextResponse.json({ error: 'case changed; refresh and try again' }, { status: 409 })
  return NextResponse.json({ case: data })
}
