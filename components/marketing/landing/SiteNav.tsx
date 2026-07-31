'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// Cinematic sticky nav for the redesigned landing page (Tokens file, Type A).
// Simplified header: a single Cards dropdown (public / SEO routes only), then
// flat links — Live Features (jumps to the shipped-and-labelled section),
// Blog, Pricing — and the auth pair Sign In / Sign Up. The personal tools live
// behind auth, so they are deliberately NOT surfaced here.
//
// Contrast: this nav sits on dark in BOTH states (transparent over the dark hero,
// then the night-ground bar on scroll), so the "ink" is the light design-language
// ink #f4f1ec at rest, lifting to #ffffff on hover — readable in both states.
// Previously #cfd6de, which washed out over the bright patches of the hero footage.

const FR = "'Fraunces', Georgia, serif";
const IN = "'Inter', system-ui, sans-serif";

// Cards dropdown — PUBLIC / SEO routes only (no auth). Order per spec.
const CARDS_LINKS = [
  { label: 'All Cards', href: '/cards', icon: '💳', desc: 'Every Indian card, ranked' },
  { label: 'Compare', href: '/compare', icon: '⚖️', desc: 'Two cards, side by side' },
  { label: 'Best Travel', href: '/best-cards/travel', icon: '✈️', desc: 'Top cards for travel' },
  { label: 'Best Cashback', href: '/best-cards/cashback', icon: '💰', desc: 'Maximum cashback' },
  { label: 'Best Fuel', href: '/best-cards/fuel', icon: '⛽', desc: 'Fuel surcharge waivers' },
  { label: 'UAE Cards', href: '/uae', icon: '🇦🇪', desc: 'For UAE residents' },
  { label: 'Sweet Spots', href: '/sweet-spots', icon: '💎', desc: '8 redemption strategies' },
  { label: 'Devaluation Tracker', href: '/blog/credit-card-devaluations-india-2026', icon: '⚠️', desc: 'Every 2026 cut, dated' },
  { label: 'Card Roast', href: '/card-roast', icon: '🔥', desc: 'A brutal A–F grade' },
  { label: 'Glossary', href: '/glossary', icon: '📖', desc: 'Every card term explained' },
];

// Flat top-level links after the Cards dropdown. Live Features anchors to the
// "Shipped, and labelled" section (#today) on this page.
const FLAT_LINKS = [
  { label: 'Live Features', href: '#today' },
  { label: 'Blog', href: '/blog' },
  { label: 'Pricing', href: '/plans' },
];

