'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, Home, ScanLine, Sparkles, Star } from 'lucide-react';

const TABS = [
  { label: 'Home', href: '/dashboard', Icon: Home, active: (p: string) => p === '/dashboard' },
  { label: 'Cards', href: '/wallet', Icon: CreditCard, active: (p: string) => p.startsWith('/wallet') || p.startsWith('/card/') },
  { label: 'Scan', href: '/upload-statement', Icon: ScanLine, active: (p: string) => p.startsWith('/upload-statement') || p.startsWith('/statement-truth') },
  { label: 'Rewards', href: '/intelligence', Icon: Star, active: (p: string) => p.startsWith('/intelligence') || p.startsWith('/points-optimizer') },
  { label: 'CIRA', href: '/cira', Icon: Sparkles, active: (p: string) => p.startsWith('/cira') || p.startsWith('/concierge') },
];

export function TabBar() {
  const path = usePathname() || '/dashboard';
  return (
    <nav className="ciq-mobile-tabbar" aria-label="Primary navigation">
      {TABS.map(({ label, href, Icon, active }) => {
        const on = active(path);
        return (
          <Link key={href} href={href} className={on ? 'active' : undefined}>
            <Icon size={21} strokeWidth={on ? 2.15 : 1.8} aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
