import Link from 'next/link';
import { Metadata } from 'next';
import { SEED_CARDS } from '@/lib/data/seed-cards';

export const metadata: Metadata = {
  title: 'CreditIQ — India\'s Unbiased Credit Card Intelligence Platform',
  description: 'Find the best Indian credit card for your spends. AI-powered analysis of 93 cards with zero affiliate bias. Compare rewards, fees, lounge access. No bank pays us to rank them.',
  keywords: 'best credit card India 2026, compare credit cards India, HDFC credit card, Axis Magnus, credit card rewards optimizer',
  openGraph: {
    title: 'CreditIQ — Honest Credit Card Intelligence',
    description: 'Zero affiliate bias. 93 cards. AI-powered recommendations.',
    url: 'https://creditiq.app',
  },
};

const DEVALUATION_EVENTS = [
  'HDFC Regalia lounge capped at 1/quarter without spend',
  'Axis Magnus reward rate reduced from 12 to 10 EDGE Miles',
  'SBI Elite dining multiplier cut from 10X to 5X',
  'ICICI Amazon Pay cashback capped at Rs.200/month',
  'Kotak 811 reward expiry reduced to 12 months',
];

const JOURNEYS = [
  {
    href: '/spend-optimizer',
    icon: '🎯',
    title: 'Find my best card',
    sub: 'New to credit cards or want to switch',
    color: '#E8EFF7',
    iconBg: '#1B3A5C',
  },
  {
    href: '/card-roast',
    icon: '🔥',
    title: 'Roast my card',
    sub: 'Already have a card — is it the best?',
    color: '#FEF3E2',
    iconBg: '#C9972E',
  },
  {
    href: '/travel',
    icon: '✈️',
    title: 'Travel smarter',
    sub: 'Maximize miles, lounges & forex',
    color: '#E8F5EE',
    iconBg: '#166534',
  },
];

const AI_TOOLS = [
  { href: '/spend-optimizer', icon: '🎯', title: 'Card Match AI', sub: 'Best card for your exact spends', badge: 'Most used' },
  { href: '/card-roast', icon: '🔥', title: 'Card Roast', sub: 'Get an honest A–F grade', badge: 'Viral' },
  { href: '/statement-truth', icon: '📊', title: 'Truth Report', sub: 'Bank claims vs reality', badge: 'New' },
  { href: '/card-switch', icon: '🔄', title: 'Switch Wizard', sub: 'Find better card + transfer debt', badge: null },
  { href: '/travel', icon: '✈️', title: 'Travel AI', sub: 'Flights, hotels, miles advice', badge: null },
  { href: '/lounge-tracker', icon: '🛋️', title: 'Lounge Tracker', sub: 'Visits remaining this quarter', badge: null },
];

const TOP_CARDS = SEED_CARDS.slice(0, 6) as any[];

const CATEGORIES = [
  { href: '/best-cards/travel', label: 'Travel', icon: '✈️' },
  { href: '/best-cards/cashback', label: 'Cashback', icon: '💰' },
  { href: '/best-cards/no-fee', label: 'Free cards', icon: '🎁' },
  { href: '/best-cards/dining', label: 'Dining', icon: '🍽️' },
  { href: '/best-cards/premium', label: 'Premium', icon: '👑' },
  { href: '/best-cards/fuel', label: 'Fuel', icon: '⛽' },
  { href: '/best-cards/shopping', label: 'Shopping', icon: '🛍️' },
  { href: '/best-cards/beginners', label: 'Beginners', icon: '🌱' },
];

