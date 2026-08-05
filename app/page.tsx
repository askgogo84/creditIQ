'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { SpendProvider } from '@/components/marketing/landing/SpendContext';
import { HeroCompute } from '@/components/marketing/landing/HeroCompute';
import { HeroProof } from '@/components/marketing/landing/HeroProof';
import { FaresBoard } from '@/components/marketing/landing/FaresBoard';
import { HeroWindow } from './HeroWindow';
import styles from './page.module.css';

// Map the readable hm-* names to their hashed CSS-module classes. Compound
// classNames (e.g. hm-btn hm-sm hm-solid) pass every name. Element/pseudo
// selectors (.hm-tickrow b, .hm-window::before) live in the module and need no
// className here.
const cx = (...names: string[]) => names.map((n) => styles[n]).join(' ');

// ─────────────────────────────────────────────────────────────────────────────
// CreditIQ merged homepage — Phase A (shell + hero + live fares).
// Reference: docs/design/home-merge-v4.html. Tokens: DESIGN.md § Merged homepage.
//   · Fixed white/copper + teal palette (literal hexes), NOT the app light/dark
//     toggle — same convention as the /landing surface.
//   · HeroCompute / HeroProof / FaresBoard are IMPORTED from their shared home in
//     components/marketing/landing (the same maths that powers /landing) and
//     re-skinned to the light tokens by setting --hc-* / --hp-* / --fb-* CSS vars
//     on the wrappers below. No second copy of that maths exists.
//   · Header is position:fixed (NOT sticky): html/body set overflow-x:hidden in
//     globals.css, which detaches sticky bars — see SiteNav's note and the
//     "sticky broken by overflow-x:hidden" project memory.
// Phase A intentionally STOPS after #fares. Method, Smart Match, tools, editorial
// and the (still-unsourced) Receipts / Reviews bands are later phases.
// ─────────────────────────────────────────────────────────────────────────────

// Light-skin var maps. Each key overrides a var(--x, <landing-fallback>) inside the
// shared component, so /landing (which sets none of these) is untouched.
const HERO_COMPUTE_VARS: CSSProperties = {
  '--hc-headline': '#10202A',
  '--hc-accent': '#9A6516',
  '--hc-accent-style': 'normal', // "booked" roman, not italic (Emphasis rule)
  '--hc-pill-bg': 'rgba(110,123,130,0.10)',
  '--hc-pill-bd': 'rgba(110,123,130,0.30)',
  '--hc-pill-fg': '#5b6169', // Estimated stays neutral grey (provenance law)
  '--hc-sub': '#48565E',
  '--hc-range': '#10202A',
  '--hc-panel-bg': '#F7F1E6',
  '--hc-panel-bd': '#E2DCD0',
  '--hc-label': '#6E7B82',
  '--hc-value': '#0E3B3C',
  '--hc-scale': '#6E7B82',
  '--hc-track-fill': '#0E3B3C',
  '--hc-track-rem': '#D3CBBB',
  '--hc-thumb': '#0E3B3C',
  '--hc-thumb-bd': '#F7F1E6',
} as CSSProperties;

const HERO_PROOF_VARS: CSSProperties = {
  '--hp-card-bg': '#FFFFFF',
  '--hp-hair': '#E2DCD0',
  '--hp-shadow': '0 1px 2px rgba(16,32,42,0.04)',
  '--hp-muted': '#6E7B82',
  '--hp-body': '#48565E',
  '--hp-ink': '#10202A',
  '--hp-verified': '#1A7A5E',
} as CSSProperties;

const FARES_VARS: CSSProperties = {
  '--fb-tab-on': '#0E3B3C',
  '--fb-tab-on-fg': '#F4F0E6',
  '--fb-tab-bd': '#D3CBBB',
  '--fb-body': '#48565E',
  '--fb-hair': '#E2DCD0',
  '--fb-ink': '#10202A',
  '--fb-muted': '#6E7B82',
} as CSSProperties;

// Where a signed-in visitor to the crawlable marketing "/" is sent. Client-side
// only (a server redirect would kill "/" static rendering / SEO).
// INTERIM: repoint to '/home' in one line once the Home surface ships (docs/00-SIGNED-IN-IA.md §2).
const SIGNED_IN_HOME = '/dashboard';

