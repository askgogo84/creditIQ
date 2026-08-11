'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { CreditCard } from '@/lib/types';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { getFloorValuation, getRedemptionOptions } from '@/lib/redemption';
import { matchCards } from '@/lib/engine';
import { EstimatedValue, UnverifiedRowBadge } from '@/components/cards/Unverified';
import { useSpend, rupeeShort } from './SpendContext';

// ─────────────────────────────────────────────────────────────────────────────
// ProductTabs — the interactive §04 that REPLACES the old "What you get today"
// PRODUCTS grid. Four numbered tabs, a LIVE badge, one panel open at a time. Every
// figure is real: SEED_CARDS + the value engine + cached /api/fares. NOTHING here
// is ever Verified — that needs a linked statement and is impossible pre-login — so
// the strongest label any figure carries is Estimated (or Cached, for a live fare).
//
//   01 Fly on Points  → cached economy fare + the card's transfer programmes by ₹/pt
//   02 Spend Smart    → one purchase, each card's ₹ back (engine convention), ranked
//   03 My Wallet      → a LABELLED EXAMPLE wallet, floor-valued (worth at least ₹X)
//   04 Discover Cards → SEED_CARDS ranked by net value, compact, no paid placement
//
// Landing tokens only (Fraunces / Inter / JetBrains Mono, no shadows, copper
// hairlines, 44px tap targets) — this component does NOT follow the app theme.
// ─────────────────────────────────────────────────────────────────────────────

const FR = "'Fraunces', Georgia, serif";
const IN = "'Inter', system-ui, sans-serif";
const MO = "'JetBrains Mono', ui-monospace, monospace";

const INR = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

// ── Provenance pills (semantic colours; Verified deliberately unreachable here) ──
function Pill({ kind }: { kind: 'cached' | 'estimated' | 'example' }) {
  const map = {
    cached: { bg: 'rgba(185,139,31,.14)', bd: 'rgba(185,139,31,.42)', fg: '#7a5c0f', dot: '#B98B1F', label: 'Cached' },
    estimated: { bg: 'rgba(107,107,109,.1)', bd: 'rgba(107,107,109,.3)', fg: '#5b6169', dot: '#9aa2ad', label: 'Estimated' },
    example: { bg: 'rgba(200,120,20,.12)', bd: 'rgba(200,120,20,.5)', fg: '#9a5a05', dot: '#c2871f', label: 'Example' },
  }[kind];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: map.bg, border: `1px solid ${map.bd}`, fontFamily: IN, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: map.fg, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: map.dot }} />
      {map.label}
    </span>
  );
}

// Shared surface for a panel body — white card on the white §04 ground, sand hairline.
const panelSurface: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5d9cc',
  borderRadius: 20,
  padding: 'clamp(20px,3vw,32px)',
};

const panelLead: React.CSSProperties = { fontFamily: IN, fontSize: 15, lineHeight: 1.6, color: '#2b385c', maxWidth: '60ch', margin: '4px 0 22px' };
const panelCta: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, marginTop: 22, fontFamily: IN, fontSize: 14, fontWeight: 600, color: '#c2871f', textDecoration: 'none' };

// Reward-currency → compact unit label for a points balance.
function unitLabel(cur: CreditCard['reward_currency']): string {
  switch (cur) {
    case 'reward-points': return 'RP';
    case 'membership-rewards': return 'MR pts';
    case 'edge': return 'EDGE miles';
    case 'miles': return 'miles';
    case 'neucoins': return 'NeuCoins';
    case 'avios': return 'Avios';
    case 'krisflyer': return 'miles';
    case 'cashback': return '₹';
    default: return 'pts';
  }
}

const byId = (id: string) => SEED_CARDS.find((c) => c.id === id);

// ════════════════════════════════════════════════════════════════════════════
// 01 · FLY ON POINTS
// Corridor pills → cached economy fare from /api/fares (Cached, age-stamped). A
// card selector → that card's TRANSFER programmes ranked by ₹/point (Estimated).
// No cabin picker: we can't price a business/first award, so we never pretend to.
// ════════════════════════════════════════════════════════════════════════════

