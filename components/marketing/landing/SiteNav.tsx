'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MORE_GROUPS } from '@/components/ciq/moreNav';

// Cinematic sticky nav for the redesigned landing page (Tokens file, Type A).
// Each top-level item is a MORE_GROUPS title that OPENS A DROPDOWN of that group's
// links — a signed-out visitor sees the whole feature list from the header, not a
// single jump target. Plus a Pricing link straight to /plans (there is no in-page
// pricing section). Transparent over the dark hero; on scroll it fills with the
// night ground + a 1px copper hairline. No shadows, no media queries — the links
// wrap intrinsically; dropdowns are click-to-open (touch-safe) with hover assist.

const FR = "'Fraunces', Georgia, serif";
const IN = "'Inter', system-ui, sans-serif";

const CSS = `
  .ciqL-nav { position: sticky; top: 0; z-index: 50; width: 100%; transition: background 300ms cubic-bezier(.2,.8,.2,1), border-color 300ms cubic-bezier(.2,.8,.2,1); background: transparent; border-bottom: 1px solid transparent; }
  .ciqL-nav.scrolled { background: rgba(15,22,32,.94); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(216,155,42,.5); }
  .ciqL-nav-inner { width: 100%; max-width: 1200px; margin: 0 auto; padding: 10px 20px; min-height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .ciqL-wordmark { font-family: ${FR}; font-weight: 400; font-size: 19px; letter-spacing: -0.01em; color: #f4f1ec; display: inline-flex; align-items: baseline; gap: 2px; text-decoration: none; }
  .ciqL-wordmark span { color: #D89B2A; }
  .ciqL-right { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
  .ciqL-links { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .ciqL-drop { position: relative; }
  .ciqL-link { font-family: ${IN}; font-size: 14px; font-weight: 500; color: #cfd6de; text-decoration: none; transition: color 150ms; white-space: nowrap; background: none; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; padding: 8px 6px; min-height: 44px; }
  .ciqL-link:hover, .ciqL-link.open { color: #ffffff; }
  .ciqL-chev { transition: transform 200ms; opacity: 0.55; }
  .ciqL-link.open .ciqL-chev { transform: rotate(180deg); }
  .ciqL-panel { position: absolute; top: calc(100% + 8px); left: 0; width: 288px; max-width: 78vw; background: rgba(15,22,32,.98); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,.14); border-radius: 16px; padding: 8px; display: flex; flex-direction: column; gap: 2px; z-index: 60; }
  .ciqL-item { display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: 12px; text-decoration: none; transition: background 120ms; }
  .ciqL-item:hover { background: rgba(255,255,255,.06); }
  .ciqL-ico { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,.06); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
  .ciqL-item-label { font-family: ${IN}; font-size: 13px; font-weight: 600; color: #f4f1ec; }
  .ciqL-item-desc { font-family: ${IN}; font-size: 11px; color: rgba(247,244,239,.55); margin-top: 1px; }
  .ciqL-badge { font-family: ${IN}; font-size: 8.5px; font-weight: 700; letter-spacing: 0.04em; padding: 1px 5px; border-radius: 999px; background: rgba(216,155,42,.18); border: 1px solid rgba(216,155,42,.4); color: #e8b45c; margin-left: 6px; vertical-align: middle; }
  .ciqL-cta { min-height: 44px; display: inline-flex; align-items: center; padding: 0 22px; border-radius: 999px; background: #D89B2A; color: #12203a; font-family: ${IN}; font-size: 14px; font-weight: 600; white-space: nowrap; text-decoration: none; transition: background 150ms; }
  .ciqL-cta:hover { background: #c2871f; }
`;

const Chevron = () => (
  <svg className="ciqL-chev" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled((window.scrollY || 0) > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const delayClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(null), 200);
  };

  return (
    <nav className={`ciqL-nav${scrolled ? ' scrolled' : ''}`}>
      <style>{CSS}</style>
      <div className="ciqL-nav-inner" ref={rootRef}>
        <Link href="#top" className="ciqL-wordmark">
          Credit<span>IQ</span>
        </Link>
        <div className="ciqL-right">
          <div className="ciqL-links">
            {MORE_GROUPS.map((g) => {
              const isOpen = open === g.title;
              return (
                <div
                  key={g.title}
                  className="ciqL-drop"
                  onMouseEnter={() => {
                    cancelClose();
                    setOpen(g.title);
                  }}
                  onMouseLeave={delayClose}
                >
                  <button
                    type="button"
                    className={`ciqL-link${isOpen ? ' open' : ''}`}
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : g.title)}
                  >
                    {g.title}
                    <Chevron />
                  </button>
                  {isOpen && (
                    <div className="ciqL-panel">
                      {g.links.map((l) => (
                        <Link key={l.href} href={l.href} className="ciqL-item" onClick={() => setOpen(null)}>
                          <span className="ciqL-ico">{l.icon}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span className="ciqL-item-label">
                              {l.label}
                              {l.badge && <span className="ciqL-badge">{l.badge}</span>}
                            </span>
                            {l.desc && <span className="ciqL-item-desc" style={{ display: 'block' }}>{l.desc}</span>}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <Link href="/plans" className="ciqL-link">
              Pricing
            </Link>
          </div>
          <Link href="/login" className="ciqL-cta">
            Compute my cards
          </Link>
        </div>
      </div>
    </nav>
  );
}
