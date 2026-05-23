'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/cards', label: 'Cards' },
  {
    label: 'AI Tools',
    dropdown: [
      { href: '/spend-optimizer', label: '🎯 Card Match AI', desc: 'Best card for your spends' },
      { href: '/card-roast', label: '🔥 Card Roast', desc: 'Get an honest A–F grade' },
      { href: '/statement-truth', label: '📊 Statement Truth', desc: 'Bank claims vs reality' },
      { href: '/card-switch', label: '🔄 Switch Wizard', desc: 'Find a better card' },
      { href: '/optimize', label: '💎 Points Optimizer', desc: 'Maximize redemption value' },
      { href: '/approval-odds', label: '✅ Approval Odds', desc: 'Know before you apply' },
      { href: '/credit-simulator', label: '📈 Score Simulator', desc: 'Model score changes' },
    ],
  },
  {
    label: 'Travel',
    dropdown: [
      { href: '/trip-planner', label: '✈️ Trip Planner', desc: 'Plan trip with your points' },
      { href: '/travel', label: '🤖 Travel AI', desc: 'AI travel advisor' },
      { href: '/lounge-tracker', label: '🛋️ Lounge Tracker', desc: 'Track free lounge visits' },
      { href: '/uae', label: '🇦🇪 UAE Cards', desc: '16 UAE credit cards' },
    ],
  },
  { href: '/compare', label: 'Compare' },
  { href: '/dashboard', label: 'Dashboard' },
];

const MOBILE_ALL = [
  { href: '/', label: 'Home', section: 'Main' },
  { href: '/cards', label: 'All 93 Cards', section: 'Cards' },
  { href: '/best-cards/travel', label: 'Best Travel Cards', section: 'Cards' },
  { href: '/best-cards/cashback', label: 'Best Cashback Cards', section: 'Cards' },
  { href: '/best-cards/no-fee', label: 'Lifetime Free Cards', section: 'Cards' },
  { href: '/best-cards/premium', label: 'Premium Cards', section: 'Cards' },
  { href: '/spend-optimizer', label: '🎯 Card Match AI', section: 'AI Tools' },
  { href: '/card-roast', label: '🔥 Card Roast', section: 'AI Tools' },
  { href: '/statement-truth', label: '📊 Statement Truth', section: 'AI Tools' },
  { href: '/card-switch', label: '🔄 Switch Wizard', section: 'AI Tools' },
  { href: '/optimize', label: '💎 Points Optimizer', section: 'AI Tools' },
  { href: '/approval-odds', label: '✅ Approval Odds', section: 'AI Tools' },
  { href: '/credit-simulator', label: '📈 Score Simulator', section: 'AI Tools' },
  { href: '/trip-planner', label: '✈️ Trip Planner', section: 'Travel' },
  { href: '/travel', label: '🤖 Travel AI', section: 'Travel' },
  { href: '/lounge-tracker', label: '🛋️ Lounge Tracker', section: 'Travel' },
  { href: '/uae', label: '🇦🇪 UAE Cards', section: 'Travel' },
  { href: '/compare', label: 'Compare Cards', section: 'Tools' },
  { href: '/calculators', label: 'Calculators', section: 'Tools' },
  { href: '/credit-score', label: 'Credit Score Guide', section: 'Tools' },
  { href: '/dashboard', label: 'My Dashboard', section: 'Account' },
  { href: '/upload-statement', label: 'Upload Statement', section: 'Account' },
];

