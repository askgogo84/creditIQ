import type { Metadata } from 'next';
import Link from 'next/link';

// STUB (Phase 2) — the plans/checkout page is fleshed out in Slice C (paywall +
// Razorpay one-time). This exists so the landing's pricing CTA resolves. One-time
// pricing only (PRD §4.3). Local ink ground, like the landing.
export const metadata: Metadata = { title: 'Plans | CreditIQ' };

const MONO = 'var(--font-jbmono), ui-monospace, monospace';
const clash = 'var(--font-clash), system-ui, sans-serif';

const PLANS = [
  { name: '6 months', price: '₹499', best: false },
  { name: '12 months', price: '₹799', best: true },
];

export default function PlansPage() {
  return (
    <main style={{ background: 'var(--bg-deep, #0E1420)', color: '#C7CDD6', minHeight: '100vh', fontFamily: 'var(--font-satoshi), system-ui, sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(56px,10vw,120px) clamp(20px,5vw,48px)' }}>
        <Link href="/landing" style={{ fontSize: 13, color: '#8A93A3', textDecoration: 'none' }}>← Back</Link>
        <h1 style={{ fontFamily: clash, fontSize: 'clamp(32px,6vw,52px)', fontWeight: 600, letterSpacing: '-0.02em', margin: '16px 0 8px', color: '#F5F0E8' }}>
          Pay once. Renew when you want.
        </h1>
        <p style={{ color: '#9AA3B2', fontSize: 16, lineHeight: 1.6, margin: '0 0 36px' }}>
          One-time — not a subscription. Free gives you estimates; paid verifies them from your real statements.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {PLANS.map((p) => (
            <div key={p.name} style={{ flex: '1 1 220px', maxWidth: 300, background: p.best ? 'rgba(201,151,46,0.08)' : 'rgba(245,240,232,0.04)', border: `1px solid ${p.best ? 'var(--prov-cached)' : 'rgba(245,240,232,0.14)'}`, borderRadius: 18, padding: 28 }}>
              {p.best && <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--prov-cached)', marginBottom: 12 }}>Best value</div>}
              <div style={{ fontSize: 14, color: '#9AA3B2', marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontFamily: MONO, fontVariantNumeric: 'tabular-nums', fontSize: 48, fontWeight: 700, color: '#F5F0E8' }}>{p.price}</div>
              <div style={{ fontSize: 12, color: '#8A93A3' }}>one-time</div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 28, fontSize: 13, color: '#8A93A3' }}>Checkout wiring lands with the paywall slice. This is a stub.</p>
      </div>
    </main>
  );
}
