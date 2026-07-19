// components/ciq/ThemeProvider.tsx
'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'dark', toggle: () => {} });
export const useTheme = () => useContext(ThemeCtx);

/**
 * Wrap the app (or a screen) in this. It sets data-ciq + data-theme on the wrapper div,
 * so the design tokens apply. Persists choice in localStorage; defaults to dark.
 */
export function CiqTheme({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('ciq-theme') as Theme | null;
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch {}
  }, []);

  // Re-read the persisted theme whenever another surface flips it (e.g. the
  // Settings toggle inside the TabBar "More" sheet, which lives outside this
  // context and broadcasts 'ciq-theme-change').
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

  const toggle = () => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem('ciq-theme', next);
        window.dispatchEvent(new Event('ciq-theme-change'));
      } catch {}
      return next;
    });
  };

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <div data-ciq data-theme={theme} className={className}
           style={{ background: 'var(--ciq-bg)', color: 'var(--ciq-ink)', minHeight: '100vh', transition: 'background .3s, color .3s' }}>
        {children}
      </div>
    </ThemeCtx.Provider>
  );
}

/** Small pill toggle. Place in a header. */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} aria-label="Toggle theme"
      style={{
        width: 48, height: 27, borderRadius: 999, position: 'relative', cursor: 'pointer',
        border: '1.5px solid var(--ciq-line-2)', background: 'var(--ciq-panel)', flex: '0 0 auto',
      }}>
      <span style={{
        position: 'absolute', top: 2, left: 2, width: 20, height: 20, borderRadius: '50%',
        background: 'linear-gradient(135deg,var(--ciq-gold-2),var(--ciq-gold))',
        transform: theme === 'light' ? 'translateX(21px)' : 'none',
        transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)',
      }} />
    </button>
  );
}
