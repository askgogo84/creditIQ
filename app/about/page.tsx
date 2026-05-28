import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { Reveal } from '@/components/design/Reveal';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { ShieldCheck, Zap, Eye, TrendingDown } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'About CreditIQ — Why This Site Exists',
  description: 'CreditIQ is India\'s first unbiased credit card intelligence platform. We built it because every other comparison site is paid to rank cards.',
};

const PRINCIPLES = [
  { Icon: ShieldCheck, title: 'Zero bank payments', body: 'No bank pays us to rank their card higher. Our scores are based on value, not commissions.' },
  { Icon: Eye, title: 'Full transparency', body: 'We publish our methodology, show our maths, and disclose every affiliate relationship.' },
  { Icon: Zap, title: 'Real-time devaluation tracking', body: 'We log every benefit cut. When your card gets worse, you find out here first.' },
  { Icon: TrendingDown, title: 'Honest about complexity', body: 'Credit card rewards are deliberately confusing. We simplify without hiding the truth.' },
];

export default function AboutPage() {
  const allDevaluations = SEED_CARDS.flatMap((c) =>
    (c.devaluations ?? []).map((d) => ({ ...d, cardName: c.name, cardBank: c.bank, slug: c.slug }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  return (
    <>
      <Header />
      <div className="page-fade">

        {/* Hero */}
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 60 }}>
          <div className="aurora" style={{ top: -80, right: -120, width: 700, height: 600, background: 'radial-gradient(circle,rgba(212,163,115,0.28),transparent 60%)' }} />
          <div className="aurora" style={{ bottom: -60, left: -80, width: 500, height: 400, background: 'radial-gradient(circle,rgba(196,106,82,0.15),transparent 60%)' }} />
          <div className="shell" style={{ position: 'relative', zIndex: 2 }}>
            <Reveal>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', fontWeight: 700, marginBottom: 16 }}>The manifesto</div>
              <h1 style={{ fontSize: 'clamp(40px,7vw,96px)', fontWeight: 800, color: 'var(--ink,#142950)', lineHeight: 1.0, letterSpacing: '-0.04em', margin: '0 0 32px' }}>
                Why this site{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>exists</span>.
              </h1>

              <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  `In India, "credit card comparison" is a business model, not a service. Every major comparison platform earns Rs.500 to Rs.3,000 per approved application. The card that pays more, ranks higher. Period.`,
                  `We've watched friends apply for cards that were objectively wrong for their spending pattern because some affiliate site put them at the top. We've seen "Top 10 Travel Cards" lists that are really "Top 10 Cards That Pay Us The Most This Quarter."`,
                  `We built CreditIQ because the smartest financial decision of your year — which credit card to hold — deserves a recommendation that isn't bought.`,
                  `Our rankings are based on one thing: the actual rupee value a card generates for your spending pattern, minus its true costs. We track caps, fee waivers, milestone spends, redemption haircuts. We log every devaluation. We show our maths.`,
                ].map((para, i) => (
                  <p key={i} style={{
                    fontSize: i === 2 ? 'clamp(17px,2vw,22px)' : 15,
                    color: i === 2 ? 'var(--ink,#142950)' : 'var(--ink-2,#2A3F6B)',
                    lineHeight: 1.8,
                    margin: 0,
                    fontFamily: i === 2 ? 'var(--font-serif,Georgia,serif)' : 'inherit',
                    fontStyle: i === 2 ? 'italic' : 'normal',
                    borderLeft: i === 2 ? '3px solid var(--copper-3,#D89B2A)' : 'none',
                    paddingLeft: i === 2 ? 20 : 0,
                  }}>{para}</p>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Principles */}
        <section style={{ padding: 'clamp(40px,6vw,64px) 0', background: 'var(--paper,#FAF5EB)', borderTop: '1px solid var(--line,rgba(20,41,80,0.08))', borderBottom: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
          <div className="shell">
            <Reveal>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
                {PRINCIPLES.map(({ Icon, title, body }, i) => (
                  <div key={i} style={{ background: 'var(--surface,#fff)', borderRadius: 18, padding: 24, border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(212,163,115,0.12)', border: '1px solid rgba(212,163,115,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <Icon style={{ width: 18, height: 18, color: 'var(--copper,#8C5F12)' }} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 8, letterSpacing: '-0.01em' }}>{title}</div>
                    <div style={{ fontSize: 13.5, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.7 }}>{body}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Recent devaluations */}
        {allDevaluations.length > 0 && (
          <section style={{ padding: 'clamp(40px,6vw,64px) 0' }}>
            <div className="shell">
              <Reveal>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 8 }}>What we track</div>
                    <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, color: 'var(--ink,#142950)', margin: 0, letterSpacing: '-0.02em' }}>
                      Recent{' '}
                      <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: '#B84230', fontStyle: 'italic', fontWeight: 400 }}>devaluations</span>
                    </h2>
                  </div>
                  <Link href="/blog/credit-card-devaluations-india-2026" style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--copper,#8C5F12)', textDecoration: 'none', fontWeight: 700 }}>
                    Full 2026 tracker →
                  </Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {allDevaluations.map((d, i) => (
                    <Link key={i} href={`/cards/${d.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr auto', gap: 16, alignItems: 'center', padding: '14px 20px', background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 12 }}>
                        <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--ink-3,#5A6A8A)', whiteSpace: 'nowrap' }}>
                          {new Date(d.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink,#142950)', whiteSpace: 'nowrap' }}>{d.cardBank} {d.cardName}</div>
                        <div style={{ fontSize: 13, color: 'var(--ink-2,#2A3F6B)' }}>{d.description}</div>
                        <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: 100, background: d.impact === 'high' ? 'rgba(184,66,48,0.10)' : 'rgba(212,163,115,0.12)', color: d.impact === 'high' ? '#B84230' : 'var(--copper,#8C5F12)' }}>
                          {d.impact}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>
        )}

        {/* CTA */}
        <section style={{ padding: 'clamp(40px,6vw,64px) 0 80px' }}>
          <div className="shell">
            <Reveal>
              <div style={{ background: 'var(--ink,#142950)', borderRadius: 24, padding: 'clamp(32px,5vw,56px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div className="aurora" style={{ top: -80, right: -80, width: 400, height: 400, background: 'radial-gradient(circle,rgba(212,163,115,0.18),transparent 60%)' }} />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <h2 style={{ fontSize: 'clamp(22px,3.5vw,36px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
                    See it in action
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, margin: '0 0 28px', lineHeight: 1.7 }}>
                    Find your best card in 90 seconds. No email, no sign-up, no commissions.
                  </p>
                  <Link href="/smart-match" style={{ display: 'inline-block', background: 'var(--copper-3,#D89B2A)', color: '#fff', padding: '14px 32px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
                    Find my card →
                  </Link>
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
