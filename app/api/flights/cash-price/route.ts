// app/api/flights/cash-price/route.ts
// POST /api/flights/cash-price — live cash fare for a route, backing the
// Fly-on-Points "Show cash price" disclosure. No cash number appears in the UI
// until the user asks; when they do we fetch it live.
//
// Prefers a SAME-DATE fare (v3 prices_for_dates, departure_at = the row's date) so
// the points-vs-cash verdict is like-for-like. If that fails or the date has no
// cached fare, it falls back to the ROUTE-level cheapest and says so via `scope`,
// so the client can label the weaker comparison rather than pretend it's same-date.
//
// Always 200 { cashPrice, scope }: cashPrice number|null; scope 'date'|'route'|null.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { fetchCashForDate, fetchCheapestCash } from '@/lib/cheapest-cash';

export const runtime = 'nodejs';
export const maxDuration = 15;
export const dynamic = 'force-dynamic';

const IATA = /^[A-Z]{3}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIMEOUT_MS = 9000;

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;

  const body = await req.json().catch(() => ({}));
  const from = String(body.from ?? '').toUpperCase().trim();
  const to = String(body.to ?? '').toUpperCase().trim();
  const date = String(body.date ?? '').slice(0, 10);
  if (!IATA.test(from) || !IATA.test(to)) {
    return NextResponse.json({ error: 'from/to must be 3-letter IATA codes' }, { status: 400 });
  }

  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // 1) same-date fare (preferred)
    if (ISO_DATE.test(date)) {
      const perDate = await fetchCashForDate(from, to, date, controller.signal);
      if (perDate != null) return NextResponse.json({ cashPrice: perDate, scope: 'date' });
    }
    // 2) EXPLICIT fallback: route-level cheapest (labelled 'route' downstream)
    const route = await fetchCheapestCash(from, to, controller.signal);
    if (route != null) return NextResponse.json({ cashPrice: route, scope: 'route' });

    return NextResponse.json({ cashPrice: null, scope: null });
  } catch {
    return NextResponse.json({ cashPrice: null, scope: null });
  } finally {
    clearTimeout(deadline);
  }
}
