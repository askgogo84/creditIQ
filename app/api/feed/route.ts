// app/api/feed/route.ts
// User-facing community feed. Free for any logged-in user, but NOT public.
// Community intelligence is ranked for relevance to the user's wallet while
// remaining explicitly directional rather than issuer-verified financial truth.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeText } from '@/lib/sanitize-text';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const URL_ENV = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SVC = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

const TYPE_WEIGHT: Record<string, number> = {
  devaluation: 32,
  transfer_hack: 30,
  sweet_spot: 27,
  reward_tip: 24,
  card_comparison: 22,
  card_review: 17,
  strategy: 16,
  lounge: 15,
  forex: 15,
  general: 8,
};

type WalletIdentity = { name: string; bank: string };

function norm(value: unknown) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function cardMentionMatches(mention: string, cardName: string) {
  const a = norm(mention);
  const b = norm(cardName);
  if (!a || !b) return false;
  if (a === b) return true;
  return Math.min(a.length, b.length) >= 6 && (a.includes(b) || b.includes(a));
}

function bankMatches(mention: string, bank: string) {
  const a = norm(mention).replace(/bank$/, '');
  const b = norm(bank).replace(/bank$/, '');
  return !!a && !!b && (a === b || (Math.min(a.length, b.length) >= 4 && (a.includes(b) || b.includes(a))));
}

function publishedTime(row: any) {
  const value = row.published_at || row.scraped_at || row.created_at;
  const ms = value ? new Date(value).getTime() : 0;
  return Number.isFinite(ms) ? ms : 0;
}

function freshnessScore(row: any) {
  const ms = publishedTime(row);
  if (!ms) return 0;
  const days = Math.max(0, (Date.now() - ms) / 86_400_000);
  if (days <= 2) return 45;
  if (days <= 7) return 38;
  if (days <= 30) return 25;
  if (days <= 90) return 10;
  return 2;
}

function scoreRow(row: any, wallet: WalletIdentity[]) {
  const mentions = Array.isArray(row.card_mentions) ? row.card_mentions.map(String) : [];
  const bankMentions = Array.isArray(row.bank_mentions) ? row.bank_mentions.map(String) : [];
  const matchedCards = wallet
    .filter(card => mentions.some((mention: string) => cardMentionMatches(mention, card.name)))
    .map(card => card.name);
  const matchedBanks = wallet
    .filter(card => bankMentions.some((mention: string) => bankMatches(mention, card.bank)))
    .map(card => card.bank);

  const uniqueCards = [...new Set(matchedCards)];
  const uniqueBanks = [...new Set(matchedBanks)];
  const trust = Math.max(0, Math.min(1, Number(row.trust_score || 0)));
  const engagement = Math.max(0, Number(row.engagement || 0));
  const walletBoost = uniqueCards.length ? 85 + Math.min(20, (uniqueCards.length - 1) * 6) : uniqueBanks.length ? 28 : 0;
  const score =
    freshnessScore(row) +
    (TYPE_WEIGHT[row.insight_type] ?? 8) +
    trust * 24 +
    Math.min(14, Math.log10(engagement + 1) * 3) +
    walletBoost;

  return { score, matchedCards: uniqueCards, matchedBanks: uniqueBanks };
}

async function loadWallet(sb: ReturnType<typeof createClient>, userId: string): Promise<WalletIdentity[]> {
  const [{ data: points }, { data: manual }] = await Promise.all([
    sb.from('user_points').select('card_id').eq('user_id', userId).limit(100),
    sb.from('manual_cards').select('bank,card_name').eq('user_id', userId).limit(100),
  ]);

  const ids = [...new Set((points || []).map((row: any) => String(row.card_id || '')).filter(Boolean))];
  let catalogue: any[] = [];
  if (ids.length) {
    const { data } = await sb.from('cards').select('id,name,bank').in('id', ids).limit(100);
    catalogue = data || [];
  }

  const identities: WalletIdentity[] = [
    ...catalogue.map((row: any) => ({ name: String(row.name || ''), bank: String(row.bank || '') })),
    ...(manual || []).map((row: any) => ({ name: String(row.card_name || ''), bank: String(row.bank || '') })),
  ].filter(card => card.name);

  const seen = new Set<string>();
  return identities.filter(card => {
    const key = `${norm(card.bank)}:${norm(card.name)}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(req: NextRequest) {
  const m = (req.headers.get('authorization') ?? '').match(/^Bearer\s+(.+)$/i);
  if (!m) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const anon = createClient(URL_ENV(), ANON(), { auth: { persistSession: false } });
  const { data: u, error: ue } = await anon.auth.getUser(m[1].trim());
  if (ue || !u.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const sb = createClient(URL_ENV(), SVC() || ANON(), { auth: { persistSession: false } });
    const [wallet, intel] = await Promise.all([
      loadWallet(sb, u.user.id),
      sb
        .from('intelligence_kb')
        .select('id, source, source_url, creator_handle, creator_name, title, content, insight_type, card_mentions, bank_mentions, trust_score, engagement, published_at, scraped_at, created_at')
        .eq('active', true)
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(500),
    ]);

    if (intel.error) return NextResponse.json({ items: [], wallet_cards: wallet.length });

    const ranked = (intel.data ?? [])
      .map((row: any) => ({ row, ...scoreRow(row, wallet) }))
      .sort((a: any, b: any) => b.score - a.score || publishedTime(b.row) - publishedTime(a.row))
      .slice(0, 100);

    const items = ranked.map(({ row, matchedCards, matchedBanks }: any) => ({
      id: row.id,
      source: row.source ?? null,
      source_url: row.source_url ?? null,
      creator_handle: row.creator_handle ?? null,
      creator_name: sanitizeText(row.creator_name),
      title: sanitizeText(row.title),
      summary: sanitizeText(row.content),
      insight_type: row.insight_type ?? 'general',
      card_mentions: Array.isArray(row.card_mentions) ? row.card_mentions : [],
      date: row.published_at ?? row.scraped_at ?? null,
      wallet_matches: matchedCards,
      relevance_reason: matchedCards.length
        ? `Relevant to ${matchedCards.slice(0, 2).join(' + ')}`
        : matchedBanks.length
          ? `Relevant to your ${matchedBanks[0]} card`
          : ['devaluation', 'transfer_hack', 'sweet_spot'].includes(row.insight_type)
            ? 'High-value card intelligence'
            : null,
    }));

    return NextResponse.json({ items, wallet_cards: wallet.length });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
