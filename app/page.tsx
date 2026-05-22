'use client';

import { useRef, useState, useEffect, type ReactNode, type CSSProperties } from 'react';
import Link from 'next/link';
import {
  motion,
  useMotionValue,
  useTransform,
  useMotionTemplate,
  useSpring,
  useInView,
  animate,
  type Variants,
} from 'motion/react';
import {
  ArrowRight, ArrowUpRight, Flame, Plane, Target, Wallet, FileText, Activity,
  ShieldCheck, Eye, Radio, Layers, CreditCard, UtensilsCrossed, Crown,
  BadgePercent, Fuel, ShoppingBag, Compass, Repeat,
} from 'lucide-react';
import { Header } from '@/components/Header';

/* ============================================================
   shared motion tokens
   ============================================================ */
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
const fadeUp: Variants = {
  hidden: { y: 30, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: EASE_OUT } },
};
const blurUp: Variants = {
  hidden: { y: 34, opacity: 0, filter: 'blur(8px)' },
  visible: { y: 0, opacity: 1, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE_OUT } },
};

/* ============================================================
   shell
   ============================================================ */
export default function HomePage() {
  return (
    <main className="relative min-h-screen mobile-tabbar-pad" style={{ background: '#08080E' }}>
      <Header />
      <MeshBackground />
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

/* ============================================================
   background — radial mesh + grain
   ============================================================ */
function MeshBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(900px circle at 18% -10%, rgba(27,58,92,0.34), transparent 55%),' +
            'radial-gradient(720px circle at 92% 28%, rgba(201,151,46,0.10), transparent 55%),' +
            'radial-gradient(820px circle at 65% 88%, rgba(27,58,92,0.22), transparent 55%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 220 220' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

/* ============================================================
   primitives
   ============================================================ */
function CountUp({
  to,
  duration = 1.6,
  suffix = '',
}: {
  to: number;
  duration?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const inView = useInView(ref, { once: true, margin: '-15%' });
  const [val, setVal] = useState(0);

  useEffect(() => mv.on('change', v => setVal(Math.round(v))), [mv]);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, { duration, ease: EASE_OUT });
    return () => controls.stop();
  }, [inView, to, duration, mv]);

  return (
    <span ref={ref} className="tabular-nums">
      {val.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}

function Magnetic({
  href,
  className,
  style,
  children,
}: {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 240, damping: 22, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 240, damping: 22, mass: 0.6 });

  function onMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.18);
    y.set((e.clientY - cy) * 0.18);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy, display: 'inline-block' }}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
      >
        <Link href={href} className={className} style={style}>
          {children}
        </Link>
      </motion.div>
    </motion.div>
  );
}

