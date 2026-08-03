// components/ciq/ThemeProvider.tsx
'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';
const ThemeCtx = createContext<{ theme: Theme }>({ theme: 'dark' });
export const useTheme = () => useContext(ThemeCtx);

/**
 * Wrap a gold [data-ciq] surface in this. It sets data-ciq + data-theme on the
 * wrapper div so the retired gold design tokens apply, and keeps that attribute in
 * sync with the persisted 'ciq-theme' key.
 *
 * READ-ONLY: this provider never WRITES the theme. Every signed-in toggle
 * (Header, AppRail, TabBar) routes through the single writer in lib/store.ts,
 * which writes 'ciq-theme' and broadcasts 'ciq-theme-change' — enforced by
 * lib/theme-single-writer.test.ts. The old in-wrapper ThemeToggle pill was
 * removed for that reason. This whole file dies with the gold system in the ciq
 * cleanup (docs/wallet/06-Implementation-Plan Follow-on task).
 */
export function CiqTheme({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('ciq-theme') as Theme | null;
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch {}
  }, []);

  // Re-read the persisted theme whenever another surface flips it. The site
  // toggles all route through lib/store.ts, which writes 'ciq-theme' and
  // dispatches 'ciq-theme-change'; the 'storage' event covers other tabs.
  useEffect(() => {
    const sync = () => {
      try {
        const saved = window.localStorage.getItem('ciq-theme') as Theme | null;
        if (saved === 'light' || saved === 'dark') setTheme(saved);
      } catch {}
    };
    window.addEventListener('ciq-theme-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('ciq-theme-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme }}>
      <div data-ciq data-theme={theme} className={className}
           style={{ background: 'var(--ciq-bg)', color: 'var(--ciq-ink)', minHeight: '100vh', transition: 'background .3s, color .3s' }}>
        {children}
      </div>
    </ThemeCtx.Provider>
  );
}
