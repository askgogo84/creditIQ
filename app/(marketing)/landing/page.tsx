import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/marketing/landing/SiteNav';
import { RailNav } from '@/components/marketing/landing/RailNav';
import { SpendProvider } from '@/components/marketing/landing/SpendContext';
import { HeroCompute } from '@/components/marketing/landing/HeroCompute';
import { HeroProof } from '@/components/marketing/landing/HeroProof';
import { AmbientHero } from '@/components/marketing/AmbientHero';
import { FaresBoard } from '@/components/marketing/landing/FaresBoard';
import { CardRankings } from '@/components/marketing/landing/CardRankings';

// ─────────────────────────────────────────────────────────────────────────────
// CreditIQ landing — built to the Tokens file ("CreditIQ Tokens.dc.html"), Type A.
//   · Fixed Amex-Platinum palette (literal hexes from the token sheet), NOT the
//     app's theme tokens — this page does not follow the light/dark toggle.
//   · Type A: Fraunces 300 display with ONE italic emphasis word per headline,
//     Inter body, JetBrains Mono for every figure. Fonts loaded below via Google.
//   · No shadows anywhere. 1px copper hairline rgba(216,155,42,.6) at the top of
//     every section. 44px tap targets / 48px primary CTAs. Section padding
//     clamp(56,7vw,96) working · clamp(88,11vw,150) aspiration. 375px primary,
//     no media queries (grids collapse via auto-fit minmax; rows wrap).
//   · Every figure is real: hero range + rankings from the engine, fares from
//     /api/fares. No fabricated numbers, no PricingTeaser (Pricing → /plans in
//     the header). Statement upload is a LIVE item, not coming-soon.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'CreditIQ — compute what your cards are worth',
  description:
    "Every rupee carries its source. See what your Indian credit cards actually earn — computed from published earn rules, valued at cached fares, and verified from your own statements. We don't guess your money.",
};

const FR = "'Fraunces', Georgia, serif";
const IN = "'Inter', system-ui, sans-serif";
const MO = "'JetBrains Mono', ui-monospace, monospace";

const HAIRLINE = '1px solid rgba(216,155,42,.6)'; // copper section boundary

const inner: React.CSSProperties = {
  width: '100%',
  maxWidth: 1200,
  margin: '0 auto',
  padding: '0 20px',
};

const WORK_PAD = 'clamp(56px,7vw,96px) 0'; // working sections
const ASPIRE_TOP = 'clamp(88px,11vw,150px)'; // aspiration sections

// Eyebrow ("LIVE — INDIA" style) — a label, a hairline rule, a second word.
function Eyebrow({ a, b, dark = false }: { a: string; b: string; dark?: boolean }) {
  const c = dark ? '#e8b45c' : '#6b6b6d';
  const rule = dark ? 'rgba(232,180,92,.45)' : 'rgba(107,107,109,.35)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: IN, fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: c }}>
      <span>{a}</span>
      <span style={{ height: 1, flex: '0 1 84px', background: rule }} />
      <span>{b}</span>
    </div>
  );
}

// Provenance pill (semantic-only colours).
const PROV = {
  verified: { bg: 'rgba(18,183,106,.12)', bd: 'rgba(18,183,106,.38)', fg: '#0b7a47', dot: '#12B76A' },
  cached: { bg: 'rgba(185,139,31,.14)', bd: 'rgba(185,139,31,.42)', fg: '#8a6a12', dot: '#B98B1F' },
  estimated: { bg: 'rgba(107,107,109,.1)', bd: 'rgba(107,107,109,.3)', fg: '#5b6169', dot: '#9aa2ad' },
} as const;

function Pill({ kind, label }: { kind: keyof typeof PROV; label: string }) {
  const p = PROV[kind];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: p.bg, border: `1px solid ${p.bd}`, fontFamily: IN, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: p.fg, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: p.dot }} />
      {label}
    </span>
  );
}

