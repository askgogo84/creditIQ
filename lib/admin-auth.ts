// lib/admin-auth.ts
// Server-side admin gate. There was no admin-identity pattern in the app (only a
// client-side sessionStorage flag + shared passwords shipped in the bundle), so
// this introduces one: admin identity = the logged-in Supabase user whose email is
// in the ADMIN_EMAIL allowlist. State-changing admin/cron routes verify a real
// Supabase session token — never a NEXT_PUBLIC_* secret.
//
// Required env (server-only, NOT NEXT_PUBLIC):
//   ADMIN_EMAIL   comma-separated allowlist, e.g. "goverdhan.md@gmail.com"
//   CRON_SECRET   shared secret Vercel Cron sends as `Authorization: Bearer <secret>`
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const URL_ENV = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || '')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = adminEmails();
  return list.length > 0 && list.includes(email.toLowerCase());
}

function bearer(req: NextRequest): string | null {
  const m = (req.headers.get('authorization') ?? '').match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

// Verify a Supabase access token and return the user's email IFF they're an admin.
export async function verifyAdminToken(token: string | null): Promise<string | null> {
  if (!token) return null;
  try {
    const sb = createClient(URL_ENV(), ANON(), { auth: { persistSession: false } });
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data.user) return null;
    return isAdminEmail(data.user.email) ? (data.user.email ?? null) : null;
  } catch {
    return null;
  }
}

// Gate for admin-only routes (called from the admin UI with the user's Supabase token).
// Returns a 401 NextResponse when denied, or null when allowed.
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const email = await verifyAdminToken(bearer(req));
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return null;
}

// Gate for routes that are BOTH cron-triggered and admin-triggered (scrape, cards-sync,
// the /api/cron/* jobs). Accepts a valid CRON_SECRET (Bearer or x-cron-secret header —
// Vercel Cron sends it as a Bearer token) OR a valid admin Supabase token.
export async function requireAdminOrCron(req: NextRequest): Promise<NextResponse | null> {
  const secret = process.env.CRON_SECRET;
  const tok = bearer(req);
  if (secret) {
    if (tok === secret) return null;                                  // Vercel Cron / Bearer
    if (req.headers.get('x-cron-secret') === secret) return null;     // header form
    // Query param form: cron-job.org sends a plain GET with no Authorization header,
    // so accept ?secret=<CRON_SECRET> too (same convention as AskGogo's reminders URL).
    try {
      if (new URL(req.url).searchParams.get('secret') === secret) return null;
    } catch { /* ignore malformed URL */ }
  }
  if (await verifyAdminToken(tok)) return null;                       // admin UI (Supabase token)
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}
