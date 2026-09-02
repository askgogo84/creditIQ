import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import {
  CONCIERGE_STATUSES,
  type ConciergeStatus,
  type ConciergeUserAction,
  userTransition,
} from '@/lib/concierge/contract'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const URL_ENV = () => process.env.NEXT_PUBLIC_SUPABASE_URL!
const SVC = () => process.env.SUPABASE_SERVICE_ROLE_KEY!
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function service() {
  return createClient(URL_ENV(), SVC(), { auth: { persistSession: false } })
}

const DETAIL_SELECT = [
  'id', 'context', 'source_type', 'source_ref', 'title',
  'selection', 'redemption_snapshot', 'source_snapshot', 'snapshot_trust',
  'expected_cash_minor', 'currency', 'contact_channel', 'notes',
  'status', 'approval_state', 'approval_requested_at', 'approved_at', 'cancelled_at',
  'operator_verified_at', 'verified_redemption_snapshot',
  'booking_reference', 'reconciliation', 'created_at', 'updated_at',
].join(',')

function safeCase(row: any) {
  return {
    id: row.id,
    context: row.context,
    source_type: row.source_type,
    source_ref: row.source_ref,
    title: row.title,
    selection: row.selection ?? {},
    redemption_snapshot: row.redemption_snapshot ?? {},
    source_snapshot: row.source_snapshot ?? {},
    snapshot_trust: row.snapshot_trust,
    expected_cash_minor: row.expected_cash_minor ?? null,
    currency: row.currency,
    contact_channel: row.contact_channel,
    notes: row.notes ?? null,
    status: row.status,
    approval_state: row.approval_state,
    approval_requested_at: row.approval_requested_at ?? null,
    approved_at: row.approved_at ?? null,
    cancelled_at: row.cancelled_at ?? null,
    operator_verified_at: row.operator_verified_at ?? null,
    verified_redemption_snapshot: row.verified_redemption_snapshot ?? null,
    booking_reference: row.booking_reference ?? null,
    reconciliation: row.reconciliation ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

async function getOwnedCase(sb: ReturnType<typeof service>, id: string, userId: string) {
  return sb
    .from('concierge_cases')
    .select(DETAIL_SELECT)
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res

  const id = params.id
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { data, error } = await getOwnedCase(service(), id, gate.userId)
  if (error) {
    console.error('concierge case read failed', error)
    return NextResponse.json({ error: 'could not load concierge case' }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })

  return NextResponse.json({ case: safeCase(data) })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res

  const id = params.id
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'not found' }, { status: 404 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const action = body?.action
  if (action !== 'APPROVE' && action !== 'CANCEL') {
    return NextResponse.json({ error: 'invalid action' }, { status: 400 })
  }

  const sb = service()

  // IDOR gate: first resolve this case through BOTH case id and the verified
  // bearer user id. A caller probing another user's UUID gets the same 404 as an
  // unknown case; the request body can never select an owner.
  const { data: current, error: readError } = await getOwnedCase(sb, id, gate.userId)
  if (readError) {
    console.error('concierge case transition lookup failed', readError)
    return NextResponse.json({ error: 'could not load concierge case' }, { status: 500 })
  }
  if (!current) return NextResponse.json({ error: 'not found' }, { status: 404 })

  if (!CONCIERGE_STATUSES.includes(current.status as ConciergeStatus)) {
    return NextResponse.json({ error: 'case state is invalid' }, { status: 409 })
  }

  const next = userTransition(current.status as ConciergeStatus, action as ConciergeUserAction)
  if (!next) {
    return NextResponse.json({ error: 'action not allowed in current state' }, { status: 409 })
  }

  // The database function repeats the ownership check and performs the status
  // change + audit event atomically. Only the VERIFIED bearer identity is passed.
  const { data, error } = await sb.rpc('concierge_apply_user_action', {
    p_user_id: gate.userId,
    p_case_id: id,
    p_action: action,
  }).single()

  if (error || !data) {
    console.error('concierge user action failed', error)
    return NextResponse.json({ error: 'case changed; refresh and try again' }, { status: 409 })
  }

  return NextResponse.json({ case: safeCase(data) })
}