// Real "what's shipped" figures — no placeholders.
const PRODUCTS = [
  { no: '01', title: 'Value engine', body: 'Every card scored from its published earn rules — category caps, milestones, exclusions, all of it.', figure: '162 cards · 36 banks · 49 with computed values', pill: 'estimated' as const, href: '/cards' },
  { no: '02', title: 'Cached fare index', body: 'Lowest cash fare on the corridors Indian points actually pay for, refreshed daily and stamped with its age.', figure: '5 corridors', pill: 'cached' as const, href: '/flights' },
  { no: '03', title: 'Statement Truth', body: 'Upload a statement and your real category mix replaces our model. Figures switch from estimated to verified — live today.', figure: 'your spend', pill: 'verified' as const, href: '/statement-truth' },
  { no: '04', title: 'Redemption paths', body: 'Transfer ratios and award charts, shown as maths you can check line by line.', figure: '₹ / point', pill: 'estimated' as const, href: '/points-optimizer' },
];

// Coming, with no dates promised — statement upload is deliberately NOT here (it ships today).
const SOON = [
  'Devaluation watch on transfer partners',
  'Award-seat availability, cached like fares',
  'Multi-card portfolio optimiser',
  'Hotel points, once we can cite the rates',
];

const h2Cream: React.CSSProperties = { fontFamily: FR, fontWeight: 300, fontSize: 'clamp(30px,4vw,54px)', lineHeight: 1.08, letterSpacing: '-0.015em', color: '#142335', margin: '16px 0 0', maxWidth: '22ch', textWrap: 'pretty' };
const h2Dark: React.CSSProperties = { fontFamily: FR, fontWeight: 300, fontSize: 'clamp(32px,4.6vw,62px)', lineHeight: 1.06, letterSpacing: '-0.015em', color: '#f7f4ef', margin: '18px 0 0', maxWidth: '19ch', textWrap: 'pretty' };
const leadCream: React.CSSProperties = { fontFamily: IN, fontSize: 17, lineHeight: 1.6, color: '#2b385c', maxWidth: '56ch', margin: '14px 0 0' };
const emCream: React.CSSProperties = { fontStyle: 'italic', color: '#c2871f' };
const emDark: React.CSSProperties = { fontStyle: 'italic', color: '#e8b45c' };

const ctaPrimary: React.CSSProperties = { minHeight: 48, display: 'inline-flex', alignItems: 'center', gap: 12, padding: '0 26px', borderRadius: 999, background: '#D89B2A', color: '#12203a', fontFamily: IN, fontSize: 15, fontWeight: 600, textDecoration: 'none' };
const ctaGhost: React.CSSProperties = { minHeight: 48, display: 'inline-flex', alignItems: 'center', padding: '0 26px', borderRadius: 999, background: 'transparent', border: '1px solid rgba(255,255,255,.45)', color: '#f7f4ef', fontFamily: IN, fontSize: 15, fontWeight: 500, textDecoration: 'none' };

