// app/api/wa/portfolio/route.ts
// Server-to-server: AskGogo fetches a linked user's read-only card portfolio.
// Shared-secret auth. Unions manual_cards (direct user_id) + linked_cards (via aa_consents).
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(req: Request) {
  const secret = req.headers.get('x-wa-secret') ?? '';
  if (!process.env.WA_LINK_SECRET || secret !== process.env.WA_LINK_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const uid = new URL(req.url).searchParams.get('uid') ?? '';
  if (!uid) return NextResponse.json({ error: 'uid required' }, { status: 400 });

  const b = svc();

  // 1) Manually-added cards (direct user_id).
  const { data: manualRows } = await b
    .from('manual_cards')
    .select('bank, card_name, card_last4, points_balance, points_currency')
    .eq('user_id', uid)
    .order('imported_at', { ascending: false });

  // 2) Statement-imported cards (direct user_id) — the VERIFIED source (the moat).
  //    This mirrors /api/user-cards EXACTLY (same table, same select *, same order, and the
  //    same intra-statement dedupe key `${bank}-${card_last4 || 'unknown'}`, user-cards/
  //    route.ts:34-40) so the WA wallet and the web wallet read the same rows and can't
  //    diverge. The web then concatenates statement + manual with NO cross-table dedupe
  //    (dashboard/page.tsx:151-153), so we concat below too rather than dropping a manual
  //    card that also appears as a statement — matching the web is the whole point.
  const { data: stmtRows } = await b
    .from('statement_imports')
    .select('*')
    .eq('user_id', uid)
    .order('imported_at', { ascending: false });

  const stmtSeen = new Set<string>();
  const statementRows = (stmtRows ?? []).filter((row: any) => {
    const key = `${row.bank}-${row.card_last4 || 'unknown'}`;
    if (stmtSeen.has(key)) return false;
    stmtSeen.add(key);
    return true;
  });

  // 3) AA-linked cards: resolve this user's consent handles, then pull linked rows.
  const { data: consents } = await b
    .from('aa_consents')
    .select('consent_handle')
    .eq('user_id', uid)
    .eq('status', 'DATA_FETCHED');

  const handles = (consents ?? []).map((c: any) => c.consent_handle).filter(Boolean);

  let linkedRows: any[] = [];
  if (handles.length) {
    const { data } = await b
      .from('linked_cards')
      .select('bank, masked_number, reward_points, cashback_balance, synced_at')
      .in('consent_handle', handles);
    linkedRows = data ?? [];
  }

  const cards = [
    ...(manualRows ?? []).map((r: any) => ({
      source: 'manual' as const,
      bank: r.bank,
      name: r.card_name,
      last4: r.card_last4 ?? null,
      points: r.points_balance ?? 0,
      points_currency: r.points_currency ?? 'Points',
      verified: false, // manual = self-reported (grey/"Self-entered" in CreditIQ's honesty model).
                       // NB: the user-facing WA label string lives in the AskGogo bot repo
                       // (gogo-memory-os), not here — this route only returns the boolean.
                       // Rename it there too or the bot still says "Estimated". See branch notes.
    })),
    ...statementRows.map((r: any) => ({
      source: 'statement' as const,
      bank: r.bank,
      name: r.card_name,
      last4: r.card_last4 ?? null,
      points: r.points_balance ?? 0,
      points_currency: r.points_currency ?? 'Points',
      verified: !r.self_entered, // read from a statement AND not since hand-edited
                                 // (self_entered demotes to grey) — same rule as
                                 // WalletView.tsx:53. Default self_entered=false => verified.
      statement_date: r.statement_date ?? null,
    })),
    ...linkedRows.map((r: any) => ({
      source: 'linked' as const,
      bank: r.bank,
      name: null, // AA gives masked number + bank, not a catalogue name
      last4: r.masked_number ? String(r.masked_number).slice(-4) : null,
      points: r.reward_points ?? 0,
      points_currency: 'Points',
      cashback: r.cashback_balance ?? null,
      verified: true, // AA-sourced = statement-verified
      synced_at: r.synced_at ?? null,
    })),
  ];

  // Server-side total so the bot never sums client-side (and can't drift from this figure).
  const total_points = cards.reduce((s, c) => s + (c.points ?? 0), 0);

  return NextResponse.json({ uid, count: cards.length, total_points, cards });
}
