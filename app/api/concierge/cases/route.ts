import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { parseCreateConciergeCaseInput } from '@/lib/concierge/contract'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const URL_ENV = () => process.env.NEXT_PUBLIC_SUPABASE_URL!
const SVC = () => process.env.SUPABASE_SERVICE_ROLE_KEY!

function service() {
  return createClient(URL_ENV(), SVC(), { auth: { persistSession: false } })
}

const SUMMARY_SELECT = [
  'id', 'context', 'source_type', 'source_ref', 'title',
  'status', 'approval_state', 'expected_cash_minor', 'currency',
  'contact_channel', 'snapshot_trust', 'created_at', 'updated_at',
].join(',')

function summary(row: any) {
  return {
    id: row.id,
    context: row.context,
    source_type: row.source_type,
    source_ref: row.source_ref,
    title: row.title,
    status: row.status,
    approval_state: row.approval_state,
    expected_cash_minor: row.expected_cash_minor ?? null,
    currency: row.currency,
    contact_channel: row.contact_channel,
    snapshot_trust: row.snapshot_trust,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res

  const sb = service()
  const { data, error } = await sb
    .from('concierge_cases')
    .select(SUMMARY_SELECT)
    .eq('user_id', gate.userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('concierge list failed', error)
    return NextResponse.json({ error: 'could not load concierge cases' }, { status: 500 })
  }

  return NextResponse.json({ cases: (data ?? []).map(summary) })
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const parsed = parseCreateConciergeCaseInput(raw)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const v = parsed.value
  const sb = service()

  // Atomic DB function creates the case + audit event. The only user identity
  // passed to it is the VERIFIED bearer identity from requireAuth; a body userId
  // is ignored by the parser and never reaches the database.
  const { data, error } = await sb.rpc('concierge_create_case', {
    p_user_id: gate.userId,
    p_context: v.context,
    p_source_type: v.sourceType,
    p_source_ref: v.sourceRef,
    p_title: v.title,
    p_selection: v.selection,
    p_redemption_snapshot: v.redemptionSnapshot,
    p_source_snapshot: v.sourceSnapshot,
    p_expected_cash_minor: v.expectedCashMinor,
    p_currency: v.currency,
    p_contact_channel: v.contactChannel,
    p_notes: v.notes,
  }).single()

  if (error || !data) {
    console.error('concierge create failed', error)
    return NextResponse.json({ error: 'could not create concierge case' }, { status: 500 })
  }

  return NextResponse.json({ case: summary(data) }, { status: 201 })
}
