// app/api/admin/update-deval/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req); if (denied) return denied;
  const { id, status } = await req.json();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  await supabase.from('devaluation_events').update({
    status,
    published_at: status === 'published' ? new Date().toISOString() : null,
  }).eq('id', id);
  return NextResponse.json({ ok: true });
}
