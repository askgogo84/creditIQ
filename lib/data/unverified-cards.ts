// Per-field uncertainty for the cards whose LIVE SEED_CARDS values conflict with
// an unverified alternate source (the dead NEW_CARDS block) and have NOT been
// re-checked against a bank source. See docs/SEED-CARDS-INTEGRITY.md §7.
//
// We do NOT blank a contested value — a missing number is worse, the user can't
// judge it. We SHOW it, rendered in the "estimated" provenance style (grey, not
// verified-green), the same verified-vs-estimated distinction the wallet already
// teaches for point balances. Applied here to card catalogue data.
//
// The keys are SEED_CARDS field names; the treatment reaches any surface that
// renders the raw field OR a value computed from it (the engine consumes several
// of these — base_reward_rate, reward_currency, fees, income, credit_score).
// Remove a field (or the whole card) the moment it's verified against the issuer.
export const UNVERIFIED_CARD_FIELDS: Record<string, ReadonlySet<string>> = {
  // live fee ₹500 (joining+annual) & reward-points & 1% base vs source ₹0 LTF / cashback / 0.5%
  'rbl-shoprite': new Set(['annual_fee_inr', 'joining_fee_inr', 'reward_currency', 'base_reward_rate']),
  // live 0% forex / super-premium / 1.65% base vs source 1.75% / premium / 2.0%
  'yes-marquee': new Set(['tier', 'forex_markup_percent', 'base_reward_rate']),
  // live cashback / entry vs source reward-points / mid
  'au-altura-plus': new Set(['reward_currency', 'tier']),
  // live 2% base / income ₹1.2L / credit 750 vs source 1% / ₹1.5L / 730
  'icici-sapphiro': new Set(['base_reward_rate', 'min_income_inr_monthly', 'credit_score_min']),
  // Added 2026-08-26: base_reward_rate 0 is a PLACEHOLDER for unknown (earn chart not
  // machine-readable this run); reward_currency 'reward-points' proxies 6E Rewards.
  // Flag as estimated so surfaces never present the 0%/proxy as verified fact.
  'indigo-hdfc-6e-rewards-xl': new Set(['base_reward_rate', 'reward_currency']),
  // Added 2026-08-26: subscription-style card, fee + earn rate UNKNOWN this run;
  // 0s are placeholders (non-nullable numeric fields), flagged so they read estimated.
  'idfc-first-swyp': new Set(['base_reward_rate', 'joining_fee_inr', 'annual_fee_inr']),
};

/** True when any field on this card is contested (i.e. the card is flagged). */
export function isCardUnverified(slug: string | undefined): boolean {
  return !!slug && slug in UNVERIFIED_CARD_FIELDS;
}

/** True when this specific field on this card is contested. */
export function isFieldUnverified(slug: string | undefined, field: string): boolean {
  return !!slug && !!UNVERIFIED_CARD_FIELDS[slug]?.has(field);
}
