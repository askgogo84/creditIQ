'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CompareStore {
  cards: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  isIn: (id: string) => boolean;
}

export const useCompare = create<CompareStore>()(
  persist(
    (set, get) => ({
      cards: [],
      add: (id) => {
        const current = get().cards;
        if (current.includes(id)) return;
        if (current.length >= 4) return;
        set({ cards: [...current, id] });
      },
      remove: (id) => set({ cards: get().cards.filter((c) => c !== id) }),
      clear: () => set({ cards: [] }),
      isIn: (id) => get().cards.includes(id),
    }),
    { name: 'CreditIQ-compare' }
  )
);

interface ThemeStore {
  theme: 'dark' | 'light';
  toggle: () => void;
  setTheme: (t: 'dark' | 'light') => void;
}

const THEME_KEY = 'creditiq-theme';

// `data-theme` on <html> is the single source of truth; the inline script in
// app/layout.tsx sets it before first paint (stored choice → OS preference → light).
// applyTheme mirrors a change back onto the attribute, the legacy .dark/.light classes
// (still read by html.dark CSS + Logo), and localStorage so the pre-paint script
// restores it next load. Same key the script and the nav toggle read.
function applyTheme(t: 'dark' | 'light') {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  el.setAttribute('data-theme', t);
  el.classList.toggle('dark', t === 'dark');
  el.classList.toggle('light', t === 'light');
  try { localStorage.setItem(THEME_KEY, t); } catch {}
}

function currentTheme(): 'dark' | 'light' {
  if (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark') return 'dark';
  return 'light';
}

export const useTheme = create<ThemeStore>((set) => ({
  // Seeded from the attribute the pre-paint script already set — never a blind default.
  theme: currentTheme(),
  toggle: () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    set({ theme: next });
    applyTheme(next);
  },
  setTheme: (t) => {
    set({ theme: t });
    applyTheme(t);
  },
}));

