// lib/rate-limit.ts
// Per-caller rate limiter for the paid-AI routes (Anthropic credit-burn protection).
//
// Keying:
//   - Logged-in callers  -> user:<id>:<route>   (survives Jio/Airtel CGNAT, higher cap)
//   - Anonymous callers  -> ip:<addr>:<route>   (public lead-gen surfaces)
// Per-minute window = the abuse control. Per-day window = the generous NAT-neighbour
// backstop. Both must pass.
//
// Usage at the top of a POST handler (before req.json()):
//   const rl = await rateLimit(req, 'trip-planner');
//   if (!rl.ok) return rl.res;
//
// Backed by Supabase (rate_limits table + rl_hit RPC) so counts are shared across
// serverless instances. FAILS OPEN: a limiter outage must not take down the public
// product — we'd rather burn some credits than 500 every real user.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callerId } from './api-auth';

const svc = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

export function clientIp(req: NextRequest): string {
  // On Vercel the first hop of x-forwarded-for is set by the edge proxy (trustworthy).
  const xff = req.headers.get('x-forwarded-for') ?? '';
  const first = xff.split(',')[0].trim();
  return first || req.headers.get('x-real-ip') || 'unknown';
}

type Tier = { perMin: number; perDay: number };
type Limits = { anon: Tier; user: Tier };

// Anonymous caps are the floor; logged-in ~5x. trip-planner + trip-compare share a tier
// because one "plan a trip" action fires BOTH routes back to back.
export const LIMITS: Record<string, Limits> = {
  'trip-planner':    { anon: { perMin: 3,  perDay: 40  }, user: { perMin: 15, perDay: 200  } },
  'trip-compare':    { anon: { perMin: 3,  perDay: 40  }, user: { perMin: 15, perDay: 200  } },
  'card-roast':      { anon: { perMin: 5,  perDay: 60  }, user: { perMin: 25, perDay: 300  } },
  'card-switch':     { anon: { perMin: 5,  perDay: 60  }, user: { perMin: 25, perDay: 300  } },
  'spend-optimizer': { anon: { perMin: 5,  perDay: 40  }, user: { perMin: 25, perDay: 200  } },
  'assistant':       { anon: { perMin: 15, perDay: 200 }, user: { perMin: 75, perDay: 1000 } },
};

type RlOk = { ok: true };
type RlFail = { ok: false; res: NextResponse };

export async function rateLimit(req: NextRequest, route: keyof typeof LIMITS): Promise<RlOk | RlFail> {
  const limits = LIMITS[route];

  // callerId returns null instantly for anon (no Bearer header) — only logged-in
  // requests pay the token-verification round-trip.
  const userId = await callerId(req);
  const tier = userId ? limits.user : limits.anon;
  const idKey = userId ? `user:${userId}` : `ip:${clientIp(req)}`;

  try {
    const client = svc();
    const [min, day] = await Promise.all([
      client.rpc('rl_hit', { p_key: `${idKey}:${route}:min`, p_window_seconds: 60, p_limit: tier.perMin }),
      client.rpc('rl_hit', { p_key: `${idKey}:${route}:day`, p_window_seconds: 86400, p_limit: tier.perDay }),
    ]);
    const minBlocked = !min.error && min.data?.[0]?.allowed === false;
    const dayBlocked = !day.error && day.data?.[0]?.allowed === false;
    if (minBlocked || dayBlocked) {
      return {
        ok: false,
        res: NextResponse.json(
          { error: 'rate_limited', scope: minBlocked ? 'per_minute' : 'per_day' },
          { status: 429, headers: { 'Retry-After': minBlocked ? '60' : '3600' } },
        ),
      };
    }
  } catch {
    // fail open — see header note
  }
  return { ok: true };
}
