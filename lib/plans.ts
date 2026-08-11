// lib/plans.ts
// Single source of truth for CreditIQ Pro one-time prices. Amounts in PAISE.
// The client only ever sends a plan KEY; the amount is read here, server-side —
// never trusted from the browser. /plans, /pro and the first-run modal all import
// this one object instead of three surfaces disagreeing.
//
// Ladder (decided 9 Aug 2026): Free · ₹149 (1mo) · ₹499 (6mo) · ₹999 (12mo).

export type ProPlanKey = 'monthly' | 'sixmonth' | 'twelvemonth';

export const PLANS: Record<ProPlanKey, { amount: number; months: number; label: string }> = {
  monthly:     { amount: 14900, months:  1, label: '1 month'   },
  sixmonth:    { amount: 49900, months:  6, label: '6 months'  },
  twelvemonth: { amount: 99900, months: 12, label: '12 months' },
};

export function isProPlanKey(k: string): k is ProPlanKey {
  return Object.prototype.hasOwnProperty.call(PLANS, k);
}

export function monthsForPlan(k: string): number {
  return isProPlanKey(k) ? PLANS[k].months : 1;
}
