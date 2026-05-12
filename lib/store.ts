'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CreditCard } from '@/lib/types';

interface CompareStore {
  cards: string[]; // card IDs
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
        if (current.length >= 4) return; // max 4
        set({ cards: [...current, id] });
      },
      remove: (id) => set({ cards: get().cards.filter((c) => c !== id) }),
      clear: () => set({ cards: [] }),
      isIn: (id) => get().cards.includes(id),
    }),
    { name: 'cardiq-compare' }
  )
);

interface ThemeStore {
  theme: 'dark' | 'light';
  toggle: () => void;
}

export const useTheme = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggle: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    { name: 'cardiq-theme' }
  )
);
