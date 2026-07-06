// components/ciq/BestMove.tsx
'use client';
import Link from 'next/link';

export function BestMove({
  title, detail, unlockedValue, vsLabel, href, flag,
}: {
  title: string; detail: string; unlockedValue: string; vsLabel: string; href: string; flag?: string;
}) {
  return (
    <div className="ciq-rise d3" style={{
      margin: '0 20px', borderRadius: 22, padding: 1,
      background: 'linear-gradient(135deg,var(--ciq-gold),transparent 55%)',
      boxShadow: '0 16px 40px -24px var(--ciq-glow)',
    }}>
      <div style={{ borderRadius: 21, background: 'var(--ciq-panel)', padding: 18 }}>
        {flag && (
          <span className="ciq-mono" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, letterSpacing: '.06em',
            textTransform: 'uppercase', color: 'var(--ciq-gold-2)', background: 'var(--ciq-gold-soft)',
            border: '1px solid var(--ciq-gold-line)', padding: '4px 8px', borderRadius: 6,
          }}>◆ {flag}</span>
        )}
        <div className="ciq-display" style={{ fontWeight: 600, fontSize: 18, lineHeight: 1.25, marginTop: 12, letterSpacing: '-.01em' }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ciq-ink-3)', marginTop: 6, lineHeight: 1.45 }}>{detail}</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16 }}>
          <div className="ciq-display" style={{ fontWeight: 700, fontSize: 30, lineHeight: 1, color: 'var(--ciq-verified)' }}>{unlockedValue}</div>
          <div className="ciq-mono" style={{ fontSize: 10, color: 'var(--ciq-ink-3)', textAlign: 'right', lineHeight: 1.4 }}>{vsLabel}</div>
        </div>
        <Link href={href} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, padding: 13,
          borderRadius: 13, background: 'linear-gradient(135deg,var(--ciq-gold-2),var(--ciq-gold))',
          color: '#1a1710', fontWeight: 700, fontSize: 13.5, textDecoration: 'none',
        }}>Show me exactly how →</Link>
      </div>
    </div>
  );
}
