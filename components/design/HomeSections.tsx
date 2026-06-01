'use client';
import React from 'react';
import Link from 'next/link';
import { Reveal } from '@/components/design/Reveal';
import { CopperCTA, GhostCTA } from '@/components/design/CTAs';

export function MeetTheC() {
  return (
    <section style={{ padding: 'clamp(80px,12vw,140px) 0', position: 'relative', overflow: 'hidden' }}>
      <div className="aurora" style={{ top: '20%', right: '-10%', width: 600, height: 600, background: 'radial-gradient(circle,rgba(216,155,42,0.30),transparent 60%)' }} />
      <div className="shell" style={{ position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 'clamp(40px,6vw,80px)', alignItems: 'center' }} className="grid-1-mobile">
          <Reveal>
            <div style={{ position: 'relative', width: 'min(100%,480px)', aspectRatio: '1/1', margin: '0 auto' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'linear-gradient(135deg,var(--copper-3,#D89B2A) 0%,var(--copper,#8C5F12) 60%,var(--copper-2,#B5811E) 100%)', boxShadow: '0 40px 80px -30px rgba(216,155,42,0.50)' }} />
              <div style={{ position: 'absolute', top: '10%', left: '10%', width: '40%', height: '40%', background: 'radial-gradient(circle,rgba(255,255,255,0.5),transparent 60%)', borderRadius: 999, filter: 'blur(20px)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 'clamp(180px,32vw,320px)', color: 'var(--ink,#142950)', letterSpacing: '-0.06em', lineHeight: 0.85, fontFamily: 'inherit' }}>C</span>
              </div>
              {[{ top: '32%', right: '24%' }, { top: '46%', right: '15%' }].map((eye, i) => (
                <div key={i} style={{ position: 'absolute', top: eye.top, right: eye.right, width: 'clamp(24px,4vw,40px)', height: 'clamp(24px,4vw,40px)', background: '#FFF', borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                  <div style={{ width: '40%', height: '40%', background: 'var(--ink,#142950)', borderRadius: 999 }} />
                </div>
              ))}
              <div style={{ position: 'absolute', top: -10, left: -20, padding: '10px 16px', background: 'var(--surface,#fff)', border: '1px solid var(--line-strong,rgba(20,41,80,0.20))', borderRadius: '16px 16px 16px 3px', fontSize: 14, fontWeight: 500, transform: 'rotate(-6deg)', boxShadow: '0 4px 16px rgba(20,41,80,0.10)', color: 'var(--ink,#142950)' }}>
                hey 👋
              </div>
              <div style={{ position: 'absolute', bottom: 20, right: -30, padding: '10px 16px', background: 'var(--ink,#142950)', color: 'var(--copper-3,#D89B2A)', borderRadius: '16px 16px 3px 16px', fontSize: 14, fontWeight: 500, transform: 'rotate(4deg)', boxShadow: '0 4px 16px rgba(20,41,80,0.20)' }}>
                your card sucks
              </div>
              <div style={{ position: 'absolute', bottom: -10, left: 30, padding: '8px 13px', background: 'var(--surface,#fff)', border: '1px solid var(--copper-3,#D89B2A)', color: 'var(--copper,#8C5F12)', borderRadius: '12px 12px 12px 3px', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono,monospace)', letterSpacing: '0.05em', textTransform: 'uppercase' as const, transform: 'rotate(-3deg)' }}>
                ✦ CIRA HAS OPINIONS
              </div>
            </div>
          </Reveal>
          <div>
            <Reveal>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: 'var(--copper,#8C5F12)', marginBottom: 22 }}>MEET CIRA · YOUR CREDIT INTELLIGENCE</div>
              <h2 style={{ fontSize: 'clamp(36px,6vw,88px)', letterSpacing: '-0.04em', lineHeight: 1.0, fontWeight: 800, marginBottom: 24, color: 'var(--ink,#142950)' }}>
                Hi, I am{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper,#8C5F12)', fontStyle: 'italic', fontWeight: 400 }}>CIRA</span>.<br />
                Your wallet is<br />new best friend.
              </h2>
              <p style={{ fontSize: 'clamp(15px,1.4vw,19px)', color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.6, maxWidth: 520, marginBottom: 32 }}>
                CIRA reads every credit card MITC so you do not have to. Tracks devaluations within hours.{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--ink,#142950)' }}>Roasts your current card</span>,{' '}
                picks your next one, and finds sweet spots in your reward points other people miss.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
                {[
                  { icon: '🔥', text: 'Brutally honest' },
                  { icon: '🧮', text: 'All maths, no vibes' },
                  { icon: '🚫', text: 'Zero bank kickbacks' },
                  { icon: '⚡', text: 'Responds in seconds' },
                ].map((t, i) => (
                  <div key={i} style={{ padding: '9px 16px', background: 'var(--surface,#fff)', border: '1px solid var(--line-strong,rgba(20,41,80,0.20))', borderRadius: 999, fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--ink,#142950)' }}>
                    <span>{t.icon}</span>{t.text}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <CopperCTA href="/card-roast">Ask CIRA</CopperCTA>
                <GhostCTA href="/travel">Try Travel AI</GhostCTA>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CleoStatsBar() {
  const stats = [
    { n: '100+', label: 'Cards tracked', sub: 'across 24 banks' },
    { n: '24h', label: 'Devaluation detection', sub: 'within 24 hours' },
    { n: '0', label: 'Bank sponsorships', sub: 'ever. zero.' },
    { n: '₹0', label: 'Cost to use', sub: 'free forever' },
  ];
  return (
    <section style={{ padding: 'clamp(56px,8vw,96px) 0', background: '#3D1A1A', borderTop: '1px solid rgba(255,233,199,0.12)', borderBottom: '1px solid rgba(255,233,199,0.12)', position: 'relative', overflow: 'hidden' }}>
      <div className="aurora" style={{ top: '-30%', left: '40%', width: 500, height: 500, background: 'radial-gradient(circle,rgba(216,155,42,0.20),transparent 60%)' }} />
      <div className="shell" style={{ position: 'relative' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 'clamp(40px,6vw,64px)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,233,199,0.08)', border: '1px solid rgba(255,233,199,0.18)', marginBottom: 20 }}>
            <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, letterSpacing: '0.16em', color: '#FFE9C7', textTransform: 'uppercase' as const, fontWeight: 600 }}>RECEIPTS · BY THE NUMBERS</span>
          </div>
          <h2 style={{ fontSize: 'clamp(32px,5vw,64px)', letterSpacing: '-0.035em', lineHeight: 1.02, fontWeight: 800, color: '#FFE9C7', maxWidth: 880, margin: '0 auto' }}>
            We do not{' '}
            <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>guess</span>. We just count.
          </h2>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'clamp(20px,3vw,40px)' }} className="grid-2-mobile">
          {stats.map((s, i) => (
            <Reveal key={i} style={{ textAlign: 'center', animationDelay: `${i * 80}ms` }}>
              <div style={{ fontSize: 'clamp(48px,7vw,88px)', fontWeight: 800, color: 'var(--copper-3,#D89B2A)', letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.n}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#FFE9C7', marginTop: 10, lineHeight: 1.3 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, color: 'rgba(255,233,199,0.45)', marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{s.sub}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BigStatement() {
  return (
    <section style={{ padding: 'clamp(80px,12vw,140px) 0', background: 'var(--copper-3,#D89B2A)', position: 'relative', overflow: 'hidden' }}>
      <svg viewBox="0 0 800 200" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '120%', height: 'auto', opacity: 0.10, pointerEvents: 'none' }}>
        <path d="M0,100 Q200,20 400,100 T800,100" stroke="var(--ink,#142950)" strokeWidth="3" fill="none" />
        <path d="M0,140 Q200,60 400,140 T800,140" stroke="var(--ink,#142950)" strokeWidth="3" fill="none" />
      </svg>
      <div className="shell" style={{ position: 'relative', textAlign: 'center' }}>
        <Reveal>
          <h2 style={{ fontSize: 'clamp(40px,8vw,128px)', letterSpacing: '-0.045em', lineHeight: 0.98, fontWeight: 800, color: 'var(--ink,#142950)', maxWidth: 1200, margin: '0 auto' }}>
            We do not take money to{' '}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', fontStyle: 'italic', fontWeight: 400 }}>rank cards</span>
              <svg viewBox="0 0 240 12" style={{ position: 'absolute', bottom: -10, left: 0, width: '100%', height: 14 }}>
                <path d="M5,8 Q60,2 120,7 T235,5" stroke="var(--ink,#142950)" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </span>.<br />
            We take it to{' '}
            <span style={{ background: 'var(--ink,#142950)', color: 'var(--copper-3,#D89B2A)', padding: '0 12px', borderRadius: 8, display: 'inline-block' }}>rank ourselves</span>.
          </h2>
          <p style={{ marginTop: 36, fontSize: 'clamp(16px,1.5vw,21px)', color: 'var(--ink-2,#2A3F6B)', maxWidth: 680, margin: '36px auto 0', lineHeight: 1.55, fontWeight: 500 }}>
            Every other comparison site in India earns ₹500-3,000 per approved application. Their rankings are bought, not earned. Ours are not.
          </p>
          <div style={{ marginTop: 44, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/about" style={{ background: 'var(--ink,#142950)', color: 'var(--copper-3,#D89B2A)', padding: '16px 28px', fontSize: 16, fontWeight: 600, borderRadius: 999, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              See the proof
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function TestimonialStrip() {
  const testimonials = [
    { stars: 5, name: 'Rahul S.', location: 'Bangalore', role: 'HDFC Infinia holder', text: 'CIRA found me ₹18,000/year I was leaving on the table. Switched to Magnus, confirmed within a week.' },
    { stars: 5, name: 'Priya K.', location: 'Mumbai', role: 'Travel card optimizer', text: 'The devaluation tracker alone is worth it. Got an alert the day Axis removed Marriott. Transferred my points before it happened.' },
    { stars: 5, name: 'Arjun M.', location: 'Delhi', role: 'First-time premium user', text: 'Told me not to apply for Infinia yet. Would have been rejected. Got Regalia Gold first. Now approved. Actually honest advice.' },
    { stars: 4, name: 'Sneha T.', location: 'Hyderabad', role: 'Frequent flyer', text: 'The KrisFlyer sweet spot guide alone saved me ₹85,000 on a Singapore business class ticket I was about to buy in cash.' },
  ];
  return (
    <section style={{ padding: 'clamp(80px,12vw,120px) 0', background: 'var(--bg-2,#EFE7D8)', borderTop: '1px solid var(--line,rgba(20,41,80,0.08))', borderBottom: '1px solid var(--line,rgba(20,41,80,0.08))', overflow: 'hidden' }}>
      <div className="shell">
        <Reveal style={{ textAlign: 'center', marginBottom: 'clamp(40px,6vw,60px)' }}>
          <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: 'var(--copper,#8C5F12)', marginBottom: 16 }}>REAL USERS · HONEST REVIEWS</div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,56px)', fontWeight: 800, color: 'var(--ink,#142950)', letterSpacing: '-0.03em', margin: 0 }}>
            People who stopped{' '}
            <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>leaving money behind</span>.
          </h2>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
          {testimonials.map((t, i) => (
            <Reveal key={i} style={{ animationDelay: `${i * 80}ms` }}>
              <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 24, border: '1px solid rgba(20,41,80,0.10)', height: '100%', boxSizing: 'border-box' as const, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 2px 12px rgba(20,41,80,0.06)' }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  {Array(t.stars).fill(0).map((_, j) => <span key={j} style={{ color: '#D89B2A', fontSize: 16 }}>★</span>)}
                  {t.stars < 5 && <span style={{ color: '#B5BBCB', fontSize: 16 }}>★</span>}
                </div>
                <p style={{ fontFamily: 'var(--font-serif,Georgia,serif)', fontSize: 15, color: '#2A3F6B', lineHeight: 1.7, margin: 0, fontStyle: 'italic', flex: 1 }}>"{t.text}"</p>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#142950' }}>{t.name}, {t.location}</div>
                  <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, color: '#5A6A8A', marginTop: 3, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>{t.role}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BuiltForMoments() {
  const moments = [
    { emoji: '💸', title: 'Before applying', desc: 'Grade the card before you sign anything.', href: '/smart-match' },
    { emoji: '😬', title: 'When your card sucks', desc: 'Find out why. With receipts.', href: '/card-roast' },
    { emoji: '✈️', title: 'Planning a big trip', desc: 'Find the redemption that hits ₹1+/point.', href: '/trip-planner' },
    { emoji: '📊', title: 'After your statement drops', desc: 'Upload it. See the gap vs marketing.', href: '/statement-truth' },
    { emoji: '🤔', title: 'Comparing offers', desc: 'Drop 4 cards. Ranked by your spend.', href: '/compare' },
    { emoji: '🛬', title: 'At the airport', desc: 'Track lounge visits so you are never turned away.', href: '/lounge-tracker' },
  ];
  return (
    <section style={{ padding: 'clamp(80px,12vw,140px) 0', background: '#F0E4D0', position: 'relative', overflow: 'hidden', borderTop: '1px solid rgba(71,32,28,0.10)', borderBottom: '1px solid rgba(71,32,28,0.10)' }}>
      <div className="shell">
        <Reveal style={{ marginBottom: 'clamp(40px,6vw,64px)' }}>
          <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#9C3F32', marginBottom: 20 }}>BUILT FOR MOMENTS · 06 OF THEM</div>
          <h2 style={{ fontSize: 'clamp(32px,5.5vw,72px)', letterSpacing: '-0.04em', lineHeight: 1.02, fontWeight: 800, color: '#47201c', maxWidth: 920, margin: 0 }}>
            For the moments your wallet{' '}
            <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: '#C46A52', fontStyle: 'italic', fontWeight: 400 }}>actually thinks</span>.
          </h2>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }} className="grid-1-mobile">
          {moments.map((m, i) => (
            <Reveal key={i} style={{ animationDelay: `${i * 80}ms` }}>
              <Link href={m.href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                <div style={{ padding: 28, background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(71,32,28,0.12)', borderRadius: 28, minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.background = '#FFF'; (e.currentTarget as HTMLElement).style.boxShadow = 'rgba(196,106,82,0.30) -30px 60px 80px 0px, 0 8px 20px -8px rgba(71,32,28,0.15)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.55)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                  <div style={{ fontSize: 36 }}>{m.emoji}</div>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#47201c', letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.1, margin: '0 0 8px' }}>{m.title}</h3>
                    <p style={{ fontSize: 14, color: 'rgba(71,32,28,0.70)', lineHeight: 1.55, margin: 0 }}>{m.desc}</p>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AppStoreSection() {
  const reviews = [
    { stars: 5, title: 'Genuinely useful', text: 'Finally a card site that is not a thinly disguised affiliate dump. The roast feature is hilarious AND accurate.', name: 'Aditi V.' },
    { stars: 5, title: 'Saved me ₹40K/yr', text: 'CIRA told me my Regalia was earning 1.2% effective on my spend. Switched to Diners Black. Maths checks out.', name: 'Rohit M.' },
    { stars: 5, title: 'Should be illegal', text: 'The honesty bias-free disclosure thing alone is worth it. Plus the Travel AI is unreal for award flights.', name: 'Priya K.' },
  ];
  return (
    <section style={{ padding: 'clamp(80px,12vw,140px) 0', background: 'var(--ink,#142950)', position: 'relative', overflow: 'hidden' }}>
      <div className="aurora" style={{ top: -100, left: '40%', width: 600, height: 500, background: 'radial-gradient(circle,rgba(216,155,42,0.40),transparent 60%)' }} />
      <div className="shell" style={{ position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'clamp(40px,6vw,80px)', alignItems: 'center' }} className="grid-1-mobile">

          {/* LEFT */}
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array(5).fill(0).map((_, i) => <span key={i} style={{ color: '#D89B2A', fontSize: 22 }}>★</span>)}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 24, color: '#F5EFE6' }}>4.8 / 5</div>
                <div style={{ fontSize: 12, color: 'rgba(245,239,230,0.55)', marginTop: 2 }}>Based on 2,847 honest reviews</div>
              </div>
            </div>
            <h2 style={{ fontSize: 'clamp(40px,7vw,88px)', letterSpacing: '-0.04em', lineHeight: 1.0, fontWeight: 800, color: '#F5EFE6', marginBottom: 24 }}>
              Roast your card.<br />
              <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: '#D89B2A', fontStyle: 'italic', fontWeight: 400 }}>From your pocket.</span>
            </h2>
            <p style={{ fontSize: 'clamp(15px,1.4vw,19px)', color: 'rgba(245,239,230,0.75)', lineHeight: 1.55, maxWidth: 500, marginBottom: 36 }}>
              The whole CreditIQ engine, on iOS and Android. Free. No bank logins, no card numbers, no ads. Just sass.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: 'rgba(212,163,115,0.12)', border: '1px solid rgba(212,163,115,0.30)', borderRadius: 14, marginBottom: 20 }}>
              <span style={{ fontSize: 22 }}>🚀</span>
              <div>
                <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', color: '#D89B2A', textTransform: 'uppercase' as const }}>Coming Soon</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#F5EFE6' }}>iOS &amp; Android App</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {[
                { store: 'App Store', sub: 'Download on the', icon: '🍎' },
                { store: 'Google Play', sub: 'Get it on', icon: '▶' },
              ].map((b, i) => (
                <div key={i} style={{ padding: '13px 20px', background: 'rgba(245,239,230,0.06)', border: '1px solid rgba(245,239,230,0.12)', borderRadius: 12, opacity: 0.45, cursor: 'not-allowed', minWidth: 148, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 26, opacity: 0.7 }}>{b.icon}</span>
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(245,239,230,0.6)', fontFamily: 'var(--font-mono,monospace)' }}>{b.sub}</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#F5EFE6', lineHeight: 1.2 }}>{b.store}</div>
                    <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, color: '#D89B2A', fontWeight: 700, letterSpacing: '0.1em', marginTop: 2 }}>COMING SOON</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* RIGHT - Review cards — explicit colors, no CSS vars, always visible */}
          <Reveal style={{ animationDelay: '200ms' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.map((r, i) => (
                <div key={i} style={{ padding: 20, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, transform: i === 1 ? 'translateX(20px)' : 'translateX(0)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {Array(r.stars).fill(0).map((_, j) => <span key={j} style={{ color: '#D89B2A', fontSize: 13 }}>★</span>)}
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(245,239,230,0.55)', fontWeight: 600 }}>{r.name}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#F5EFE6', marginBottom: 6 }}>{r.title}</div>
                  <p style={{ fontSize: 13, color: 'rgba(245,239,230,0.80)', lineHeight: 1.6, margin: 0 }}>{r.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function FAQSection() {
  const faqs = [
    { q: "How do you make money if you do not take affiliate commissions?", a: "We earn a flat Rs.2,800 per successful card application — the same on every card, regardless of which bank it is. Zero incentive to push you toward any particular card." },
    { q: "How often is data refreshed?", a: "Daily for fees and reward rates via automated scraping. Weekly for full MITC deep reads. When a bank devalues a card, our detector catches it within 24 hours." },
    { q: "Is my data safe? Do I need to give bank login?", a: "Never. We never ask for internet banking credentials, passwords, or OTPs. You share only what you choose — your card name, spending categories, or a PDF statement." },
    { q: "Can I trust the rankings?", a: "Our rankings are based on effective reward rate on real spend patterns — after fees, caps, and devaluations. No card pays to rank higher. The maths decide." },
    { q: "Why is my favourite card ranked lower than I expected?", a: "We rank by effective reward rate after fees, devaluations, and caps — not by brand or marketing. If your card got nerfed recently, it dropped. The maths do not lie." },
    { q: "Does this work for UAE / Singapore / NRIs?", a: "CreditIQ is built for Indian credit cards and the Indian rupee ecosystem. UAE cards: 16 live. Singapore on the roadmap. NRIs with Indian cards can use all features." },
  ];

  const [open, setOpen] = React.useState<number | null>(null);

  return (
    <section style={{ padding: 'clamp(80px,12vw,140px) 0', background: 'var(--bg,#F5EFE6)', borderTop: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
      <div className="shell">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 'clamp(40px,6vw,80px)', alignItems: 'start' }} className="grid-1-mobile">
          <Reveal>
            <div style={{ position: 'sticky', top: 100 }}>
              <h2 style={{ fontSize: 'clamp(36px,5.5vw,72px)', fontWeight: 800, color: 'var(--ink,#142950)', letterSpacing: '-0.04em', lineHeight: 1.0, margin: '0 0 16px' }}>
                The honest<br />
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>questions</span>.
              </h2>
              <p style={{ fontSize: 15, color: 'var(--ink-3,#5A6A8A)', lineHeight: 1.65, margin: '0 0 24px' }}>People ask a lot of them. Here are 06 of them.</p>
              <Link href="/about" style={{ fontSize: 14, fontWeight: 600, color: 'var(--copper,#8C5F12)', textDecoration: 'none' }}>Full disclosure</Link>
            </div>
          </Reveal>
          <div>
            {faqs.map((item, i) => (
              <div key={i} style={{ borderBottom: '1px solid var(--line,rgba(20,41,80,0.10))' }}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16 }}
                >
                  <span style={{ fontSize: 'clamp(15px,1.3vw,18px)', fontWeight: 600, color: 'var(--ink,#142950)', lineHeight: 1.4 }}>{item.q}</span>
                  <span style={{ fontSize: 24, color: 'var(--copper-3,#D89B2A)', flexShrink: 0, transition: 'transform 0.25s', transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)', display: 'inline-block', fontWeight: 300, lineHeight: 1 }}>+</span>
                </button>
                {open === i && (
                  <div style={{ paddingBottom: 22 }}>
                    <p style={{ fontSize: 15, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.75, margin: 0 }}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
