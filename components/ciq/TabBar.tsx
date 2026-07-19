// components/ciq/TabBar.tsx
'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

// Logged-in bottom bar: exactly 4 destinations + a "More" sheet (5 items total).
// Cards + Profile (You) moved into the More sheet's account list.
const TABS = [
  { label: 'Wallet',   href: '/dashboard',    icon: (a: boolean) => <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2v-9Z" stroke={a ? 'var(--ciq-gold-2)' : 'currentColor'} strokeWidth="1.7" strokeLinejoin="round" /> },
  { label: 'Optimize', href: '/optimize',     icon: (a: boolean) => <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke={a ? 'var(--ciq-gold-2)' : 'currentColor'} strokeWidth="1.7" strokeLinejoin="round" /> },
  { label: 'Travel',   href: '/trip-planner', icon: (a: boolean) => <path d="m3 11 19-9-9 19-2-8-8-2Z" stroke={a ? 'var(--ciq-gold-2)' : 'currentColor'} strokeWidth="1.7" strokeLinejoin="round" /> },
  { label: 'Feed',     href: '/feed',         icon: (a: boolean) => <path d="M4 6h16M4 12h16M4 18h10" stroke={a ? 'var(--ciq-gold-2)' : 'currentColor'} strokeWidth="1.7" strokeLinecap="round" /> },
];

// "More" sheet — account destinations (all confirmed routes). Settings is a
// section inside the sheet (theme toggle), not a separate page.
const ACCOUNT_LINKS = [
  {
    label: 'Cards', href: '/my-cards', desc: 'Your saved cards & points',
    icon: <><rect x="2" y="5" width="20" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" /><path d="M2 10h20" stroke="currentColor" strokeWidth="1.7" /></>,
  },
  {
    label: 'Profile', href: '/profile', desc: 'Your account & details',
    icon: <><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" /><path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></>,
  },
  {
    label: 'Pro / Billing', href: '/pro', desc: 'Plan, upgrade & payments',
    icon: <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.9l-5.8 3.05 1.1-6.47-4.7-4.58 6.5-.95L12 2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />,
  },
];

const tabItem = (active: boolean): React.CSSProperties => ({
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
  fontSize: 9.5, fontWeight: 600, flex: 1, padding: '5px 0', textDecoration: 'none',
  whiteSpace: 'nowrap', color: active ? 'var(--ciq-ink)' : 'var(--ciq-ink-3)',
  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
});

// Account/settings row inside the More sheet — min 48px touch target.
const sheetRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 13, width: '100%', minHeight: 56,
  padding: '12px 14px', borderRadius: 14, textDecoration: 'none', textAlign: 'left',
  background: 'var(--ciq-panel)', border: '1px solid var(--ciq-line)',
  cursor: 'pointer', fontFamily: 'inherit', marginTop: 10,
};
const sheetIconTile: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'var(--ciq-gold-soft)', border: '1px solid var(--ciq-gold-line)', color: 'var(--ciq-gold-2)',
};

export function TabBar() {
  const path = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Close the sheet whenever the route changes (a link inside it was tapped).
  useEffect(() => { setMoreOpen(false); }, [path]);

  // Lock body scroll while the full-screen sheet is open.
  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [moreOpen]);

  // Read the persisted ciq theme when the sheet opens so the Settings toggle
  // shows the real current state.
  useEffect(() => {
    if (!moreOpen) return;
    try {
      const saved = window.localStorage.getItem('ciq-theme');
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch {}
  }, [moreOpen]);

  // Toggle theme from OUTSIDE any CiqTheme context: persist + broadcast a
  // 'ciq-theme-change' event that CiqTheme (WalletView) and the Header wrapper
  // both listen for, so the whole app re-themes live.
  const toggleTheme = () => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem('ciq-theme', next);
        window.dispatchEvent(new Event('ciq-theme-change'));
      } catch {}
      return next;
    });
  };

  const signOut = async () => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    await sb.auth.signOut();
    router.push('/');
  };

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
              {/* active marker — gold dot, matching the logged-out Home tab */}
              {active && <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--ciq-gold-2)' }} />}
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
          {moreOpen && <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--ciq-gold-2)' }} />}
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

          {/* Scrollable account + settings list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px calc(28px + env(safe-area-inset-bottom))' }}>

            {/* Account destinations */}
            <div style={{
              fontSize: 10, fontWeight: 700, color: 'var(--ciq-gold-2)',
              letterSpacing: '1.6px', textTransform: 'uppercase', padding: '8px 4px 0',
            }}>Account</div>
            {ACCOUNT_LINKS.map(link => {
              const active = path.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href} onClick={() => setMoreOpen(false)} style={{
                  ...sheetRow,
                  borderColor: active ? 'var(--ciq-gold-line)' : 'var(--ciq-line)',
                }}>
                  <span style={sheetIconTile}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">{link.icon}</svg>
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: active ? 'var(--ciq-gold-2)' : 'var(--ciq-ink)' }}>{link.label}</span>
                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ciq-ink-3)', marginTop: 1 }}>{link.desc}</span>
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ciq-ink-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </Link>
              );
            })}

            {/* Settings — theme toggle lives here (no dedicated /settings page) */}
            <div style={{
              fontSize: 10, fontWeight: 700, color: 'var(--ciq-gold-2)',
              letterSpacing: '1.6px', textTransform: 'uppercase', padding: '22px 4px 0',
            }}>Settings</div>
            <div style={{ ...sheetRow, cursor: 'default' }}>
              <span style={sheetIconTile}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--ciq-ink)' }}>Appearance</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ciq-ink-3)', marginTop: 1 }}>{theme === 'light' ? 'Light mode' : 'Dark mode'}</span>
              </span>
              <button type="button" onClick={toggleTheme} aria-label="Toggle theme" style={{
                width: 48, height: 27, borderRadius: 999, position: 'relative', cursor: 'pointer', flexShrink: 0,
                border: '1.5px solid var(--ciq-line-2)', background: 'var(--ciq-panel-2)',
              }}>
                <span style={{
                  position: 'absolute', top: 2, left: 2, width: 20, height: 20, borderRadius: '50%',
                  background: 'linear-gradient(135deg,var(--ciq-gold-2),var(--ciq-gold))',
                  transform: theme === 'light' ? 'translateX(21px)' : 'none',
                  transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)',
                }} />
              </button>
            </div>

            {/* Sign out */}
            <button type="button" onClick={signOut} style={{
              ...sheetRow, justifyContent: 'flex-start', marginTop: 22,
              borderColor: 'var(--ciq-line-2)',
            }}>
              <span style={{ ...sheetIconTile, background: 'var(--ciq-line)', borderColor: 'var(--ciq-line-2)', color: 'var(--ciq-ink-2)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </span>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ciq-ink)' }}>Sign out</span>
            </button>

          </div>
        </div>
      )}
    </>
  );
}
