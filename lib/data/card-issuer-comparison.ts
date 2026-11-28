
// Exact product snapshots for published issuer terms that are usable in a
// comparison. These are not cashback-model inputs or approval criteria.
export const CARD_ISSUER_COMPARISON = [
  {
    slug: 'hdfc-infinia',
    names: ['hdfc infinia', 'hdfc infinia metal', 'hdfc infinia metal edition'],
    name: 'HDFC Infinia Metal Edition',
    issuer: 'HDFC Bank',
    lastVerified: '2026-11-28',
    annualFeeInr: 12500,
    joiningFeeInr: 12500,
    annualFeeWaiverSpendInr: 1000000,
    rewardCurrency: 'HDFC Reward Points',
    baseEarn: { points: 5, perEligibleSpendInr: 150 },
    forexMarkupPercent: 2,
    issuerProductUrl: 'https://www.hdfc.bank.in/credit-cards/infinia-credit-card',
    issuerSourceUrls: [
      'https://www.hdfc.bank.in/credit-cards/infinia-credit-card',
      'https://www.hdfc.bank.in/malayalam/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/personal-mitc/mitc-in-english.pdf',
    ],
    conditions: ['Taxes are extra. Fee waivers and rewards apply only to eligible spending.'],
  },
  {
    slug: 'axis-magnus',
    names: ['axis magnus', 'axis bank magnus'],
    name: 'Axis Bank Magnus Credit Card',
    issuer: 'Axis Bank',
    lastVerified: '2026-11-28',
    annualFeeInr: 12500,
    joiningFeeInr: 12500,
    annualFeeWaiverSpendInr: 2500000,
    rewardCurrency: 'EDGE Reward Points',
    baseEarn: { points: 12, perEligibleSpendInr: 200, monthlyEligibleSpendTierCeilingInr: 150000 },
    forexMarkupPercent: 2,
    issuerProductUrl: 'https://www.axis.bank.in/cards/credit-card/axis-bank-magnus-credit-card',
    issuerSourceUrls: [
      'https://www.axis.bank.in/cards/credit-card/axis-bank-magnus-credit-card/more-benefits',
      'https://www.axis.bank.in/docs/default-source/ld/soc/credit-cards/mitc-credit-cards.pdf',
    ],
    conditions: [
      'Taxes are extra. Annual waiver uses eligible spend in the previous card anniversary year.',
      'Tiered rewards and exclusions apply. Lounge limits need issuer reconfirmation because published presentations differ.',
    ],
  },
] as const
