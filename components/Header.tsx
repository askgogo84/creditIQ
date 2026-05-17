'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCompare, useTheme } from '@/lib/store';
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
  const isDark = theme === 'dark';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <>
      <header
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          transition: 'all 0.3s',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          backgroundColor: scrolled ? (isDark ? 'rgba(10,10,11,0.9)' : 'rgba(248,247,244,0.92)') : 'transparent',
          borderBottom: scrolled ? '1px solid var(--border)' : 'none',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: 'linear-gradient(135deg, #e9b97f, #d4a373, #b8834a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, color: 'white', fontSize: 14 }}>C</span>
            </div>
            <div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: 'var(--text)', lineHeight: 1 }}>CardIQ</div>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Intelligence</div>
            </div>
          </Link>

          <nav style={{ display: 'none', alignItems: 'center', gap: 4 }} className="lg-nav">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} style={{ padding: '8px 12px', fontSize: 14, color: pathname === item.href ? 'var(--accent)' : 'var(--text-muted)', textDecoration: 'none', borderRadius: 4, transition: 'color 0.2s' }}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {compareCount > 0 && (
              <Link href="/compare" style={{ padding: '6px 12px', fontSize: 13, borderRadius: 6, border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)', color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', textDecoration: 'none', fontFamily: 'monospace', minHeight: 36, display: 'flex', alignItems: 'center' }}>
                â‡„ {compareCount}
              </Link>
            )}

            <button
              onClick={toggle}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border-strong)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', transition: 'all 0.2s', flexShrink: 0 }}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <Link href="/smart-match" className="btn-primary" style={{ fontSize: 13, padding: '8px 14px', minHeight: 36, gap: 6, display: 'flex', alignItems: 'center' }}>
              <Sparkles size={14} />
              <span>Find My Card</span>
            </Link>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ width: 40, height: 40, borderRadius: 6, border: '1px solid var(--border-strong)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
              className="hamburger-btn"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <style jsx>{`
        @media (min-width: 1024px) {
          .lg-nav { display: flex !important; }
          .hamburger-btn { display: none !important; }
        }
      `}</style>

      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)}>
          <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(16px)', background: isDark ? 'rgba(10,10,11,0.8)' : 'rgba(248,247,244,0.8)' }} />
          <nav style={{ position: 'absolute', top: 64, left: 0, right: 0, background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '16px' }} onClick={(e) => e.stopPropagation()}>
            {nav.map((item) => (
              <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: 8, fontSize: 16, fontWeight: 500, color: pathname === item.href ? 'var(--accent)' : 'var(--text)', background: pathname === item.href ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent', textDecoration: 'none', minHeight: 48, marginBottom: 4 }}>
                {item.label}
              </Link>
            ))}
            <button onClick={toggle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, width: '100%', fontSize: 16, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', minHeight: 48, marginBottom: 4 }}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            </button>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 8 }}>
              <Link href="/smart-match" className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 16 }}>
                <Sparkles size={16} /> Find My Perfect Card
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