export default function HomePage() {
  const totalCards = SEED_CARDS.length;

  return (
    <div className="page">

      {/* ── HERO ── */}
      <section style={{
        background: 'var(--navy)',
        padding: '48px 0 52px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(201,151,46,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.03) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative' }}>
          <div style={{ maxWidth: 620 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(201,151,46,0.15)', border: '1px solid rgba(201,151,46,0.3)',
              borderRadius: 'var(--radius-full)', padding: '5px 14px', marginBottom: 20,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: 1, textTransform: 'uppercase' }}>
                India's only unbiased card platform
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(30px, 5vw, 52px)',
              fontWeight: 900, color: '#fff',
              lineHeight: 1.1, marginBottom: 16,
              letterSpacing: '-0.5px',
            }}>
              Stop leaving{' '}
              <span style={{ color: 'var(--gold)' }}>Rs.40,000</span>
              <br />on the table every year
            </h1>

            <p style={{
              fontSize: 'clamp(15px, 2vw, 17px)',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.7, marginBottom: 28, maxWidth: 520,
            }}>
              {totalCards} credit cards analyzed. Zero affiliate bias. AI that reads your actual statement and tells you exactly what you're missing — no bank pays us to rank them higher.
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/spend-optimizer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                height: 52, padding: '0 28px',
                background: 'var(--gold)', color: '#fff',
                borderRadius: 'var(--radius-xl)', fontSize: 15, fontWeight: 700,
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                Find my best card →
              </Link>
              <Link href="/card-roast" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                height: 52, padding: '0 24px',
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 'var(--radius-xl)', fontSize: 15, fontWeight: 600,
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                🔥 Roast my card
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: 24, marginTop: 40,
            flexWrap: 'wrap',
          }}>
            {[
              { value: `${totalCards}+`, label: 'Cards analyzed' },
              { value: '0%', label: 'Affiliate bias' },
              { value: '17', label: 'Banks covered' },
              { value: 'Free', label: 'No login needed' },
            ].map((s, i) => (
              <div key={i} style={{ minWidth: 80 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEVALUATION TICKER ── */}
      <div style={{
        background: 'var(--warning-bg)',
        borderBottom: '1px solid var(--warning-border)',
        overflow: 'hidden', whiteSpace: 'nowrap',
      }}>
        <div style={{
          display: 'inline-flex', gap: 48, padding: '8px 0',
          animation: 'ticker 25s linear infinite',
          fontSize: 12, fontWeight: 600, color: 'var(--warning)',
        }}>
          {[...DEVALUATION_EVENTS, ...DEVALUATION_EVENTS].map((e, i) => (
            <span key={i}>⚠️ {e}</span>
          ))}
        </div>
        <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      </div>

      {/* ── JOURNEYS ── */}
      <section style={{ padding: '48px 0 0' }}>
        <div className="container">
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Start here
            </div>
            <h2 style={{ fontSize: 'clamp(20px, 3vw, 26px)', margin: 0 }}>What brings you here today?</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {JOURNEYS.map((j, i) => (
              <Link key={i} href={j.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-xl)', padding: '22px',
                  cursor: 'pointer', transition: 'all 0.2s',
                  height: '100%',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-lg)',
                    background: j.iconBg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 20, marginBottom: 14,
                  }}>
                    {j.icon}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 5 }}>{j.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{j.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI TOOLS ── */}
      <section style={{ padding: '48px 0 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                AI-powered tools
              </div>
              <h2 style={{ fontSize: 'clamp(20px, 3vw, 26px)', margin: 0 }}>Built for your card, not the bank's</h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {AI_TOOLS.map((tool, i) => (
              <Link key={i} href={tool.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xl)', padding: '20px',
                  height: '100%', transition: 'all 0.2s',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {tool.badge && (
                    <div style={{
                      position: 'absolute', top: 14, right: 14,
                      fontSize: 9, fontWeight: 700, color: 'var(--gold)',
                      background: 'var(--gold-light)', border: '1px solid var(--gold)',
                      padding: '2px 7px', borderRadius: 'var(--radius-full)',
                      letterSpacing: 0.5, textTransform: 'uppercase',
                    }}>{tool.badge}</div>
                  )}
                  <div style={{ fontSize: 24, marginBottom: 12 }}>{tool.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{tool.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{tool.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section style={{ padding: '48px 0 0' }}>
        <div className="container">
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Browse by category
            </div>
            <h2 style={{ fontSize: 'clamp(20px, 3vw, 26px)', margin: 0 }}>Find the best card for how you spend</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {CATEGORIES.map((cat, i) => (
              <Link key={i} href={cat.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: '16px 14px',
                  textAlign: 'center', transition: 'all 0.2s',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{cat.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{cat.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOP CARDS PREVIEW ── */}
      <section style={{ padding: '48px 0 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Top rated
              </div>
              <h2 style={{ fontSize: 'clamp(20px, 3vw, 26px)', margin: 0 }}>Most popular cards in India</h2>
            </div>
            <Link href="/cards" style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              See all {totalCards} →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {TOP_CARDS.map((card, i) => {
              const fee = card.annual_fee_inr ?? 0;
              const cats = Array.isArray(card.category) ? card.category : [card.category ?? 'rewards'];
              return (
                <Link key={card.id} href={`/cards/${card.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xl)', padding: '20px',
                    transition: 'all 0.2s', height: '100%',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{card.bank}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{card.name}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: fee === 0 ? 'var(--success)' : 'var(--text)' }}>
                          {fee === 0 ? 'Free' : `₹${fee.toLocaleString('en-IN')}`}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>annual fee</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {cats.slice(0, 2).map((cat: string, j: number) => (
                        <span key={j} style={{
                          fontSize: 11, background: 'var(--navy-light)', color: 'var(--navy)',
                          padding: '2px 8px', borderRadius: 'var(--radius-full)', textTransform: 'capitalize',
                        }}>{cat}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TRUST SECTION ── */}
      <section style={{ padding: '48px 0 0' }}>
        <div className="container">
          <div style={{
            background: 'var(--navy)', borderRadius: 'var(--radius-xl)',
            padding: '40px 32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
              Why CreditIQ is different
            </div>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', color: '#fff', marginBottom: 14 }}>
              No bank pays us to rank them higher
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>
              BankBazaar and Paisabazaar earn Rs.500–2,000 per card application. We earn from transparent affiliate links shown openly. Our rankings are pure math.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, maxWidth: 720, margin: '0 auto' }}>
              {[
                { icon: '🔍', title: 'Transparent commissions', sub: 'We show exactly what we earn on each card' },
                { icon: '🤖', title: 'AI-powered analysis', sub: 'Reads your actual statement, not guesses' },
                { icon: '📊', title: 'Real reward rates', sub: 'Actual value, not advertised marketing rates' },
                { icon: '🔒', title: 'Privacy first', sub: 'Statements analyzed in memory, never stored' },
              ].map((item, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-lg)',
                  padding: '18px 16px', textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 10 }}>{item.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 5 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{item.sub}</div>
                </div>
              ))}
            </div>
            <Link href="/spend-optimizer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 52, padding: '0 28px', marginTop: 28,
              background: 'var(--gold)', color: '#fff',
              borderRadius: 'var(--radius-xl)', fontSize: 15, fontWeight: 700,
              textDecoration: 'none',
            }}>
              Find my best card — free →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '48px 0 calc(var(--bottom-nav-height) + 32px)', marginTop: 48, borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 32, marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>
                Credit<span style={{ color: 'var(--gold)' }}>IQ</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                India's honest credit card intelligence platform. Built by Nexus AI.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Tools</div>
              {[['Card Match AI', '/spend-optimizer'], ['Card Roast', '/card-roast'], ['Truth Report', '/statement-truth'], ['Switch Wizard', '/card-switch'], ['Travel AI', '/travel']].map(([label, href]) => (
                <Link key={href} href={href} style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 6 }}>{label}</Link>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Best Cards</div>
              {[['Travel Cards', '/best-cards/travel'], ['Cashback Cards', '/best-cards/cashback'], ['Free Cards', '/best-cards/no-fee'], ['Premium Cards', '/best-cards/premium'], ['All 93 Cards', '/cards']].map(([label, href]) => (
                <Link key={href} href={href} style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 6 }}>{label}</Link>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Company</div>
              {[['About CreditIQ', '/about'], ['Privacy Policy', '/privacy'], ['Dashboard', '/dashboard'], ['UAE Cards', '/uae']].map(([label, href]) => (
                <Link key={href} href={href} style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 6 }}>{label}</Link>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>© 2026 CreditIQ by Nexus AI. All rights reserved.</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>DPDP 2023 compliant · Zero affiliate bias</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
