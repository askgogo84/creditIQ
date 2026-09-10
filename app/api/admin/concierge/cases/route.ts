import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

const SELECT = [
  'id', 'user_id', 'context', 'source_type', 'source_ref', 'title',
  'selection', 'redemption_snapshot', 'source_snapshot', 'snapshot_trust',
  'expected_cash_minor', 'currency', 'contact_channel', 'notes',
  'status', 'approval_state', 'approval_requested_at', 'approved_at', 'cancelled_at',
  'operator_verified_at', 'verified_redemption_snapshot',
  'booking_reference', 'reconciliation', 'created_at', 'updated_at',
].join(',')

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req)
  if (denied) return denied

  const { data, error } = await service()
    .from('concierge_cases')
    .select(SELECT)
    .order('updated_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('admin concierge queue read failed', error)
    return NextResponse.json({ error: 'could not load concierge queue' }, { status: 500 })
  }

  return NextResponse.json({ cases: data ?? [] }, { headers: { 'Cache-Control': 'no-store, private' } })
}
