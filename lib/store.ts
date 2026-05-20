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

export const useTheme = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggle: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: next });
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', next === 'dark');
          document.documentElement.classList.toggle('light', next === 'light');
        }
      },
      setTheme: (t) => {
        set({ theme: t });
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', t === 'dark');
          document.documentElement.classList.toggle('light', t === 'light');
        }
      },
    }),
    { name: 'CreditIQ-theme' }
  )
);

