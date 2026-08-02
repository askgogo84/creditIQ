// components/ciq/EstimateRange.tsx
'use client';

/**
 * The one honest way CreditIQ shows a rupee value: a clearly-labelled ESTIMATE
 * RANGE (≈ ₹low–₹high) with an "estimate" badge — never a single figure stated
 * as fact, never verified-green. Shared by the HeroGauge footer and BestMove so
 * the format can never drift between the two. One number, one meaning.
 * See docs/dashboard-data-audit.md §1.
 */
export function EstimateRange({ low, high }: { low: number; high: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ciq-ink-2)' }}>
        ≈ ₹{low.toLocaleString('en-IN')}–₹{high.toLocaleString('en-IN')}
      </div>
      <span className="ciq-mono" title="Point values vary by how you redeem. We never state a value as fact."
        style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase',
          color: 'var(--ciq-estimated)', background: 'var(--ciq-line)', border: '1px solid var(--ciq-line-2)',
          padding: '2px 6px', borderRadius: 5 }}>
        estimate
      </span>
    </div>
  );
}
