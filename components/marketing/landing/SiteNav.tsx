'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import './SiteNav.css';

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
