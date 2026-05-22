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

function applyTheme(t: 'dark' | 'light') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (t === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
  // keep legacy classes in sync for any older components that still check them
  root.classList.toggle('dark', t === 'dark');
  root.classList.toggle('light', t === 'light');
}

export const useTheme = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggle: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: next });
        applyTheme(next);
      },
      setTheme: (t) => {
        set({ theme: t });
        applyTheme(t);
      },
    }),
    { name: 'CreditIQ-theme' }
  )
);

