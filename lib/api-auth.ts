// lib/api-auth.ts
// Shared gate helpers for API routes.
//   requireAuth(req) -> caller must be logged in (401 otherwise)
//   requirePro(req)  -> caller must be logged in AND Pro (401 / 402 {upgrade:true})
// Usage at the top of a POST/GET handler:
//   const gate = await requirePro(req);
//   if (!gate.ok) return gate.res;
//   // gate.userId is the verified caller
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isProServer } from './pro';

const URL_ENV = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function callerId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const anon = createClient(URL_ENV(), ANON(), { auth: { persistSession: false } });
  const { data, error } = await anon.auth.getUser(m[1].trim());
  if (error || !data.user) return null;
  return data.user.id;
}

type GateOk = { ok: true; userId: string };
type GateFail = { ok: false; res: NextResponse };
export type GateResult = GateOk | GateFail;

export async function requireAuth(req: NextRequest): Promise<GateResult> {
  const userId = await callerId(req);
  if (!userId) {
    return { ok: false, res: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  }
  return { ok: true, userId };
}

export async function requirePro(req: NextRequest): Promise<GateResult> {
  const base = await requireAuth(req);
  if (!base.ok) return base;
  const pro = await isProServer(base.userId);
  if (!pro) {
    return {
      ok: false,
      res: NextResponse.json({ error: 'upgrade required', upgrade: true }, { status: 402 }),
    };
  }
  return base;
}
