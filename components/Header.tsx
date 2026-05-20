'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCompare, useTheme } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Sparkles, Menu, X, Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

const nav = [
  { href: '/', label: 'Discover' },
  { href: '/smart-match', label: 'Smart Match' },
  { href: '/optimize', label: 'Optimize Points' },
  { href: '/compare', label: 'Compare' },
  { href: '/about', label: 'Manifesto' },
];

export function Header() {
  const pathname = usePathname();
  const compareCount = useCompare((s) => s.cards.length);
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const isDark = theme === 'dark';

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'backdrop-blur-xl border-b shadow-sm'
            : 'bg-transparent'
        )}
        style={{
          backgroundColor: scrolled ? (isDark ? 'rgba(10,10,11,0.9)' : 'rgba(248,247,244,0.9)') : 'transparent',
          borderBottomColor: 'var(--border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-copper-300 via-copper-500 to-copper-700 flex items-center justify-center">
              <span className="font-display font-bold text-white text-sm">C</span>
            </div>
            <div className="leading-none">
              <div className="font-display text-xl" style={{ color: 'var(--text)' }}>CreditIQ</div>
              <div className="text-[9px] font-mono tracking-widest uppercase hidden sm:block" style={{ color: 'var(--text-dim)' }}>Intelligence</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn('px-3 py-2 text-sm tracking-wide transition-colors rounded')}
                style={{
                  color: pathname === item.href ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Compare badge */}
            {compareCount > 0 && (
              <Link
                href="/compare"
                className="px-3 py-2 text-xs sm:text-sm rounded border font-mono tabular min-h-[36px] flex items-center"
                style={{
                  borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)',
                  color: 'var(--accent)',
                  background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                }}
              >
                ⇄ {compareCount}
              </Link>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-lg border flex items-center justify-center transition-all"
              style={{
                borderColor: 'var(--border-strong)',
                color: 'var(--text-muted)',
                background: 'transparent',
              }}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark
                ? <Sun className="w-4 h-4" />
                : <Moon className="w-4 h-4" />
              }
            </button>

            {/* Find My Card CTA */}
            <Link
              href="/smart-match"
              className="hidden sm:flex items-center gap-1.5 btn-primary text-sm py-2 px-3"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">Find My Card</span>
              <span className="md:hidden">Match</span>
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded border touch-manipulation"
              style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 backdrop-blur-md" style={{ background: isDark ? 'rgba(10,10,11,0.8)' : 'rgba(248,247,244,0.8)' }} />
          <nav
            className="absolute top-16 left-0 right-0 border-b py-4 px-4 space-y-1"
            style={{ background: 'var(--bg)', borderBottomColor: 'var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors min-h-[48px]"
                style={{
                  background: pathname === item.href ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
                  color: pathname === item.href ? 'var(--accent)' : 'var(--text)',
                }}
              >
                {item.label}
              </Link>
            ))}

            {/* Theme toggle in mobile menu */}
            <button
              onClick={toggle}
              className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-base min-h-[48px]"
              style={{ color: 'var(--text-muted)' }}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            </button>

            <div className="pt-3 border-t" style={{ borderTopColor: 'var(--border)' }}>
              <Link href="/smart-match" className="btn-primary w-full flex items-center justify-center gap-2 text-base">
                <Sparkles className="w-4 h-4" />
                Find My Perfect Card
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
