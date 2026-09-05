import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const service = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

const SELECT = 'id,type,title,body,href,severity,source_type,source_ref,metadata,read_at,created_at'

export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res
  const limitRaw = Number(new URL(req.url).searchParams.get('limit') || 20)
  const limit = Math.max(1, Math.min(50, Number.isFinite(limitRaw) ? limitRaw : 20))
  const sb = service()
  const [{ data, error }, { count, error: countError }] = await Promise.all([
    sb.from('user_notifications').select(SELECT).eq('user_id', gate.userId).order('created_at', { ascending: false }).limit(limit),
    sb.from('user_notifications').select('id', { count: 'exact', head: true }).eq('user_id', gate.userId).is('read_at', null),
  ])
  if (error || countError) return NextResponse.json({ error: 'could not load notifications' }, { status: 500 })
  return NextResponse.json({ notifications: data ?? [], unread_count: count ?? 0 })
}

export async function PATCH(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res
  const raw = await req.json().catch(() => ({}))
  const sb = service()
  const now = new Date().toISOString()

  if (raw?.all === true) {
    const { error } = await sb.from('user_notifications').update({ read_at: now }).eq('user_id', gate.userId).is('read_at', null)
    if (error) return NextResponse.json({ error: 'could not mark notifications read' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const id = String(raw?.id || '')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { data, error } = await sb.from('user_notifications').update({ read_at: now }).eq('id', id).eq('user_id', gate.userId).select(SELECT).maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'notification not found' }, { status: 404 })
  return NextResponse.json({ notification: data })
}