export default function HomePage() {
  const router = useRouter();
  // Client-only veil: false on the server + first client render, so the static
  // marketing HTML is what crawlers get and hydration matches. Flips true only
  // while a confirmed session is being redirected away, to hide the flash.
  const [redirecting, setRedirecting] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    let settled = false;
    // Fallback: if auth never resolves within 2s, reveal marketing regardless.
    const timer = setTimeout(() => { if (!settled) { settled = true; setRedirecting(false); } }, 2000);

    // Decide ONLY on the resolved getSession() truth. Every sign-out handler awaits
    // sb.auth.signOut() before landing on "/", so by the time this runs the session
    // is already cleared -> null -> no redirect. That is what stops the sign-out
    // bounce loop (sign out -> "/" -> yanked back into the app).
    sb.auth.getSession().then(({ data: { session } }) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      if (session?.user && !firedRef.current) {
        firedRef.current = true;
        setRedirecting(true);
        router.replace(SIGNED_IN_HOME);
      }
    });

    // Belt-and-suspenders for a same-tab sign-out that races the check: cancel any
    // pending redirect and reveal marketing. (INITIAL_SESSION on subscribe is
    // ignored; only SIGNED_OUT matters here.)
    const { data: { subscription } } = sb.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') { firedRef.current = true; settled = true; clearTimeout(timer); setRedirecting(false); }
    });

    return () => { clearTimeout(timer); subscription.unsubscribe(); };
  }, [router]);

  return (
    <>
      {redirecting && (
        <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg,#fff)' }} />
      )}

      {/* Type A fonts — Fraunces (display, roman only) · Inter (body) · JetBrains Mono (figures) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <header className={cx('hm-header')}>
        <div className={cx('hm-wrap', 'hm-nav')}>
          <Link href="#top" className={cx('hm-logo')}>
            <span className={cx('hm-mark')}>C</span>CreditIQ
          </Link>
          <nav className={cx('hm-navlinks')}>
            <Link href="#fares">Fares</Link>
            <Link href="/cards">Cards</Link>
            <Link href="/plans">Pricing</Link>
          </nav>
          <div className={cx('hm-navcta')}>
            <Link className={cx('hm-btn', 'hm-sm')} href="/login">Sign in</Link>
            <Link className={cx('hm-btn', 'hm-sm', 'hm-solid')} href="/login">Find my card</Link>
          </div>
        </div>
      </header>

      <main id="top" style={{ background: '#FFFFFF', color: '#10202A', fontFamily: "'Inter', system-ui, sans-serif", paddingTop: 64 }}>
        {/* Ticker — clean copy; no internal fields leaked. Duplicated once for a seamless loop. */}
        <div className={cx('hm-ticker')}>
          <div className={cx('hm-tickrow')}>
            <span><b>Sweet spot</b> — Delhi to Zurich business class for 40,000 Aeroplan points</span>
            <span><b>Change</b> — Axis Magnus Burgundy revisions effective 28 August 2026</span>
            <span><b>Watch</b> — HDFC BizPower adds airline and hotel transfer partners</span>
            <span aria-hidden="true"><b>Sweet spot</b> — Delhi to Zurich business class for 40,000 Aeroplan points</span>
            <span aria-hidden="true"><b>Change</b> — Axis Magnus Burgundy revisions effective 28 August 2026</span>
            <span aria-hidden="true"><b>Watch</b> — HDFC BizPower adds airline and hotel transfer partners</span>
          </div>
        </div>

        <SpendProvider>
          {/* ── 01 · HERO (white ground) ── */}
          <div className={cx('hm-hero')}>
            <div className={cx('hm-wrap', 'hm-herogrid')}>
              <div>
                <div className={cx('hm-kicker')}>Live<span className={cx('hm-rule')} />India</div>
                <div style={HERO_COMPUTE_VARS}>
                  <HeroCompute />
                </div>
                <p className={cx('hm-method')}>
                  That range is computed from each card&rsquo;s <b>published earn rules</b> — real math, not a
                  self-reported guess. Link a statement and Statement Truth turns the estimate into your{' '}
                  <span className={cx('hm-vf')}>verified</span> spend, today.
                </p>
                <div className={cx('hm-herocta')}>
                  <Link className={cx('hm-btn', 'hm-solid')} href="/login">Compute my cards →</Link>
                  <Link className={cx('hm-btn')} href="#fares">See the method</Link>
                </div>
              </div>
              <div className={cx('hm-heroside')}>
                <HeroWindow />
                <div style={HERO_PROOF_VARS}>
                  <HeroProof />
                </div>
              </div>
            </div>
          </div>

          {/* ── 02 · LIVE FARES (cream band) ── */}
          <section className={cx('hm-section', 'hm-band-cream')} id="fares">
            <div className={cx('hm-wrap')}>
              <div className={cx('hm-sechead')}>
                <div className={cx('hm-kicker')}>Live fares<span className={cx('hm-rule')} />Cached</div>
                <h2 className={cx('hm-h2')}>One price, one age stamp, one <span className={cx('hm-accent')}>source</span>.</h2>
                <p className={cx('hm-sub')}>
                  We cache the lowest cash fare on the corridors Indian points actually pay for. Nothing here is a
                  live quote, and we never pretend it is.
                </p>
              </div>
              <div style={FARES_VARS}>
                <FaresBoard />
              </div>
            </div>
          </section>
        </SpendProvider>
      </main>
    </>
  );
}
