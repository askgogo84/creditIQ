'use client';
import { WhatCreatorsSay } from '@/components/WhatCreatorsSay';
import { ReportValue } from '@/components/ReportValue';

import { CreditCard3D } from '@/components/design/CreditCard3D';
import { CardArt } from '@/components/cards/CardArt';
import { isCardUnverified, isFieldUnverified } from '@/lib/data/unverified-cards';
import { EstimatedValue } from '@/components/cards/Unverified';
import { useCompare } from '@/lib/store';
import { calculateAnnualValue } from '@/lib/engine';
import { formatINR, formatINRFull } from '@/lib/utils';
import { Reveal } from '@/components/design/Reveal';
import { CopperCTA, GhostCTA } from '@/components/design/CTAs';
import Link from 'next/link';
import {
  Plane, ShoppingBag, CreditCard as CreditCardIcon,
  Hotel, Package, ArrowDownRight, AlertTriangle, Award, TrendingUp, Clock,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import type { CreditCard } from '@/lib/types';

const TYPE_ICONS: Record<string, any> = {
  flight: Plane, hotel: Hotel, transfer: ArrowDownRight,
  cashback: CreditCardIcon, voucher: ShoppingBag, product: Package, fuel: Package,
};

const VARIANT_MAP: Record<string, any> = {
  hdfc: 'obsidian', axis: 'plum', sbi: 'gold', icici: 'navy',
  amex: 'iris', idfc: 'mint', kotak: 'obsidian', indusind: 'plum',
};

export function CardDetailClient({ card }: { card: CreditCard }) {
  const { add, remove, isIn } = useCompare();
  const inCompare = isIn(card.id);
  const [monthlySpend, setMonthlySpend] = useState(50000);

  const annualCalc = useMemo(
    () => calculateAnnualValue(card, { monthly_total_inr: monthlySpend }),
    [card, monthlySpend]
  );

  const cardVariant = VARIANT_MAP[card.bank?.toLowerCase().split(' ')[0]] ?? 'obsidian';

  return (
    // No `page-fade` here: the parent app/(shell)/card/[slug]/page.tsx wraps this in
    // <main className="page-fade">, which already supplies BOTH the fade-in animation
    // (it cascades over this subtree) AND the mobile bottom-tab clearance. Duplicating
    // the class on this nested wrapper double-counted the 72px clearance (176px stack).
    <div>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 60 }}>
        <div className="aurora" style={{ top: -80, right: -120, width: 700, height: 600, background: `radial-gradient(circle,${card.color ?? 'rgba(212,163,115,0.3)'}40,transparent 60%)` }} />
        <div className="aurora" style={{ bottom: -60, left: -80, width: 500, height: 400, background: 'radial-gradient(circle,rgba(196,106,82,0.12),transparent 60%)' }} />

        <div className="shell" style={{ position: 'relative', zIndex: 2 }}>
          <nav aria-label="Breadcrumb" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--ink-3,#5A6A8A)', letterSpacing: '0.05em', marginBottom: 32, fontWeight: 600 }}>
            <Link href="/" style={{ color: 'var(--ink-3,#5A6A8A)', textDecoration: 'none' }}>Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/cards" style={{ color: 'var(--ink-3,#5A6A8A)', textDecoration: 'none' }}>Cards</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/cards?bank=${encodeURIComponent(card.bank)}`} style={{ color: 'var(--ink-3,#5A6A8A)', textDecoration: 'none' }}>{card.bank}</Link>
            <span aria-hidden="true">/</span>
            <span style={{ color: 'var(--ink,#142950)' }}>{card.name}</span>
          </nav>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 'clamp(32px,5vw,64px)', alignItems: 'start' }} className="grid-1-mobile">
            <Reveal>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 12 }}>
                {card.bank} &bull;{' '}
                <span
                  title={isFieldUnverified(card.slug, 'tier') ? 'Being re-verified — our sources disagree on this card’s tier' : undefined}
                  style={isFieldUnverified(card.slug, 'tier') ? { color: 'var(--prov-estimated)' } : undefined}
                >
                  {card.tier?.replace('-', ' ')}{isFieldUnverified(card.slug, 'tier') && <span aria-hidden="true"> · est</span>}
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(32px,5vw,64px)', fontWeight: 800, color: 'var(--ink,#142950)', lineHeight: 1.0, letterSpacing: '-0.03em', margin: '0 0 12px' }}>
                {card.name}
              </h1>
              <p style={{ fontFamily: 'var(--font-serif,Georgia,serif)', fontSize: 'clamp(16px,1.6vw,20px)', color: 'var(--ink-2,#2A3F6B)', fontStyle: 'italic', margin: '0 0 32px' }}>
                {card.best_for}
              </p>

              {/* Metric grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 32 }}>
                <Metric label="Annual Fee" value={card.annual_fee_inr === 0 ? 'FREE' : formatINR(card.annual_fee_inr)} estimated={isFieldUnverified(card.slug, 'annual_fee_inr')} />
                <Metric label="Joining Fee" value={card.joining_fee_inr === 0 ? 'FREE' : formatINR(card.joining_fee_inr)} estimated={isFieldUnverified(card.slug, 'joining_fee_inr')} />
                <Metric label="Base Rate" value={`${card.base_reward_rate}%`} highlight estimated={isFieldUnverified(card.slug, 'base_reward_rate')} />
                <Metric label="Our rating" value={`${card.expert_rating?.toFixed(1) ?? '--'}/10`} highlight />
              </div>
              <p style={{ fontSize: 12, color: 'var(--ink-3,#5A6A8A)', margin: '0 0 32px', lineHeight: 1.5 }}>
                <strong style={{ fontWeight: 600 }}>Our rating</strong> is our own hand-set overall judgment of this card — not a computed score. <a href="/disclosures#rating" style={{ color: 'var(--copper,#8C5F12)', textDecoration: 'underline' }}>How we set it →</a>
              </p>

              {isCardUnverified(card.slug) && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 12, marginBottom: 24, background: 'color-mix(in srgb, var(--copper-3,#D89B2A) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--copper-3,#D89B2A) 28%, transparent)' }}>
                  <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1.5 }}>&#9888;</span>
                  <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink-2,#2A3F6B)' }}>
                    <b style={{ color: 'var(--ink,#142950)' }}>Some details on this card are being re-verified.</b> Our sources disagree on a few figures, so we&apos;d rather flag it than show a number we&apos;re not sure of. Please confirm fees and rewards on the issuer&apos;s site before applying.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a href={`/api/apply/${card.id}`} target="_blank" rel="noopener noreferrer">
                  <CopperCTA>Apply & Earn</CopperCTA>
                </a>
                <GhostCTA onClick={() => (inCompare ? remove(card.id) : add(card.id))}>
                  {inCompare ? '✓ In compare' : '+ Add to compare'}
                </GhostCTA>
              </div>
            </Reveal>

            <Reveal style={{ display: 'flex', justifyContent: 'center' }}>
              <CardArt card={card}>
                <CreditCard3D
                  variant={cardVariant}
                  color={card.color}
                  name={(card.name || 'CARD').toUpperCase()}
                  bank={(card.bank || 'BANK').toUpperCase()}
                  tagline={card.tier || ''}
                  network="VISA"
                />
              </CardArt>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Value Calculator ── */}
      <section style={{ padding: 'clamp(40px,6vw,64px) 0', background: 'var(--paper,#FAF5EB)', borderTop: '1px solid var(--line,rgba(20,41,80,0.08))', borderBottom: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
        <div className="shell">
          <Reveal>
            <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 12 }}>Real Annual Value</div>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 800, color: 'var(--ink,#142950)', margin: '0 0 32px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              What&apos;s it actually worth{' '}
              <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>for you</span>?
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,400px) minmax(0,1fr)', gap: 24, alignItems: 'start' }} className="grid-1-mobile">
              {/* Slider */}
              <div style={{ background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 20, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)' }}>Monthly Spend</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--copper-3,#D89B2A)', fontVariantNumeric: 'tabular-nums' }}>{formatINR(monthlySpend)}</span>
                </div>
                <input type="range" min={5000} max={500000} step={5000} value={monthlySpend}
                  onChange={(e) => setMonthlySpend(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--copper-3,#D89B2A)', marginBottom: 20 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16, borderTop: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                  {[
                    { label: 'Gross rewards', value: formatINRFull(annualCalc.gross_rewards_inr), color: 'var(--ink,#142950)' },
                    { label: 'Annual fee', value: `-${formatINRFull(annualCalc.fee_inr)}`, color: '#B84230' },
                  ].map((row) => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 14, color: 'var(--ink-2,#2A3F6B)' }}>{row.label}</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: row.color }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 12, borderTop: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#142950)' }}>Net annual value</span>
                    <EstimatedValue
                      slug={card.slug}
                      baseColor={annualCalc.net_value_inr > 0 ? '#2d7a56' : '#B84230'}
                      mark={false}
                      style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}
                    >
                      {annualCalc.net_value_inr > 0 ? '+' : ''}{formatINRFull(annualCalc.net_value_inr)}
                    </EstimatedValue>
                  </div>
                  {isCardUnverified(card.slug) && (
                    <p style={{ margin: '10px 0 0', fontSize: 11.5, lineHeight: 1.45, color: 'var(--prov-estimated)' }}>
                      Estimated — computed from figures on this card that are being re-verified.
                    </p>
                  )}
                </div>
                <ReportValue
                  cardSlug={card.slug}
                  surface="card-detail"
                  displayedValueInr={annualCalc.net_value_inr}
                  monthlyTotalInr={monthlySpend}
                />
              </div>

              {/* Breakdown */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 12 }}>Value Breakdown</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(annualCalc.breakdown).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 10 }}>
                      <span style={{ fontSize: 14, color: 'var(--ink,#142950)' }}>{k}</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: (v as number) < 0 ? '#B84230' : '#2d7a56', fontVariantNumeric: 'tabular-nums' }}>
                        {(v as number) < 0 ? '' : '+'}Rs.{Math.abs(v as number).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Highlights & Drawbacks ── */}
      <section style={{ padding: 'clamp(40px,6vw,64px) 0' }}>
        <div className="shell">
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
              <div style={{ background: 'var(--paper,#FAF5EB)', borderRadius: 20, padding: 'clamp(20px,3vw,32px)', border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 20 }}>Highlights</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {card.highlights.map((h, i) => (
                    <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.65 }}>
                      <Award style={{ width: 14, height: 14, color: '#2d7a56', flexShrink: 0, marginTop: 3 }} />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
              {card.drawbacks && card.drawbacks.length > 0 && (
                <div style={{ background: 'var(--paper,#FAF5EB)', borderRadius: 20, padding: 'clamp(20px,3vw,32px)', border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                  <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 20 }}>Drawbacks</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {card.drawbacks.map((d, i) => (
                      <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.65 }}>
                        <AlertTriangle style={{ width: 14, height: 14, color: '#B84230', flexShrink: 0, marginTop: 3 }} />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Redemption Paths ── */}
      <section style={{ padding: 'clamp(40px,6vw,64px) 0', background: 'var(--paper,#FAF5EB)', borderTop: '1px solid var(--line,rgba(20,41,80,0.08))', borderBottom: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
        <div className="shell">
          <Reveal>
            <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 12 }}>Redemption Paths</div>
            <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, color: 'var(--ink,#142950)', margin: '0 0 24px', letterSpacing: '-0.02em' }}>
              Every way to spend your{' '}
              <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>
                {card.reward_currency.replace('-', ' ')}
              </span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {card.redemption_options
                .sort((a, b) => b.value_per_point_inr - a.value_per_point_inr)
                .map((r, i) => {
                  const Icon = TYPE_ICONS[r.type] ?? Package;
                  const isTop = i === 0;
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr auto', gap: 16, alignItems: 'center', padding: '14px 20px', background: isTop ? 'rgba(212,163,115,0.10)' : 'var(--surface,#fff)', border: `1px solid ${isTop ? 'rgba(212,163,115,0.30)' : 'var(--line,rgba(20,41,80,0.08))'}`, borderRadius: 12 }}>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 13, fontWeight: 700, color: 'var(--ink-3,#5A6A8A)', width: 24, textAlign: 'center' }}>{i + 1}</div>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon style={{ width: 16, height: 16, color: 'var(--copper,#8C5F12)' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#142950)', textTransform: 'capitalize' }}>{r.partner || r.type}</div>
                        {(r.best_for || r.notes) && (
                          <div style={{ fontSize: 12, color: 'var(--ink-3,#5A6A8A)', marginTop: 2 }}>{r.best_for || r.notes}</div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: isTop ? 'var(--copper,#8C5F12)' : '#2d7a56', fontVariantNumeric: 'tabular-nums' }}>
                          Rs.{r.value_per_point_inr.toFixed(2)}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3,#5A6A8A)' }}>per point</div>
                      </div>
                    </div>
                  );
                })}
            </div>
            <Link href={`/points-optimizer?card=${card.id}`}>
              <CopperCTA>Optimise my balance →</CopperCTA>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Category Rewards ── */}
      {card.category_rewards.length > 0 && (
        <section style={{ padding: 'clamp(40px,6vw,64px) 0' }}>
          <div className="shell">
            <Reveal>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 12 }}>Reward Rates</div>
              <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, color: 'var(--ink,#142950)', margin: '0 0 24px', letterSpacing: '-0.02em' }}>Earn by category</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
                {card.category_rewards.map((cr, i) => (
                  <div key={i} style={{ background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 6 }}>{cr.category}</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--copper-3,#D89B2A)', fontVariantNumeric: 'tabular-nums' }}>
                      {cr.rate}<span style={{ fontSize: 16, color: 'var(--ink-2,#2A3F6B)' }}>{cr.unit === 'percent' ? '%' : 'X'}</span>
                    </div>
                    {cr.cap_inr_monthly && (
                      <div style={{ fontSize: 11, color: '#B84230', marginTop: 6 }}>Cap: {formatINR(cr.cap_inr_monthly)}/mo</div>
                    )}
                    {cr.notes && (
                      <div style={{ fontSize: 12, color: 'var(--ink-3,#5A6A8A)', marginTop: 6, lineHeight: 1.5 }}>{cr.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Devaluations ── */}
      {card.devaluations && card.devaluations.length > 0 && (
        <section style={{ padding: 'clamp(40px,6vw,64px) 0', background: 'rgba(184,66,48,0.03)', borderTop: '1px solid rgba(184,66,48,0.10)', borderBottom: '1px solid rgba(184,66,48,0.10)' }}>
          <div className="shell">
            <Reveal>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <TrendingUp style={{ width: 18, height: 18, color: '#B84230', transform: 'rotate(180deg)' }} />
                <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#B84230' }}>Devaluation History</div>
              </div>
              <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, color: 'var(--ink,#142950)', margin: '0 0 24px', letterSpacing: '-0.02em' }}>
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: '#B84230', fontStyle: 'italic', fontWeight: 400 }}>Beware</span> — this card has been devalued
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {card.devaluations.map((d, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr auto', gap: 16, alignItems: 'center', padding: '14px 20px', background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 12 }}>
                    <Clock style={{ width: 14, height: 14, color: 'var(--ink-3,#5A6A8A)' }} />
                    <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 12, color: 'var(--ink-2,#2A3F6B)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {new Date(d.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' })}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, color: 'var(--ink,#142950)' }}>{d.description}</div>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3,#5A6A8A)', marginTop: 3 }}>{d.category.replace('-', ' ')}</div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', padding: '3px 10px', borderRadius: 100, background: d.impact === 'high' ? 'rgba(184,66,48,0.10)' : d.impact === 'medium' ? 'rgba(212,163,115,0.15)' : 'rgba(20,41,80,0.06)', color: d.impact === 'high' ? '#B84230' : d.impact === 'medium' ? 'var(--copper,#8C5F12)' : 'var(--ink-3,#5A6A8A)' }}>
                      {d.impact} impact
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}
      {/* ── What creators say — live intelligence ── */}
      <section style={{ padding: 'clamp(40px,6vw,64px) 0' }}>
        <div className="shell">
          <Reveal>
            <WhatCreatorsSay cardSlug={card.slug ?? card.id} />
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: 'clamp(40px,6vw,64px) 0', background: 'var(--paper,#FAF5EB)', borderTop: '1px solid var(--line,rgba(20,41,80,0.08))', borderBottom: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
        <div className="shell">
          <Reveal>
            <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 12 }}>Questions</div>
            <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, color: 'var(--ink,#142950)', margin: '0 0 24px', letterSpacing: '-0.02em' }}>
              Frequently asked{' '}
              <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>questions</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                {
                  q: `What is the annual fee of ${card.name}?`,
                  a: (card.annual_fee_inr ?? 0) === 0
                    ? `${card.name} is a lifetime free card with zero annual fee.`
                    : `The annual fee is ${formatINR(card.annual_fee_inr)} + GST. It may be waived if you meet the annual spend threshold.`,
                },
                {
                  q: `What is the reward rate on ${card.name}?`,
                  a: `${card.name} earns a base rate of ${card.base_reward_rate}%. See the reward-rates section above for category accelerators.`,
                },
                {
                  q: `How to apply for ${card.name}?`,
                  a: `Apply online through ${card.bank}'s website, or use the Apply & Earn button on this page for a direct, unbiased apply link. Eligibility typically needs a credit score of 750+ and income as per bank criteria.`,
                },
              ].map((faq, i) => (
                <div key={i} style={{ background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 12, padding: '18px 20px' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 6 }}>{faq.q}</div>
                  <div style={{ fontSize: 14, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.65 }}>{faq.a}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Explore more — internal links ── */}
      <section style={{ padding: 'clamp(40px,6vw,64px) 0' }}>
        <div className="shell">
          <Reveal>
            <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 16 }}>Explore more</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { href: '/best-cards/travel', label: 'Best Travel Cards' },
                { href: '/best-cards/cashback', label: 'Best Cashback Cards' },
                { href: '/best-cards/dining', label: 'Best Dining Cards' },
                { href: '/best-cards/no-fee', label: 'Lifetime Free Cards' },
                { href: '/spend-optimizer', label: 'Find My Best Card' },
                { href: '/compare', label: 'Compare Cards' },
              ].map((link, i) => (
                <Link key={i} href={link.href} style={{ padding: '8px 16px', background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.12))', borderRadius: 100, fontSize: 13, fontWeight: 600, color: 'var(--ink-2,#2A3F6B)', textDecoration: 'none' }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, highlight, estimated }: { label: string; value: string; highlight?: boolean; estimated?: boolean }) {
  // `estimated` = this figure is being re-verified (our sources disagree). Render
  // it in the estimated-provenance grey, never verified-green/copper, and expose
  // the reason on hover. We show the number, not a blank — the user can still judge.
  return (
    <div style={{ background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-3,#5A6A8A)', marginBottom: 6 }}>{label}</div>
      <div
        title={estimated ? 'Being re-verified — our sources disagree on this figure' : undefined}
        style={{ fontSize: 22, fontWeight: 800, color: estimated ? 'var(--prov-estimated)' : highlight ? 'var(--copper-3,#D89B2A)' : 'var(--ink,#142950)', fontVariantNumeric: 'tabular-nums' }}
      >
        {value}{estimated && <span aria-hidden="true" style={{ fontSize: 12, fontWeight: 700, marginLeft: 4, color: 'var(--prov-estimated)' }}>·&nbsp;est</span>}
      </div>
    </div>
  );
}
