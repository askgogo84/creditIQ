import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'
import { buildBookingExecutionPlan } from '@/lib/concierge/execution-plan'
import {
  bookingSandboxEnabled,
  buildSandboxBooking,
  type SandboxSimulation,
} from '@/lib/concierge/sandbox-booking'
import { bookDuffelTestFlight } from '@/lib/flights/providers/duffel-test'
import { bookHotelbedsTestRate } from '@/lib/hotels/providers/hotelbeds-hbx'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SupplierMode = 'INTERNAL' | 'DUFFEL_TEST' | 'HBX_TEST'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ALLOWED = new Set(['TRANSFER_APPROVED', 'BOOKING_IN_PROGRESS', 'BOOKED', 'RECONCILED'])
const SIMULATIONS = new Set<SandboxSimulation>(['SUCCESS', 'PAYMENT_DECLINED', 'SUPPLIER_TIMEOUT'])
const SUPPLIERS = new Set<SupplierMode>(['INTERNAL', 'DUFFEL_TEST', 'HBX_TEST'])

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

function participantCount(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= 9 ? value : 1
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
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
    supplierModes: data.source_type === 'FLIGHT'
      ? ['INTERNAL', 'DUFFEL_TEST']
      : ['INTERNAL', 'HBX_TEST'],
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
  const supplier = (body?.supplier || 'INTERNAL') as SupplierMode
  if (!SUPPLIERS.has(supplier)) return NextResponse.json({ error: 'invalid sandbox supplier' }, { status: 400 })
  if (supplier !== 'INTERNAL' && simulation !== 'SUCCESS') {
    return NextResponse.json({ error: 'supplier TEST mode uses the provider response; synthetic failure simulation is INTERNAL only' }, { status: 400 })
  }

  const sb = service()
  const { data: initial, error: readError } = await readCase(sb, params.id)
  if (readError) return NextResponse.json({ error: 'could not load case' }, { status: 500 })
  if (!initial) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (!ALLOWED.has(String(initial.status))) {
    return NextResponse.json({ error: 'sandbox booking requires an approved booking case' }, { status: 409 })
  }
  if (supplier !== 'INTERNAL' && initial.status !== 'TRANSFER_APPROVED') {
    return NextResponse.json({ error: 'supplier TEST booking may start only once from TRANSFER_APPROVED to avoid duplicate supplier orders' }, { status: 409 })
  }
  if (initial.snapshot_trust !== 'SERVER_VERIFIED' || !initial.verified_redemption_snapshot) {
    return NextResponse.json({ error: 'sandbox booking requires a server-verified snapshot' }, { status: 409 })
  }
  if (supplier === 'DUFFEL_TEST' && initial.source_type !== 'FLIGHT') {
    return NextResponse.json({ error: 'Duffel TEST is available only for FLIGHT cases' }, { status: 400 })
  }
  if (supplier === 'HBX_TEST' && initial.source_type !== 'HOTEL') {
    return NextResponse.json({ error: 'HBX TEST is available only for HOTEL cases' }, { status: 400 })
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
        payload: { mode: supplier === 'INTERNAL' ? 'SANDBOX' : 'SUPPLIER_TEST', simulation, provider: supplier },
      })
    }

    if (supplier === 'INTERNAL' && simulation !== 'SUCCESS') {
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

    let bookingReference = outcome.bookingReference
    let reconciliation: Record<string, unknown> = outcome.reconciliation
    let provider = outcome.provider
    let supplierEvidence: Record<string, unknown> | null = null

    if (supplier === 'DUFFEL_TEST') {
      const selection = initial.selection ?? {}
      const date = stringValue(selection.departs_at || selection.award_date).slice(0, 10)
      const cabinRaw = stringValue(selection.cabin)
      const cabin = ['economy','premium_economy','business','first'].includes(cabinRaw)
        ? cabinRaw as 'economy' | 'premium_economy' | 'business' | 'first'
        : 'economy'
      const result = await bookDuffelTestFlight({
        from: stringValue(selection.from),
        to: stringValue(selection.to),
        date,
        cabin,
        adults: participantCount(body?.participantCount),
        clientReference: initial.id,
      })
      bookingReference = result.bookingReference
      provider = result.provider
      supplierEvidence = {
        mode: 'SUPPLIER_TEST',
        provider: result.provider,
        test_mode: true,
        supplier_order_id: result.orderId,
        offer_request_id: result.offerRequestId,
        offer_id: result.offerId,
        booking_reference: result.bookingReference,
        final_amount: result.totalAmount,
        currency: result.totalCurrency,
        payment_type: result.paymentType,
        carrier_owner: result.owner,
        personal_data_persisted: false,
      }
      reconciliation = supplierEvidence
    }

    if (supplier === 'HBX_TEST') {
      const result = await bookHotelbedsTestRate({
        rateKey: stringValue(body?.hbxRateKey),
        rateType: stringValue(body?.hbxRateType) || null,
        holder: {
          firstName: stringValue(body?.holder?.firstName),
          lastName: stringValue(body?.holder?.lastName),
        },
        adults: participantCount(body?.participantCount),
        clientReference: initial.id,
      })
      bookingReference = result.bookingReference
      provider = result.provider
      supplierEvidence = {
        mode: 'SUPPLIER_TEST',
        provider: result.provider,
        test_mode: true,
        booking_reference: result.bookingReference,
        supplier_status: result.status,
        rate_type: result.rateType,
        total_net: result.totalNet,
        currency: result.currency,
        personal_data_persisted: false,
      }
      reconciliation = supplierEvidence
    }

    if (current.status === 'BOOKING_IN_PROGRESS') {
      current = await apply(sb, params.id, actorId, 'MARK_BOOKED', {
        bookingReference,
        payload: { mode: supplier === 'INTERNAL' ? 'SANDBOX' : 'SUPPLIER_TEST', provider },
      })
    }

    if (current.status === 'BOOKED') {
      current = await apply(sb, params.id, actorId, 'RECONCILE', {
        reconciliation,
        payload: { mode: supplier === 'INTERNAL' ? 'SANDBOX' : 'SUPPLIER_TEST', provider },
      })
    }

    if (current.status !== 'RECONCILED') {
      return NextResponse.json({ error: 'sandbox booking did not reach reconciliation', case: current }, { status: 409 })
    }

    return NextResponse.json({
      case: current,
      sandbox: {
        ...outcome,
        provider,
        bookingReference,
        reconciliation,
        supplier,
        supplierEvidence,
        status: 'RECONCILED',
      },
    }, { headers: { 'Cache-Control': 'no-store, private' } })
  } catch (error) {
    if (current.status === 'BOOKING_IN_PROGRESS') {
      try {
        current = await apply(sb, params.id, actorId, 'FAIL', {
          payload: {
            mode: supplier === 'INTERNAL' ? 'SANDBOX' : 'SUPPLIER_TEST',
            provider: supplier,
            reason: error instanceof Error ? error.message.slice(0, 240) : 'supplier test failed',
          },
        })
      } catch {
        // Preserve the original provider error below. The case will remain visible
        // in BOOKING_IN_PROGRESS if the failure transition itself races/fails.
      }
    }
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'sandbox booking failed',
      case: current,
      retrySafe: supplier === 'INTERNAL',
    }, { status: 409 })
  }
}
