'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from './ThemeToggle';

const LINKS: { href: string; label: string; match: (p: string | null) => boolean }[] = [
  { href: '/',            label: 'Discover',  match: p => p === '/' },
  { href: '/cards',       label: 'Cards',     match: p => !!p && p.startsWith('/cards') },
  { href: '/smart-match', label: 'AI Tools',  match: p => !!p && (p.startsWith('/smart-match') || p.startsWith('/card-roast') || p.startsWith('/statement-truth') || p.startsWith('/card-switch') || p.startsWith('/optimize') || p.startsWith('/spend-optimizer') || p.startsWith('/lounge-tracker')) },
  { href: '/dashboard',   label: 'Dashboard', match: p => !!p && p.startsWith('/dashboard') },
];

export function TopNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <Fragment>
      <nav className="nav">
        <Link href="/" className="nav__logo" aria-label="CreditIQ home">
          <Logo size="sm" showWordmark={true} />
        </Link>
        {LINKS.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`nav__link hide-mobile ${l.match(pathname) ? 'active' : ''}`}
          >
            {l.label}
          </Link>
        ))}
        <div className="nav__right">
          <ThemeToggle />
          <Link
            href="/smart-match"
            className="btn btn-primary nav__cta hide-mobile"
            style={{ padding: '10px 18px', fontSize: 13.5, minHeight: 40 }}
          >
            Find my card <span className="arrow">-></span>
          </Link>
          <button
            className="menu-btn"
            onClick={() => setOpen(o => !o)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6 L18 18 M18 6 L6 18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16 M4 12h16 M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {open && (
        <div className="mobile-menu">
          {LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={l.match(pathname) ? 'active' : ''}
              onClick={() => setOpen(false)}
            >
              {l.label} <span className="arrow">-></span>
            </Link>
          ))}
          <Link
            href="/smart-match"
            className="btn btn-copper"
            style={{ marginTop: 12 }}
            onClick={() => setOpen(false)}
          >
            Find my card <span className="arrow">-></span>
          </Link>
        </div>
      )}
    </Fragment>
  );
}
