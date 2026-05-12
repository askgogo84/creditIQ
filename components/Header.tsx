'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCompare } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Search, Menu, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Header() {
  const pathname = usePathname();
  const compareCount = useCompare((s) => s.cards.length);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const nav = [
    { href: '/', label: 'Discover' },
    { href: '/smart-match', label: 'Smart Match' },
    { href: '/optimize', label: 'Optimize Points' },
    { href: '/compare', label: 'Compare' },
    { href: '/about', label: 'Manifesto' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'backdrop-blur-xl bg-ink-950/80 border-b border-white/5' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-copper-300 via-copper-500 to-copper-700 flex items-center justify-center">
              <span className="font-display font-bold text-ink-950 text-sm">C</span>
            </div>
            <div className="absolute -inset-0.5 rounded-md bg-copper-400 opacity-0 group-hover:opacity-30 blur-md transition-opacity" />
          </div>
          <div className="leading-none">
            <div className="font-display text-xl text-ink-50">CardIQ</div>
            <div className="text-[9px] font-mono text-ink-300 tracking-widest uppercase">Intelligence</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-4 py-2 text-sm tracking-wide transition-colors rounded',
                pathname === item.href
                  ? 'text-copper-400'
                  : 'text-ink-200 hover:text-copper-300'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/compare"
            className={cn(
              'relative px-3 py-2 text-sm rounded border transition-all',
              compareCount > 0
                ? 'border-copper-500 text-copper-300 bg-copper-500/10'
                : 'border-white/10 text-ink-300 hover:border-white/20'
            )}
          >
            <span className="font-mono tabular">⇄ {compareCount}</span>
          </Link>
          <Link href="/smart-match" className="hidden sm:flex items-center gap-1.5 btn-primary text-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Find My Card
          </Link>
        </div>
      </div>
    </header>
  );
}
