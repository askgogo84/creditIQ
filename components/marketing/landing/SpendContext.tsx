'use client';

import { createContext, useContext, useState } from 'react';

// ONE shared monthly-spend value for the whole landing page. The hero owns the
// single slider that writes it; the hero leak range AND the card rankings both
// read it, so the two surfaces can never show contradictory numbers. Bounds/step
// match the card-detail control (5,000–5,00,000, step 5,000).

type SpendCtx = { spend: number; setSpend: (n: number) => void };

const Ctx = createContext<SpendCtx | null>(null);

export const SPEND_MIN = 5000;
export const SPEND_MAX = 500000;
export const SPEND_STEP = 5000;
export const SPEND_DEFAULT = 50000;

export function SpendProvider({ children }: { children: React.ReactNode }) {
  const [spend, setSpend] = useState(SPEND_DEFAULT);
  return <Ctx.Provider value={{ spend, setSpend }}>{children}</Ctx.Provider>;
}

export function useSpend(): SpendCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSpend must be used within <SpendProvider>');
  return v;
}

// Compact ₹ read-out shared by the hero + rankings: 50000→₹50K, 500000→₹5L.
export const rupeeShort = (n: number): string => {
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2).replace(/\.?0+$/, '')}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1).replace(/\.?0+$/, '')}K`;
  return `₹${n.toLocaleString('en-IN')}`;
};