// Warmed corridors (same subset lib/fares keeps hot) so an anonymous visitor never
// lands on a cold cache. Economy, one way — the only cabin we can price from cash.
const CORRIDORS = [
  { o: 'BLR', d: 'DXB', label: 'BLR–DXB' },
  { o: 'DEL', d: 'DXB', label: 'DEL–DXB' },
  { o: 'BOM', d: 'SIN', label: 'BOM–SIN' },
  { o: 'DEL', d: 'LON', label: 'DEL–LON' },
  { o: 'BLR', d: 'BKK', label: 'BLR–BKK' },
] as const;

// Cards that actually publish a transfer path (the only ones this tab can rank).
const FLY_CARD_IDS = ['hdfc-infinia', 'axis-atlas', 'amex-platinum-travel', 'axis-magnus-burgundy'];
const FLY_CARDS = FLY_CARD_IDS.map(byId).filter((c): c is CreditCard => Boolean(c));

function ageLabel(iso: string | null | undefined): string {
  if (!iso) return 'recently';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'recently';
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return 'under 1h';
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

type Fare =
  | { kind: 'loading' }
  | { kind: 'cached'; price: number; airline?: string; foundAt: string }
  | { kind: 'estimated' };

function FlyOnPointsPanel() {
  const [corridor, setCorridor] = useState(0);
  const [cardIdx, setCardIdx] = useState(0);
  const [fare, setFare] = useState<Fare>({ kind: 'loading' });
  const c = CORRIDORS[corridor];
  const card = FLY_CARDS[cardIdx];

  useEffect(() => {
    let cancelled = false;
    setFare({ kind: 'loading' });
    fetch(`/api/fares?origin=${c.o}&destination=${c.d}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const fresh = (Array.isArray(d?.fares) ? d.fares : []).find((f: any) => !f.stale && f.price_inr);
        if (fresh) setFare({ kind: 'cached', price: fresh.price_inr, airline: fresh.airlineName || fresh.airline, foundAt: fresh.found_at });
        else setFare({ kind: 'estimated' });
      })
      .catch(() => { if (!cancelled) setFare({ kind: 'estimated' }); });
    return () => { cancelled = true; };
  }, [c.o, c.d]);

  // The card's transfer programmes, ranked by ₹/point. Transfers only — a portal
  // flight/voucher isn't a "fly on points" path, so it's out of this list.
  const transfers = useMemo(() => {
    if (!card) return [];
    return getRedemptionOptions(card)
      .filter((o) => o.type === 'transfer')
      .sort((a, b) => b.value_per_point_inr - a.value_per_point_inr);
  }, [card]);

  return (
    <div style={panelSurface}>
      <p style={panelLead}>
        What a seat costs in cash, and what a point is worth if you transfer it. We price economy only —
        a business or first award needs an award chart we can&rsquo;t verify, so we never invent one.
      </p>

      {/* Corridor pills → cached economy fare */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {CORRIDORS.map((corr, i) => {
          const on = i === corridor;
          return (
            <button key={corr.label} onClick={() => setCorridor(i)}
              style={{ minHeight: 44, padding: '0 15px', borderRadius: 999, cursor: 'pointer', fontFamily: MO, fontSize: 12.5, transition: '150ms', border: `1px solid ${on ? '#142335' : '#ddd0c0'}`, background: on ? '#142335' : 'transparent', color: on ? '#fbf8f3' : '#2b385c' }}>
              {corr.label}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 18, padding: '18px 20px', border: '1px solid #f1ece4', borderRadius: 14, background: '#faf8f4', minHeight: 96 }}>
        <div style={{ fontFamily: MO, fontSize: 12, color: '#6b6b6d' }}>{c.label} · economy, one way</div>
        {fare.kind === 'loading' && (
          <div style={{ fontFamily: MO, fontSize: 'clamp(30px,5vw,42px)', color: '#8A857B', lineHeight: 1.1, marginTop: 6 }}>…</div>
        )}
        {fare.kind === 'cached' && (
          <>
            <div style={{ fontFamily: MO, fontSize: 'clamp(30px,5vw,42px)', fontWeight: 500, color: '#142335', lineHeight: 1.1, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{INR(fare.price)}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 12 }}>
              <Pill kind="cached" />
              <span style={{ fontFamily: IN, fontSize: 12.5, color: '#6b6b6d' }}>
                updated {ageLabel(fare.foundAt)} ago{fare.airline ? ` · ${fare.airline}` : ''} · cheapest cached cash fare, not a live quote
              </span>
            </div>
          </>
        )}
        {fare.kind === 'estimated' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <Pill kind="estimated" />
            <span style={{ fontFamily: IN, fontSize: 13.5, color: '#2b385c' }}>No fresh fare cached for this corridor — we never invent one. Try another route.</span>
          </div>
        )}
      </div>

      {/* Card selector → that card's transfer programmes ranked by ₹/point */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 26 }}>
        {FLY_CARDS.map((fc, i) => {
          const on = i === cardIdx;
          return (
            <button key={fc.id} onClick={() => setCardIdx(i)}
              style={{ minHeight: 44, padding: '0 14px', borderRadius: 999, cursor: 'pointer', fontFamily: IN, fontSize: 13, fontWeight: 500, transition: '150ms', border: `1px solid ${on ? '#c2871f' : '#ddd0c0'}`, background: on ? 'rgba(200,135,31,.1)' : 'transparent', color: on ? '#9a5a05' : '#2b385c' }}>
              {fc.name.replace(/ (Metal Edition|Credit Card|Card)$/i, '')}
            </button>
          );
        })}
      </div>

      {card && (
        <div style={{ marginTop: 16, border: '1px solid #f1ece4', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', background: '#f1ece4', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontFamily: IN, fontSize: 13, fontWeight: 600, color: '#142335' }}>{card.name} · transfer programmes</span>
            <span style={{ fontFamily: MO, fontSize: 11, color: '#6b6b6d' }}>ranked ₹ / {unitLabel(card.reward_currency)}</span>
          </div>
          {transfers.length === 0 && (
            <div style={{ padding: '16px 18px', fontFamily: IN, fontSize: 13.5, color: '#6b6b6d' }}>No published transfer path for this card.</div>
          )}
          {transfers.map((t, i) => (
            <div key={`${t.partner}-${i}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center', padding: '13px 18px', borderTop: i === 0 ? 'none' : '1px solid #f5f1ea' }}>
              <span style={{ fontFamily: IN, fontSize: 14, color: '#142335', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.partner ?? 'Transfer partner'}</span>
              <span style={{ fontFamily: MO, fontSize: 15, color: '#142335', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>₹{t.value_per_point_inr.toFixed(2)}/pt</span>
              <Pill kind="estimated" />
            </div>
          ))}
        </div>
      )}

      <Link href="/points-optimizer" style={panelCta}>Open the full points optimiser <span style={{ fontFamily: MO }}>→</span></Link>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 02 · SPEND SMART
// One purchase (amount + category) → each card's ₹ back, ranked. The reward maths
// MIRRORS lib/engine's categoryAnnualReward VERBATIM (percent unit = %-equiv rupees;
// multiplier unit = rate ×  best redemption value; monthly cap as ceiling) so this
// panel can never contradict the real engine. Base rate when no accelerator matches.
// ════════════════════════════════════════════════════════════════════════════

// Category → the seed category_rewards strings it maps onto (subset of DEFAULT_SPEND_MIX).
const SPEND_CATS = [
  { id: 'online', label: 'Online shopping', matches: ['online', 'amazon-prime', 'flipkart', 'smartbuy', 'tata-neu-app', 'tata-partners'] },
  { id: 'dining', label: 'Dining', matches: ['dining', 'preferred'] },
  { id: 'grocery', label: 'Grocery', matches: ['grocery'] },
  { id: 'travel', label: 'Travel', matches: ['travel', 'travel-edge', 'international'] },
  { id: 'fuel', label: 'Fuel', matches: ['fuel'] },
  { id: 'utility', label: 'Utilities', matches: ['utility'] },
];

const bestRedemptionValue = (card: CreditCard): number =>
  card.redemption_options.length > 0 ? Math.max(...card.redemption_options.map((r) => r.value_per_point_inr)) : 1.0;

// Single-purchase ₹ back for one category — mirrors lib/engine categoryAnnualReward
// (no ×12, monthly cap applied as a ceiling). Returns the winning accelerator too.
function purchaseBack(card: CreditCard, matches: string[], amount: number): { inr: number; via: string } {
  const brv = bestRedemptionValue(card);
  let best: { inr: number; via: string } | null = null;
  for (const cr of card.category_rewards) {
    if (!matches.includes(cr.category.toLowerCase())) continue;
    let reward: number;
    if (cr.unit === 'percent') {
      reward = amount * (cr.rate / 100);
    } else if (card.reward_currency === 'cashback') {
      reward = amount * ((cr.rate * card.base_reward_rate) / 100);
    } else {
      reward = amount * (cr.rate / 100) * brv;
    }
    if (cr.cap_inr_monthly) reward = Math.min(reward, cr.cap_inr_monthly);
    if (!best || reward > best.inr) best = { inr: reward, via: `${cr.rate}${cr.unit === 'percent' ? '%' : '×'} on ${cr.category}` };
  }
  if (!best) return { inr: amount * (card.base_reward_rate / 100), via: `${card.base_reward_rate}% base rate` };
  return best;
}

function SpendSmartPanel() {
  const [amount, setAmount] = useState(10000);
  const [catId, setCatId] = useState(SPEND_CATS[0].id);
  const cat = SPEND_CATS.find((c) => c.id === catId)!;

  const ranked = useMemo(() => {
    const seen = new Set<string>();
    return SEED_CARDS
      .filter((c) => c.active && !seen.has(c.id) && seen.add(c.id))
      .map((c) => ({ card: c, ...purchaseBack(c, cat.matches, amount) }))
      .sort((a, b) => b.inr - a.inr)
      .slice(0, 5);
  }, [cat, amount]);

  return (
    <div style={panelSurface}>
      <p style={panelLead}>
        One purchase, every Indian card ranked by what it actually hands back — rate × redemption, capped at the
        published limit. The same maths the value engine runs, on a single spend.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: IN, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6b6d' }}>Purchase amount</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid #ddd0c0', borderRadius: 12, padding: '0 14px', background: '#faf8f4', height: 48 }}>
            <span style={{ fontFamily: MO, fontSize: 16, color: '#6b6b6d' }}>₹</span>
            <input type="number" min={0} step={500} value={amount}
              onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
              style={{ width: 110, border: 'none', outline: 'none', background: 'transparent', fontFamily: MO, fontSize: 18, color: '#142335' }} />
          </span>
        </label>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
        {SPEND_CATS.map((sc) => {
          const on = sc.id === catId;
          return (
            <button key={sc.id} onClick={() => setCatId(sc.id)}
              style={{ minHeight: 44, padding: '0 15px', borderRadius: 999, cursor: 'pointer', fontFamily: IN, fontSize: 13, fontWeight: 500, transition: '150ms', border: `1px solid ${on ? '#142335' : '#ddd0c0'}`, background: on ? '#142335' : 'transparent', color: on ? '#fbf8f3' : '#2b385c' }}>
              {sc.label}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 22, border: '1px solid #f1ece4', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, padding: '11px 18px', background: '#f1ece4', fontFamily: IN, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6b6d' }}>
          <span>Card</span>
          <span style={{ textAlign: 'right' }}>₹ back</span>
          <span style={{ textAlign: 'right' }}>Prov.</span>
        </div>
        {ranked.map((r, i) => (
          <div key={r.card.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center', padding: '14px 18px', borderTop: i === 0 ? 'none' : '1px solid #f5f1ea' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: IN, fontSize: 14.5, fontWeight: 600, color: '#142335', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.card.name}</div>
              <div style={{ fontFamily: MO, fontSize: 11.5, color: '#8a857b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.card.bank} · {r.via}</div>
            </div>
            <div style={{ fontFamily: MO, fontSize: 17, color: '#142335', whiteSpace: 'nowrap', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{INR(r.inr)}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Pill kind="estimated" /></div>
          </div>
        ))}
      </div>

      <Link href="/spend-optimizer" style={panelCta}>Rank on your full monthly spend <span style={{ fontFamily: MO }}>→</span></Link>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 03 · MY WALLET
// A LABELLED EXAMPLE wallet — real SEED_CARDS, stated illustrative balances, valued
// at the deterministic FLOOR (getFloorValuation: portal/voucher/cashback rates any
// user can hit today; transfers excluded, so "worth at least" is provable). The word
// "example" is on the panel in several places — a visitor must NEVER read it as theirs.
// ════════════════════════════════════════════════════════════════════════════

const WALLET_EXAMPLE = [
  { id: 'hdfc-infinia', points: 150000 },
  { id: 'axis-atlas', points: 40000 },
  { id: 'amex-platinum-travel', points: 75000 },
];

function MyWalletPanel() {
  const rows = WALLET_EXAMPLE
    .map((w) => { const card = byId(w.id); return card ? { card, points: w.points, fv: getFloorValuation(card, w.points) } : null; })
    .filter((r): r is { card: CreditCard; points: number; fv: ReturnType<typeof getFloorValuation> } => Boolean(r));
  const floorTotal = rows.reduce((s, r) => s + r.fv.total_inr, 0);

  return (
    <div style={{ ...panelSurface, position: 'relative' }}>
      {/* Unmissable EXAMPLE banner — the first thing read, before any figure. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(200,135,31,.1)', border: '1px solid rgba(200,120,20,.5)', marginBottom: 18 }}>
        <Pill kind="example" />
        <span style={{ fontFamily: IN, fontSize: 13.5, fontWeight: 600, color: '#9a5a05' }}>
          Example wallet — not your data. Sign in to load your own cards and balances.
        </span>
      </div>

      <p style={panelLead}>
        Real cards, illustrative balances, valued at the floor — the deterministic rate you can always redeem
        at today, transfers excluded. So &ldquo;worth at least&rdquo; is a number we can stand behind.
      </p>

      <div style={{ border: '1px solid #f1ece4', borderRadius: 14, overflow: 'hidden' }}>
        {rows.map((r, i) => (
          <div key={r.card.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 12, alignItems: 'center', padding: '15px 18px', borderTop: i === 0 ? 'none' : '1px solid #f5f1ea' }}>
            {/* Brand chip from the card's own colour */}
            <span style={{ width: 20, height: 28, borderRadius: 4, background: r.card.color, border: '1px solid rgba(0,0,0,.12)' }} aria-hidden />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: IN, fontSize: 14.5, fontWeight: 600, color: '#142335', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.card.name}</div>
              <div style={{ fontFamily: MO, fontSize: 11.5, color: '#8a857b', marginTop: 2 }}>
                {r.points.toLocaleString('en-IN')} {unitLabel(r.card.reward_currency)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: MO, fontSize: 16, color: '#142335', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{INR(r.fv.total_inr)}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}><Pill kind="estimated" /></div>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, padding: '14px 18px', background: '#f1ece4' }}>
          <span style={{ fontFamily: IN, fontSize: 12.5, color: '#6b6b6d' }}>Worth at least, across this example wallet</span>
          <span style={{ fontFamily: MO, fontSize: 20, fontWeight: 500, color: '#142335', fontVariantNumeric: 'tabular-nums' }}>{INR(floorTotal)}</span>
        </div>
      </div>

      <Link href="/my-cards" style={panelCta}>Build your real wallet <span style={{ fontFamily: MO }}>→</span></Link>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 04 · DISCOVER CARDS
// SEED_CARDS ranked by net value at the SHARED slider spend (SpendContext) — the
// SAME value §05 reads, so the two surfaces can never show one card at two net
// values. This is the compact browse (top 8); §05 is the fuller at-your-spend
// table. Deduped by id (a few seed ids repeat). No paid placement, stated plainly.
// ════════════════════════════════════════════════════════════════════════════

function DiscoverCardsPanel() {
  const { spend } = useSpend();
  const ranked = useMemo(() => {
    const seen = new Set<string>();
    const unique = SEED_CARDS.filter((c) => !seen.has(c.id) && seen.add(c.id));
    return matchCards(unique, { monthly_total_inr: spend }).slice(0, 8);
  }, [spend]);

  return (
    <div style={panelSurface}>
      <p style={panelLead}>
        Every card scored on your <em>{rupeeShort(spend)}</em>/month — the same spend the hero slider drives —
        ranked by net annual value: earnings from published rules, minus the fee. A compact browse; the fuller
        at-your-spend table is §05, just below.
      </p>

      <div style={{ border: '1px solid #f1ece4', borderRadius: 14, overflow: 'hidden' }}>
        {ranked.map((r, i) => (
          <div key={r.card.id} style={{ display: 'grid', gridTemplateColumns: '22px 1fr auto auto', gap: 12, alignItems: 'center', padding: '13px 18px', borderTop: i === 0 ? 'none' : '1px solid #f5f1ea' }}>
            <span style={{ fontFamily: MO, fontSize: 12, color: '#c2871f' }}>{String(i + 1).padStart(2, '0')}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: IN, fontSize: 14.5, fontWeight: 600, color: '#142335', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.card.name}</div>
              <div style={{ fontFamily: MO, fontSize: 11.5, color: '#8a857b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.card.bank} · {r.card.annual_fee_inr > 0 ? `fee ${INR(r.card.annual_fee_inr)}` : 'no annual fee'}
              </div>
              <UnverifiedRowBadge slug={r.card.slug} style={{ marginTop: 5 }} />
            </div>
            <div style={{ fontFamily: MO, fontSize: 15, whiteSpace: 'nowrap', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}><EstimatedValue slug={r.card.slug} baseColor="#142335" mark={false}>{INR(r.annual_value_inr)}</EstimatedValue></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Pill kind="estimated" /></div>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: IN, fontSize: 13, lineHeight: 1.6, color: '#6b6b6d', margin: '14px 0 0', maxWidth: '60ch' }}>
        Ranked purely by computed net value. No card pays for placement — the order is the maths, nothing else.
      </p>

      <Link href="/cards" style={panelCta}>Browse all cards <span style={{ fontFamily: MO }}>→</span></Link>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB SHELL
// ════════════════════════════════════════════════════════════════════════════

const TABS = [
  { no: '01', label: 'Fly on Points', Panel: FlyOnPointsPanel },
  { no: '02', label: 'Spend Smart', Panel: SpendSmartPanel },
  { no: '03', label: 'My Wallet', Panel: MyWalletPanel },
  { no: '04', label: 'Discover Cards', Panel: DiscoverCardsPanel },
];

export function ProductTabs() {
  const [active, setActive] = useState(0);
  const ActivePanel = TABS[active].Panel;

  return (
    <div style={{ marginTop: 30 }}>
      {/* Section chrome: LIVE badge, then the numbered tab strip. LIVE is copper —
          green stays reserved for verified-from-statement, which is impossible here. */}
      <style>{`
        @keyframes ciqLivePulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
        @media (prefers-reduced-motion: reduce) { .ciqLiveDot { animation: none !important; } }
        .ciqTabStrip::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 999, background: '#142335' }}>
        <span className="ciqLiveDot" style={{ width: 7, height: 7, borderRadius: 999, background: '#e8b45c', animation: 'ciqLivePulse 1.8s ease-in-out infinite' }} />
        <span style={{ fontFamily: IN, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#f7f4ef' }}>Live · try it now</span>
      </div>

      {/* Numbered tabs across the top — horizontal scroll at 375px, no wrap. */}
      <div className="ciqTabStrip" role="tablist" aria-label="Interactive product demos"
        style={{ display: 'flex', gap: 8, marginTop: 16, overflowX: 'auto', paddingBottom: 4, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        {TABS.map((t, i) => {
          const on = i === active;
          return (
            <button key={t.no} role="tab" aria-selected={on} onClick={() => setActive(i)}
              style={{ minHeight: 46, flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 18px', borderRadius: 999, cursor: 'pointer', transition: '160ms', border: `1px solid ${on ? '#142335' : '#ddd0c0'}`, background: on ? '#142335' : '#ffffff', color: on ? '#fbf8f3' : '#2b385c' }}>
              <span style={{ fontFamily: MO, fontSize: 12, color: on ? '#e8b45c' : '#c2871f' }}>{t.no}</span>
              <span style={{ fontFamily: IN, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 18 }}>
        <ActivePanel />
      </div>
    </div>
  );
}
