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
//
// This is the ONE place either theme key may be written (enforced by
// lib/theme-single-writer.test.ts). Every signed-in toggle — Header, AppRail,
// TabBar — routes here via useTheme().toggle/setTheme, so the two keys can never
// desync. That desync was the root cause of the gold-surface light-mode bug.
function applyTheme(t: 'dark' | 'light') {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  el.setAttribute('data-theme', t);
  el.classList.toggle('dark', t === 'dark');
  el.classList.toggle('light', t === 'light');
  try {
    localStorage.setItem(THEME_KEY, t);
    // INTERIM (wallet migration, docs/wallet/02-TRD §4.1): write BOTH theme keys so
    // the two systems can NEVER desync — that desync is the root cause of the
    // light-mode bug. `creditiq-theme` (the site theme, on <html data-theme>) drives
    // the migrated wallet and every white/copper surface; `ciq-theme` (RETIRED per
    // CLAUDE.md) still drives the five not-yet-migrated gold [data-ciq] surfaces
    // (onboarding, my-cards, feed, profile, pro). This dual-write is NOT the intended
    // design — when the last gold surface migrates, delete `ciq-theme`, the
    // `ciq-theme-change` broadcast, and this branch (06-Implementation-Plan Follow-on task).
    localStorage.setItem('ciq-theme', t);
    window.dispatchEvent(new Event('ciq-theme-change'));
  } catch {}
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

