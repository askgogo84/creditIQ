import type { CreditCard, RedemptionRecommendation } from './types';

/**
 * Given a card and a points balance, return all redemption options
 * ranked by INR value, with AI-friendly context.
 */
export function optimizeRedemption(
  card: CreditCard,
  points: number,
  preference?: 'cash' | 'travel' | 'shopping' | 'any'
): RedemptionRecommendation[] {
  const recommendations: RedemptionRecommendation[] = [];

  for (const opt of card.redemption_options) {
    if (opt.min_points && points < opt.min_points) continue;

    // Preference filtering (but still include all for comparison)
    const inrValue = points * opt.value_per_point_inr;

    recommendations.push({
      option: opt,
      inr_value: Math.round(inrValue),
      points_used: points,
      ranking: 0, // set below
    });
  }

  // Sort by INR value desc
  recommendations.sort((a, b) => b.inr_value - a.inr_value);
  recommendations.forEach((r, i) => (r.ranking = i + 1));

  // Apply preference reordering (move preferred type to top among similar values)
  if (preference && preference !== 'any') {
    const preferredTypes: Record<string, string[]> = {
      cash: ['cashback'],
      travel: ['flight', 'hotel', 'transfer'],
      shopping: ['voucher', 'product'],
    };
    const targets = preferredTypes[preference] || [];
    recommendations.sort((a, b) => {
      const aPref = targets.includes(a.option.type) ? 1 : 0;
      const bPref = targets.includes(b.option.type) ? 1 : 0;
      if (aPref !== bPref) return bPref - aPref;
      return b.inr_value - a.inr_value;
    });
  }

  return recommendations;
}

/**
 * Build a prompt for the AI to generate human-readable redemption advice.
 * Used by the /api/claude endpoint.
 */
export function buildRedemptionPrompt(card: CreditCard, points: number, top: RedemptionRecommendation[]): string {
  const list = top
    .slice(0, 5)
    .map(
      r =>
        `- ${r.option.type.toUpperCase()}${r.option.partner ? ` via ${r.option.partner}` : ''}: ₹${r.inr_value.toLocaleString('en-IN')} (${r.option.value_per_point_inr.toFixed(2)}/pt)${r.option.best_for ? `. Best for: ${r.option.best_for}` : ''}`
    )
    .join('\n');

  return `You are a senior Indian credit card rewards strategist. A user holds ${points.toLocaleString('en-IN')} ${card.reward_currency.replace('-', ' ')} on the ${card.name}.

Their available redemption options (ranked by INR value):
${list}

Provide a concise, expert recommendation in 4-6 short paragraphs (do NOT use bullet points or headers):
1. The single highest-value redemption to chase, with a concrete travel example (specific route, hotel, or product).
2. A simpler alternative if they don't want to deal with transfers or complex bookings.
3. What to AVOID (the worst-value redemption and why).
4. A "sweet spot" tip — e.g. when transfer ratios make sense, sweet-spot routes, partner promos.

Use INR (₹) values. Be specific. Mention airline/hotel sweet spots where relevant (e.g. KrisFlyer Business Class redemptions, Marriott Cat 4 hotels).`;
}
