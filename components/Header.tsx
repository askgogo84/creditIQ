'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu, X, Sun, Moon, Home, CreditCard, Sparkles, Plane, User,
  ArrowRight, Flame, Target, Wallet, FileText, Activity, MapPin,
  Calculator, BarChart3, BookOpen, Globe2, LogIn, Crown, Building2, Scale,
} from 'lucide-react';
import { useTheme } from '@/lib/store';
import { Logo } from './Logo';

const DESKTOP_NAV = [
  { href: '/', label: 'Discover' },
  { href: '/cards', label: 'Cards' },
  { href: '/smart-match', label: 'AI Tools' },
  { href: '/travel', label: 'Travel' },
  { href: '/compare', label: 'Compare' },
];

const TABS = [
  { href: '/', label: 'Home', Icon: Home },
  { href: '/cards', label: 'Cards', Icon: CreditCard },
  { href: '/smart-match', label: 'AI', Icon: Sparkles },
  { href: '/travel', label: 'Travel', Icon: Plane },
  { href: '/dashboard', label: 'Me', Icon: User },
] as const;

type DrawerItem = { href: string; label: string; Icon: typeof Home; badge?: string };
type DrawerGroup = { title: string; items: DrawerItem[] };

const DRAWER: DrawerGroup[] = [
  {
    title: 'AI Tools',
    items: [
      { href: '/smart-match', label: 'Smart Match', Icon: Target, badge: 'Most used' },
      { href: '/card-roast', label: 'Roast my card', Icon: Flame, badge: 'Viral' },
      { href: '/optimize', label: 'Points Optimizer', Icon: Sparkles },
      { href: '/spend-optimizer', label: 'Spend Optimizer', Icon: Wallet },
      { href: '/statement-truth', label: 'Statement Truth', Icon: FileText },
      { href: '/lounge-tracker', label: 'Lounge Tracker', Icon: Activity },
    ],
  },
  {
    title: 'Browse',
    items: [
      { href: '/cards', label: 'All Cards', Icon: CreditCard },
      { href: '/best-cards', label: 'Best Cards', Icon: Crown },
      { href: '/compare', label: 'Compare', Icon: Scale },
      { href: '/travel', label: 'Travel AI', Icon: Plane },
      { href: '/uae', label: 'UAE', Icon: Globe2 },
      { href: '/sg', label: 'Singapore', Icon: MapPin },
    ],
  },
  {
    title: 'Tools',
    items: [
      { href: '/calculators', label: 'Calculators', Icon: Calculator },
      { href: '/credit-score', label: 'Credit Score', Icon: BarChart3 },
      { href: '/glossary', label: 'Glossary', Icon: BookOpen },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/dashboard', label: 'Dashboard', Icon: User },
      { href: '/premium', label: 'Premium', Icon: Crown },
      { href: '/login', label: 'Sign In', Icon: LogIn },
      { href: '/about', label: 'Manifesto', Icon: Building2 },
    ],
  },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggle } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      {/* spacer for fixed top header */}
      <div aria-hidden style={{ height: 64 }} />

      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all"
        style={{
          background: scrolled
            ? 'color-mix(in srgb, var(--bg) 86%, transparent)'
            : 'var(--bg)',
          backdropFilter: scrolled ? 'saturate(140%) blur(18px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'saturate(140%) blur(18px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0 -ml-1" aria-label="CreditIQ home">
            <Logo size="sm" showWordmark={true} />
          </Link>

          {/* Desktop nav (5 items) */}
          <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {DESKTOP_NAV.map(n => {
              const active = isActive(pathname, n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className="relative px-4 py-2 rounded-lg text-[13.5px] font-medium transition-colors"
                  style={{
                    color: active ? 'var(--text)' : 'var(--text-muted)',
                    letterSpacing: '-0.005em',
                  }}
                >
                  {n.label}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-[2px] w-5 rounded-full"
                      style={{ background: 'var(--gold-bright)' }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-muted)' }}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>

            <Link
              href="/smart-match"
              className="btn-gold hidden sm:inline-flex text-[13.5px]"
              style={{ minHeight: 40, padding: '10px 16px', borderRadius: 8 }}
            >
              Find my card
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => setOpen(v => !v)}
              className="lg:hidden w-11 h-11 -mr-2 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
              style={{ color: 'var(--text)' }}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen drawer (mobile) */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-200 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'color-mix(in srgb, var(--bg) 96%, transparent)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        aria-hidden={!open}
        role="dialog"
      >
        <div className="h-16" />
        <div className="overflow-y-auto max-h-[calc(100vh-64px)] px-5 pt-2 pb-32">
          {/* Featured CTA */}
          <Link
            href="/smart-match"
            onClick={() => setOpen(false)}
            className="btn-gold w-full mb-6"
            style={{ minHeight: 56 }}
          >
            <Sparkles className="w-4 h-4" />
            Find my best card
            <ArrowRight className="w-4 h-4" />
          </Link>

          {DRAWER.map(group => (
            <section key={group.title} className="mb-7">
              <h3 className="eyebrow mb-3 px-1">{group.title}</h3>
              <ul className="grid grid-cols-2 gap-2">
                {group.items.map(item => {
                  const active = isActive(pathname, item.href);
                  const Icon = item.Icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="card-surface flex flex-col gap-2 p-4 min-h-[88px] relative"
                        style={{
                          borderColor: active ? 'color-mix(in srgb, var(--gold) 55%, var(--border))' : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{
                              background: active
                                ? 'color-mix(in srgb, var(--gold) 18%, transparent)'
                                : 'color-mix(in srgb, var(--text) 4%, transparent)',
                              color: active ? 'var(--gold-bright)' : 'var(--text)',
                            }}
                          >
                            <Icon className="w-4 h-4" />
                          </span>
                          {item.badge && (
                            <span className="badge badge-gold">{item.badge}</span>
                          )}
                        </div>
                        <span className="text-[13.5px] font-semibold leading-tight" style={{ color: 'var(--text)' }}>
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <div className="pt-2 pb-6 flex items-center justify-between gap-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={toggle}
              className="flex items-center gap-2 text-sm py-2"
              style={{ color: 'var(--text-muted)' }}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
              CreditIQ · India
            </span>
          </div>
        </div>
      </div>

      {/* Bottom tab bar (mobile only) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
          backdropFilter: 'saturate(160%) blur(24px)',
          WebkitBackdropFilter: 'saturate(160%) blur(24px)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        aria-label="Primary"
      >
        <ul className="grid grid-cols-5 max-w-md mx-auto px-2">
          {TABS.map(t => {
            const active = isActive(pathname, t.href);
            const Icon = t.Icon;
            return (
              <li key={t.href} className="flex justify-center">
                <Link
                  href={t.href}
                  className="tabbar-item w-full"
                  data-active={active}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.7} />
                  <span>{t.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
