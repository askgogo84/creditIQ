// app/api/subscription/status/route.ts
// Returns the caller's Pro status (isPro, plan, renewal date, cancel flag).
// Read-only. Used by the Profile page and by client UX to decide blur/unblur —
// but remember: real gating is enforced server-side in each gated API route.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProStatus } from '@/lib/pro';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const URL_ENV = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function callerId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const anon = createClient(URL_ENV(), ANON(), { auth: { persistSession: false } });
  const { data, error } = await anon.auth.getUser(m[1].trim());
  if (error || !data.user) return null;
  return data.user.id;
}

export async function GET(req: NextRequest) {
  const userId = await callerId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const status = await getProStatus(userId);
  return NextResponse.json(status);
}
