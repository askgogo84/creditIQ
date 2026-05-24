import type { CreditCard, RedemptionOption, RedemptionRecommendation } from './types';

/**
 * Default redemption options by reward currency + bank
 * Used when a card has no explicit redemption_options defined
 */
function getDefaultRedemptions(card: CreditCard): RedemptionOption[] {
  const currency = card.reward_currency;
  const bank = card.bank;

  // Cashback cards  --  always 1:1
  if (currency === 'cashback') {
    return [
      { type: 'cashback', value_per_point_inr: 1.0, best_for: 'Auto statement credit  --  no action needed' },
    ];
  }

  // NeuCoins  --  Tata ecosystem 1:1
  if (currency === 'neucoins') {
    return [
      { type: 'voucher', partner: 'Tata Neu App (1:1)', value_per_point_inr: 1.0, best_for: 'BigBasket, Croma, 1mg, Westside, Air Asia' },
      { type: 'cashback', value_per_point_inr: 0.75, best_for: 'Statement credit (worse than Neu redemption)' },
    ];
  }

  // EDGE Miles  --  Axis
  if (currency === 'edge') {
    return [
      { type: 'flight', partner: 'Axis Travel Edge Portal', value_per_point_inr: 1.0, best_for: 'Domestic and international flights' },
      { type: 'transfer', partner: 'Marriott Bonvoy (5:4)', value_per_point_inr: 1.5, best_for: 'Luxury hotel stays' },
      { type: 'transfer', partner: 'Singapore KrisFlyer (5:4)', value_per_point_inr: 2.0, best_for: 'Business class sweet spots' },
      { type: 'transfer', partner: 'Air India Flying Returns (1:1)', value_per_point_inr: 0.8, best_for: 'Air India flights' },
      { type: 'cashback', value_per_point_inr: 0.20, best_for: 'Worst option  --  avoid' },
    ];
  }

  // Miles (Axis Vistara, SBI Air India)
  if (currency === 'miles') {
    if (bank === 'Axis') {
      return [
        { type: 'flight', partner: 'Air India (post-Vistara merger)', value_per_point_inr: 0.80, best_for: 'Domestic flights' },
        { type: 'transfer', partner: 'Singapore KrisFlyer (1:1)', value_per_point_inr: 2.0, best_for: 'Business class  --  best value' },
        { type: 'transfer', partner: 'Marriott Bonvoy (1:1)', value_per_point_inr: 1.4, best_for: 'Marriott hotels' },
        { type: 'cashback', value_per_point_inr: 0.25, best_for: 'Worst option' },
      ];
    }
    if (bank === 'SBI') {
      return [
        { type: 'flight', partner: 'Air India Flying Returns', value_per_point_inr: 0.60, best_for: 'Air India redemptions' },
        { type: 'transfer', partner: 'Star Alliance partners', value_per_point_inr: 0.90, best_for: 'International business class' },
        { type: 'cashback', value_per_point_inr: 0.25, best_for: 'Avoid  --  poor value' },
      ];
    }
    return [
      { type: 'flight', partner: 'Miles redemption', value_per_point_inr: 0.70 },
      { type: 'cashback', value_per_point_inr: 0.25 },
    ];
  }

  // Membership Rewards (Amex)
  if (currency === 'membership-rewards') {
    return [
      { type: 'transfer', partner: 'Marriott Bonvoy (1:1)', value_per_point_inr: 1.4, best_for: 'Luxury hotels  --  Cat 1-4 sweet spots' },
      { type: 'transfer', partner: 'Hilton Honors (1:2)', value_per_point_inr: 1.0, best_for: 'Hilton properties' },
      { type: 'transfer', partner: 'British Airways Avios (1:1)', value_per_point_inr: 1.2, best_for: 'Short-haul flights' },
      { type: 'voucher', partner: 'Taj IHCL Hotels', value_per_point_inr: 0.50, best_for: 'Taj hotel stays' },
      { type: 'flight', partner: 'Amex Travel Portal', value_per_point_inr: 0.50, best_for: 'Book directly on Amex' },
      { type: 'cashback', value_per_point_inr: 0.25, best_for: 'Statement credit  --  worst option' },
    ];
  }

  // Marriott Bonvoy points (HDFC Marriott card)
  if (currency === 'points' && bank === 'HDFC') {
    return [
      { type: 'hotel', partner: 'Marriott Bonvoy (direct)', value_per_point_inr: 0.70, best_for: 'Cat 1-4 Marriott hotels in India' },
      { type: 'transfer', partner: 'Airlines (3:1 ratio)', value_per_point_inr: 0.40, best_for: 'Airline miles  --  poor ratio' },
      { type: 'voucher', partner: 'Marriott gift cards', value_per_point_inr: 0.50 },
    ];
  }

  // HDFC Reward Points
  if (currency === 'reward-points' && bank === 'HDFC') {
    return [
      { type: 'transfer', partner: 'Singapore KrisFlyer (1:1)', value_per_point_inr: 1.80, best_for: 'Best value  --  Business Class MEL/SYD/LHR' },
      { type: 'transfer', partner: 'Marriott Bonvoy (1:1)', value_per_point_inr: 1.30, best_for: 'Luxury hotels  --  Cat 4-5 properties' },
      { type: 'flight', partner: 'HDFC SmartBuy Flights', value_per_point_inr: 1.00, best_for: 'Domestic flights  --  simple redemption' },
      { type: 'hotel', partner: 'HDFC SmartBuy Hotels', value_per_point_inr: 1.00, best_for: 'Hotel bookings' },
      { type: 'voucher', partner: 'Brand vouchers', value_per_point_inr: 0.50, best_for: 'Amazon, Flipkart, Myntra' },
      { type: 'product', partner: 'HDFC Rewards Catalog', value_per_point_inr: 0.35, best_for: 'Electronics  --  poor value' },
      { type: 'cashback', value_per_point_inr: 0.30, best_for: 'Statement credit  --  worst option' },
    ];
  }

  // ICICI Reward Points
  if (currency === 'reward-points' && bank === 'ICICI') {
    return [
      { type: 'cashback', value_per_point_inr: 1.00, best_for: '1:1 cashback on Emeralde  --  best for most users' },
      { type: 'voucher', partner: 'Brand vouchers', value_per_point_inr: 0.50, best_for: 'Flipkart, Amazon, dining' },
      { type: 'flight', partner: 'ICICI Travel Portal', value_per_point_inr: 0.40, best_for: 'Flight bookings' },
      { type: 'product', partner: 'ICICI Rewards Catalog', value_per_point_inr: 0.25, best_for: 'Catalog items  --  avoid' },
    ];
  }

  // Axis Reward Points
  if (currency === 'reward-points' && bank === 'Axis') {
    return [
      { type: 'flight', partner: 'Axis Travel Edge', value_per_point_inr: 1.00, best_for: 'Flights via Travel Edge portal' },
      { type: 'transfer', partner: 'Marriott Bonvoy', value_per_point_inr: 1.20, best_for: 'Hotel transfers' },
      { type: 'voucher', partner: 'Brand vouchers', value_per_point_inr: 0.50 },
      { type: 'cashback', value_per_point_inr: 0.25, best_for: 'Avoid' },
    ];
  }

  // SBI Reward Points
  if (currency === 'reward-points' && bank === 'SBI') {
    return [
      { type: 'voucher', partner: 'SBI Rewardz vouchers', value_per_point_inr: 0.25, best_for: 'Flipkart, Amazon, Myntra' },
      { type: 'flight', partner: 'SBI Travel Portal', value_per_point_inr: 0.25, best_for: 'Flight bookings' },
      { type: 'cashback', value_per_point_inr: 0.25, best_for: 'Statement credit' },
      { type: 'product', partner: 'SBI Catalog', value_per_point_inr: 0.15, best_for: 'Avoid  --  worst value' },
    ];
  }

  // SC (Standard Chartered) Reward Points
  if (currency === 'reward-points' && bank === 'SC') {
    return [
      { type: 'cashback', value_per_point_inr: 1.00, best_for: '1:1 statement credit  --  best in class' },
      { type: 'voucher', partner: 'SC Rewards vouchers', value_per_point_inr: 0.50 },
      { type: 'flight', partner: 'SC Travel Portal', value_per_point_inr: 0.40 },
    ];
  }

  // IDFC Reward Points
  if (currency === 'reward-points' && bank === 'IDFC') {
    return [
      { type: 'cashback', value_per_point_inr: 0.25, best_for: 'Statement credit' },
      { type: 'voucher', partner: 'IDFC Vouchers', value_per_point_inr: 0.30, best_for: 'Amazon, Flipkart, dining' },
      { type: 'flight', partner: 'IDFC Travel Portal', value_per_point_inr: 0.35, best_for: 'Best value on IDFC cards' },
    ];
  }

  // Yes Bank Reward Points
  if (currency === 'reward-points' && bank === 'Yes') {
    return [
      { type: 'flight', partner: 'YES Rewardz Portal', value_per_point_inr: 0.50, best_for: 'Flight and hotel bookings' },
      { type: 'voucher', partner: 'YES Rewardz vouchers', value_per_point_inr: 0.40 },
      { type: 'cashback', value_per_point_inr: 0.25, best_for: 'Statement credit  --  avoid' },
    ];
  }

  // IndusInd Reward Points
  if (currency === 'reward-points' && bank === 'IndusInd') {
    return [
      { type: 'cashback', value_per_point_inr: 0.50, best_for: 'Statement credit' },
      { type: 'flight', partner: 'IndusInd Travel Portal', value_per_point_inr: 0.75, best_for: 'Best value  --  flight bookings' },
      { type: 'voucher', partner: 'Brand vouchers', value_per_point_inr: 0.40 },
    ];
  }

  // Kotak Reward Points
  if (currency === 'reward-points' && bank === 'Kotak') {
    return [
      { type: 'cashback', value_per_point_inr: 0.25, best_for: 'Statement credit' },
      { type: 'voucher', partner: 'Kotak Rewards', value_per_point_inr: 0.25 },
      { type: 'product', partner: 'Kotak Catalog', value_per_point_inr: 0.15, best_for: 'Avoid' },
    ];
  }

  // RBL Reward Points
  if (currency === 'reward-points' && bank === 'RBL') {
    return [
      { type: 'cashback', value_per_point_inr: 0.25, best_for: 'Statement credit' },
      { type: 'voucher', partner: 'BookMyShow / brand vouchers', value_per_point_inr: 0.25 },
    ];
  }

  // AU Reward Points
  if (currency === 'reward-points' && bank === 'AU') {
    return [
      { type: 'cashback', value_per_point_inr: 0.25, best_for: 'Statement credit' },
      { type: 'flight', partner: 'AU Travel Portal', value_per_point_inr: 0.40, best_for: 'Best value on AU cards' },
      { type: 'voucher', partner: 'Brand vouchers', value_per_point_inr: 0.30 },
    ];
  }

  // Generic fallback
  return [
    { type: 'cashback', value_per_point_inr: 0.25, best_for: 'Statement credit' },
    { type: 'voucher', partner: 'Brand vouchers', value_per_point_inr: 0.30 },
  ];
}

