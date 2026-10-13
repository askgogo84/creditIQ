import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'
import { buildBookingExecutionPlan } from '@/lib/concierge/execution-plan'
import {
  bookingSandboxEnabled,
  buildSandboxBooking,
  type SandboxSimulation,
} from '@/lib/concierge/sandbox-booking'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ALLOWED = new Set(['TRANSFER_APPROVED', 'BOOKING_IN_PROGRESS', 'BOOKED', 'RECONCILED'])
const SIMULATIONS = new Set<SandboxSimulation>(['SUCCESS', 'PAYMENT_DECLINED', 'SUPPLIER_TIMEOUT'])

function service() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
}

function currentCash(row: any): number | null {
  const direct = row?.expected_cash_minor
  if (typeof direct === 'number' && Number.isSafeInteger(direct) && direct >= 0) return direct

  const snapshot = row?.verified_redemption_snapshot
  if (!snapshot || typeof snapshot !== 'object') return null
  const candidates = [
    snapshot.final_cash_minor,
    snapshot.cash_payable_minor,
    snapshot.expected_cash_minor,
    snapshot?.recommended_candidate?.cash_payable_minor,
    snapshot?.travel_decision?.recommended_candidate?.cash_payable_minor,
  ]
  for (const value of candidates) {
    if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return value
  }
  return null
}

async function apply(
  sb: ReturnType<typeof service>,
  caseId: string,
  actorId: string,
  action: string,
  input: {
    bookingReference?: string | null
    reconciliation?: Record<string, unknown> | null
    payload?: Record<string, unknown>
  } = {},
) {
  const { data, error } = await sb.rpc('concierge_apply_ops_action', {
    p_case_id: caseId,
    p_actor_id: actorId,
    p_action: action,
    p_verified_redemption_snapshot: null,
    p_booking_reference: input.bookingReference ?? null,
    p_reconciliation: input.reconciliation ?? null,
    p_payload: input.payload ?? {},
  }).single()
  if (error || !data) throw new Error(`sandbox transition failed at ${action}`)
  return data as any
}

async function readCase(sb: ReturnType<typeof service>, id: string) {
  return sb.from('concierge_cases')
    .select('id,status,source_type,selection,redemption_snapshot,source_snapshot,snapshot_trust,verified_redemption_snapshot,expected_cash_minor,currency,booking_reference,reconciliation')
    .eq('id', id)
    .maybeSingle()
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(req)
  if (denied) return denied
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const enabled = bookingSandboxEnabled()
  if (!enabled) return NextResponse.json({ enabled: false, eligible: false })

  const { data, error } = await readCase(service(), params.id)
  if (error) return NextResponse.json({ error: 'could not load case' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })

  return NextResponse.json({
    enabled: true,
    eligible: ALLOWED.has(String(data.status)) && data.snapshot_trust === 'SERVER_VERIFIED',
    status: data.status,
  }, { headers: { 'Cache-Control': 'no-store, private' } })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(req)
  if (denied) return denied
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (!bookingSandboxEnabled()) return NextResponse.json({ error: 'booking sandbox is disabled' }, { status: 404 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }

  const simulation = (body?.simulation || 'SUCCESS') as SandboxSimulation
  if (!SIMULATIONS.has(simulation)) return NextResponse.json({ error: 'invalid sandbox simulation' }, { status: 400 })

  const sb = service()
  const { data: initial, error: readError } = await readCase(sb, params.id)
  if (readError) return NextResponse.json({ error: 'could not load case' }, { status: 500 })
  if (!initial) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (!ALLOWED.has(String(initial.status))) {
    return NextResponse.json({ error: 'sandbox booking requires an approved booking case' }, { status: 409 })
  }
  if (initial.snapshot_trust !== 'SERVER_VERIFIED' || !initial.verified_redemption_snapshot) {
    return NextResponse.json({ error: 'sandbox booking requires a server-verified snapshot' }, { status: 409 })
  }

  const plan = buildBookingExecutionPlan({
    source_type: initial.source_type,
    selection: initial.selection ?? {},
    redemption_snapshot: initial.redemption_snapshot ?? {},
    source_snapshot: initial.source_snapshot ?? {},
    snapshot_trust: initial.snapshot_trust,
    verified_redemption_snapshot: initial.verified_redemption_snapshot,
  })
  if (!plan.canStartBooking) {
    return NextResponse.json({ error: 'booking path is not executable', executionPlan: plan }, { status: 409 })
  }

  let outcome
  try {
    outcome = buildSandboxBooking({
      caseId: initial.id,
      sourceType: initial.source_type,
      selection: initial.selection ?? {},
      verifiedRedemptionSnapshot: initial.verified_redemption_snapshot,
      expectedCashMinor: currentCash(initial),
      currency: initial.currency,
      holder: {
        firstName: body?.holder?.firstName,
        lastName: body?.holder?.lastName,
      },
      participantCount: body?.participantCount,
      simulation,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'invalid sandbox booking' }, { status: 400 })
  }

  const actorId = req.headers.get('x-admin-email') || 'admin-sandbox'
  let current: any = initial

  try {
    if (current.status === 'TRANSFER_APPROVED') {
      current = await apply(sb, params.id, actorId, 'START_BOOKING', {
        payload: { mode: 'SANDBOX', simulation, provider: outcome.provider },
      })
    }

    if (simulation !== 'SUCCESS') {
      if (current.status === 'BOOKING_IN_PROGRESS') {
        current = await apply(sb, params.id, actorId, 'FAIL', {
          payload: { mode: 'SANDBOX', simulation, provider: outcome.provider },
        })
      }
      return NextResponse.json({
        case: current,
        sandbox: {
          ...outcome,
          bookingReference: null,
          reconciliation: null,
          status: 'FAILED',
        },
      }, { headers: { 'Cache-Control': 'no-store, private' } })
    }

    if (current.status === 'BOOKING_IN_PROGRESS') {
      current = await apply(sb, params.id, actorId, 'MARK_BOOKED', {
        bookingReference: outcome.bookingReference,
        payload: { mode: 'SANDBOX', provider: outcome.provider },
      })
    }

    if (current.status === 'BOOKED') {
      current = await apply(sb, params.id, actorId, 'RECONCILE', {
        reconciliation: outcome.reconciliation,
        payload: { mode: 'SANDBOX', provider: outcome.provider },
      })
    }

    if (current.status !== 'RECONCILED') {
      return NextResponse.json({ error: 'sandbox booking did not reach reconciliation', case: current }, { status: 409 })
    }

    return NextResponse.json({
      case: current,
      sandbox: { ...outcome, status: 'RECONCILED' },
    }, { headers: { 'Cache-Control': 'no-store, private' } })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'sandbox booking failed',
      bookingReference: outcome.bookingReference,
      retrySafe: true,
    }, { status: 409 })
  }
}
