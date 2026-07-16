// app/api/trip-planner/live-price/route.ts
// POST /api/trip-planner/live-price — live award + cash + your-points price for
// ONE destination (the trip-planner "inspire" cards currently show a hardcoded
// `miles` figure; this replaces that with a live seats.aero read).
//
// Fuses three upstreams in parallel (8s cap each):
//   1. seats.aero award availability (today .. +30d) via lib/seats-aero.ts
//   2. cheapest cash fare — same pattern /api/flights/cheapest uses (revalidate 3600)
//   3. the caller's VERIFIED cards (statement_imports only)
// Picks the lowest-mileage LIVE award, enriches ONLY that one with a trips call,
// then computes a redemption via lib/fusion-core.ts.
//
// HONESTY CONTRACT (CreditIQ moat): the result ships verified:false, and the
// affordable/verified figures use STATEMENT-sourced points only — manual
// (estimated) cards are deliberately excluded from the verified balance.
//
// ROBUSTNESS: any upstream failure degrades gracefully — the client NEVER gets a
// 5xx. No live award (or an unexpected error) => 200 { live: false }.
//
// NOTE (spec provenance): the live-award TRD (docs/live-award/) was NOT present
// in the repo when this was written, so the LiveDestinationPrice shape and the
// zeroVerified/affordable/shortfall semantics are INFERRED from the task brief +
// existing fusion patterns — reconcile against TRD sections 3-4 when available.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';
import {
  searchAwardAvailability,
  getAvailabilityTrips,
  type SeatsAeroResult,
  type SeatsAeroTrip,
} from '@/lib/seats-aero';
import {
  pickLiveAward,
  assembleLivePrice,
  type UserCard,
} from '@/lib/fusion-core';
import type { LiveDestinationPrice } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 20;
export const dynamic = 'force-dynamic';

const IATA = /^[A-Z]{3}$/;
type LiveCabin = 'economy' | 'business';

const UPSTREAM_TIMEOUT_MS = 8000;
const AWARD_WINDOW_DAYS = 30;

// Race a promise we can't hand an AbortSignal to (the seats.aero helpers own their
// own fetches) against an 8s deadline; on timeout OR error resolve to `fallback`
// rather than reject, so a slow/failing upstream degrades to "no data".
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    p.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── upstream: cheapest cash fare (same pattern as /api/flights/cheapest) ───────
async function fetchCheapestCash(
  origin: string,
  destination: string,
  signal: AbortSignal,
): Promise<number | null> {
  const token = process.env.TRAVELPAYOUTS_TOKEN || '';
  if (!token) return null;
  try {
    const url = new URL('https://api.travelpayouts.com/v1/prices/cheap');
    url.searchParams.set('origin', origin);
    url.searchParams.set('destination', destination);
    url.searchParams.set('currency', 'INR');
    url.searchParams.set('token', token);
    const res = await fetch(url.toString(), {
      headers: { 'X-Access-Token': token },
      next: { revalidate: 3600 }, // cache 1 hour
      signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const entries = data?.data?.[destination];
    if (!entries || typeof entries !== 'object') return null;
    let min: number | null = null;
    for (const k of Object.keys(entries)) {
      const price = Number(entries[k]?.price);
      if (price > 0 && (min === null || price < min)) min = price;
    }
    return min;
  } catch {
    return null; // cash is enrichment — never fail the whole response on it
  }
}

// ── upstream: caller's VERIFIED cards (statement_imports only) ─────────────────
// The fusion route merges statement_imports + manual_cards; here we deliberately
// read ONLY statement_imports because verified balance = statement-sourced.
async function fetchVerifiedCards(userId: string): Promise<UserCard[]> {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
    const { data } = await sb
      .from('statement_imports')
      .select('bank, card_name, card_last4, points_balance, points_currency')
      .eq('user_id', userId);
    const rows = (data || []) as UserCard[];
    // dedupe by bank + last4 + name (same key the fusion route uses)
    const seen = new Set<string>();
    const cards: UserCard[] = [];
    for (const r of rows) {
      if (!r || !r.card_name) continue;
      const key = `${(r.bank || '').toLowerCase()}-${r.card_last4 || 'x'}-${r.card_name.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cards.push(r);
    }
    return cards;
  } catch (e) {
    console.error('live-price: verified card fetch failed', e);
    return [];
  }
}

// ── handler ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;

  // Parse + validate.
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const origin = String(body.origin ?? '').toUpperCase().trim();
  const destination = String(body.destination ?? '').toUpperCase().trim();
  const cabinProvided =
    body.cabin !== undefined && body.cabin !== null && body.cabin !== '';
  const cabin = cabinProvided ? String(body.cabin) : 'economy';

  if (
    !IATA.test(origin) ||
    !IATA.test(destination) ||
    (cabinProvided && cabin !== 'economy' && cabin !== 'business')
  ) {
    return NextResponse.json(
      {
        error:
          'origin/destination must be 3-letter IATA codes; cabin must be economy or business',
      },
      { status: 400 },
    );
  }
  const cabinTyped = cabin as LiveCabin;

  const today = new Date();
  const start = ymd(today);
  const end = ymd(new Date(today.getTime() + AWARD_WINDOW_DAYS * 24 * 60 * 60 * 1000));

  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const [awards, cashPrice, verifiedCards] = await Promise.all([
      withTimeout(
        searchAwardAvailability(origin, destination, start, end, undefined, cabinTyped),
        UPSTREAM_TIMEOUT_MS,
        [] as SeatsAeroResult[],
      ),
      fetchCheapestCash(origin, destination, controller.signal),
      withTimeout(fetchVerifiedCards(gate.userId), UPSTREAM_TIMEOUT_MS, [] as UserCard[]),
    ]);

    const best = pickLiveAward(awards);
    if (!best) {
      const notLive: LiveDestinationPrice = { live: false };
      return NextResponse.json(notLive);
    }

    // Enrich ONLY the chosen award (one extra credit-costing seats.aero call).
    const trip = await withTimeout(
      getAvailabilityTrips(best.id, cabinTyped),
      UPSTREAM_TIMEOUT_MS,
      null as SeatsAeroTrip | null,
    );

    const result = assembleLivePrice({
      origin,
      destination,
      cabin: cabinTyped,
      best,
      trip,
      cashPrice,
      verifiedCards,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    // Never 5xx to the client — degrade to live:false on any unexpected failure.
    console.error('live-price error:', err?.message || err);
    const notLive: LiveDestinationPrice = { live: false };
    return NextResponse.json(notLive);
  } finally {
    clearTimeout(deadline);
  }
}
