// components/ciq/TabBar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: 'Wallet',   href: '/dashboard',    icon: (a: boolean) => <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2v-9Z" stroke={a ? 'var(--ciq-gold-2)' : 'currentColor'} strokeWidth="1.7" strokeLinejoin="round" /> },
  { label: 'Cards',    href: '/my-cards',        icon: (a: boolean) => <><rect x="2" y="5" width="20" height="14" rx="2.5" stroke={a ? 'var(--ciq-gold-2)' : 'currentColor'} strokeWidth="1.7" /><path d="M2 10h20" stroke={a ? 'var(--ciq-gold-2)' : 'currentColor'} strokeWidth="1.7" /></> },
  { label: 'Feed',     href: '/feed',         icon: (a: boolean) => <path d="M4 6h16M4 12h16M4 18h10" stroke={a ? 'var(--ciq-gold-2)' : 'currentColor'} strokeWidth="1.7" strokeLinecap="round" /> },
  { label: 'Travel',   href: '/trip-planner', icon: (a: boolean) => <path d="m3 11 19-9-9 19-2-8-8-2Z" stroke={a ? 'var(--ciq-gold-2)' : 'currentColor'} strokeWidth="1.7" strokeLinejoin="round" /> },
  { label: 'Optimize', href: '/optimize',     icon: (a: boolean) => <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke={a ? 'var(--ciq-gold-2)' : 'currentColor'} strokeWidth="1.7" strokeLinejoin="round" /> },
  { label: 'You',      href: '/profile',      icon: (a: boolean) => <><circle cx="12" cy="8" r="4" stroke={a ? 'var(--ciq-gold-2)' : 'currentColor'} strokeWidth="1.7" /><path d="M4 21a8 8 0 0 1 16 0" stroke={a ? 'var(--ciq-gold-2)' : 'currentColor'} strokeWidth="1.7" strokeLinecap="round" /></> },
];

export function TabBar() {
  const path = usePathname();
  return (
    <nav style={{
      position: 'fixed', left: 0, right: 0, bottom: 0, maxWidth: 420, margin: '0 auto',
      background: 'color-mix(in srgb, var(--ciq-bg) 84%, transparent)', backdropFilter: 'blur(18px)',
      borderTop: '1px solid var(--ciq-line)', display: 'flex', justifyContent: 'space-around',
      padding: '9px 4px calc(9px + env(safe-area-inset-bottom))', zIndex: 40,
    }}>
      {TABS.map(t => {
        const active = path === t.href || (t.href !== '/dashboard' && path.startsWith(t.href));
        return (
          <Link key={t.href} href={t.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            fontSize: 9.5, fontWeight: 600, flex: 1, padding: '5px 0', textDecoration: 'none',
            whiteSpace: 'nowrap', color: active ? 'var(--ciq-ink)' : 'var(--ciq-ink-3)',
          }}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none">{t.icon(active)}</svg>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
