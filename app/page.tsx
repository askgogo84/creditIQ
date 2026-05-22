import Link from 'next/link';
import {
  ArrowRight, ArrowUpRight, Sparkles, Flame, Plane, Target,
  Wallet, FileText, Activity, ShieldCheck, Eye, Radio, Layers,
  CreditCard, Coffee, Fuel, UtensilsCrossed, Crown, BadgePercent,
  MapPin,
} from 'lucide-react';
import { Header } from '@/components/Header';

export default function HomePage() {
  return (
    <main className="min-h-screen mobile-tabbar-pad">
      <Header />
      <Hero />
      <DevaluationTicker />
      <StartHere />
      <AITools />
      <Categories />
      <TopCards />
      <Trust />
      <SiteFooter />
    </main>
  );
}

/* ============================================================== */
/* 1. HERO                                                         */
/* ============================================================== */

function Hero() {
  return (
    <section className="relative bg-hero-navy overflow-hidden" style={{ color: 'var(--on-navy)' }}>
      {/* subtle grain */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
      />
      {/* hairline gold rule at top */}
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,151,46,0.55), transparent)' }} />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 lg:pt-32 lg:pb-36 relative">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left: copy */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-7">
              <span className="gold-rule" />
              <span className="eyebrow" style={{ color: 'rgba(255,255,255,0.62)' }}>
                India · zero affiliate bias
              </span>
            </div>

            <h1
              className="font-tight font-bold leading-[1.02] mb-7"
              style={{
                fontSize: 'clamp(40px, 7.2vw, 76px)',
                letterSpacing: '-0.04em',
              }}
            >
              Stop leaving{' '}
              <span
                className="text-gold whitespace-nowrap"
                style={{
                  background: 'linear-gradient(180deg, #f0c060 0%, #C9972E 60%, #855e1c 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ₹40,000
              </span>{' '}
              on the table every&nbsp;year.
            </h1>

            <p
              className="text-[17px] sm:text-[19px] leading-relaxed max-w-[560px] mb-10"
              style={{ color: 'rgba(255,255,255,0.74)', letterSpacing: '-0.005em' }}
            >
              CreditIQ is India's first AI engine that picks the right credit card for your real
              spend — without taking a cut from the banks. Compare, optimise, and stop bleeding
              points to silent devaluations.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-14">
              <Link href="/smart-match" className="btn-gold" style={{ minHeight: 56, padding: '16px 26px', fontSize: '15px' }}>
                Find my best card
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/card-roast" className="btn-outline-light" style={{ minHeight: 56, padding: '16px 26px', fontSize: '15px' }}>
                <Flame className="w-4 h-4" style={{ color: 'var(--gold-bright)' }} />
                Roast my card
              </Link>
            </div>

            {/* trust microbar */}
            <dl className="grid grid-cols-3 max-w-[480px] gap-6 sm:gap-8">
              {[
                { k: '93+', v: 'Cards tracked' },
                { k: '17', v: 'Banks covered' },
                { k: '0', v: 'Affiliate dollars' },
              ].map(s => (
                <div key={s.v} className="flex flex-col gap-1">
                  <dt className="font-tight tabular text-[28px] sm:text-[32px] font-bold" style={{ color: 'var(--on-navy)' }}>
                    {s.k}
                  </dt>
                  <dd className="text-[11px] uppercase tracking-[0.16em] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {s.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Right: stat card */}
          <div className="hidden lg:block lg:col-span-5">
            <HeroPanel />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroPanel() {
  return (
    <div
      className="relative rounded-[20px] p-7 card-gold-edge"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 30px 80px -30px rgba(0,0,0,0.5)',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <span className="eyebrow" style={{ color: 'rgba(255,255,255,0.55)' }}>Avg user saves</span>
        <span className="badge badge-gold">Live</span>
      </div>

      <div className="flex items-baseline gap-1 mb-1">
        <span className="font-tight tabular text-[56px] font-bold leading-none" style={{ color: 'var(--gold-bright)' }}>
          ₹38,400
        </span>
        <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>/yr</span>
      </div>
      <p className="text-[13px] mb-7" style={{ color: 'rgba(255,255,255,0.65)' }}>
        After switching to their optimal card mix
      </p>

      {/* sparkline */}
      <svg viewBox="0 0 280 64" className="w-full h-16 mb-6" preserveAspectRatio="none">
        <defs>
          <linearGradient id="hsg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#C9972E" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#C9972E" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,50 L30,42 L60,46 L90,34 L120,28 L150,30 L180,18 L210,22 L240,10 L280,4 L280,64 L0,64 Z"
          fill="url(#hsg)"
        />
        <path
          d="M0,50 L30,42 L60,46 L90,34 L120,28 L150,30 L180,18 L210,22 L240,10 L280,4"
          fill="none"
          stroke="#e0b94c"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="grid grid-cols-2 gap-3 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Top win</div>
          <div className="text-[14px] font-semibold" style={{ color: 'var(--on-navy)' }}>HDFC Infinia · ₹62k</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Median save</div>
          <div className="text-[14px] font-semibold" style={{ color: 'var(--on-navy)' }}>₹24,800 / yr</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================== */
/* 2. DEVALUATION TICKER                                           */
/* ============================================================== */

const TICKER_ITEMS = [
  'Axis Magnus · Yatra capped at ₹15k/mo',
  'HDFC Smartbuy · Cleartrip points cut by 50%',
  'ICICI Emeralde · Lounge access reduced to 4/qtr',
  'SBI Elite · Vistara waiver removed',
  'Amex MRCC · MakeMyTrip points devalued 30%',
  'Axis Atlas · Edge Miles capped on hotels',
  'HDFC Diners · Smartbuy 10x removed on Tata Neu',
  'Citi PremierMiles · Programme migrated to Axis',
];

function DevaluationTicker() {
  return (
    <section className="ticker-amber relative" aria-label="Recent devaluations">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3 flex items-center gap-5">
        <span className="badge badge-crimson shrink-0">
          <Radio className="w-3 h-3" />
          Devaluation watch
        </span>
        <div className="marquee flex-1">
          <div className="marquee-track">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
              <span key={i} className="inline-flex items-center gap-3 text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                <span style={{ color: 'var(--amber)' }}>●</span>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================== */
/* 3. START HERE                                                   */
/* ============================================================== */

const JOURNEYS = [
  {
    href: '/smart-match',
    eyebrow: 'Start here',
    title: 'Find my card',
    body: 'Tell us your spend in 90 seconds. We rank every card in India by what you actually keep — net of fees, GST, and breakage.',
    Icon: Target,
    cta: 'Match my spend',
    accent: 'gold' as const,
  },
  {
    href: '/card-roast',
    eyebrow: 'Already have one?',
    title: 'Roast my card',
    body: 'Drop your current card. Our AI auditor compares it against the 93-card universe and tells you — bluntly — what you\'re losing.',
    Icon: Flame,
    cta: 'Get the roast',
    accent: 'crimson' as const,
  },
  {
    href: '/travel',
    eyebrow: 'Going abroad?',
    title: 'Travel smarter',
    body: 'Forex, lounges, transfer partners, devaluation alerts. The travel-points playbook built for Indian wallets.',
    Icon: Plane,
    cta: 'Plan a trip',
    accent: 'navy' as const,
  },
];

function StartHere() {
  return (
    <section className="py-20 sm:py-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHead eyebrow="Three ways in" title="Start where you are" />

        <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
          {JOURNEYS.map(j => (
            <Link key={j.href} href={j.href} className="card-surface p-7 sm:p-8 group flex flex-col" style={{ minHeight: 280 }}>
              <span className="eyebrow mb-5">{j.eyebrow}</span>
              <div
                className="w-12 h-12 rounded-xl mb-5 flex items-center justify-center"
                style={{
                  background:
                    j.accent === 'gold'  ? 'color-mix(in srgb, var(--gold) 16%, transparent)' :
                    j.accent === 'crimson' ? 'color-mix(in srgb, var(--crimson) 14%, transparent)' :
                                           'color-mix(in srgb, var(--navy) 22%, transparent)',
                  color:
                    j.accent === 'gold'  ? 'var(--gold-bright)' :
                    j.accent === 'crimson' ? 'var(--crimson)' :
                                           'var(--navy-bright)',
                }}
              >
                <j.Icon className="w-5 h-5" />
              </div>
              <h3 className="font-tight font-bold text-[26px] mb-3 leading-tight" style={{ color: 'var(--text)' }}>
                {j.title}
              </h3>
              <p className="text-[14.5px] leading-relaxed mb-7 flex-1" style={{ color: 'var(--text-muted)' }}>
                {j.body}
              </p>
              <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold" style={{ color: 'var(--gold-bright)' }}>
                {j.cta}
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================== */
/* 4. AI TOOLS                                                     */
/* ============================================================== */

const AI_TOOLS = [
  { href: '/smart-match', label: 'Smart Match',       blurb: 'Rank every card by your real spend.', Icon: Target,    badge: { text: 'Most used', tone: 'gold' as const } },
  { href: '/card-roast', label: 'Roast my card',      blurb: 'Brutally honest audit of your current card.', Icon: Flame, badge: { text: 'Viral', tone: 'crimson' as const } },
  { href: '/optimize', label: 'Points Optimizer',     blurb: 'Best redemption for every reward currency.', Icon: Sparkles, badge: null },
  { href: '/spend-optimizer', label: 'Spend Optimizer', blurb: 'Which card to swipe — for every purchase.', Icon: Wallet, badge: { text: 'New', tone: 'emerald' as const } },
  { href: '/statement-truth', label: 'Statement Truth', blurb: 'Upload a statement. See what you actually earned.', Icon: FileText, badge: null },
  { href: '/lounge-tracker', label: 'Lounge Tracker', blurb: 'Live lounge availability across India.', Icon: Activity, badge: null },
];

function AITools() {
  return (
    <section className="py-20 sm:py-24" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHead
          eyebrow="AI Tools"
          title="Six engines. One unfair advantage."
          link={{ href: '/smart-match', label: 'Open the toolkit' }}
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {AI_TOOLS.map(t => (
            <Link key={t.href} href={t.href} className="card-surface p-6 sm:p-7 group relative">
              <div className="flex items-start justify-between mb-5">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'color-mix(in srgb, var(--gold) 12%, transparent)',
                    color: 'var(--gold-bright)',
                  }}
                >
                  <t.Icon className="w-[18px] h-[18px]" />
                </div>
                {t.badge && (
                  <span className={`badge badge-${t.badge.tone}`}>{t.badge.text}</span>
                )}
              </div>
              <h3 className="font-tight font-bold text-[19px] mb-2 leading-tight" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
                {t.label}
              </h3>
              <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {t.blurb}
              </p>
              <ArrowUpRight
                className="absolute top-6 right-6 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--text-dim)' }}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================== */
/* 5. CATEGORY PILLS                                               */
/* ============================================================== */

const CATEGORIES: { label: string; href: string; Icon: typeof Target }[] = [
  { label: 'Cashback',       href: '/cards?cat=cashback',     Icon: BadgePercent },
  { label: 'Travel',         href: '/cards?cat=travel',       Icon: Plane },
  { label: 'Fuel',           href: '/cards?cat=fuel',         Icon: Fuel },
  { label: 'Dining',         href: '/cards?cat=dining',       Icon: UtensilsCrossed },
  { label: 'Lifestyle',      href: '/cards?cat=lifestyle',    Icon: Coffee },
  { label: 'Super premium',  href: '/cards?cat=premium',      Icon: Crown },
  { label: 'Lounge access',  href: '/cards?cat=lounge',       Icon: MapPin },
  { label: 'No annual fee',  href: '/cards?cat=no-fee',       Icon: Wallet },
];

function Categories() {
  return (
    <section className="py-20 sm:py-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHead eyebrow="Browse" title="Pick by what you actually do." />

        <div className="flex flex-wrap gap-2.5 sm:gap-3">
          {CATEGORIES.map(c => (
            <Link key={c.label} href={c.href} className="pill">
              <c.Icon className="w-4 h-4" style={{ color: 'var(--gold-bright)' }} />
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================== */
/* 6. TOP 6 CARDS                                                  */
/* ============================================================== */

const TOP_CARDS = [
  { bank: 'HDFC',  name: 'Infinia (Metal)',        category: 'Super premium', value: '₹62,000', highlight: '5X Smartbuy + lounge unlimited', tone: 'gold' as const },
  { bank: 'Axis',  name: 'Magnus Burgundy',        category: 'Travel',        value: '₹48,500', highlight: 'EDGE Miles · 1:5 transfer ratios', tone: 'gold' as const },
  { bank: 'ICICI', name: 'Emeralde Private Metal', category: 'Premium',       value: '₹52,000', highlight: '6 LPP + Taj Epicure', tone: 'gold' as const },
  { bank: 'SBI',   name: 'Cashback',               category: 'Cashback',      value: '₹18,000', highlight: 'Flat 5% online · ₹999 fee',     tone: 'plain' as const },
  { bank: 'Amex',  name: 'Platinum Travel',        category: 'Travel',        value: '₹22,400', highlight: 'Milestone vouchers · Taj stay',  tone: 'plain' as const },
  { bank: 'Tata',  name: 'Neu Infinity',           category: 'Lifestyle',     value: '₹16,800', highlight: '5% NeuCoins · UPI rewards',     tone: 'plain' as const },
];

function TopCards() {
  return (
    <section className="py-20 sm:py-24" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHead
          eyebrow="Top 6 — May 2026"
          title="The cards holding their value this quarter."
          link={{ href: '/cards', label: 'See all 93+ cards' }}
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {TOP_CARDS.map((c, i) => (
            <Link key={c.name} href="/cards" className={`card-surface p-6 sm:p-7 group ${c.tone === 'gold' ? 'card-gold-edge' : ''} relative overflow-hidden`}>
              <div className="flex items-start justify-between mb-5">
                <span className="eyebrow">{c.bank}</span>
                <span className="font-tight tabular text-[11px] font-bold" style={{ color: 'var(--text-dim)' }}>
                  #{i + 1}
                </span>
              </div>

              <h3 className="font-tight font-bold text-[22px] mb-1 leading-tight" style={{ color: 'var(--text)', letterSpacing: '-0.025em' }}>
                {c.name}
              </h3>
              <p className="text-[12px] uppercase tracking-[0.14em] mb-6 font-medium" style={{ color: 'var(--text-dim)' }}>
                {c.category}
              </p>

              <div className="mb-6">
                <div className="text-[11px] uppercase tracking-[0.14em] mb-1 font-medium" style={{ color: 'var(--text-dim)' }}>
                  Real annual value
                </div>
                <div className="font-tight tabular font-bold text-[32px] leading-none" style={{ color: c.tone === 'gold' ? 'var(--gold-bright)' : 'var(--text)' }}>
                  {c.value}
                </div>
              </div>

              <p className="text-[13.5px] leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
                {c.highlight}
              </p>

              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: 'var(--gold-bright)' }}>
                See details
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================== */
/* 7. TRUST                                                        */
/* ============================================================== */

const PILLARS = [
  { Icon: ShieldCheck, title: 'Zero affiliate bias',     body: 'We earn from Premium subscribers — never from the banks. Rankings can\'t be bought.' },
  { Icon: Eye,         title: 'Real annual value',       body: 'Every rupee is calculated net of fee, GST, lounge cap, breakage and forex spread.' },
  { Icon: Radio,       title: 'Live devaluation tracking', body: 'When an issuer cuts rewards, you get an alert before your next billing cycle.' },
  { Icon: Layers,      title: '93+ cards · 17 banks',    body: 'India\'s deepest catalogue — refreshed weekly with primary-source documentation.' },
];

function Trust() {
  return (
    <section className="bg-trust-navy relative overflow-hidden" style={{ color: 'var(--on-navy)' }}>
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,151,46,0.5), transparent)' }} />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28 relative">
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="gold-rule" />
            <span className="eyebrow" style={{ color: 'rgba(255,255,255,0.55)' }}>Why CreditIQ exists</span>
          </div>
          <h2 className="font-tight font-bold leading-[1.05]" style={{ fontSize: 'clamp(32px, 5vw, 56px)', letterSpacing: '-0.035em' }}>
            Every card comparison site in India is paid by the banks.
            <span className="block mt-3" style={{ color: 'var(--gold-bright)' }}>We are not.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {PILLARS.map(p => (
            <div key={p.title} className="flex flex-col">
              <div
                className="w-11 h-11 rounded-xl mb-5 flex items-center justify-center"
                style={{ background: 'rgba(201,151,46,0.16)', color: 'var(--gold-bright)', border: '1px solid rgba(201,151,46,0.32)' }}
              >
                <p.Icon className="w-5 h-5" />
              </div>
              <h3 className="font-tight font-bold text-[18px] mb-2 leading-tight" style={{ color: 'var(--on-navy)', letterSpacing: '-0.02em' }}>
                {p.title}
              </h3>
              <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-10 border-t flex flex-col sm:flex-row gap-6 sm:items-end sm:justify-between" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          <div>
            <div className="eyebrow mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>Ready when you are</div>
            <p className="font-tight font-bold text-[24px] sm:text-[28px] leading-tight max-w-md" style={{ letterSpacing: '-0.025em' }}>
              90 seconds. Honest answer.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/smart-match" className="btn-gold" style={{ minHeight: 52 }}>
              Find my best card
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/about" className="btn-outline-light" style={{ minHeight: 52 }}>
              Read the manifesto
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================== */
/* 8. FOOTER                                                       */
/* ============================================================== */

const FOOTER_COLS = [
  {
    title: 'Product',
    links: [
      { href: '/smart-match', label: 'Smart Match' },
      { href: '/card-roast', label: 'Roast my card' },
      { href: '/compare', label: 'Compare' },
      { href: '/best-cards', label: 'Best cards' },
    ],
  },
  {
    title: 'AI Tools',
    links: [
      { href: '/optimize', label: 'Points Optimizer' },
      { href: '/spend-optimizer', label: 'Spend Optimizer' },
      { href: '/statement-truth', label: 'Statement Truth' },
      { href: '/lounge-tracker', label: 'Lounge Tracker' },
    ],
  },
  {
    title: 'Browse',
    links: [
      { href: '/cards', label: 'All cards' },
      { href: '/travel', label: 'Travel AI' },
      { href: '/uae', label: 'UAE' },
      { href: '/sg', label: 'Singapore' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'Manifesto' },
      { href: '/premium', label: 'Premium' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/login', label: 'Sign in' },
    ],
  },
];

function SiteFooter() {
  return (
    <footer style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 sm:pt-20 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4" style={{ color: 'var(--gold-bright)' }} />
              <span className="font-tight font-bold text-[17px]" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
                CreditIQ
              </span>
            </div>
            <p className="text-[13px] leading-relaxed max-w-[240px]" style={{ color: 'var(--text-muted)' }}>
              Honest credit-card intelligence for India. No affiliate dollars, ever.
            </p>
          </div>

          {FOOTER_COLS.map(col => (
            <div key={col.title}>
              <h4 className="eyebrow mb-4">{col.title}</h4>
              <ul className="flex flex-col gap-3">
                {col.links.map(l => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[13.5px] transition-colors hover:text-[var(--text)]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[12px]" style={{ color: 'var(--text-dim)' }}>
            © 2026 CreditIQ Intelligence · Made in India · Zero affiliate bias
          </p>
          <p className="text-[12px]" style={{ color: 'var(--text-dim)' }}>
            Information only. Not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================== */
/* shared                                                          */
/* ============================================================== */

function SectionHead({ eyebrow, title, link }: { eyebrow: string; title: string; link?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12 sm:mb-14">
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="gold-rule" />
          <span className="eyebrow">{eyebrow}</span>
        </div>
        <h2
          className="font-tight font-bold leading-[1.08]"
          style={{ fontSize: 'clamp(28px, 4.2vw, 44px)', letterSpacing: '-0.035em', color: 'var(--text)' }}
        >
          {title}
        </h2>
      </div>
      {link && (
        <Link
          href={link.href}
          className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold transition-colors shrink-0"
          style={{ color: 'var(--gold-bright)' }}
        >
          {link.label}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}