const CSS = `
  /* Overlay, not a band — and FIXED, not sticky. The comp uses position:sticky, but
     this app sets overflow-x:hidden on <html>/<body> (to kill horizontal scroll),
     which makes <body> the sticky scroll-context while the real scroll is on <html>
     — so a sticky nav detaches and scrolls away. position:fixed is immune to that and
     is out of flow, so the hero starts at y=0 and this 64px bar overlays its top. At
     rest the transparent bar shows the DARK hero footage behind it (never the white
     <main> ground); the hero's own paddingTop (clamp(88,150) ≥ 64) clears the copy. */
  .ciqL-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; width: 100%; transition: background 300ms cubic-bezier(.2,.8,.2,1), border-color 300ms cubic-bezier(.2,.8,.2,1); background: transparent; border-bottom: 1px solid transparent; }
  .ciqL-nav.scrolled { background: rgba(15,22,32,.94); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(216,155,42,.5); }
  .ciqL-nav-inner { width: 100%; max-width: 1200px; margin: 0 auto; padding: 10px 20px; min-height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .ciqL-wordmark { font-family: ${FR}; font-weight: 400; font-size: 19px; letter-spacing: -0.01em; color: #f4f1ec; display: inline-flex; align-items: baseline; gap: 2px; text-decoration: none; }
  .ciqL-wordmark span { color: #D89B2A; }
  .ciqL-right { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
  .ciqL-links { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .ciqL-drop { position: relative; }
  /* Ink: light in both states (over dark hero + dark scrolled bar). */
  .ciqL-link { font-family: ${IN}; font-size: 14px; font-weight: 500; color: #f4f1ec; text-decoration: none; transition: color 150ms; white-space: nowrap; background: none; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; padding: 8px 6px; min-height: 44px; }
  .ciqL-link:hover, .ciqL-link.open { color: #ffffff; }
  .ciqL-chev { transition: transform 200ms; opacity: 0.65; }
  .ciqL-link.open .ciqL-chev { transform: rotate(180deg); }
  .ciqL-signin { color: #f4f1ec; }
  .ciqL-panel { position: absolute; top: calc(100% + 8px); left: 0; width: 300px; max-width: 82vw; max-height: 74vh; overflow-y: auto; background: rgba(15,22,32,.98); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,.14); border-radius: 16px; padding: 8px; display: flex; flex-direction: column; gap: 2px; z-index: 60; }
  .ciqL-item { display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: 12px; text-decoration: none; transition: background 120ms; }
  .ciqL-item:hover { background: rgba(255,255,255,.06); }
  .ciqL-ico { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,.06); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
  .ciqL-item-label { font-family: ${IN}; font-size: 13px; font-weight: 600; color: #f4f1ec; }
  .ciqL-item-desc { font-family: ${IN}; font-size: 11px; color: rgba(247,244,239,.55); margin-top: 1px; }
  .ciqL-cta { min-height: 44px; display: inline-flex; align-items: center; padding: 0 22px; border-radius: 999px; background: #D89B2A; color: #12203a; font-family: ${IN}; font-size: 14px; font-weight: 600; white-space: nowrap; text-decoration: none; transition: background 150ms; }
  .ciqL-cta:hover { background: #c2871f; }

  /* ── Mobile hamburger + sheet (below 900px) ── */
  .ciqL-ham { display: none; flex-direction: column; justify-content: center; align-items: center; gap: 5px; width: 44px; height: 44px; padding: 0; background: none; border: none; cursor: pointer; flex-shrink: 0; }
  .ciqL-ham span { display: block; width: 22px; height: 2px; background: #f4f1ec; border-radius: 2px; transition: transform 200ms ease, opacity 200ms ease; }
  .ciqL-ham.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .ciqL-ham.open span:nth-child(2) { opacity: 0; }
  .ciqL-ham.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
  .ciqL-sheet { position: absolute; top: 100%; left: 0; right: 0; background: rgba(15,22,32,.98); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); border-top: 1px solid rgba(216,155,42,.5); border-bottom: 1px solid rgba(255,255,255,.12); padding: 8px 20px 24px; max-height: calc(100vh - 64px); overflow-y: auto; }
  .ciqL-sheet-title { font-family: ${IN}; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #e8b45c; padding: 18px 4px 6px; }
  .ciqL-sheet-link { display: flex; align-items: center; gap: 12px; padding: 12px 4px; text-decoration: none; border-bottom: 1px solid rgba(255,255,255,.08); }
  .ciqL-sheet-ico { width: 30px; height: 30px; border-radius: 8px; background: rgba(255,255,255,.06); display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; color: #e8b45c; }
  .ciqL-sheet-label { font-family: ${IN}; font-size: 15px; font-weight: 600; color: #f4f1ec; }
  .ciqL-sheet-desc { font-family: ${IN}; font-size: 12px; color: rgba(247,244,239,.55); margin-top: 1px; }
  .ciqL-sheet-cta { display: block; text-align: center; margin-top: 18px; padding: 14px; border-radius: 999px; background: #D89B2A; color: #12203a; font-family: ${IN}; font-size: 15px; font-weight: 600; text-decoration: none; }

  @media (max-width: 899px) {
    .ciqL-links { display: none !important; }
    .ciqL-signin-desktop { display: none !important; }
    .ciqL-ham { display: flex !important; }
    .ciqL-nav-inner { flex-wrap: nowrap; }
    .ciqL-right { gap: 10px; }
  }
  @media (min-width: 900px) {
    .ciqL-ham { display: none !important; }
    .ciqL-sheet { display: none !important; }
  }
`;

