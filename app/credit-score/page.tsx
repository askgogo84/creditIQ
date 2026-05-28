'use client';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { Reveal } from '@/components/design/Reveal';
import { ExternalLink, ShieldCheck, TrendingUp } from 'lucide-react';

const SCORE_RANGES = [
  { range: '300–549', label: 'Poor', color: '#B84230', bg: 'rgba(184,66,48,0.08)', desc: 'Very difficult to get approved. Work on improving before applying.', cards: 'Secured/FD-backed cards only' },
  { range: '550–649', label: 'Fair', color: '#f97316', bg: 'rgba(249,115,22,0.08)', desc: 'Limited options. Entry-level cards with lower credit limits.', cards: 'Kotak 811, IDFC Classic' },
  { range: '650–699', label: 'Good', color: '#eab308', bg: 'rgba(234,179,8,0.08)', desc: 'Most entry-level and mid-tier cards available to you.', cards: 'Amazon Pay ICICI, SBI Cashback, HDFC Millennia' },
  { range: '700–749', label: 'Very Good', color: '#84cc16', bg: 'rgba(132,204,22,0.08)', desc: 'Wide range of cards including premium options.', cards: 'Axis ACE, Flipkart Axis, IDFC Wealth' },
  { range: '750–799', label: 'Excellent', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', desc: 'Almost all cards available. Premium cards within reach.', cards: 'HDFC Regalia, Axis Atlas, SC Ultimate' },
  { range: '800–900', label: 'Exceptional', color: '#10b981', bg: 'rgba(16,185,129,0.08)', desc: 'Best rates, highest limits, super-premium cards.', cards: 'HDFC Infinia, Axis Magnus, IndusInd Pinnacle' },
];

const FREE_SERVICES = [
  { name: 'CIBIL Free Score', url: 'https://www.cibil.com/freecibil', desc: 'Official CIBIL score — free once a year', org: 'TransUnion CIBIL' },
  { name: 'Paisabazaar', url: 'https://www.paisabazaar.com', desc: 'Free CIBIL score with monthly updates', org: 'Paisabazaar' },
  { name: 'BankBazaar', url: 'https://www.bankbazaar.com', desc: 'Free Experian score + CIBIL', org: 'BankBazaar' },
  { name: 'OneScore App', url: 'https://www.onescore.app/', desc: 'Free CIBIL score with detailed analysis', org: 'OneScore' },
];

const TIPS = [
  ['Pay on time, every time', 'Payment history is 35% of your score. Set auto-pay for the minimum at least.'],
  ['Keep utilisation below 30%', 'If your limit is Rs.1L, keep outstanding below Rs.30K. Ideally below 10%.'],
  ["Don't apply for multiple cards at once", 'Each application is a hard inquiry and drops your score by 5-10 points.'],
  ['Keep old cards open', "Length of credit history matters. Don't close your oldest card."],
  ['Check for errors', 'Dispute any incorrect entries on your CIBIL report — they take them seriously.'],
];

export default function CreditScorePage() {
  return (
    <>
      <Header />
      <div className="page-fade">
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 48 }}>
          <div className="aurora" style={{ top: -80, right: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(212,163,115,0.22),transparent 60%)' }} />
          <div className="shell" style={{ position: 'relative', zIndex: 2 }}>
            <Reveal>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 999, background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)', marginBottom: 24 }}>
                <ShieldCheck style={{ width: 14, height: 14, color: '#22c55e' }} />
                <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, letterSpacing: '0.12em', color: '#166534', fontWeight: 700 }}>Checking your score does NOT affect it</span>
              </div>
              <h1 style={{ fontSize: 'clamp(36px,6vw,80px)', fontWeight: 800, color: 'var(--ink,#142950)', lineHeight: 1.0, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
                Check your CIBIL score.{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>Free.</span>
              </h1>
              <p style={{ fontSize: 'clamp(15px,1.4vw,18px)', color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.65, margin: 0, maxWidth: 520 }}>
                Your credit score determines which cards you can get approved for. Check it free — no hard inquiry, no effect on your score.
              </p>
            </Reveal>
          </div>
        </section>

        <section style={{ paddingBottom: 80 }}>
          <div className="shell" style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

            {/* Free services */}
            <Reveal>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 16 }}>Free places to check</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
                {FREE_SERVICES.map(s => (
                  <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{ background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 16, padding: '18px 20px', transition: 'box-shadow 0.2s', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink,#142950)', letterSpacing: '-0.01em' }}>{s.name}</div>
                        <ExternalLink style={{ width: 14, height: 14, color: 'var(--ink-3,#5A6A8A)', flexShrink: 0 }} />
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ink-2,#2A3F6B)', marginBottom: 8, lineHeight: 1.5 }}>{s.desc}</div>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3,#5A6A8A)' }}>{s.org}</div>
                    </div>
                  </a>
                ))}
              </div>
            </Reveal>

            {/* Score ranges */}
            <Reveal>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 16 }}>What your score means for credit cards</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SCORE_RANGES.map(r => (
                  <div key={r.range} style={{ background: r.bg, border: `1px solid ${r.color}25`, borderRadius: 14, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 6 }}>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 16, fontWeight: 800, color: r.color, minWidth: 80, fontVariantNumeric: 'tabular-nums' }}>{r.range}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--ink-2,#2A3F6B)', flex: 1 }}>{r.desc}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3,#5A6A8A)', paddingLeft: 96 }}>
                      <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', marginRight: 6 }}>Cards:</span>
                      {r.cards}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Tips */}
            <Reveal>
              <div style={{ background: 'var(--ink,#142950)', borderRadius: 20, padding: 'clamp(24px,4vw,40px)', position: 'relative', overflow: 'hidden' }}>
                <div className="aurora" style={{ top: -40, right: -40, width: 300, height: 300, background: 'radial-gradient(circle,rgba(212,163,115,0.18),transparent 60%)' }} />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <TrendingUp style={{ width: 18, height: 18, color: 'var(--copper-3,#D89B2A)' }} />
                    <h2 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>How to improve your score fast</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {TIPS.map(([title, desc]) => (
                      <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--copper-3,#D89B2A)', flexShrink: 0, marginTop: 7 }} />
                        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.70)', lineHeight: 1.65 }}>
                          <span style={{ color: '#fff', fontWeight: 600 }}>{title}: </span>
                          {desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

          </div>
        </section>
        <DesignFooter />
      </div>
    </>
  );
}
