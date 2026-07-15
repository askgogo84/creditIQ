// components/ciq/TabBar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MORE_GROUPS } from './moreNav';

const TABS = [
  { label: 'Wallet',   href: '/dashboard',    icon: (a: boolean) => <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2v-9Z" stroke={a ? 'var(--ciq-gold-2)' : 'currentColor'} strokeWidth="1.7" strokeLinejoin="round" /> },
  { label: 'Cards',    href: '/my-cards',        icon: (a: boolean) => <><rect x="2" y="5" width="20" height="14" rx="2.5" stroke={a ? 'var(--ciq-gold-2)' : 'currentColor'} strokeWidth="1.7" /><path d="M2 10h20" stroke={a ? 'var(--ciq-gold-2)' : 'currentColor'} strokeWidth="1.7" /></> },
  { label: 'Feed',     href: '/feed',         icon: (a: boolean) => <path d="M4 6h16M4 12h16M4 18h10" stroke={a ? 'var(--ciq-gold-2)' : 'currentColor'} strokeWidth="1.7" strokeLinecap="round" /> },
  { label: 'Travel',   href: '/trip-planner', icon: (a: boolean) => <path d="m3 11 19-9-9 19-2-8-8-2Z" stroke={a ? 'var(--ciq-gold-2)' : 'currentColor'} strokeWidth="1.7" strokeLinejoin="round" /> },
  { label: 'Optimize', href: '/optimize',     icon: (a: boolean) => <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke={a ? 'var(--ciq-gold-2)' : 'currentColor'} strokeWidth="1.7" strokeLinejoin="round" /> },
  { label: 'You',      href: '/profile',      icon: (a: boolean) => <><circle cx="12" cy="8" r="4" stroke={a ? 'var(--ciq-gold-2)' : 'currentColor'} strokeWidth="1.7" /><path d="M4 21a8 8 0 0 1 16 0" stroke={a ? 'var(--ciq-gold-2)' : 'currentColor'} strokeWidth="1.7" strokeLinecap="round" /></> },
];

const tabItem = (active: boolean): React.CSSProperties => ({
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
  fontSize: 9.5, fontWeight: 600, flex: 1, padding: '5px 0', textDecoration: 'none',
  whiteSpace: 'nowrap', color: active ? 'var(--ciq-ink)' : 'var(--ciq-ink-3)',
  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
});

export function TabBar() {
  const path = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // Close the sheet whenever the route changes (a link inside it was tapped).
  useEffect(() => { setMoreOpen(false); }, [path]);

  // Lock body scroll while the full-screen sheet is open.
  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [moreOpen]);

  return (
    <>
      <nav style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, maxWidth: 420, margin: '0 auto',
        background: 'color-mix(in srgb, var(--ciq-bg) 84%, transparent)', backdropFilter: 'blur(18px)',
        borderTop: '1px solid var(--ciq-line)', display: 'flex', justifyContent: 'space-around',
        padding: '9px 4px calc(9px + env(safe-area-inset-bottom))', zIndex: 40,
      }}>
        {TABS.map(t => {
          const active = path === t.href || (t.href !== '/dashboard' && path.startsWith(t.href));
          return (
            <Link key={t.href} href={t.href} style={tabItem(active)}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none">{t.icon(active)}</svg>
              {t.label}
            </Link>
          );
        })}
        {/* "More" — opens the full-screen sheet, never a link itself. */}
        <button type="button" onClick={() => setMoreOpen(true)} aria-label="More" aria-expanded={moreOpen} style={tabItem(moreOpen)}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
            <circle cx="5" cy="12" r="1.6" fill={moreOpen ? 'var(--ciq-gold-2)' : 'currentColor'} />
            <circle cx="12" cy="12" r="1.6" fill={moreOpen ? 'var(--ciq-gold-2)' : 'currentColor'} />
            <circle cx="19" cy="12" r="1.6" fill={moreOpen ? 'var(--ciq-gold-2)' : 'currentColor'} />
          </svg>
          More
        </button>
      </nav>

      {moreOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="More navigation"
          style={{
            position: 'fixed', inset: 0, zIndex: 2000, background: 'var(--ciq-bg)',
            display: 'flex', flexDirection: 'column', animation: 'ciqMoreIn 0.22s ease',
          }}
        >
          <style>{`@keyframes ciqMoreIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }`}</style>

          {/* Sheet header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'calc(16px + env(safe-area-inset-top)) 20px 14px', borderBottom: '1px solid var(--ciq-line)',
          }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ciq-ink)', letterSpacing: '-0.3px' }}>More</span>
            <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close" style={{
              width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--ciq-line-2)',
              background: 'transparent', color: 'var(--ciq-ink)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* Scrollable grouped links */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px calc(28px + env(safe-area-inset-bottom))' }}>
            {MORE_GROUPS.map(group => (
              <section key={group.title} style={{ marginTop: 18 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: 'var(--ciq-gold-2)',
                  letterSpacing: '1.6px', textTransform: 'uppercase', padding: '0 4px 4px',
                }}>{group.title}</div>
                {group.links.map(link => {
                  const active = link.href === '/' ? path === '/' : path.startsWith(link.href);
                  return (
                    <Link key={`${group.title}-${link.href}`} href={link.href} onClick={() => setMoreOpen(false)} style={{
                      display: 'flex', alignItems: 'center', gap: 13, padding: '13px 6px',
                      borderBottom: '1px solid var(--ciq-line)', textDecoration: 'none',
                    }}>
                      <span style={{
                        width: 38, height: 38, borderRadius: 11, flexShrink: 0, fontSize: 18,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: active ? 'var(--ciq-gold-soft)' : 'var(--ciq-panel-2)',
                        border: '1px solid var(--ciq-line)',
                      }}>{link.icon}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontSize: 14.5, fontWeight: 600, color: active ? 'var(--ciq-gold-2)' : 'var(--ciq-ink)' }}>{link.label}</span>
                          {link.badge && <span style={{
                            fontSize: 8.5, fontWeight: 700, letterSpacing: '0.5px', padding: '2px 6px', borderRadius: 100,
                            background: 'var(--ciq-gold-soft)', color: 'var(--ciq-gold-2)', border: '1px solid var(--ciq-gold-line)',
                          }}>{link.badge}</span>}
                        </span>
                        {link.desc && <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ciq-ink-3)', marginTop: 1 }}>{link.desc}</span>}
                      </span>
                    </Link>
                  );
                })}
              </section>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
