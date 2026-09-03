// components/ciq/BestMove.tsx
'use client';
import Link from 'next/link';
import { EstimateRange } from './EstimateRange';

export function BestMove({
  title, detail, points, estLow, estHigh, href, flag, variant = 'gold', balancesHidden = false,
}: {
  title: string; detail: string; points: number; estLow: number; estHigh: number; href: string; flag?: string;
  variant?: 'light' | 'gold'; balancesHidden?: boolean;
}) {
  const light = variant === 'light';
  return (
    <div className={light ? 'w-rise d3 wallet-best-move' : 'ciq-rise d3'} style={{
      margin: light ? 0 : '0 20px', borderRadius: 22, padding: light ? 0 : 1,
      background: light ? 'linear-gradient(145deg, var(--surface), color-mix(in srgb,var(--copper-3) 14%,var(--surface)))' : 'linear-gradient(135deg,var(--ciq-gold),transparent 55%)',
      boxShadow: light ? 'var(--shadow-sm)' : '0 16px 40px -24px var(--ciq-glow)',
      border: light ? '1px solid color-mix(in srgb,var(--copper-3) 35%,var(--line))' : 'none',
    }}>
      <div style={{ borderRadius: 21, background: light ? 'transparent' : 'var(--ciq-panel)', padding: light ? 24 : 18, color: light ? 'var(--ink)' : undefined }}>
        {flag && (
          <span className="ciq-mono" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, letterSpacing: '.06em',
            textTransform: 'uppercase', color: light ? 'var(--copper)' : 'var(--ciq-gold-2)', background: light ? 'color-mix(in srgb,var(--copper-3) 12%,transparent)' : 'var(--ciq-gold-soft)',
            border: `1px solid ${light ? 'color-mix(in srgb,var(--copper-3) 35%,transparent)' : 'var(--ciq-gold-line)'}`, padding: '4px 8px', borderRadius: 6,
          }}>◆ {flag}</span>
        )}
        <div className="ciq-display" style={{ fontWeight: 600, fontSize: 18, lineHeight: 1.25, marginTop: 12, letterSpacing: '-.01em' }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: light ? 'var(--ink-3)' : 'var(--ciq-ink-3)', marginTop: 6, lineHeight: 1.45 }}>{detail}</div>
        {/* Lead with the REAL point count (points-first, consistent with the HeroGauge
            headline). The rupee value is only ever the labelled ESTIMATE RANGE below,
            shared with the gauge — never a single figure asserted as fact. */}
        <div style={{ marginTop: 16 }}>
          <div className="ciq-display" style={{ fontWeight: 700, fontSize: 30, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {balancesHidden ? '••••••' : points.toLocaleString('en-IN')}
            <span style={{ fontSize: 15, color: light ? 'var(--copper)' : 'var(--ciq-gold-2)', marginLeft: 6 }}>pts</span>
          </div>
          <div style={{ marginTop: 10 }}>
            {balancesHidden ? <span style={{ color: light ? 'var(--ink-3)' : 'var(--ciq-ink-3)', fontSize: 12 }}>Estimated value hidden</span> : <EstimateRange low={estLow} high={estHigh} variant={light ? 'light' : 'gold'} />}
          </div>
        </div>
        <Link href={href} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, padding: 13,
          borderRadius: 13, background: light ? 'var(--ink)' : 'linear-gradient(135deg,var(--ciq-gold-2),var(--ciq-gold))',
          color: light ? 'var(--surface)' : '#1a1710', fontWeight: 700, fontSize: 13.5, textDecoration: 'none',
        }}>Show me exactly how →</Link>
      </div>
    </div>
  );
}
