import type { CreditCard, UserSpendProfile, MatchScore } from './types';

/**
 * DEFAULT_SPEND_MIX — the canonical, CARD-INDEPENDENT allocation of monthly
 * spend across categories. Fractions sum to exactly 1.0. Every card is scored
 * against this SAME vector: a card's listed accelerators decide the RATE applied
 * to a slice, never the SIZE of the slice. A slice with no matching accelerator
 * on a given card earns the base rate — it is not dropped or redistributed.
 *
 *  - `fraction` — share of monthly_total_inr assigned to this slice.
 *  - `field`    — UserSpendProfile override; a passed-in value wins over the
 *                 default fraction (e.g. spend.online_inr overrides online).
 *  - `matches`  — the seed `category_rewards.category` strings (lower-cased)
 *                 that map onto this slice.
 *
 * `international` folds onto the TRAVEL slice: it has no own spend field and
 * would otherwise double-count travel. The `other` slice (0.05) has no
 * accelerator and always earns base rate — it closes 0.95 -> 1.0 while leaving
 * the six real buckets at their historical literal proportions.
 *
 * PROVENANCE: these fractions are the same relative proportions the engine used
 * as bare inline literals prior to 2026-07-28. They are an internal spend-shape
 * ASSUMPTION, not a surveyed or sourced distribution.
 */
export const DEFAULT_SPEND_MIX: {
  bucket: string;
  fraction: number;
  field?: keyof UserSpendProfile;
  matches: string[];
}[] = [
  { bucket: 'online',  fraction: 0.40, field: 'online_inr',  matches: ['online', 'amazon-prime', 'flipkart', 'smartbuy', 'tata-neu-app', 'tata-partners'] },
  { bucket: 'dining',  fraction: 0.15, field: 'dining_inr',  matches: ['dining', 'preferred'] },
  { bucket: 'grocery', fraction: 0.12, field: 'grocery_inr', matches: ['grocery'] },
  { bucket: 'travel',  fraction: 0.10, field: 'travel_inr',  matches: ['travel', 'travel-edge', 'international'] },
  { bucket: 'utility', fraction: 0.10, field: 'utility_inr', matches: ['utility'] },
  { bucket: 'fuel',    fraction: 0.08, field: 'fuel_inr',    matches: ['fuel'] },
  { bucket: 'other',   fraction: 0.05,                        matches: [] },
];

/**
 * Post-cap ANNUAL reward for a single accelerator applied to a given monthly
 * spend on its slice. The cap logic (monthly ceiling -> x12 -> annual ceiling,
 * plus the point-currency redemption recompute) is preserved VERBATIM from the
 * prior per-category loop. Do not change it.
 */
function categoryAnnualReward(
  cr: CreditCard['category_rewards'][number],
  monthlySpendInCategory: number,
  card: CreditCard,
  bestRedemptionValue: number
): number {
  let rewardMultiplier = 0;
  if (cr.unit === 'percent') {
    rewardMultiplier = cr.rate / 100;
  } else {
    // multiplier on base rate
    rewardMultiplier = (cr.rate * card.base_reward_rate) / 100;
  }

  let monthlyReward = monthlySpendInCategory * rewardMultiplier;

  // Apply monthly cap
  if (cr.cap_inr_monthly) {
    monthlyReward = Math.min(monthlyReward, cr.cap_inr_monthly);
  }

  // For point-based cards, multiply by redemption value
  if (card.reward_currency !== 'cashback') {
    // The rate already represents % equivalent in our seed
    // For multipliers, we approximate at best redemption value
    if (cr.unit === 'multiplier') {
      monthlyReward = monthlySpendInCategory * (cr.rate / 100) * bestRedemptionValue;
      if (cr.cap_inr_monthly) monthlyReward = Math.min(monthlyReward, cr.cap_inr_monthly);
    }
  }

  const annualCategoryReward = monthlyReward * 12;
  const annualCap = cr.cap_inr_annual ?? Infinity;
  return Math.min(annualCategoryReward, annualCap);
}

/**
 * Calculate the annual value of a card given a spend profile.
 *
 * Spend is split across categories using DEFAULT_SPEND_MIX — the SAME
 * card-independent vector for every card. Each slice earns the card's
 * best-matching accelerator (highest POST-CAP annual value when several match),
 * or the base rate when the card has no accelerator for that slice.
 *
 * Three value figures are returned:
 *  - net_value_inr      — legacy field, kept for existing callers (== year_one).
 *  - year_one_value_inr — rewards INCLUDING the one-time welcome benefit, minus
 *                         the annual fee AND the one-time joining fee. True
 *                         first-year net.
 *  - recurring_value_inr — steady state: EXCLUDES the one-time welcome benefit
 *                          and joining fee; includes the recurring annual fee.
 *
 * The welcome benefit is counted at FULL value in year 1 only — it is NOT
 * amortized — and is absent from recurring_value_inr.
 */
