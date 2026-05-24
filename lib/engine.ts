import type { CreditCard, UserSpendProfile, MatchScore } from './types';

/**
 * Calculate the REAL annual value of a card given a spend profile.
 * Accounts for:
 *  - Category-specific reward rates with monthly caps
 *  - Base reward rate on remaining spend
 *  - Milestone bonuses
 *  - Annual fee (subtracted, but waived if eligible)
 *  - Welcome benefit (one-time, amortized over 12 months = full value year 1)
 *  - Redemption haircut (uses best redemption value)
 */
export function calculateAnnualValue(
  card: CreditCard,
  spend: UserSpendProfile
): { gross_rewards_inr: number; fee_inr: number; net_value_inr: number; breakdown: Record<string, number> } {
  const monthlyTotal = spend.monthly_total_inr;
  const annualTotal = monthlyTotal * 12;
  const breakdown: Record<string, number> = {};

  // Best redemption value (for converting points to INR)
  const bestRedemptionValue = card.redemption_options.length > 0
    ? Math.max(...card.redemption_options.map(r => r.value_per_point_inr))
    : 1.0;

  let totalRewards = 0;
  let categorizedSpend = 0;

  // Apply category-specific rewards (with caps)
  for (const cr of card.category_rewards) {
    const cat = cr.category.toLowerCase();
    let monthlySpendInCategory = 0;

    // Map seed categories to user spend buckets
    if (['online', 'amazon-prime', 'flipkart', 'smartbuy', 'tata-neu-app', 'tata-partners'].includes(cat)) {
      monthlySpendInCategory = spend.online_inr ?? Math.min(monthlyTotal * 0.4, monthlyTotal);
    } else if (['dining', 'preferred'].includes(cat)) {
      monthlySpendInCategory = spend.dining_inr ?? monthlyTotal * 0.15;
    } else if (cat === 'fuel') {
      monthlySpendInCategory = spend.fuel_inr ?? monthlyTotal * 0.08;
    } else if (cat === 'grocery') {
      monthlySpendInCategory = spend.grocery_inr ?? monthlyTotal * 0.12;
    } else if (cat === 'travel' || cat === 'travel-edge') {
      monthlySpendInCategory = spend.travel_inr ?? monthlyTotal * 0.10;
    } else if (cat === 'utility') {
      monthlySpendInCategory = spend.utility_inr ?? monthlyTotal * 0.10;
    } else if (cat === 'international') {
      monthlySpendInCategory = spend.travel_inr ? spend.travel_inr * 0.5 : monthlyTotal * 0.05;
    }

    if (monthlySpendInCategory <= 0) continue;

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
    const cappedAnnual = Math.min(annualCategoryReward, annualCap);

    breakdown[`${cr.category} (${cr.rate}${cr.unit === 'percent' ? '%' : 'x'})`] = Math.round(cappedAnnual);
    totalRewards += cappedAnnual;
    categorizedSpend += monthlySpendInCategory * 12;
  }

  // Apply base rate on remaining (non-categorized) spend
  const remainingAnnualSpend = Math.max(annualTotal - categorizedSpend, 0);
  const baseRewards = remainingAnnualSpend * (card.base_reward_rate / 100);
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

  // Welcome benefit (year 1 only)
  if (card.welcome_benefit_inr) {
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

  const netValue = totalRewards - effectiveFee - card.joining_fee_inr;

  return {
    gross_rewards_inr: Math.round(totalRewards),
    fee_inr: effectiveFee + card.joining_fee_inr,
    net_value_inr: Math.round(netValue),
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