/**
 * Get effective redemption options  --  card's own options if defined, else defaults
 */
export function getRedemptionOptions(card: CreditCard): RedemptionOption[] {
  if (card.redemption_options && card.redemption_options.length > 0) {
    return card.redemption_options;
  }
  return getDefaultRedemptions(card);
}

/**
 * Given a card and a points balance, return all redemption options
 * ranked by INR value, with AI-friendly context.
 */
export function optimizeRedemption(
  card: CreditCard,
  points: number,
  preference?: 'cash' | 'travel' | 'shopping' | 'any'
): RedemptionRecommendation[] {
  const options = getRedemptionOptions(card);
  const recommendations: RedemptionRecommendation[] = [];

  for (const opt of options) {
    if (opt.min_points && points < opt.min_points) continue;
    const inrValue = points * opt.value_per_point_inr;
    recommendations.push({
      option: opt,
      inr_value: Math.round(inrValue),
      points_used: points,
      ranking: 0,
    });
  }

  // Sort by INR value desc
  recommendations.sort((a, b) => b.inr_value - a.inr_value);
  recommendations.forEach((r, i) => (r.ranking = i + 1));

  // Apply preference reordering
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
 * Build a highly specific AI prompt for each card
 */
export function buildRedemptionPrompt(card: CreditCard, points: number, top: RedemptionRecommendation[]): string {
  const list = top
    .slice(0, 5)
    .map(r =>
      `- ${r.option.type.toUpperCase()}${r.option.partner ? ` via ${r.option.partner}` : ''}: Rs.${r.inr_value.toLocaleString('en-IN')} (Rs.${r.option.value_per_point_inr.toFixed(2)}/pt)${r.option.best_for ? `  --  ${r.option.best_for}` : ''}`
    )
    .join('\n');

  const bestOption = top[0];
  const worstOption = top[top.length - 1];
  const valueDiff = bestOption && worstOption ? bestOption.inr_value - worstOption.inr_value : 0;

  // Card-specific context
  const cardContext: Record<string, string> = {
    'reward-points-HDFC': 'HDFC Reward Points are among the most versatile in India. KrisFlyer transfers unlock Business Class sweet spots to destinations like Singapore, Sydney, London. Marriott Cat 4 hotels in India (JW Marriott Pune, Marriott Jaipur) go for 25,000-35,000 points/night.',
    'edge-Axis': 'EDGE Miles on Axis Magnus are arguably the best rewards currency in India for travelers. The KrisFlyer 5:4 transfer unlocks Singapore Business Class at ~75,000 miles for Mumbai-Singapore. Marriott Bonvoy transfers give access to Indian luxury hotels.',
    'membership-rewards-AmEx': 'Amex MR points shine in transfers. Marriott Bonvoy gives access to Cat 1-4 hotels across India. British Airways Avios are great for short-haul  --  Mumbai-Delhi can be just 7,500 Avios. Never redeem for catalog items.',
    'neucoins-HDFC': 'NeuCoins are 1:1 with INR within Tata ecosystem  --  BigBasket, Croma, 1mg, Westside, Air Asia. This is genuinely good value since there is no haircut. Best strategy: use for BigBasket grocery orders or Croma electronics.',
    'cashback-ICICI': 'Amazon Pay ICICI cashback is auto-credited to Amazon Pay balance  --  fungible for UPI payments, bills, shopping. No redemption needed. Full 1:1 value guaranteed.',
    'miles-Axis': 'Post-Vistara merger, CV Points convert to Air India miles. KrisFlyer remains the best transfer at 1:1. Business Class BOM-SIN is ~65,000 miles. Do not redeem for cash  --  massive value destruction.',
  };

  const contextKey = `${card.reward_currency}-${card.bank}`;
  const specificContext = cardContext[contextKey] || `${card.name} uses ${card.reward_currency.replace('-', ' ')}  --  focus on highest-value redemption paths above.`;

  return `You are a senior Indian credit card rewards strategist with deep knowledge of loyalty programs.

Card: ${card.name} (${card.bank})
Reward currency: ${card.reward_currency.replace('-', ' ')}
Points balance: ${points.toLocaleString('en-IN')} points
Potential value range: Rs.${worstOption?.inr_value.toLocaleString('en-IN') || 0} (worst) to Rs.${bestOption?.inr_value.toLocaleString('en-IN') || 0} (best)
Value at stake by choosing right: Rs.${valueDiff.toLocaleString('en-IN')}

Redemption options ranked by value:
${list}

Card-specific context: ${specificContext}

Write a specific, actionable strategy in 3-4 short paragraphs. Rules:
- NO bullet points or headers  --  flowing paragraphs only
- Name specific airlines, hotels, routes, or products with actual rupee values
- Tell them exactly what to do with THIS card's specific points
- Call out the worst option explicitly and why it destroys value
- If transfers are available, give a concrete sweet-spot example (e.g., "75,000 KrisFlyer miles = Business Class Mumbai to Sydney")
- Be opinionated  --  recommend ONE best path clearly`;
}
