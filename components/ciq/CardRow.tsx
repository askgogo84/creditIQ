// components/ciq/CardRow.tsx
'use client';

/**
 * A single held card row (bank monogram · name · verified/estimated badge · points).
 *
 * `variant` (wallet migration): 'light' = white/copper light system (the migrated
 * wallet). 'gold' (default) = the retired [data-ciq] gold tokens/classes, kept
 * UNCHANGED so my-cards (still a gold [data-ciq] surface) renders pixel-identical.
 * When my-cards migrates, flip callers to 'light' and delete the gold branch
 * (see docs/wallet/06-Implementation-Plan Follow-on task).
 */
export function CardRow({
  bank, cardName, last4, points, currency, source, monogram, onClick, variant = 'gold',
}: {
  bank: string; cardName: string; last4?: string; points: number;
  currency?: string; source: 'statement' | 'manual'; monogram?: string;
  onClick?: () => void; variant?: 'light' | 'gold';
}) {
  const verified = source === 'statement';
  const mono = monogram || bank.slice(0, 2).toUpperCase();
  const light = variant === 'light';

  // token set per variant — 'gold' reproduces the pre-migration values exactly.
  const t = light
    ? {
        panel: 'var(--surface)', line: 'var(--line)', ink: 'var(--ink)', ink2: 'var(--ink-2)', ink3: 'var(--ink-3)',
        monoInk: 'var(--copper)', monoBg: 'color-mix(in srgb,var(--copper-3) 9%, var(--surface))',
        monoLine: 'color-mix(in srgb,var(--copper-3) 28%, transparent)',
        verified: 'var(--prov-verified)', verifiedBg: 'color-mix(in srgb,var(--prov-verified) 13%,transparent)',
        displayCls: 'w-display', monoCls: 'mono',
      }
    : {
        panel: 'var(--ciq-panel)', line: 'var(--ciq-line)', ink: 'var(--ciq-ink)', ink2: 'var(--ciq-ink-2)', ink3: 'var(--ciq-ink-3)',
        monoInk: 'var(--ciq-gold-2)', monoBg: 'var(--ciq-card-metal)',
        monoLine: 'var(--ciq-gold-line)',
        verified: 'var(--ciq-verified)', verifiedBg: 'color-mix(in srgb,var(--ciq-verified) 13%,transparent)',
        displayCls: 'ciq-display', monoCls: 'ciq-mono',
      };

  return (
    <div onClick={onClick} style={{
      borderRadius: 18, padding: '15px 16px', background: t.panel,
      border: `1px solid ${t.line}`, display: 'flex', alignItems: 'center', gap: 13,
      transition: 'transform .18s cubic-bezier(.34,1.56,.64,1)', cursor: onClick ? 'pointer' : 'default',
    }}
    onMouseDown={e => (e.currentTarget.style.transform = 'scale(.98)')}
    onMouseUp={e => (e.currentTarget.style.transform = 'none')}
    onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
      <div style={{
        width: 42, height: 42, borderRadius: 12, flex: '0 0 auto', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: t.monoInk,
        fontWeight: 700, fontSize: 12, background: t.monoBg, border: `1px solid ${t.monoLine}`,
      }}>{mono}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: '-.01em', color: t.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {cardName}
        </div>
        <div className={t.monoCls} style={{ fontSize: 10, color: t.ink3, marginTop: 3, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{
            fontSize: 8.5, fontWeight: 700, letterSpacing: '.04em', padding: '2px 6px', borderRadius: 5,
            color: verified ? t.verified : t.ink2,
            background: verified ? t.verifiedBg : t.line,
          }}>{verified ? 'Verified' : 'Estimated'}</span>
          {last4 ? `·${last4}` : ''} {verified ? '/ statement' : '/ manual'}
        </div>
      </div>

      <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
        <div className={t.displayCls} style={{ fontWeight: 600, fontSize: 18, color: t.ink }}>{points.toLocaleString('en-IN')}</div>
        <div className={t.monoCls} style={{ fontSize: 9, color: t.ink3, marginTop: 1 }}>{currency || 'Reward Pts'}</div>
      </div>
    </div>
  );
}