export function calculateAnnualValue(
  card: CreditCard,
  spend: UserSpendProfile
): {
  gross_rewards_inr: number;
  fee_inr: number;
  net_value_inr: number;
  year_one_value_inr: number;
  recurring_value_inr: number;
  breakdown: Record<string, number>;
} {
  const monthlyTotal = spend.monthly_total_inr;
  const annualTotal = monthlyTotal * 12;
  const breakdown: Record<string, number> = {};

  // Best redemption value (for converting points to INR)
  const bestRedemptionValue = card.redemption_options.length > 0
    ? Math.max(...card.redemption_options.map(r => r.value_per_point_inr))
    : 1.0;

  let totalRewards = 0;
  let baseAnnualSpend = 0;

  // Allocate the fixed, card-independent mix. Each slice applies the card's
  // best-matching accelerator (by post-cap annual value), else falls to base.
  for (const slice of DEFAULT_SPEND_MIX) {
    const override = slice.field ? spend[slice.field] : undefined;
    const monthlySpendInCategory = override ?? monthlyTotal * slice.fraction;

    if (monthlySpendInCategory <= 0) continue;

    const candidates = card.category_rewards.filter(cr =>
      slice.matches.includes(cr.category.toLowerCase())
    );

    if (candidates.length === 0) {
      // No accelerator on this card for this slice -> earns base rate.
      baseAnnualSpend += monthlySpendInCategory * 12;
      continue;
    }

    // Collision rule: when several accelerators map to one slice, the winner is
    // the one with the highest POST-CAP annual value (a capped 10X can be worth
    // less than an uncapped 5%), NOT the highest nominal rate.
    let best = candidates[0];
    let bestValue = categoryAnnualReward(best, monthlySpendInCategory, card, bestRedemptionValue);
    for (let i = 1; i < candidates.length; i++) {
      const v = categoryAnnualReward(candidates[i], monthlySpendInCategory, card, bestRedemptionValue);
      if (v > bestValue) { best = candidates[i]; bestValue = v; }
    }

    breakdown[`${best.category} (${best.rate}${best.unit === 'percent' ? '%' : 'x'})`] = Math.round(bestValue);
    totalRewards += bestValue;
  }

  // Base rate on all non-accelerated slices (aggregated into one line).
  const baseRewards = baseAnnualSpend * (card.base_reward_rate / 100);
  if (baseRewards > 0) {
    breakdown[`Base rate (${card.base_reward_rate}%)`] = Math.round(baseRewards);
    totalRewards += baseRewards;
  }

  // Milestone bonuses
  if (card.milestones) {
    for (const m of card.milestones) {
      let triggers = 0;
      if (m.period === 'monthly' && monthlyTotal >= m.spend_threshold_inr) {
        triggers = 12;
      } else if (m.period === 'quarterly' && monthlyTotal * 3 >= m.spend_threshold_inr) {
        triggers = 4;
      } else if (m.period === 'annual' && annualTotal >= m.spend_threshold_inr) {
        triggers = 1;
      }
      if (triggers > 0) {
        const ms = m.reward_inr_equivalent * triggers;
        breakdown[`Milestone: ${m.description}`] = ms;
        totalRewards += ms;
      }
    }
  }

  // Welcome benefit (year 1 only) — tracked separately so recurring can exclude it
  let welcomeBenefit = 0;
  if (card.welcome_benefit_inr) {
    welcomeBenefit = card.welcome_benefit_inr;
    breakdown[`Welcome benefit`] = card.welcome_benefit_inr;
    totalRewards += card.welcome_benefit_inr;
  }

  // Lounge value estimation (Rs.2,000 per visit if user travels)
  const annualLoungeVisits = (card.lounges ?? []).reduce((sum, l) => {
    if (l.spend_gated && (l.spend_threshold ?? 0) > monthlyTotal * 3) return sum;
    const visits = (l.visits_per_year ?? 0) + (l.visits_per_quarter ?? 0) * 4;
    return sum + Math.min(visits, 24);
  }, 0);
  if (annualLoungeVisits > 0 && (spend.travel_inr ?? 0) > 0) {
    const loungeValue = annualLoungeVisits * 2000;
    breakdown[`Lounge access (${annualLoungeVisits} visits)`] = loungeValue;
    totalRewards += loungeValue;
  } else if (annualLoungeVisits >= 4) {
    // small value even for non-travelers
    breakdown[`Lounge access (${annualLoungeVisits} visits)`] = Math.min(annualLoungeVisits * 1000, 4000);
    totalRewards += Math.min(annualLoungeVisits * 1000, 4000);
  }

  // Fee handling
  const feeWaived = card.fee_waiver_spend_inr && annualTotal >= card.fee_waiver_spend_inr;
  const effectiveFee = feeWaived ? 0 : card.annual_fee_inr;
  if (card.annual_fee_inr > 0) {
    breakdown[`Annual fee${feeWaived ? ' (waived)' : ''}`] = -effectiveFee;
  }
  // Joining fee (year 1 only)
  if (card.joining_fee_inr > 0) {
    breakdown[`Joining fee (year 1)`] = -card.joining_fee_inr;
  }

  // year 1 keeps the one-time welcome benefit as income and the one-time joining
  // fee as cost; recurring drops both one-time items but keeps the annual fee.
  const yearOneValue = totalRewards - effectiveFee - card.joining_fee_inr;
  const recurringValue = (totalRewards - welcomeBenefit) - effectiveFee;

  return {
    gross_rewards_inr: Math.round(totalRewards),
    fee_inr: effectiveFee + card.joining_fee_inr,
    net_value_inr: Math.round(yearOneValue),
    year_one_value_inr: Math.round(yearOneValue),
    recurring_value_inr: Math.round(recurringValue),
    breakdown,
  };
}

