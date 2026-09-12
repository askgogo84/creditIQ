import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'
import { CONCIERGE_STATUSES, opsTransition, type ConciergeOpsAction, type ConciergeStatus } from '@/lib/concierge/contract'
import { buildBookingExecutionPlan } from '@/lib/concierge/execution-plan'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ACTIONS = new Set<ConciergeOpsAction>(['CONFIRM_OPTION','REQUEST_APPROVAL','START_BOOKING','MARK_BOOKED','RECONCILE','NEEDS_INFORMATION','PRICE_CHANGED','AWARD_UNAVAILABLE','FAIL'])

function service() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(req)
  if (denied) return denied
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'not found' }, { status: 404 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const action = body?.action as ConciergeOpsAction
  if (!ACTIONS.has(action)) return NextResponse.json({ error: 'invalid action' }, { status: 400 })

  const sb = service()
  const { data: current, error: readError } = await sb.from('concierge_cases')
    .select('id,status,source_type,selection,redemption_snapshot,source_snapshot,snapshot_trust,verified_redemption_snapshot')
    .eq('id', params.id).maybeSingle()
  if (readError) return NextResponse.json({ error: 'could not load case' }, { status: 500 })
  if (!current) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (!CONCIERGE_STATUSES.includes(current.status as ConciergeStatus)) return NextResponse.json({ error: 'invalid current state' }, { status: 409 })
  if (!opsTransition(current.status as ConciergeStatus, action)) return NextResponse.json({ error: 'action not allowed in current state' }, { status: 409 })

  if (action === 'CONFIRM_OPTION' && (!body?.verifiedRedemptionSnapshot || typeof body.verifiedRedemptionSnapshot !== 'object')) return NextResponse.json({ error: 'verified redemption snapshot is required' }, { status: 400 })
  if (action === 'MARK_BOOKED' && (typeof body?.bookingReference !== 'string' || !body.bookingReference.trim())) return NextResponse.json({ error: 'booking reference is required' }, { status: 400 })
  if (action === 'RECONCILE' && (!body?.reconciliation || typeof body.reconciliation !== 'object')) return NextResponse.json({ error: 'reconciliation is required' }, { status: 400 })

  if (action === 'START_BOOKING') {
    const plan = buildBookingExecutionPlan({
      source_type: current.source_type,
      selection: current.selection ?? {},
      redemption_snapshot: current.redemption_snapshot ?? {},
      source_snapshot: current.source_snapshot ?? {},
      snapshot_trust: current.snapshot_trust,
      verified_redemption_snapshot: current.verified_redemption_snapshot ?? null,
    })
    if (!plan.canStartBooking) {
      return NextResponse.json({ error: 'booking path is not executable', executionPlan: plan }, { status: 409 })
    }
  }

  const actorId = req.headers.get('x-admin-email') || 'admin'
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
  return NextResponse.json({ case: data }, { headers: { 'Cache-Control': 'no-store, private' } })
}