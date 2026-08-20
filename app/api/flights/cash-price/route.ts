// app/api/flights/cash-price/route.ts
// POST /api/flights/cash-price — cheapest live cash fare for a route. Backs the
// Fly-on-Points "Show cash price" disclosure: no cash number appears in the UI
// until the user asks, and when they do we fetch it live (never show a stored
// estimate beside a real points figure — the moat's honesty rule).
//
// Returns 200 { cashPrice: number | null } always; cash is enrichment, so an
// upstream failure degrades to null rather than a 5xx.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { fetchCheapestCash } from '@/lib/cheapest-cash';

export const runtime = 'nodejs';
export const maxDuration = 15;
export const dynamic = 'force-dynamic';

const IATA = /^[A-Z]{3}$/;
const TIMEOUT_MS = 8000;

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;

  const body = await req.json().catch(() => ({}));
  const from = String(body.from ?? '').toUpperCase().trim();
  const to = String(body.to ?? '').toUpperCase().trim();
  if (!IATA.test(from) || !IATA.test(to)) {
    return NextResponse.json({ error: 'from/to must be 3-letter IATA codes' }, { status: 400 });
  }

  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const cashPrice = await fetchCheapestCash(from, to, controller.signal);
    return NextResponse.json({ cashPrice });
  } catch {
    return NextResponse.json({ cashPrice: null });
  } finally {
    clearTimeout(deadline);
  }
}
