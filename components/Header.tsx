'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/store';
import { Logo } from './Logo';
import { Sun, Moon, Menu, X } from 'lucide-react';

const DESKTOP_NAV = [
  { href: '/cards', label: 'Cards' },
  { href: '/spend-optimizer', label: 'Card Match' },
  { href: '/compare', label: 'Compare' },
  { href: '/travel', label: 'Travel AI' },
];

const BOTTOM_NAV = [
  { href: '/', label: 'Home', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )},
  { href: '/cards', label: 'Cards', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  )},
  { href: '/spend-optimizer', label: 'AI Match', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )},
  { href: '/travel', label: 'Travel', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 1 16.5 2.5L13 6 4.8 4.2 3.3 5.7l4 3-3 3-4-1-1.5 1.5L8 14l2 5 1.5-1.5-1-4 3-3 3 4z"/>
    </svg>
  )},
  { href: '/dashboard', label: 'Me', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )},
];

const MOBILE_MENU = [
  { href: '/', label: 'Home' },
  { href: '/cards', label: 'All Cards' },
  { href: '/best-cards/travel', label: 'Best Travel Cards' },
  { href: '/best-cards/cashback', label: 'Best Cashback Cards' },
  { href: '/best-cards/no-fee', label: 'Lifetime Free Cards' },
  { href: '/spend-optimizer', label: 'Card Match AI' },
  { href: '/card-roast', label: 'Roast My Card' },
  { href: '/statement-truth', label: 'Statement Truth Report' },
  { href: '/card-switch', label: 'Switch Wizard' },
  { href: '/lounge-tracker', label: 'Lounge Tracker' },
  { href: '/compare', label: 'Compare Cards' },
  { href: '/travel', label: 'Travel AI' },
  { href: '/optimize', label: 'Points Optimizer' },
  { href: '/dashboard', label: 'My Dashboard' },
];

export function Header() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <>
      {/* Spacer */}
      <div style={{ height: 'var(--header-height)' }} />

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 'var(--header-height)',
        background: scrolled ? 'var(--bg-card)' : 'var(--bg)',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        zIndex: 200,
        transition: 'all 0.2s ease',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}>
        <div style={{
          maxWidth: 'var(--max-width)', margin: '0 auto',
          padding: '0 var(--space-5)', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          {/* Logo */}
          <Link href="/" style={{ flexShrink: 0, textDecoration: 'none' }}>
            <Logo size="sm" showWordmark />
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}
            className="hidden-mobile">
            {DESKTOP_NAV.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link key={item.href} href={item.href} style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--navy)' : 'var(--text-secondary)',
                  background: active ? 'var(--navy-light)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Theme toggle */}
            <button onClick={toggle} style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-secondary)',
              transition: 'all 0.15s',
            }} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* CTA — desktop only */}
            <Link href="/spend-optimizer" style={{
              height: 36, padding: '0 16px',
              background: 'var(--gold)', color: '#fff',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--text-sm)', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
              textDecoration: 'none', whiteSpace: 'nowrap',
            }} className="hidden-mobile">
              Find My Card
            </Link>

            {/* Mobile menu button */}
            <button onClick={() => setMenuOpen(!menuOpen)} style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              display: 'none', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-secondary)',
            }} className="show-mobile" aria-label="Menu">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile slide-down menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 'var(--header-height)', left: 0, right: 0,
          background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
          zIndex: 199, maxHeight: 'calc(100vh - var(--header-height))',
          overflowY: 'auto', padding: '12px 0 20px',
        }}>
          <div style={{ padding: '0 20px', marginBottom: 12 }}>
            <Link href="/spend-optimizer" onClick={() => setMenuOpen(false)} style={{
              display: 'block', textAlign: 'center', padding: '13px',
              background: 'var(--gold)', color: '#fff', borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--text-sm)', fontWeight: 700, textDecoration: 'none',
            }}>
              Find My Best Card
            </Link>
          </div>
          {MOBILE_MENU.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{
              display: 'block', padding: '13px 20px',
              fontSize: 'var(--text-sm)', fontWeight: 500,
              color: pathname === item.href ? 'var(--navy)' : 'var(--text-secondary)',
              background: pathname === item.href ? 'var(--navy-light)' : 'transparent',
              textDecoration: 'none', borderBottom: '1px solid var(--border)',
            }}>
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* Bottom nav — mobile only */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 'var(--bottom-nav-height)',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)',
      }} className="show-mobile">
        {BOTTOM_NAV.map(item => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, padding: '6px 12px', textDecoration: 'none',
              color: active ? 'var(--navy)' : 'var(--text-muted)',
              minWidth: 52,
            }}>
              {item.icon}
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}