const BOTTOM_TABS = [
  { href: '/', label: 'Home', icon: '🏠', match: (p: string) => p === '/' },
  { href: '/cards', label: 'Cards', icon: '💳', match: (p: string) => p.startsWith('/cards') || p.startsWith('/best-cards') },
  { href: '/spend-optimizer', label: 'AI', icon: '⭐', match: (p: string) => ['/spend-optimizer', '/card-roast', '/statement-truth', '/card-switch', '/optimize', '/approval-odds', '/credit-simulator'].some(r => p.startsWith(r)) },
  { href: '/trip-planner', label: 'Travel', icon: '✈️', match: (p: string) => ['/trip-planner', '/travel', '/lounge-tracker', '/uae'].some(r => p.startsWith(r)) },
  { href: '/dashboard', label: 'Me', icon: '👤', match: (p: string) => p.startsWith('/dashboard') },
];

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const dark = stored === 'dark';
    setIsDark(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMenuOpen(false); setOpenDropdown(null); }, [pathname]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  };

  const sections = [...new Set(MOBILE_ALL.map(i => i.section))];

  return (
    <>
      <div style={{ height: 64 }} />

      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 64, zIndex: 200,
        background: scrolled ? 'rgba(8,8,14,0.92)' : 'var(--obsidian, #08080E)',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
        transition: 'all 0.2s',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #1B3A5C, #0d2240)', border: '1px solid rgba(201,151,46,0.4)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#C9972E' }}>IQ</div>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>Credit<span style={{ color: '#C9972E' }}>IQ</span></span>
          </Link>

          {/* Desktop nav */}
          <nav ref={dropdownRef} style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }} className="hide-mobile">
            {NAV_ITEMS.map(item => {
              if ('href' in item) {
                const active = (item.href ?? "") ===  '/' ? pathname === '/' : pathname.startsWith(item.href ?? '');
                return (
                  <Link key={item.href ?? ""} href={item.href ?? "/"} style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: active ? 600 : 400,
                    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                    textDecoration: 'none', transition: 'all 0.15s', whiteSpace: 'nowrap',
                  }}>{item.label}</Link>
                );
              }
              const isOpen = openDropdown === item.label;
              const isActive = item.dropdown?.some(d => pathname.startsWith(d.href));
              return (
                <div key={item.label} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setOpenDropdown(isOpen ? null : item.label)}
                    style={{
                      padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                      background: isOpen || isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      transition: 'all 0.15s', whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                    <span style={{ fontSize: 10, opacity: 0.6, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                  </button>
                  {isOpen && (
                    <div style={{
                      position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                      marginTop: 8, background: '#111118', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 14, padding: 8, minWidth: 240,
                      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                      zIndex: 300,
                    }}>
                      {item.dropdown?.map(d => (
                        <Link key={d.href} href={d.href} style={{
                          display: 'block', padding: '10px 14px', borderRadius: 10,
                          textDecoration: 'none', transition: 'background 0.15s',
                          background: pathname.startsWith(d.href) ? 'rgba(201,151,46,0.1)' : 'transparent',
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{d.label}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{d.desc}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button onClick={toggleTheme} style={{
              width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
              fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isDark ? '☀️' : '🌙'}
            </button>
            <Link href="/spend-optimizer" className="hide-mobile" style={{
              height: 36, padding: '0 16px', background: 'linear-gradient(135deg, #C9972E, #E8B84B)',
              color: '#0a0a0a', borderRadius: 10, fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', textDecoration: 'none', whiteSpace: 'nowrap',
            }}>Find my card →</Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="show-mobile" style={{
              width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 18,
              display: 'none', alignItems: 'center', justifyContent: 'center',
            }}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile full menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, bottom: 0,
          background: '#08080E', zIndex: 199, overflowY: 'auto', padding: '16px 0 80px',
        }}>
          <div style={{ padding: '0 20px 16px' }}>
            <Link href="/spend-optimizer" onClick={() => setMenuOpen(false)} style={{
              display: 'block', textAlign: 'center', padding: '14px',
              background: 'linear-gradient(135deg, #C9972E, #E8B84B)',
              color: '#0a0a0a', borderRadius: 14, fontSize: 15, fontWeight: 800,
              textDecoration: 'none', marginBottom: 20,
            }}>🎯 Find My Best Card</Link>
          </div>
          {sections.map(section => (
            <div key={section}>
              <div style={{ padding: '8px 20px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {section}
              </div>
              {MOBILE_ALL.filter(i => i.section === section).map(item => (
                <Link key={item.href ?? ""} href={item.href ?? "/"} onClick={() => setMenuOpen(false)} style={{
                  display: 'block', padding: '13px 20px', fontSize: 14, fontWeight: 500,
                  color: pathname === item.href ? '#C9972E' : 'rgba(255,255,255,0.7)',
                  background: pathname === item.href ? 'rgba(201,151,46,0.08)' : 'transparent',
                  textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>{item.label}</Link>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Bottom tab bar — mobile only */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 64,
        background: 'rgba(8,8,14,0.95)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'none', alignItems: 'center', justifyContent: 'space-around',
        zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)',
      }} className="show-mobile">
        {BOTTOM_TABS.map(tab => {
          const active = tab.match(pathname);
          return (
            <Link key={tab.href} href={tab.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, padding: '6px 12px', textDecoration: 'none', minWidth: 52,
              color: active ? '#C9972E' : 'rgba(255,255,255,0.35)',
            }}>
              <span style={{ fontSize: 20 }}>{tab.icon}</span>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}
