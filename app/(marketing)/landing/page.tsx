import type { Metadata } from 'next';
import Link from 'next/link';
import { AmbientHero } from '@/components/marketing/AmbientHero';
import { HeroLeak } from '@/components/marketing/HeroLeak';
import { LiveDemo } from '@/components/marketing/LiveDemo';
import { WhatsLive } from '@/components/marketing/WhatsLive';
import { PricingTeaser } from '@/components/marketing/PricingTeaser';

export const metadata: Metadata = {
  title: 'Your cards leak money every year | CreditIQ',
  description:
    "Most Indian credit cards quietly leak ₹1L+ a year in missed rewards. See the range from every card's published earn rules — statement-verified from your real spend, coming soon.",
};

// NOTE: local ink ground only. The page opts into --bg-deep as its own background;
// --ink / --paper / --navy are NOT inverted app-wide (that's the deferred Phase-2
// token inversion, issue #3). No other page's appearance changes. This is also the
// first surface that uses the Phase-1 fonts (Clash / Satoshi / JBMono).
const shell: React.CSSProperties = {
  background: 'var(--bg-deep, #0E1420)',
  color: '#C7CDD6',
  fontFamily: 'var(--font-satoshi), system-ui, sans-serif',
  minHeight: '100vh',
};

const section: React.CSSProperties = {
  maxWidth: 1080,
  margin: '0 auto',
  padding: '0 clamp(20px, 5vw, 48px)',
};

export default function LandingPage() {
  return (
    <main style={shell}>
      {/* ── HERO ── */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <AmbientHero />
        <div style={{ ...section, position: 'relative', zIndex: 1, paddingTop: 'clamp(72px, 12vw, 140px)', paddingBottom: 'clamp(56px, 9vw, 104px)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--prov-cached)', marginBottom: 20 }}>
            Live · India
          </div>
          <HeroLeak />
          <p style={{ maxWidth: 520, margin: '28px 0 0', fontSize: 'clamp(16px, 1.6vw, 19px)', lineHeight: 1.6, color: '#9AA3B2' }}>
            That range comes from each card&rsquo;s published earn rules &mdash; real math, not a
            self-reported guess. Statement upload is coming, so you&rsquo;ll soon replace the estimate
            with your{' '}
            <span style={{ color: 'var(--prov-verified)', fontWeight: 600 }}>real spend</span>.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 32 }}>
            <Link href="/login" style={{ padding: '14px 26px', borderRadius: 100, background: 'var(--prov-cached)', color: '#0E1420', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>
              Find my leak →
            </Link>
            <a href="#live-demo" style={{ padding: '14px 26px', borderRadius: 100, background: 'transparent', color: '#F5F0E8', border: '1px solid rgba(245,240,232,0.22)', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>
              See what&rsquo;s live
            </a>
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO (proof artifact) ── */}
      <section style={{ ...section, paddingTop: 'clamp(40px,7vw,72px)', paddingBottom: 'clamp(40px,7vw,72px)' }}>
        <LiveDemo />
      </section>

      {/* ── WHAT'S LIVE ── */}
      <section style={{ ...section, paddingTop: 'clamp(40px,7vw,72px)', paddingBottom: 'clamp(40px,7vw,72px)' }}>
        <WhatsLive />
      </section>

      {/* ── PRICING TEASER ── */}
      <section style={{ ...section, paddingTop: 'clamp(40px,7vw,72px)', paddingBottom: 'clamp(64px,10vw,112px)' }}>
        <PricingTeaser />
      </section>
    </main>
  );
}