const Chevron = () => (
  <svg className="ciqL-chev" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [cardsOpen, setCardsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled((window.scrollY || 0) > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the dropdown AND the mobile sheet on outside click / Escape.
  useEffect(() => {
    if (!cardsOpen && !mobileOpen) return;
    const close = () => {
      setCardsOpen(false);
      setMobileOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [cardsOpen, mobileOpen]);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const delayClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setCardsOpen(false), 200);
  };

  return (
    <nav className={`ciqL-nav${scrolled ? ' scrolled' : ''}`} ref={rootRef}>
      <style>{CSS}</style>
      <div className="ciqL-nav-inner">
        <Link href="#top" className="ciqL-wordmark">
          Credit<span>IQ</span>
        </Link>
        <div className="ciqL-right">
          <div className="ciqL-links">
            {/* Cards — the only dropdown; public/SEO routes only */}
            <div
              className="ciqL-drop"
              onMouseEnter={() => {
                cancelClose();
                setCardsOpen(true);
              }}
              onMouseLeave={delayClose}
            >
              <button
                type="button"
                className={`ciqL-link${cardsOpen ? ' open' : ''}`}
                aria-expanded={cardsOpen}
                onClick={() => setCardsOpen((v) => !v)}
              >
                Cards
                <Chevron />
              </button>
              {cardsOpen && (
                <div className="ciqL-panel">
                  {CARDS_LINKS.map((l) => (
                    <Link key={l.href} href={l.href} className="ciqL-item" onClick={() => setCardsOpen(false)}>
                      <span className="ciqL-ico">{l.icon}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className="ciqL-item-label">{l.label}</span>
                        <span className="ciqL-item-desc" style={{ display: 'block' }}>{l.desc}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {FLAT_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="ciqL-link">
                {l.label}
              </Link>
            ))}
          </div>

          {/* Sign In (text) sits with the desktop links; Sign Up is the CTA. */}
          <Link href="/login" className="ciqL-link ciqL-signin ciqL-signin-desktop">
            Sign In
          </Link>
          <Link href="/login" className="ciqL-cta">
            Sign Up
          </Link>

          <button
            type="button"
            className={`ciqL-ham${mobileOpen ? ' open' : ''}`}
            aria-label="Menu"
            aria-expanded={mobileOpen}
            onClick={() => {
              setMobileOpen((v) => !v);
              setCardsOpen(false);
            }}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Mobile sheet — Cards group + the flat links + the auth pair. Hidden ≥900px. */}
      {mobileOpen && (
        <div className="ciqL-sheet">
          <div className="ciqL-sheet-title">Cards</div>
          {CARDS_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="ciqL-sheet-link" onClick={() => setMobileOpen(false)}>
              <span className="ciqL-sheet-ico">{l.icon}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="ciqL-sheet-label">{l.label}</span>
                <span className="ciqL-sheet-desc" style={{ display: 'block' }}>{l.desc}</span>
              </span>
            </Link>
          ))}

          <div className="ciqL-sheet-title">More</div>
          {FLAT_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="ciqL-sheet-link" onClick={() => setMobileOpen(false)}>
              <span className="ciqL-sheet-label">{l.label}</span>
            </Link>
          ))}
          <Link href="/login" className="ciqL-sheet-link" onClick={() => setMobileOpen(false)}>
            <span className="ciqL-sheet-label">Sign In</span>
          </Link>
          <Link href="/login" className="ciqL-sheet-cta" onClick={() => setMobileOpen(false)}>
            Sign Up
          </Link>
        </div>
      )}
    </nav>
  );
}
