// components/ciq/EstimateRange.tsx
'use client';

/**
 * The one honest way CreditIQ shows a rupee value: a clearly-labelled ESTIMATE
 * RANGE (≈ ₹low–₹high) with an "estimate" badge — never a single figure stated
 * as fact, never verified-green. Shared by the HeroGauge footer and BestMove so
 * the format can never drift between the two. One number, one meaning.
 * See docs/dashboard-data-audit.md §1.
 *
 * `variant` (wallet migration): 'light' = white/copper light system tokens
 * (the migrated wallet / HeroGauge). 'gold' (default) = the retired [data-ciq]
 * gold tokens, kept so BestMove — still rendered in a transitional gold island
 * until Implementation-Plan Step 6 — renders correctly with no change. Remove
 * the 'gold' branch with the gold cleanup (Follow-on task).
 */
export function EstimateRange({ low, high, variant = 'gold' }: { low: number; high: number; variant?: 'light' | 'gold' }) {
  const light = variant === 'light';
  const ink2 = light ? 'var(--ink-2)' : 'var(--ciq-ink-2)';
  // Badge text: --ink-2, matching CardRow's "Estimated" badge and clearing AA on
  // the badge's translucent wash in BOTH themes. (--prov-estimated is tuned for the
  // page --bg, not the lighter surface panel + wash — it drops to ~3.6:1 in dark.)
  const est = light ? 'var(--ink-2)' : 'var(--ciq-estimated)';
  const line = light ? 'var(--line)' : 'var(--ciq-line)';
  const line2 = light ? 'var(--line-strong)' : 'var(--ciq-line-2)';
  const monoCls = light ? 'mono' : 'ciq-mono';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: ink2 }}>
        ≈ ₹{low.toLocaleString('en-IN')}–₹{high.toLocaleString('en-IN')}
      </div>
      <span className={monoCls} title="Point values vary by how you redeem. We never state a value as fact."
        style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase',
          color: est, background: line, border: `1px solid ${line2}`,
          padding: '2px 6px', borderRadius: 5 }}>
        estimate
      </span>
    </div>
  );
}
