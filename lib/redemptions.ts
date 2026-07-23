// Smart redemption calculator based on actual points balance
// Used by dashboard / my-cards to show what the user CAN actually afford.
//
// HONESTY RULES (do not violate — this is the brand):
// 1. cashValue = conservative estimate of the cash fare/stay the redemption replaces,
//    CAPPED so implied per-point value never exceeds the verified KrisFlyer ceiling
//    of Rs.1.60/mile (verified: lazy Rs.1.00, ceiling Rs.1.60).
//    Never quote retail business-class rack rates as "point value".
// 2. No green tags here. #4FBF87 is RESERVED for verified-from-statement only.
// 3. Values assume an HDFC-class 1:1 transfer to the named partner. Cards with
//    worse ratios will see lower real value — these are indicative, not promises.

interface RedemptionOption {
  title: string;
  partner: string;
  pointsNeeded: number;
  cashValue: number;
  tag: string;
  tagColor: string;
  canAfford: boolean;
  shortfall: number;
  tripPlannerQuery: string;
}

export function getSmartRedemptions(totalPoints: number, bank: string = 'HDFC'): RedemptionOption[] {
  const options: RedemptionOption[] = [];

  // Define all redemption options by bank
  // cashValue audit (Jul 2026): conservative fare estimates, cpp capped at 1.60
  const allOptions = [
    // Domestic flights (low points) — portal rates, deterministic
    { title: 'Domestic flight (any route)', partner: `${bank} SmartBuy / Points`, pointsNeeded: 8000, cashValue: 4000, tag: 'FLIGHT', tagColor: '#0473ea', query: 'Domestic flight Mumbai Delhi' },
    { title: 'Goa return flight', partner: `${bank} SmartBuy`, pointsNeeded: 12000, cashValue: 6000, tag: 'FLIGHT', tagColor: '#0473ea', query: 'Goa return flight from Mumbai' },
    // Hotel stays — transfer/catalog estimates, conservative
    { title: 'Marriott Goa (1 night)', partner: 'HDFC -> Marriott Bonvoy', pointsNeeded: 15000, cashValue: 7500, tag: 'HOTEL', tagColor: '#7c2d12', query: 'Goa 1 night Marriott' },
    { title: 'ITC Hotels (2 nights)', partner: `${bank} Catalog`, pointsNeeded: 20000, cashValue: 10000, tag: 'HOTEL', tagColor: '#7c2d12', query: 'ITC hotel 2 nights India' },
    // International - short haul — conservative economy fares
    { title: 'Bangkok return flight', partner: 'KrisFlyer', pointsNeeded: 25000, cashValue: 15000, tag: 'FLIGHT', tagColor: '#0473ea', query: 'Bangkok return flight from India' },
    { title: 'Dubai return flight', partner: 'Air India Flying Returns', pointsNeeded: 30000, cashValue: 18000, tag: 'FLIGHT', tagColor: '#0473ea', query: 'Dubai return flight from India' },
    { title: 'Singapore return (economy)', partner: 'KrisFlyer', pointsNeeded: 35000, cashValue: 22000, tag: 'FLIGHT', tagColor: '#0473ea', query: 'Singapore return economy flight' },
    // Mid-range
    { title: 'Marriott Singapore (2 nights)', partner: 'HDFC -> Marriott', pointsNeeded: 40000, cashValue: 28000, tag: 'HOTEL', tagColor: '#7c2d12', query: 'Singapore 2 nights Marriott' },
    { title: 'London return (economy)', partner: 'KrisFlyer', pointsNeeded: 55000, cashValue: 55000, tag: 'FLIGHT', tagColor: '#0473ea', query: 'London return economy flight' },
    // High value — cpp capped at verified KrisFlyer ceiling 1.60 (80k*1.6=128k, 120k*1.6=192k)
    { title: 'Singapore Business Class', partner: 'KrisFlyer', pointsNeeded: 80000, cashValue: 128000, tag: 'SWEET SPOT', tagColor: '#C9A24B', query: 'Singapore business class flight' },
    { title: 'Marriott Jaipur (3 nights)', partner: 'HDFC -> Marriott', pointsNeeded: 60000, cashValue: 27000, tag: 'HOTEL', tagColor: '#7c2d12', query: 'Jaipur 3 nights Marriott' },
    { title: 'London Business Class', partner: 'KrisFlyer', pointsNeeded: 120000, cashValue: 192000, tag: 'SWEET SPOT', tagColor: '#C9A24B', query: 'London business class flight' },
  ];

  // Score and sort: affordable first, then aspirational (closest to affordable)
  const scored = allOptions.map(opt => ({
    ...opt,
    canAfford: totalPoints >= opt.pointsNeeded,
    shortfall: Math.max(0, opt.pointsNeeded - totalPoints),
    cashValue: opt.cashValue,
    tripPlannerQuery: opt.query,
  }));

  // Sort: can afford (highest value first), then can't afford (smallest gap first)
  const affordable = scored.filter(o => o.canAfford).sort((a, b) => b.cashValue - a.cashValue);
  const notAffordable = scored.filter(o => !o.canAfford).sort((a, b) => a.shortfall - b.shortfall);

  // Return mix: best affordable options + nearest aspirational
  return [...affordable.slice(0, 3), ...notAffordable.slice(0, 2)].slice(0, 4);
}
