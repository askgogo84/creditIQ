'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/store';
import { Logo } from './Logo';

const NAV = [
  { href: '/', label: 'Discover' },
  { href: '/smart-match', label: 'Smart Match' },
  { href: '/optimize', label: 'Optimize Points' },
  { href: '/compare', label: 'Compare' },
  { href: '/travel', label: '✈️ Travel AI' },
  { href: '/uae', label: '🇦🇪 UAE' },
  { href: '/about', label: 'Manifesto' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all"
      style={{
        background: scrolled ? 'color-mix(in srgb, var(--bg) 85%, transparent)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Logo size="sm" showWordmark={true} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-muted)' }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-dim)', background: 'transparent' }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Premium CTA */}
          <Link href="/premium" className="btn-primary hidden sm:flex items-center gap-1.5 text-sm py-2 px-4" style={{ minHeight: 36 }}>
            ✦ Find My Card
          </Link>

          {/* Mobile menu */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg"
            style={{ color: 'var(--text-muted)' }}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {open && (
        <div
          className="lg:hidden border-t"
          style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
        >
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/premium"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2 text-center text-sm py-3"
            >
              ✦ Get Premium
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
