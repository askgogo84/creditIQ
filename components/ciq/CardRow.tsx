// components/ciq/CardRow.tsx
'use client';

export function CardRow({
  bank, cardName, last4, points, currency, source, monogram, onClick,
}: {
  bank: string; cardName: string; last4?: string; points: number;
  currency?: string; source: 'statement' | 'manual'; monogram?: string; onClick?: () => void;
}) {
  const verified = source === 'statement';
  const mono = monogram || bank.slice(0, 2).toUpperCase();
  return (
    <div onClick={onClick} style={{
      borderRadius: 18, padding: '15px 16px', background: 'var(--ciq-panel)',
      border: '1px solid var(--ciq-line)', display: 'flex', alignItems: 'center', gap: 13,
      transition: 'transform .18s cubic-bezier(.34,1.56,.64,1)', cursor: onClick ? 'pointer' : 'default',
    }}
    onMouseDown={e => (e.currentTarget.style.transform = 'scale(.98)')}
    onMouseUp={e => (e.currentTarget.style.transform = 'none')}
    onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
      <div style={{
        width: 42, height: 42, borderRadius: 12, flex: '0 0 auto', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: 'var(--ciq-gold-2)',
        fontWeight: 700, fontSize: 12, background: 'var(--ciq-card-metal)', border: '1px solid var(--ciq-gold-line)',
      }}>{mono}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: '-.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {cardName}
        </div>
        <div className="ciq-mono" style={{ fontSize: 10, color: 'var(--ciq-ink-3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{
            fontSize: 8.5, fontWeight: 700, letterSpacing: '.04em', padding: '2px 6px', borderRadius: 5,
            color: verified ? 'var(--ciq-verified)' : 'var(--ciq-ink-2)',
            background: verified ? 'color-mix(in srgb,var(--ciq-verified) 13%,transparent)' : 'var(--ciq-line)',
          }}>{verified ? 'Verified' : 'Estimated'}</span>
          {last4 ? `·${last4}` : ''} {verified ? '/ statement' : '/ manual'}
        </div>
      </div>

      <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
        <div className="ciq-display" style={{ fontWeight: 600, fontSize: 18 }}>{points.toLocaleString('en-IN')}</div>
        <div className="ciq-mono" style={{ fontSize: 9, color: 'var(--ciq-ink-3)', marginTop: 1 }}>{currency || 'Reward Pts'}</div>
      </div>
    </div>
  );
}
