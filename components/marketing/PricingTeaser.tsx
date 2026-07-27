import Link from 'next/link';

// One-time pricing (PRD §4.3) — NOT a subscription. Amounts in the data face (mono).
const MONO = 'var(--font-jbmono), ui-monospace, monospace';

const PLANS = [
  { name: '6 months', price: '₹499', note: null as string | null, best: false },
  { name: '12 months', price: '₹799', note: 'Best value', best: true },
];

export function PricingTeaser() {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8A93A3', marginBottom: 8 }}>
        Pricing
      </div>
      <h2 style={{ fontFamily: 'var(--font-clash), system-ui, sans-serif', fontSize: 'clamp(28px,5vw,44px)', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 6px', color: '#F5F0E8' }}>
        Pay once. Not a subscription.
      </h2>
      <p style={{ margin: '0 0 28px', color: '#9AA3B2', fontSize: 15, lineHeight: 1.55, maxWidth: 520 }}>
        Indian cards fight recurring international charges. So there aren&rsquo;t any — renew when you want.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {PLANS.map((p) => (
          <div
            key={p.name}
            style={{
              flex: '1 1 200px',
              maxWidth: 260,
              background: p.best ? 'rgba(201,151,46,0.08)' : 'rgba(245,240,232,0.04)',
              border: `1px solid ${p.best ? 'var(--prov-cached)' : 'rgba(245,240,232,0.14)'}`,
              borderRadius: 18,
              padding: 24,
            }}
          >
            {p.note && (
              <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--prov-cached)', border: '1px solid color-mix(in srgb, var(--prov-cached) 30%, transparent)', background: 'color-mix(in srgb, var(--prov-cached) 12%, transparent)', padding: '2px 8px', borderRadius: 100, marginBottom: 12 }}>
                {p.note}
              </div>
            )}
            <div style={{ fontSize: 13, color: '#9AA3B2', marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontFamily: MONO, fontVariantNumeric: 'tabular-nums', fontSize: 40, fontWeight: 700, color: '#F5F0E8', letterSpacing: '-0.02em' }}>{p.price}</div>
            <div style={{ fontSize: 12, color: '#8A93A3', marginTop: 4 }}>one-time</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, fontSize: 13, color: '#8A93A3' }}>
        + 1-on-1 consultation add-on{' '}
        <span style={{ fontFamily: MONO, color: '#C7CDD6' }}>₹999</span>{' '}
        <span style={{ textDecoration: 'line-through', color: '#4A5568' }}>₹1,499</span>
      </div>

      <Link
        href="/plans"
        style={{ display: 'inline-block', marginTop: 24, padding: '12px 24px', borderRadius: 100, background: 'var(--prov-cached)', color: '#0E1420', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
      >
        See plans →
      </Link>
    </div>
  );
}