/**
 * Match cards against a spend profile and return ranked results.
 */
export function matchCards(
  cards: CreditCard[],
  spend: UserSpendProfile,
  filters?: { max_fee?: number; categories?: string[]; min_score?: number }
): MatchScore[] {
  const results: MatchScore[] = [];

  for (const card of cards) {
    if (!card.active) continue;
    if (filters?.max_fee !== undefined && card.annual_fee_inr > filters.max_fee) continue;
    if (filters?.categories && filters.categories.length > 0) {
      const hasCategory = filters.categories.some(c => card.category.includes(c as any));
      if (!hasCategory) continue;
    }

    const { net_value_inr, gross_rewards_inr, fee_inr, breakdown } = calculateAnnualValue(card, spend);

    // Score: 0-100 based on net value relative to spend and expert rating
    const valuePercent = (net_value_inr / Math.max(spend.monthly_total_inr * 12, 1)) * 100;
    const ratingComponent = (card.expert_rating ?? 7) * 5;
    const score = Math.min(100, Math.max(0, valuePercent * 8 + ratingComponent));

    // Reasoning
    const topReward = Object.entries(breakdown)
      .filter(([k]) => !k.includes('fee') && !k.includes('Welcome'))
      .sort((a, b) => (b[1] as number) - (a[1] as number))[0];
    const reasoning = `Net Rs.${net_value_inr.toLocaleString('en-IN')}/year. ${topReward ? `Top earn: ${topReward[0]}` : ''}`;

    const warnings: string[] = [];
    if (card.devaluations && card.devaluations.length > 0) {
      const recent = card.devaluations.filter(d => new Date(d.date) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));
      if (recent.length > 0) warnings.push(`${recent.length} devaluation(s) in past 12 months`);
    }
    if (card.tier === 'invite-only') warnings.push('Invite-only  --  application not guaranteed');

    results.push({ card, score, annual_value_inr: net_value_inr, reasoning, warnings });
  }

  return results
    .filter(r => filters?.min_score === undefined || r.score >= filters.min_score)
    .sort((a, b) => b.annual_value_inr - a.annual_value_inr);
}

/**
 * Approval probability heuristic based on income + credit score + card tier
 */
export function approvalProbability(
  card: CreditCard,
  income_monthly: number,
  credit_score: number
): number {
  if (card.tier === 'invite-only') return 0;
  let p = 50;
  if (card.min_income_inr_monthly) {
    const ratio = income_monthly / card.min_income_inr_monthly;
    if (ratio >= 2) p += 30;
    else if (ratio >= 1.2) p += 20;
    else if (ratio >= 1) p += 10;
    else if (ratio >= 0.7) p -= 20;
    else p -= 45;
  }
  if (card.credit_score_min) {
    const gap = credit_score - card.credit_score_min;
    if (gap >= 50) p += 25;
    else if (gap >= 0) p += 15;
    else if (gap >= -30) p -= 15;
    else p -= 40;
  }
  return Math.min(95, Math.max(5, p));
}