function SectionHead({
  eyebrow,
  title,
  link,
}: {
  eyebrow: string;
  title: string;
  link?: { href: string; label: string };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15%' }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
      className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12 sm:mb-14"
    >
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="gold-rule" />
          <span className="eyebrow">{eyebrow}</span>
        </div>
        <h2
          className="font-syne font-bold leading-[1.08]"
          style={{ fontSize: 'clamp(28px, 4.2vw, 44px)', letterSpacing: '-0.035em', color: '#f5f5f6' }}
        >
          {title}
        </h2>
      </div>
      {link && (
        <Link
          href={link.href}
          className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold shrink-0"
          style={{ color: 'var(--gold-bright)' }}
        >
          {link.label}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </motion.div>
  );
}

/* ============================================================
   1. HERO — word stagger + 3D card + magnetic CTAs
   ============================================================ */
const HERO_WORDS = ['Stop', 'leaving', '__money__', 'on', 'the', 'table', 'every', 'year.'];

function Hero() {
  return (
    <section className="relative z-10 overflow-hidden pt-14 sm:pt-20 lg:pt-28 pb-20 sm:pb-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-20 items-center">
          {/* left: copy */}
          <div className="lg:col-span-7">
            <motion.div
              className="flex items-center gap-3 mb-7"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7 }}
            >
              <span className="gold-rule" />
              <span className="eyebrow" style={{ color: 'rgba(255,255,255,0.6)' }}>
                India · zero affiliate bias
              </span>
            </motion.div>

            <motion.h1
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="font-syne font-bold leading-[1.02] mb-7"
              style={{
                fontSize: 'clamp(40px, 7.4vw, 80px)',
                letterSpacing: '-0.04em',
                color: '#f5f5f6',
              }}
            >
              {HERO_WORDS.map((w, i) => (
                <span key={i} className="inline-block overflow-hidden align-bottom mr-[0.22em] last:mr-0">
                  <motion.span variants={blurUp} className="inline-block">
                    {w === '__money__' ? (
                      <span
                        className="whitespace-nowrap"
                        style={{
                          background:
                            'linear-gradient(180deg, #f0c060 0%, #C9972E 55%, #855e1c 100%)',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          filter: 'drop-shadow(0 0 28px rgba(201,151,46,0.22))',
                        }}
                      >
                        ₹<CountUp to={40000} duration={1.8} />
                      </span>
                    ) : (
                      w
                    )}
                  </motion.span>
                </span>
              ))}
            </motion.h1>

            <motion.p
              initial={{ y: 22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.95, duration: 0.7, ease: EASE_OUT }}
              className="text-[17px] sm:text-[19px] leading-relaxed max-w-[560px] mb-10"
              style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '-0.005em' }}
            >
              CreditIQ is India&apos;s first AI engine that picks the right credit card for your
              real spend — without taking a cut from the banks. Compare, optimise, and stop bleeding
              points to silent devaluations.
            </motion.p>

            <motion.div
              initial={{ y: 22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6, ease: EASE_OUT }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-14"
            >
              <Magnetic
                href="/smart-match"
                className="btn-gold"
                style={{ minHeight: 56, padding: '16px 26px', fontSize: '15px' }}
              >
                Find my best card
                <ArrowRight className="w-4 h-4" />
              </Magnetic>
              <Magnetic
                href="/card-roast"
                className="btn-outline-light"
                style={{ minHeight: 56, padding: '16px 26px', fontSize: '15px' }}
              >
                <Flame className="w-4 h-4" style={{ color: 'var(--gold-bright)' }} />
                Roast my card
              </Magnetic>
            </motion.div>

            {/* trust stats — count up on view */}
            <motion.dl
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-10%' }}
              className="grid grid-cols-3 max-w-[480px] gap-6 sm:gap-8"
            >
              {[
                { to: 93, suffix: '+', label: 'Cards tracked' },
                { to: 17, suffix: '', label: 'Banks covered' },
                { to: 0, suffix: '', label: 'Affiliate dollars' },
              ].map(s => (
                <motion.div key={s.label} variants={fadeUp} className="flex flex-col gap-1">
                  <dt
                    className="font-syne text-[28px] sm:text-[32px] font-bold"
                    style={{ color: '#f5f5f6', letterSpacing: '-0.03em' }}
                  >
                    <CountUp to={s.to} suffix={s.suffix} duration={1.2} />
                  </dt>
                  <dd
                    className="text-[11px] uppercase tracking-[0.16em] font-medium"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    {s.label}
                  </dd>
                </motion.div>
              ))}
            </motion.dl>
          </div>

          {/* right: 3D card */}
          <div className="hidden lg:block lg:col-span-5">
            <Hero3DCard />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   3D mouse-tilt card with mouse-tracking shine
   ============================================================ */
function Hero3DCard() {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const smx = useSpring(mx, { stiffness: 140, damping: 18, mass: 0.6 });
  const smy = useSpring(my, { stiffness: 140, damping: 18, mass: 0.6 });
  const rotateY = useTransform(smx, [0, 1], [-14, 14]);
  const rotateX = useTransform(smy, [0, 1], [12, -12]);
  const shineX = useTransform(smx, [0, 1], ['0%', '100%']);
  const shineY = useTransform(smy, [0, 1], ['0%', '100%']);
  const shineBg = useMotionTemplate`radial-gradient(220px circle at ${shineX} ${shineY}, rgba(255,255,255,0.22), transparent 60%)`;

  function onMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  }
  function onLeave() {
    mx.set(0.5);
    my.set(0.5);
  }

  return (
    <div style={{ perspective: 1200 }} className="flex justify-center">
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        initial={{ opacity: 0, y: 40, rotateZ: -3 }}
        animate={{ opacity: 1, y: 0, rotateZ: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: EASE_OUT }}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d', width: '100%', maxWidth: 420 }}
        className="relative aspect-[1.586/1] rounded-[22px]"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-[22px] overflow-hidden"
          style={{
            background:
              'linear-gradient(140deg, #0F2540 0%, #1B3A5C 45%, #06111F 100%)',
            boxShadow:
              '0 40px 120px -30px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06) inset',
          }}
        >
          {/* gold corner glow */}
          <div
            className="absolute -top-24 -right-24 w-64 h-64 rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgba(201,151,46,0.38), transparent)' }}
          />

          {/* hairline */}
          <div
            className="absolute top-12 left-7 right-7 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)' }}
          />

          {/* chip */}
          <div
            className="absolute left-7 top-[26%] w-12 h-9 rounded-md"
            style={{
              background: 'linear-gradient(135deg, #f0c060, #C9972E 50%, #855e1c)',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.3) inset, 0 -1px 0 rgba(0,0,0,0.3) inset',
            }}
          >
            <div
              className="absolute inset-[3px] rounded-sm"
              style={{
                background:
                  'linear-gradient(135deg, transparent 40%, rgba(0,0,0,0.18) 50%, transparent 60%)',
              }}
            />
          </div>

          {/* contactless */}
          <svg
            className="absolute right-7 top-[26%] w-7 h-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.72)"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <path d="M5 8c4 4 4 8 0 12" />
            <path d="M9 6c5 5 5 11 0 16" />
            <path d="M13 4c6 6 6 14 0 20" />
          </svg>

          {/* number */}
          <div
            className="absolute left-7 right-7 top-[55%] flex items-center gap-3 font-mono tabular-nums"
            style={{ color: 'rgba(255,255,255,0.86)', letterSpacing: '0.18em', fontSize: 17 }}
          >
            <span>••••</span>
            <span>••••</span>
            <span>••••</span>
            <span style={{ color: '#e0b94c' }}>2026</span>
          </div>

          {/* footer */}
          <div className="absolute left-7 right-7 bottom-6 flex items-end justify-between">
            <div>
              <div
                className="text-[9px] uppercase tracking-[0.2em] font-medium"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Premium member
              </div>
              <div
                className="font-syne font-bold text-[16px] mt-1"
                style={{ color: '#f5f5f6', letterSpacing: '-0.01em' }}
              >
                CreditIQ Intelligence
              </div>
            </div>
            <div className="text-right">
              <div
                className="text-[9px] uppercase tracking-[0.2em] font-medium"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Saved
              </div>
              <div
                className="font-syne font-bold text-[14px] mt-1"
                style={{ color: '#e0b94c' }}
              >
                ₹38.4k/yr
              </div>
            </div>
          </div>

          {/* mouse-tracking shine */}
          <motion.div
            className="absolute inset-0 pointer-events-none mix-blend-screen"
            style={{ background: shineBg }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ============================================================
   2. TICKER — continuous translate
   ============================================================ */
const TICKER_ITEMS = [
  'Axis Magnus · Yatra capped at ₹15k/mo',
  'HDFC Smartbuy · Cleartrip points cut 50%',
  'ICICI Emeralde · Lounge access trimmed to 4/qtr',
  'SBI Elite · Vistara waiver removed',
  'Amex MRCC · MakeMyTrip points devalued 30%',
  'Axis Atlas · Edge Miles capped on hotels',
  'HDFC Diners · 10× removed on Tata Neu',
  'Citi PremierMiles · Programme migrated to Axis',
];

function DevaluationTicker() {
  return (
    <section className="ticker-amber relative z-10" aria-label="Recent devaluations">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3 flex items-center gap-5">
        <span className="badge badge-crimson shrink-0">
          <Radio className="w-3 h-3" />
          Devaluation watch
        </span>
        <div className="overflow-hidden flex-1">
          <motion.div
            className="flex gap-12 whitespace-nowrap will-change-transform"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          >
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-3 text-[13px] font-medium"
                style={{ color: 'var(--text)' }}
              >
                <span style={{ color: 'var(--amber)' }}>●</span>
                {t}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   3. JOURNEY CARDS — whileHover y:-8 + glow
   ============================================================ */
const JOURNEYS = [
  {
    href: '/smart-match',
    eyebrow: 'Start here',
    title: 'Find my card',
    body: 'Tell us your spend in 90 seconds. We rank every card by what you actually keep — net of fees, GST, breakage.',
    Icon: Target,
    cta: 'Match my spend',
    accent: 'gold' as const,
    glow: 'rgba(201,151,46,0.28)',
  },
  {
    href: '/card-roast',
    eyebrow: 'Already have one?',
    title: 'Roast my card',
    body: "Drop your current card. Our AI auditor compares it against the 93-card universe and tells you, bluntly, what you're losing.",
    Icon: Flame,
    cta: 'Get the roast',
    accent: 'crimson' as const,
    glow: 'rgba(251,113,133,0.24)',
  },
  {
    href: '/travel',
    eyebrow: 'Going abroad?',
    title: 'Travel smarter',
    body: 'Forex, lounges, transfer partners, devaluation alerts. The travel-points playbook built for Indian wallets.',
    Icon: Plane,
    cta: 'Plan a trip',
    accent: 'navy' as const,
    glow: 'rgba(47,87,131,0.34)',
  },
];

function StartHere() {
  return (
    <section className="relative z-10 py-20 sm:py-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHead eyebrow="Three ways in" title="Start where you are" />
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
          className="grid md:grid-cols-3 gap-5 sm:gap-6"
        >
          {JOURNEYS.map(j => (
            <motion.div key={j.href} variants={fadeUp}>
              <motion.div
                whileHover={{ y: -8, boxShadow: `0 30px 60px -20px ${j.glow}` }}
                transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                className="rounded-2xl"
              >
                <Link
                  href={j.href}
                  className="block p-7 sm:p-8 rounded-2xl group h-full"
                  style={{
                    background: '#111118',
                    border: '1px solid rgba(255,255,255,0.07)',
                    minHeight: 280,
                  }}
                >
                  <div className="flex flex-col h-full">
                    <span className="eyebrow mb-5">{j.eyebrow}</span>
                    <div
                      className="w-12 h-12 rounded-xl mb-5 flex items-center justify-center"
                      style={{
                        background:
                          j.accent === 'gold'
                            ? 'color-mix(in srgb, var(--gold) 16%, transparent)'
                            : j.accent === 'crimson'
                            ? 'color-mix(in srgb, var(--crimson) 14%, transparent)'
                            : 'color-mix(in srgb, var(--navy) 22%, transparent)',
                        color:
                          j.accent === 'gold'
                            ? 'var(--gold-bright)'
                            : j.accent === 'crimson'
                            ? 'var(--crimson)'
                            : 'var(--navy-bright)',
                      }}
                    >
                      <j.Icon className="w-5 h-5" />
                    </div>
                    <h3
                      className="font-syne font-bold text-[26px] mb-3 leading-tight"
                      style={{ color: '#f5f5f6', letterSpacing: '-0.025em' }}
                    >
                      {j.title}
                    </h3>
                    <p
                      className="text-[14.5px] leading-relaxed mb-7 flex-1"
                      style={{ color: 'rgba(255,255,255,0.62)' }}
                    >
                      {j.body}
                    </p>
                    <span
                      className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold"
                      style={{ color: 'var(--gold-bright)' }}
                    >
                      {j.cta}
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   4. AI TOOLS — staggered grid, whileHover scale 1.02
   ============================================================ */
const AI_TOOLS = [
  {
    href: '/smart-match',
    label: 'Card Match AI',
    blurb: 'AI ranks every card by your real spend.',
    Icon: Target,
    badge: { text: 'Most used', tone: 'gold' as const },
  },
  {
    href: '/card-roast',
    label: 'Card Roast',
    blurb: 'Brutally honest audit of your current card.',
    Icon: Flame,
    badge: { text: '🔥 Viral', tone: 'crimson' as const },
  },
  {
    href: '/statement-truth',
    label: 'Statement Truth',
    blurb: 'Upload a statement. See what you actually earned.',
    Icon: FileText,
    badge: { text: 'New', tone: 'emerald' as const },
  },
  {
    href: '/card-switch',
    label: 'Switch Wizard',
    blurb: 'Step-by-step migration plan, with fee waivers in mind.',
    Icon: Repeat,
    badge: null,
  },
  {
    href: '/travel',
    label: 'Travel AI',
    blurb: 'Transfer partners, forex, lounges, devaluation alerts.',
    Icon: Plane,
    badge: null,
  },
  {
    href: '/lounge-tracker',
    label: 'Lounge Tracker',
    blurb: 'Live lounge availability across India.',
    Icon: Activity,
    badge: null,
  },
];

function AITools() {
  return (
    <section
      className="relative z-10 py-20 sm:py-24"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHead
          eyebrow="AI Tools"
          title="Six engines. One unfair advantage."
          link={{ href: '/smart-match', label: 'Open the toolkit' }}
        />
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
        >
          {AI_TOOLS.map(t => (
            <motion.div
              key={t.href}
              variants={fadeUp}
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            >
              <Link
                href={t.href}
                className="block p-6 sm:p-7 rounded-2xl relative group h-full"
                style={{
                  background: '#111118',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
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
                  {t.badge && <span className={`badge badge-${t.badge.tone}`}>{t.badge.text}</span>}
                </div>
                <h3
                  className="font-syne font-bold text-[19px] mb-2 leading-tight"
                  style={{ color: '#f5f5f6', letterSpacing: '-0.02em' }}
                >
                  {t.label}
                </h3>
                <p
                  className="text-[13.5px] leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.62)' }}
                >
                  {t.blurb}
                </p>
                <ArrowUpRight
                  className="absolute top-6 right-6 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   5. CATEGORIES
   ============================================================ */
const CATEGORIES = [
  { label: 'Travel',     href: '/cards?cat=travel',     Icon: Plane },
  { label: 'Cashback',   href: '/cards?cat=cashback',   Icon: BadgePercent },
  { label: 'Free Cards', href: '/cards?cat=free',       Icon: Wallet },
  { label: 'Dining',     href: '/cards?cat=dining',     Icon: UtensilsCrossed },
  { label: 'Premium',    href: '/cards?cat=premium',    Icon: Crown },
  { label: 'Fuel',       href: '/cards?cat=fuel',       Icon: Fuel },
  { label: 'Shopping',   href: '/cards?cat=shopping',   Icon: ShoppingBag },
  { label: 'Beginners',  href: '/cards?cat=beginners',  Icon: Compass },
];

function Categories() {
  return (
    <section className="relative z-10 py-20 sm:py-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHead eyebrow="Browse" title="Pick by what you actually do." />
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
          className="flex flex-wrap gap-2.5 sm:gap-3"
        >
          {CATEGORIES.map(c => (
            <motion.div
              key={c.label}
              variants={fadeUp}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            >
              <Link href={c.href} className="pill">
                <c.Icon className="w-4 h-4" style={{ color: 'var(--gold-bright)' }} />
                {c.label}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   6. TOP CARDS — count-up on value
   ============================================================ */
const TOP_CARDS = [
  {
    bank: 'HDFC',
    name: 'Infinia (Metal)',
    category: 'Super premium',
    value: 62000,
    highlight: '5× Smartbuy + lounge unlimited',
    tone: 'gold' as const,
  },
  {
    bank: 'Axis',
    name: 'Magnus Burgundy',
    category: 'Travel',
    value: 48500,
    highlight: 'EDGE Miles · 1:5 transfer ratios',
    tone: 'gold' as const,
  },
  {
    bank: 'ICICI',
    name: 'Emeralde Private Metal',
    category: 'Premium',
    value: 52000,
    highlight: '6 LPP + Taj Epicure',
    tone: 'gold' as const,
  },
  {
    bank: 'SBI',
    name: 'Cashback',
    category: 'Cashback',
    value: 18000,
    highlight: 'Flat 5% online · ₹999 fee',
    tone: 'plain' as const,
  },
  {
    bank: 'Amex',
    name: 'Platinum Travel',
    category: 'Travel',
    value: 22400,
    highlight: 'Milestone vouchers · Taj stay',
    tone: 'plain' as const,
  },
  {
    bank: 'Tata',
    name: 'Neu Infinity',
    category: 'Lifestyle',
    value: 16800,
    highlight: '5% NeuCoins · UPI rewards',
    tone: 'plain' as const,
  },
];

function TopCards() {
  return (
    <section
      className="relative z-10 py-20 sm:py-24"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHead
          eyebrow="Top 6 — May 2026"
          title="The cards holding their value this quarter."
          link={{ href: '/cards', label: 'See all 93+ cards' }}
        />
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
        >
          {TOP_CARDS.map((c, i) => (
            <motion.div
              key={c.name}
              variants={fadeUp}
              whileHover={{ y: -6, boxShadow: '0 30px 60px -20px rgba(201,151,46,0.18)' }}
              transition={{ type: 'spring', stiffness: 240, damping: 22 }}
              className="rounded-2xl"
            >
              <Link
                href="/cards"
                className={`block p-6 sm:p-7 rounded-2xl relative group h-full ${
                  c.tone === 'gold' ? 'card-gold-edge' : ''
                }`}
                style={{
                  background: '#111118',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div className="flex items-start justify-between mb-5">
                  <span className="eyebrow">{c.bank}</span>
                  <span
                    className="font-syne text-[11px] font-bold tabular-nums"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    #{i + 1}
                  </span>
                </div>
                <h3
                  className="font-syne font-bold text-[22px] mb-1 leading-tight"
                  style={{ color: '#f5f5f6', letterSpacing: '-0.025em' }}
                >
                  {c.name}
                </h3>
                <p
                  className="text-[12px] uppercase tracking-[0.14em] mb-6 font-medium"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  {c.category}
                </p>
                <div className="mb-6">
                  <div
                    className="text-[11px] uppercase tracking-[0.14em] mb-1 font-medium"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                  >
                    Real annual value
                  </div>
                  <div
                    className="font-syne font-bold text-[32px] leading-none"
                    style={{
                      color: c.tone === 'gold' ? 'var(--gold-bright)' : '#f5f5f6',
                      letterSpacing: '-0.025em',
                    }}
                  >
                    ₹<CountUp to={c.value} duration={1.4} />
                  </div>
                </div>
                <p
                  className="text-[13.5px] leading-relaxed mb-6"
                  style={{ color: 'rgba(255,255,255,0.62)' }}
                >
                  {c.highlight}
                </p>
                <span
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
                  style={{ color: 'var(--gold-bright)' }}
                >
                  See details
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   7. TRUST — pillars with stagger reveal
   ============================================================ */
const PILLARS = [
  {
    Icon: ShieldCheck,
    title: 'Zero affiliate bias',
    body: 'We earn from Premium subscribers, never from the banks. Rankings can\'t be bought.',
  },
  {
    Icon: Eye,
    title: 'Real annual value',
    body: 'Every rupee is net of fee, GST, lounge cap, breakage and forex spread.',
  },
  {
    Icon: Radio,
    title: 'Live devaluation tracking',
    body: 'When an issuer cuts rewards, you\'re alerted before your next billing cycle.',
  },
  {
    Icon: Layers,
    title: '93+ cards · 17 banks',
    body: 'India\'s deepest catalogue, refreshed weekly with primary-source documentation.',
  },
];

function Trust() {
  return (
    <section
      className="bg-trust-navy relative overflow-hidden z-10"
      style={{ color: 'var(--on-navy)' }}
    >
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(201,151,46,0.5), transparent)' }}
      />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          className="max-w-3xl mb-14"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="gold-rule" />
            <span className="eyebrow" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Why CreditIQ exists
            </span>
          </div>
          <h2
            className="font-syne font-bold leading-[1.05]"
            style={{ fontSize: 'clamp(32px, 5vw, 56px)', letterSpacing: '-0.035em' }}
          >
            Every card comparison site in India is paid by the banks.
            <span className="block mt-3" style={{ color: 'var(--gold-bright)' }}>
              We are not.
            </span>
          </h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
        >
          {PILLARS.map(p => (
            <motion.div key={p.title} variants={fadeUp} className="flex flex-col">
              <div
                className="w-11 h-11 rounded-xl mb-5 flex items-center justify-center"
                style={{
                  background: 'rgba(201,151,46,0.16)',
                  color: 'var(--gold-bright)',
                  border: '1px solid rgba(201,151,46,0.32)',
                }}
              >
                <p.Icon className="w-5 h-5" />
              </div>
              <h3
                className="font-syne font-bold text-[18px] mb-2 leading-tight"
                style={{ color: 'var(--on-navy)', letterSpacing: '-0.02em' }}
              >
                {p.title}
              </h3>
              <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {p.body}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="mt-16 pt-10 border-t flex flex-col sm:flex-row gap-6 sm:items-end sm:justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.12)' }}
        >
          <div>
            <div className="eyebrow mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Ready when you are
            </div>
            <p
              className="font-syne font-bold text-[24px] sm:text-[28px] leading-tight max-w-md"
              style={{ letterSpacing: '-0.025em' }}
            >
              90 seconds. Honest answer.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Magnetic href="/smart-match" className="btn-gold" style={{ minHeight: 52 }}>
              Find my best card
              <ArrowRight className="w-4 h-4" />
            </Magnetic>
            <Magnetic href="/about" className="btn-outline-light" style={{ minHeight: 52 }}>
              Read the manifesto
            </Magnetic>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   8. FOOTER
   ============================================================ */
const FOOTER_COLS = [
  {
    title: 'Product',
    links: [
      { href: '/smart-match', label: 'Card Match AI' },
      { href: '/card-roast', label: 'Card Roast' },
      { href: '/compare', label: 'Compare' },
      { href: '/best-cards', label: 'Best cards' },
    ],
  },
  {
    title: 'AI Tools',
    links: [
      { href: '/statement-truth', label: 'Statement Truth' },
      { href: '/card-switch', label: 'Switch Wizard' },
      { href: '/travel', label: 'Travel AI' },
      { href: '/lounge-tracker', label: 'Lounge Tracker' },
    ],
  },
  {
    title: 'Browse',
    links: [
      { href: '/cards', label: 'All cards' },
      { href: '/travel', label: 'Travel' },
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
    <footer className="relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 sm:pt-20 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4" style={{ color: 'var(--gold-bright)' }} />
              <span
                className="font-syne font-bold text-[17px]"
                style={{ color: '#f5f5f6', letterSpacing: '-0.02em' }}
              >
                CreditIQ
              </span>
            </div>
            <p
              className="text-[13px] leading-relaxed max-w-[240px]"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
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
                      className="text-[13.5px] transition-colors hover:text-white"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          className="pt-8 border-t flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            © 2026 CreditIQ Intelligence · Made in India · Zero affiliate bias
          </p>
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Information only. Not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