export default function LandingPage() {
  return (
    <main style={{ background: '#fbf8f3', color: '#142335', fontFamily: IN }}>
      {/* Type A fonts — Fraunces (display + italic), Inter (body), JetBrains Mono (figures) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
        rel="stylesheet"
      />

      <SiteNav />
      <RailNav />

      <SpendProvider>
        {/* ── 01 · HERO (dark cinematic; .cinematic supplies light inks) ── */}
        <section
          id="top"
          className="cinematic"
          style={{
            position: 'relative',
            background: '#0f1620',
            overflow: 'hidden',
            // Fill the first screen (nav is a 64px sticky row above it) so the footage
            // reads as the hero, not a band.
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            alignItems: 'center',
            paddingTop: ASPIRE_TOP,
            paddingBottom: 'clamp(72px,9vw,110px)',
            // AmbientHero's bottom dissolve melts into the NEXT section's sand ground
            // (#f1ece4). This page is fixed-palette, so point the dissolve token at it.
            ['--page-bg-rgb' as any]: '241, 236, 228',
          }}
        >
          {/* Full-bleed licensed footage (cabin window) + the scrim tuned against the
              real frames. Sits at z-index 0; all copy is z-index 1 above it. */}
          <AmbientHero />
          <div style={{ ...inner, position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))', gap: 48, alignItems: 'center' }}>
            <div style={{ minWidth: 0 }}>
              <Eyebrow a="Live" b="India" dark />
              <HeroCompute />
              <p style={{ fontFamily: IN, fontSize: 16.5, lineHeight: 1.65, color: 'rgba(247,244,239,.74)', maxWidth: '46ch', margin: '24px 0 0' }}>
                That range is computed from each card&rsquo;s published earn rules &mdash; real math, not a
                self-reported guess. Link a statement and Statement Truth turns the estimate into your{' '}
                <span style={{ color: '#6fd3a0', fontWeight: 600 }}>verified</span> spend, today.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28 }}>
                <Link href="/login" style={ctaPrimary}>
                  Compute my cards<span style={{ fontFamily: MO }}>&rarr;</span>
                </Link>
                <Link href="#fares" style={ctaGhost}>
                  See the method
                </Link>
              </div>
            </div>
            <HeroProof />
          </div>
        </section>

      {/* ── 02 · LIVE FARES (sand band) ── */}
      <section id="fares" style={{ background: '#f1ece4', borderTop: HAIRLINE, padding: WORK_PAD }}>
        <div style={inner}>
          <Eyebrow a="Live fares" b="Cached" />
          <h2 style={h2Cream}>
            One price, one age stamp, one <em style={emCream}>source</em>.
          </h2>
          <p style={leadCream}>
            We cache the lowest cash fare on the corridors Indian points actually pay for. Nothing here is a
            live quote, and we never pretend it is.
          </p>
          <FaresBoard />
        </div>
      </section>

      {/* ── 03 · WHERE POINTS GO (dark break — full-bleed two-column: copy left, image right) ──
          Matches the comp's break section: a grid of auto-fit,minmax(340px,1fr) so the copy
          column carries its own padding and the image bleeds to the right edge. Collapses to
          one column below ~680px, image below the copy (DOM order). */}
      <section
        id="where"
        style={{
          position: 'relative',
          background: '#0f1620',
          borderTop: HAIRLINE,
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))',
        }}
      >
        <div style={{ padding: 'clamp(72px,9vw,124px) clamp(20px,5vw,72px)' }}>
          <Eyebrow a="Where points" b="Can go" dark />
          <h2 style={h2Dark}>
            The same balance is a <em style={emDark}>lie-flat</em> seat, or a ₹4,000 voucher.
          </h2>
          <p style={{ fontFamily: IN, fontSize: 18, lineHeight: 1.65, color: 'rgba(247,244,239,.76)', maxWidth: '52ch', margin: '22px 0 0' }}>
            Where your points land decides what they&rsquo;re worth — a premium-cabin transfer or a catalogue
            voucher can differ by an order of magnitude. We show the redemption paths and where each rate came
            from, so you compare real numbers instead of a single blended guess.
          </p>
          <Link href="/points-optimizer" style={{ ...ctaPrimary, marginTop: 40 }}>
            Find the paths for my points<span style={{ fontFamily: MO }}>&rarr;</span>
          </Link>
        </div>
        <div style={{ position: 'relative', minHeight: 'clamp(320px,40vw,580px)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/where-points.jpg"
            alt="Aerial view of a tropical island — turquoise water, palms, and overwater villas"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(15,22,32,.55),rgba(15,22,32,.05))', pointerEvents: 'none' }} />
        </div>
      </section>

      {/* ── 04 · WHAT YOU GET TODAY (cream) ── */}
      <section id="today" style={{ background: '#fbf8f3', borderTop: HAIRLINE, padding: WORK_PAD }}>
        <div style={inner}>
          <Eyebrow a="What you get" b="Today" />
          <h2 style={h2Cream}>
            Shipped, and <em style={emCream}>labelled</em>.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(255px,1fr))', gap: 16, marginTop: 34 }}>
            {PRODUCTS.map((p) => (
              <Link
                key={p.no}
                href={p.href}
                style={{ background: '#ffffff', border: '1px solid #e5d9cc', borderRadius: 16, padding: 26, display: 'flex', flexDirection: 'column', gap: 12, textDecoration: 'none', color: 'inherit' }}
              >
                <span style={{ fontFamily: MO, fontSize: 12, fontWeight: 500, color: '#D89B2A', letterSpacing: '0.06em' }}>{p.no}</span>
                <h3 style={{ fontFamily: FR, fontWeight: 400, fontSize: 22, lineHeight: 1.2, color: '#142335', margin: 0 }}>{p.title}</h3>
                <p style={{ fontFamily: IN, fontSize: 14.5, lineHeight: 1.6, color: '#2b385c', margin: 0 }}>{p.body}</p>
                <div style={{ marginTop: 'auto', paddingTop: 14, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderTop: '1px solid #f1ece4' }}>
                  <span style={{ fontFamily: MO, fontSize: 15, color: '#142335' }}>{p.figure}</span>
                  <Pill kind={p.pill} label={p.pill.charAt(0).toUpperCase() + p.pill.slice(1)} />
                </div>
              </Link>
            ))}
          </div>

          {/* Coming, with no dates promised — statement upload deliberately excluded */}
          <div style={{ marginTop: 22, border: '1px dashed #ddd0c0', borderRadius: 16, padding: 'clamp(22px,3vw,30px)', background: '#f1ece4' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <h3 style={{ fontFamily: FR, fontWeight: 400, fontSize: 21, color: '#142335', margin: 0 }}>Coming, with no dates promised</h3>
              <span style={{ fontFamily: IN, fontSize: 12, color: '#6b6b6d' }}>we don&rsquo;t ship roadmaps as features</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12, marginTop: 18 }}>
              {SOON.map((s) => (
                <div key={s} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: MO, color: '#a99b86', fontSize: 14, lineHeight: 1.5 }}>&mdash;</span>
                  <span style={{ fontFamily: IN, fontSize: 14.5, lineHeight: 1.5, color: '#2b385c' }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 05 · CARD RANKINGS (cream) — computed live from the engine ── */}
      <section id="rankings" style={{ background: '#fbf8f3', borderTop: HAIRLINE, padding: WORK_PAD }}>
        <div style={inner}>
          <Eyebrow a="Card" b="Rankings" />
          <CardRankings />
        </div>
      </section>

      {/* ── 06 · CLOSING (dark, aspiration padding) ── */}
      <section id="close" style={{ background: '#0f1620', borderTop: HAIRLINE, paddingTop: ASPIRE_TOP }}>
        <div style={{ ...inner }}>
          <h2 style={h2Dark}>
            Your move. We&rsquo;ve already shown <em style={emDark}>our</em> workings.
          </h2>
          <p style={{ fontFamily: IN, fontSize: 18, lineHeight: 1.65, color: 'rgba(247,244,239,.76)', maxWidth: '46ch', margin: '20px 0 0' }}>
            Every rupee on this page carries where it came from. Compute yours the same way.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 36 }}>
            <Link href="/login" style={ctaPrimary}>
              Compute my cards<span style={{ fontFamily: MO }}>&rarr;</span>
            </Link>
            <Link href="#fares" style={ctaGhost}>
              Read the method
            </Link>
          </div>

          <div style={{ marginTop: 'clamp(64px,8vw,110px)', padding: '26px 0', borderTop: '1px solid rgba(255,255,255,.14)', display: 'flex', flexWrap: 'wrap', gap: 18, justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: FR, fontSize: 17, color: '#f4f1ec' }}>
              Credit<span style={{ color: '#D89B2A' }}>IQ</span>
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              <Link href="#fares" style={{ fontFamily: IN, fontSize: 13.5, color: 'rgba(247,244,239,.62)', textDecoration: 'none' }}>Live fares</Link>
              <Link href="#rankings" style={{ fontFamily: IN, fontSize: 13.5, color: 'rgba(247,244,239,.62)', textDecoration: 'none' }}>Rankings</Link>
              <Link href="/plans" style={{ fontFamily: IN, fontSize: 13.5, color: 'rgba(247,244,239,.62)', textDecoration: 'none' }}>Pricing</Link>
              <Link href="#top" style={{ fontFamily: IN, fontSize: 13.5, color: 'rgba(247,244,239,.62)', textDecoration: 'none' }}>Method</Link>
            </div>
            <span style={{ fontFamily: IN, fontSize: 12.5, color: 'rgba(247,244,239,.4)' }}>No affiliate links. No issuer money.</span>
          </div>
        </div>
      </section>
      </SpendProvider>
    </main>
  );
}
