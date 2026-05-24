import type { CreditCard } from '../types';

// Top Indian credit cards with deep data  --  manually curated as of 2026
// This is the canonical source until live scraping replaces it.

export const SEED_CARDS: CreditCard[] = [
  // ===== HDFC =====
  {
    id: 'hdfc-infinia',
    slug: 'hdfc-infinia',
    name: 'HDFC Infinia Metal Edition',
    bank: 'HDFC',
    category: ['premium', 'travel', 'rewards'],
    tier: 'super-premium',
    joining_fee_inr: 12500,
    annual_fee_inr: 12500,
    fee_waiver_spend_inr: 1000000,
    min_income_inr_monthly: 250000,
    credit_score_min: 750,
    reward_currency: 'reward-points',
    base_reward_rate: 3.3,
    category_rewards: [
      { category: 'smartbuy', rate: 10, unit: 'multiplier', cap_inr_monthly: 15000, notes: '10X on SmartBuy partners (Amazon, Flipkart, Marriott)' },
      { category: 'dining', rate: 3.3, unit: 'percent', notes: '5 points per Rs.150' },
    ],
    welcome_benefit_inr: 12500,
    welcome_benefit_description: 'Club Marriott membership (worth Rs.12,500)',
    lounges: [
      { type: 'domestic', network: 'priority-pass', notes: 'Unlimited' },
      { type: 'international', network: 'priority-pass', notes: 'Unlimited Priority Pass for cardholder + guest' },
    ],
    forex_markup_percent: 2,
    fuel_surcharge_waiver: true,
    fuel_surcharge_cap_monthly: 1000,
    redemption_options: [
      { type: 'flight', partner: 'SmartBuy Flights', value_per_point_inr: 1.0, best_for: 'Domestic flights' },
      { type: 'hotel', partner: 'SmartBuy Hotels', value_per_point_inr: 1.0, best_for: 'Hotel bookings' },
      { type: 'transfer', partner: 'Singapore KrisFlyer (1:1)', value_per_point_inr: 1.8, notes: 'Premium cabin sweet spots' },
      { type: 'transfer', partner: 'Marriott Bonvoy (1:1)', value_per_point_inr: 1.3, best_for: 'Luxury hotels' },
      { type: 'cashback', value_per_point_inr: 0.30, best_for: 'Statement credit' },
      { type: 'product', partner: 'HDFC Catalog', value_per_point_inr: 0.50 },
    ],
    insurance_inr: 30000000,
    golf: { rounds_per_year: 12 },
    color: '#1a1a1a',
    best_for: 'High spenders who travel internationally  --  best redemption value among Indian cards',
    highlights: [
      'Unlimited Priority Pass lounges (self + guest)',
      '10X SmartBuy rewards (33% return)',
      'Rs.3Cr air accident cover',
      '12 free golf rounds/year',
      'Concierge services',
    ],
    drawbacks: ['Invite-only', 'Rs.2.5L+ monthly income required'],
    expert_rating: 9.5,
    devaluations: [],
    active: true,
    last_verified: '2026-05-01',
  },
  {
    id: 'hdfc-regalia-gold',
    slug: 'hdfc-regalia-gold',
    name: 'HDFC Regalia Gold',
    bank: 'HDFC',
    category: ['premium', 'travel', 'rewards'],
    tier: 'mid',
    joining_fee_inr: 2500,
    annual_fee_inr: 2500,
    fee_waiver_spend_inr: 400000,
    min_income_inr_monthly: 100000,
    credit_score_min: 750,
    reward_currency: 'reward-points',
    base_reward_rate: 1.65, // After May 2026 devaluation: 5pts/Rs.200
    category_rewards: [
      { category: 'travel', rate: 5, unit: 'multiplier', notes: '5X on Marriott, Myntra, Cult, Nykaa' },
    ],
    milestones: [
      { spend_threshold_inr: 100000, reward_inr_equivalent: 1500, description: '1,500 points per Rs.1L milestone', period: 'monthly' },
    ],
    welcome_benefit_inr: 2500,
    welcome_benefit_description: '2,500 reward points on joining',
    lounges: [
      { type: 'domestic', network: 'priority-pass', visits_per_year: 12, spend_gated: true, spend_threshold: 60000, notes: '12 visits/year, spend Rs.60K/quarter to unlock' },
      { type: 'international', network: 'priority-pass', visits_per_year: 6 },
    ],
    forex_markup_percent: 2,
    fuel_surcharge_waiver: true,
    redemption_options: [
      { type: 'flight', partner: 'SmartBuy', value_per_point_inr: 0.50 },
      { type: 'cashback', value_per_point_inr: 0.20 },
      { type: 'product', partner: 'HDFC Catalog', value_per_point_inr: 0.35 },
    ],
    color: '#c8a25a',
    best_for: 'Mid-tier travelers who can hit Rs.60K/quarter for lounges',
    highlights: ['Marriott Silver status', 'Domestic + international lounges', '5X on partners'],
    drawbacks: ['Spend-gated lounges (added May 2026)', 'Reward rate cut to 5pts/Rs.200 (was 4pts/Rs.150)'],
    expert_rating: 7.2,
    devaluations: [
      { date: '2026-05-01', category: 'reward-rate', description: 'Reward rate cut from 4 pts/Rs.150 to 5 pts/Rs.200 (-6%)', impact: 'medium' },
      { date: '2026-05-01', category: 'lounge', description: 'Lounge access now requires Rs.60K/quarter spend', impact: 'high' },
    ],
    active: true,
    last_verified: '2026-05-10',
  },
  {
    id: 'hdfc-millennia',
    slug: 'hdfc-millennia',
    name: 'HDFC Millennia',
    bank: 'HDFC',
    category: ['cashback', 'shopping', 'entry-level'],
    tier: 'entry',
    joining_fee_inr: 1000,
    annual_fee_inr: 1000,
    fee_waiver_spend_inr: 100000,
    min_income_inr_monthly: 35000,
    credit_score_min: 700,
    reward_currency: 'cashback',
    base_reward_rate: 1,
    category_rewards: [
      { category: 'online', rate: 5, unit: 'percent', cap_inr_monthly: 1000, notes: '5% on Amazon, Flipkart, Myntra, Swiggy, Zomato, Uber, BookMyShow' },
    ],
    milestones: [
      { spend_threshold_inr: 100000, reward_inr_equivalent: 1000, description: 'Rs.1,000 voucher per quarter on Rs.1L spend', period: 'quarterly' },
    ],
    welcome_benefit_inr: 1000,
    lounges: [
      { type: 'domestic', network: 'dreamfolks', visits_per_quarter: 2, spend_gated: true, spend_threshold: 100000 },
    ],
    fuel_surcharge_waiver: true,
    redemption_options: [
      { type: 'cashback', value_per_point_inr: 1.0, best_for: 'Statement credit' },
    ],
    color: '#7c3aed',
    best_for: 'Online shoppers with Rs.40K-1L monthly spend',
    highlights: ['5% on top 10 brands', '2.5% on all other online spends', 'Lounge access on Rs.1L quarterly spend'],
    expert_rating: 8.0,
    active: true,
    last_verified: '2026-05-01',
  },

  // ===== SBI =====
  {
    id: 'sbi-cashback',
    slug: 'sbi-cashback',
    name: 'SBI Cashback Credit Card',
    bank: 'SBI',
    category: ['cashback', 'shopping'],
    tier: 'entry',
    joining_fee_inr: 999,
    annual_fee_inr: 999,
    fee_waiver_spend_inr: 200000,
    min_income_inr_monthly: 30000,
    credit_score_min: 700,
    reward_currency: 'cashback',
    base_reward_rate: 1,
    category_rewards: [
      { category: 'online', rate: 5, unit: 'percent', cap_inr_monthly: 2000, notes: '5% on all online (cap Rs.2,000/month after April 2026 update)' },
    ],
    welcome_benefit_inr: 0,
    lounges: [],
    fuel_surcharge_waiver: false,
    redemption_options: [
      { type: 'cashback', value_per_point_inr: 1.0, best_for: 'Auto-credited to statement' },
    ],
    color: '#1e40af',
    best_for: 'Pure online cashback hunters under Rs.40K monthly online spend',
    highlights: ['Flat 5% online', 'Auto cashback (no redemption)', 'No category restrictions'],
    drawbacks: ['Rs.2,000/month cap (added April 2026)', 'Excludes rent, fuel, utilities, wallet'],
    expert_rating: 8.5,
    devaluations: [
      { date: '2026-04-01', category: 'cap-added', description: 'Rs.2,000/month cap on online cashback added', impact: 'high' },
    ],
    active: true,
    last_verified: '2026-05-01',
  },
  {
    id: 'sbi-elite',
    slug: 'sbi-elite',
    name: 'SBI ELITE',
    bank: 'SBI',
    category: ['premium', 'travel', 'lifestyle'],
    tier: 'mid',
    joining_fee_inr: 4999,
    annual_fee_inr: 4999,
    fee_waiver_spend_inr: 1000000,
    min_income_inr_monthly: 60000,
    credit_score_min: 750,
    reward_currency: 'reward-points',
    base_reward_rate: 0.5,
    category_rewards: [
      { category: 'dining', rate: 2.5, unit: 'percent', notes: '5X points on dining, groceries, departmental' },
    ],
    welcome_benefit_inr: 5000,
    welcome_benefit_description: 'Rs.5,000 e-gift voucher',
    lounges: [
      { type: 'domestic', network: 'priority-pass', visits_per_year: 8 },
      { type: 'international', network: 'priority-pass', visits_per_year: 6 },
    ],
    forex_markup_percent: 1.99,
    fuel_surcharge_waiver: true,
    redemption_options: [
      { type: 'cashback', value_per_point_inr: 0.25 },
      { type: 'voucher', value_per_point_inr: 0.30 },
    ],
    color: '#0f172a',
    best_for: 'Mid-premium travelers',
    highlights: ['Priority Pass', 'Rs.5K welcome voucher', '5X on dining/grocery'],
    expert_rating: 7.0,
    active: true,
    last_verified: '2026-05-01',
  },

  // ===== ICICI =====
  {
    id: 'icici-amazon-pay',
    slug: 'icici-amazon-pay',
    name: 'Amazon Pay ICICI',
    bank: 'ICICI',
    category: ['cashback', 'shopping', 'zero-fee', 'entry-level'],
    tier: 'entry',
    joining_fee_inr: 0,
    annual_fee_inr: 0,
    min_income_inr_monthly: 25000,
    credit_score_min: 680,
    reward_currency: 'cashback',
    base_reward_rate: 1,
    category_rewards: [
      { category: 'amazon-prime', rate: 5, unit: 'percent', notes: '5% on Amazon (Prime members)' },
      { category: 'amazon-non-prime', rate: 3, unit: 'percent', notes: '3% on Amazon (non-Prime)' },
      { category: 'amazon-partners', rate: 2, unit: 'percent', notes: '2% on Amazon Pay partners' },
    ],
    lounges: [],
    fuel_surcharge_waiver: true,
    redemption_options: [
      { type: 'cashback', value_per_point_inr: 1.0, best_for: 'Amazon Pay balance' },
    ],
    color: '#ff9900',
    best_for: 'Anyone who shops on Amazon  --  lifetime free, no caps',
    highlights: ['Lifetime free', 'No category caps', 'Amazon Pay balance is fungible (UPI bills)'],
    expert_rating: 9.2,
    active: true,
    last_verified: '2026-05-01',
  },

  // ===== Axis =====
  {
    id: 'axis-magnus-burgundy',
    slug: 'axis-magnus-burgundy',
    name: 'Axis Magnus for Burgundy',
    bank: 'Axis',
    category: ['premium', 'travel', 'rewards'],
    tier: 'super-premium',
    joining_fee_inr: 0,
    annual_fee_inr: 0,
    min_income_inr_monthly: 200000,
    credit_score_min: 780,
    reward_currency: 'edge',
    base_reward_rate: 4.8,
    category_rewards: [
      { category: 'travel-edge', rate: 25, unit: 'multiplier', notes: '25X on Travel Edge portal' },
    ],
    milestones: [
      { spend_threshold_inr: 100000, reward_inr_equivalent: 25000, description: 'Tier-based bonus on milestones', period: 'monthly' },
    ],
    lounges: [
      { type: 'international', network: 'priority-pass', notes: 'Unlimited' },
      { type: 'domestic', network: 'priority-pass', notes: 'Unlimited' },
    ],
    forex_markup_percent: 2,
    redemption_options: [
      { type: 'transfer', partner: 'Marriott Bonvoy (5:4)', value_per_point_inr: 1.6 },
      { type: 'transfer', partner: 'Singapore KrisFlyer (5:4)', value_per_point_inr: 2.2 },
      { type: 'flight', partner: 'Travel Edge', value_per_point_inr: 1.0 },
      { type: 'cashback', value_per_point_inr: 0.20 },
    ],
    insurance_inr: 25000000,
    golf: { rounds_per_year: 6 },
    color: '#7c1d3a',
    best_for: 'Burgundy Banking customers  --  best mile-transfer card in India',
    highlights: ['25X Travel Edge', 'Best mile transfers (KrisFlyer, Marriott)', 'Unlimited lounges', 'Burgundy private banking'],
    drawbacks: ['Burgundy relationship required', 'Multiple devaluations in 2024-25'],
    expert_rating: 8.8,
    devaluations: [
      { date: '2025-09-01', category: 'reward-rate', description: 'Capped milestone benefits introduced', impact: 'high' },
    ],
    active: true,
    last_verified: '2026-05-01',
  },
  {
    id: 'axis-atlas',
    slug: 'axis-atlas',
    name: 'Axis Atlas',
    bank: 'Axis',
    category: ['travel', 'premium'],
    tier: 'premium',
    joining_fee_inr: 5000,
    annual_fee_inr: 5000,
    min_income_inr_monthly: 100000,
    credit_score_min: 750,
    reward_currency: 'miles',
    base_reward_rate: 2,
    category_rewards: [
      { category: 'travel', rate: 5, unit: 'multiplier', notes: '5 Miles per Rs.100 on travel (10x effectively)' },
    ],
    milestones: [
      { spend_threshold_inr: 300000, reward_inr_equivalent: 5000, description: 'Tier benefits', period: 'annual' },
    ],
    welcome_benefit_inr: 5000,
    welcome_benefit_description: '5,000 EDGE Miles on first transaction',
    lounges: [
      { type: 'international', network: 'priority-pass', visits_per_year: 12 },
      { type: 'domestic', network: 'priority-pass', visits_per_year: 8 },
    ],
    forex_markup_percent: 3.5,
    redemption_options: [
      { type: 'transfer', partner: 'Marriott Bonvoy (2:1)', value_per_point_inr: 1.4 },
      { type: 'transfer', partner: 'Air India Maharaja (2:1)', value_per_point_inr: 1.0 },
      { type: 'flight', partner: 'Travel Edge', value_per_point_inr: 1.0 },
    ],
    color: '#1e3a8a',
    best_for: 'Travel-first users without Burgundy relationship',
    highlights: ['10% effective on travel', 'Mile transfers', 'Tier-based bonuses'],
    expert_rating: 8.4,
    active: true,
    last_verified: '2026-05-01',
  },
  {
    id: 'axis-flipkart',
    slug: 'axis-flipkart',
    name: 'Flipkart Axis Bank Credit Card',
    bank: 'Axis',
    category: ['cashback', 'shopping', 'entry-level'],
    tier: 'entry',
    joining_fee_inr: 500,
    annual_fee_inr: 500,
    fee_waiver_spend_inr: 350000,
    min_income_inr_monthly: 25000,
    reward_currency: 'cashback',
    base_reward_rate: 1.5,
    category_rewards: [
      { category: 'flipkart', rate: 5, unit: 'percent', notes: '5% unlimited on Flipkart' },
      { category: 'preferred', rate: 4, unit: 'percent', notes: '4% on Swiggy, Uber, PVR, Cleartrip, etc.' },
    ],
    lounges: [
      { type: 'domestic', network: 'visa-airport', visits_per_year: 4 },
    ],
    fuel_surcharge_waiver: true,
    redemption_options: [
      { type: 'cashback', value_per_point_inr: 1.0 },
    ],
    color: '#2874f0',
    best_for: 'Flipkart power users',
    highlights: ['5% on Flipkart unlimited', '4 free lounge visits', 'No reward cap'],
    expert_rating: 8.6,
    active: true,
    last_verified: '2026-05-01',
  },

  // ===== Amex =====
  {
    id: 'amex-platinum-travel',
    slug: 'amex-platinum-travel',
    name: 'American Express Platinum Travel',
    bank: 'AmEx',
    category: ['travel', 'premium'],
    tier: 'mid',
    joining_fee_inr: 5000,
    annual_fee_inr: 5000,
    min_income_inr_monthly: 50000,
    credit_score_min: 720,
    reward_currency: 'membership-rewards',
    base_reward_rate: 1,
    category_rewards: [],
    milestones: [
      { spend_threshold_inr: 190000, reward_inr_equivalent: 7700, description: '7,700 MR points + Taj voucher Rs.4,000', period: 'annual' },
      { spend_threshold_inr: 400000, reward_inr_equivalent: 11000, description: '11,000 MR points + Taj voucher Rs.10,000', period: 'annual' },
    ],
    lounges: [
      { type: 'domestic', network: 'priority-pass', visits_per_year: 8 },
    ],
    forex_markup_percent: 3.5,
    redemption_options: [
      { type: 'transfer', partner: 'Marriott (1:1)', value_per_point_inr: 1.3 },
      { type: 'voucher', partner: 'Taj IHCL', value_per_point_inr: 0.50 },
      { type: 'cashback', value_per_point_inr: 0.25 },
    ],
    color: '#006fcf',
    best_for: 'Steady Rs.40K/month spenders  --  milestone-driven',
    highlights: ['Best milestone bonuses in India', 'MR points transfer to airlines/hotels', 'Taj vouchers'],
    expert_rating: 8.2,
    active: true,
    last_verified: '2026-05-01',
  },

  // ===== IDFC =====
  {
    id: 'idfc-first-wealth',
    slug: 'idfc-first-wealth',
    name: 'IDFC FIRST Wealth',
    bank: 'IDFC',
    category: ['premium', 'zero-fee', 'rewards'],
    tier: 'premium',
    joining_fee_inr: 0,
    annual_fee_inr: 0,
    min_income_inr_monthly: 75000,
    credit_score_min: 750,
    reward_currency: 'reward-points',
    base_reward_rate: 1.65,
    category_rewards: [
      { category: 'over-20k-monthly', rate: 5, unit: 'multiplier', notes: '10X points on >Rs.20K monthly spend' },
    ],
    lounges: [
      { type: 'domestic', network: 'visa-airport', visits_per_quarter: 4 },
      { type: 'international', network: 'visa-airport', visits_per_year: 4 },
    ],
    forex_markup_percent: 1.5,
    fuel_surcharge_waiver: true,
    redemption_options: [
      { type: 'cashback', value_per_point_inr: 0.25 },
      { type: 'voucher', value_per_point_inr: 0.30 },
    ],
    insurance_inr: 12500000,
    golf: { rounds_per_year: 2 },
    color: '#9b0c2c',
    best_for: 'Premium card seekers who refuse to pay annual fees',
    highlights: ['Lifetime free', 'Unlimited lounge (domestic)', 'Lowest forex markup (1.5%)', 'Rs.1.25Cr insurance'],
    expert_rating: 9.0,
    active: true,
    last_verified: '2026-05-01',
  },

  // ===== Tata Neu =====
  {
    id: 'tata-neu-infinity-hdfc',
    slug: 'tata-neu-infinity-hdfc',
    name: 'Tata Neu Infinity HDFC',
    bank: 'HDFC',
    category: ['shopping', 'lifestyle'],
    tier: 'mid',
    joining_fee_inr: 1499,
    annual_fee_inr: 1499,
    fee_waiver_spend_inr: 300000,
    min_income_inr_monthly: 30000,
    reward_currency: 'neucoins',
    base_reward_rate: 1.5,
    category_rewards: [
      { category: 'tata-neu-app', rate: 5, unit: 'percent', notes: '5% NeuCoins on Tata Neu app' },
      { category: 'tata-partners', rate: 1.5, unit: 'percent', notes: '1.5% on Tata brands (BigBasket, Croma, etc.)' },
      { category: 'tata-neu-upi', rate: 1.5, unit: 'percent', notes: 'Bonus on Tata Neu UPI spends' },
    ],
    lounges: [
      { type: 'domestic', network: 'priority-pass', visits_per_year: 8 },
      { type: 'international', network: 'priority-pass', visits_per_year: 4 },
    ],
    fuel_surcharge_waiver: true,
    redemption_options: [
      { type: 'voucher', partner: 'Tata Neu app (1:1)', value_per_point_inr: 1.0, best_for: 'BigBasket, Croma, 1mg, Westside' },
    ],
    color: '#1f2937',
    best_for: 'Heavy users of Tata ecosystem (BigBasket, Croma, 1mg, Westside)',
    highlights: ['5% NeuCoins on Tata Neu', 'Domestic + intl lounges', 'NeuCoins = 1:1 INR'],
    drawbacks: ['NeuCoins only usable in Tata ecosystem'],
    expert_rating: 7.8,
    active: true,
    last_verified: '2026-05-01',
  },

  // ===== Kotak =====
  {
    id: 'kotak-811-dream',
    slug: 'kotak-811-dream',
    name: 'Kotak 811 #DreamDifferent',
    bank: 'Kotak',
    category: ['zero-fee', 'entry-level'],
    tier: 'entry',
    joining_fee_inr: 0,
    annual_fee_inr: 0,
    min_income_inr_monthly: 0,
    credit_score_min: 650,
    reward_currency: 'reward-points',
    base_reward_rate: 0.5,
    category_rewards: [
      { category: 'online', rate: 1.5, unit: 'percent', notes: '2X on online' },
    ],
    welcome_benefit_inr: 500,
    lounges: [],
    fuel_surcharge_waiver: true,
    redemption_options: [
      { type: 'cashback', value_per_point_inr: 0.25 },
    ],
    color: '#d11242',
    best_for: 'First-time credit card users / FD-backed approval',
    highlights: ['Lifetime free', 'No income proof needed (FD-backed available)', 'Good for credit building'],
    expert_rating: 6.5,
    active: true,
    last_verified: '2026-05-01',
  },

  // ===== RBL =====
  {
    id: 'rbl-shoprite',
    slug: 'rbl-shoprite',
    name: 'RBL ShopRite',
    bank: 'RBL',
    category: ['shopping', 'entry-level'],
    tier: 'entry',
    joining_fee_inr: 500,
    annual_fee_inr: 500,
    fee_waiver_spend_inr: 100000,
    reward_currency: 'reward-points',
    base_reward_rate: 1,
    category_rewards: [
      { category: 'grocery', rate: 5, unit: 'percent', notes: '20 pts per Rs.100 on grocery (cap)' },
    ],
    lounges: [],
    redemption_options: [
      { type: 'cashback', value_per_point_inr: 0.25, notes: 'Rs.117 redemption fee per redemption' },
    ],
    color: '#1d4ed8',
    best_for: 'Grocery-heavy spenders',
    highlights: ['5% on groceries', 'Low joining fee'],
    drawbacks: ['Rs.117 redemption fee', 'Low base rate'],
    expert_rating: 6.0,
    active: true,
    last_verified: '2026-05-01',
  },

  // ===== Yes =====
  {
    id: 'yes-marquee',
    slug: 'yes-marquee',
    name: 'YES Bank Marquee',
    bank: 'Yes',
    category: ['premium', 'travel'],
    tier: 'super-premium',
    joining_fee_inr: 9999,
    annual_fee_inr: 9999,
    fee_waiver_spend_inr: 2500000,
    min_income_inr_monthly: 300000,
    reward_currency: 'reward-points',
    base_reward_rate: 1.65,
    category_rewards: [
      { category: 'international', rate: 6, unit: 'multiplier', notes: '12 points per Rs.200 international' },
    ],
    welcome_benefit_inr: 10000,
    lounges: [
      { type: 'international', network: 'priority-pass', notes: 'Unlimited' },
      { type: 'domestic', network: 'visa-airport', notes: 'Unlimited' },
    ],
    forex_markup_percent: 0,
    golf: { rounds_per_year: 12 },
    redemption_options: [
      { type: 'flight', partner: 'YES Rewardz', value_per_point_inr: 0.50 },
      { type: 'voucher', value_per_point_inr: 0.40 },
    ],
    color: '#0c2461',
    best_for: 'Forex-heavy super-premium spenders (0% forex)',
    highlights: ['0% forex markup', 'Unlimited lounges', '12 golf rounds', '12 pts/Rs.200 international'],
    expert_rating: 8.5,
    active: true,
    last_verified: '2026-05-01',
  },

  // ===== Standard Chartered =====
  {
    id: 'sc-ultimate',
    slug: 'sc-ultimate',
    name: 'Standard Chartered Ultimate',
    bank: 'SC',
    category: ['premium', 'rewards'],
    tier: 'premium',
    joining_fee_inr: 5000,
    annual_fee_inr: 5000,
    fee_waiver_spend_inr: 600000,
    min_income_inr_monthly: 150000,
    reward_currency: 'reward-points',
    base_reward_rate: 3.3,
    category_rewards: [],
    lounges: [
      { type: 'international', network: 'priority-pass', notes: 'Unlimited' },
      { type: 'domestic', network: 'priority-pass', notes: 'Unlimited' },
    ],
    forex_markup_percent: 2,
    redemption_options: [
      { type: 'cashback', value_per_point_inr: 1.0, best_for: '1:1 statement credit' },
    ],
    color: '#0473ea',
    best_for: 'High base reward rate seekers (3.33% flat)',
    highlights: ['3.33% flat reward', 'Unlimited lounges', '1:1 cashback redemption (no haircut)'],
    expert_rating: 8.7,
    active: true,
    last_verified: '2026-05-01',
  },

  // ===== AU =====
  {
    id: 'au-altura-plus',
    slug: 'au-altura-plus',
    name: 'AU Altura Plus',
    bank: 'AU',
    category: ['cashback', 'entry-level'],
    tier: 'entry',
    joining_fee_inr: 499,
    annual_fee_inr: 499,
    fee_waiver_spend_inr: 100000,
    reward_currency: 'cashback',
    base_reward_rate: 1.5,
    category_rewards: [
      { category: 'utility', rate: 5, unit: 'percent', notes: '5% on utilities (cap)' },
    ],
    lounges: [
      { type: 'domestic', network: 'visa-airport', visits_per_quarter: 1 },
    ],
    redemption_options: [
      { type: 'cashback', value_per_point_inr: 1.0 },
    ],
    color: '#7c2d12',
    best_for: 'Utility bill optimizers',
    highlights: ['5% on utilities', 'Lounge access', 'Low fee'],
    expert_rating: 7.0,
    active: true,
    last_verified: '2026-05-01',
  },

  // ===== HDFC Diners Black =====
  {
    id: 'hdfc-diners-black',
    slug: 'hdfc-diners-black',
    name: 'HDFC Diners Club Black',
    bank: 'HDFC',
    category: ['premium', 'travel', 'rewards', 'lifestyle'],
    tier: 'super-premium',
    joining_fee_inr: 10000,
    annual_fee_inr: 10000,
    fee_waiver_spend_inr: 800000,
    min_income_inr_monthly: 175000,
    credit_score_min: 760,
    reward_currency: 'reward-points',
    base_reward_rate: 3.3,
    category_rewards: [
      { category: 'smartbuy', rate: 10, unit: 'multiplier', notes: '10X on SmartBuy' },
      { category: 'weekend-dining', rate: 2, unit: 'multiplier', notes: '2X on weekend dining' },
    ],
    welcome_benefit_inr: 10000,
    welcome_benefit_description: 'Vouchers worth Rs.10,000+ on joining',
    lounges: [
      { type: 'international', network: 'priority-pass', notes: 'Unlimited (self + guest)' },
      { type: 'domestic', network: 'priority-pass', notes: 'Unlimited' },
    ],
    forex_markup_percent: 2,
    redemption_options: [
      { type: 'flight', partner: 'SmartBuy', value_per_point_inr: 1.0 },
      { type: 'transfer', partner: 'Marriott (1:1)', value_per_point_inr: 1.3 },
      { type: 'transfer', partner: 'KrisFlyer (1:1)', value_per_point_inr: 1.8 },
      { type: 'cashback', value_per_point_inr: 0.30 },
    ],
    golf: { rounds_per_year: 6 },
    insurance_inr: 20000000,
    color: '#000000',
    best_for: 'Pre-Infinia tier  --  best reward rate at sub-Infinia level',
    highlights: ['10X SmartBuy', 'Unlimited Priority Pass', 'KrisFlyer/Marriott transfers'],
    expert_rating: 9.2,
    active: true,
    last_verified: '2026-05-01',
  },

  // Add Marriott Bonvoy HDFC for completeness on hotel-focused cards
  {
    id: 'hdfc-marriott-bonvoy',
    slug: 'hdfc-marriott-bonvoy',
    name: 'Marriott Bonvoy HDFC',
    bank: 'HDFC',
    category: ['travel', 'lifestyle'],
    tier: 'mid',
    joining_fee_inr: 3000,
    annual_fee_inr: 3000,
    fee_waiver_spend_inr: 600000,
    min_income_inr_monthly: 60000,
    reward_currency: 'points',
    base_reward_rate: 2,
    category_rewards: [
      { category: 'marriott', rate: 8, unit: 'multiplier', notes: '8 Marriott points per Rs.150 at properties' },
      { category: 'travel-dining', rate: 4, unit: 'multiplier', notes: '4 points per Rs.150 on travel & dining' },
    ],
    welcome_benefit_inr: 8000,
    welcome_benefit_description: '1 Free Night Award (worth ~Rs.15,000)',
    milestones: [
      { spend_threshold_inr: 600000, reward_inr_equivalent: 15000, description: 'Free Night Award on Rs.6L spend', period: 'annual' },
    ],
    lounges: [
      { type: 'domestic', network: 'priority-pass', visits_per_year: 12 },
      { type: 'international', network: 'priority-pass', visits_per_year: 8 },
    ],
    forex_markup_percent: 3.5,
    redemption_options: [
      { type: 'hotel', partner: 'Marriott Bonvoy', value_per_point_inr: 0.60, best_for: 'Direct Marriott stays' },
    ],
    color: '#a4133c',
    best_for: 'Frequent Marriott guests',
    highlights: ['Marriott Silver status', '1 Free Night welcome', '1 Free Night on Rs.6L spend'],
    expert_rating: 8.3,
    active: true,
    last_verified: '2026-05-01',
  },
];

// Auto-appended: 30 more cards to reach 60+
const MORE_CARDS: CreditCard[] = [
  // ===== HDFC (more) =====
  { id: 'hdfc-moneyback-plus', slug: 'hdfc-moneyback-plus', name: 'HDFC MoneyBack+', bank: 'HDFC', category: ['cashback','entry-level'], tier: 'entry', joining_fee_inr: 500, annual_fee_inr: 500, fee_waiver_spend_inr: 50000, min_income_inr_monthly: 25000, reward_currency: 'cashback', base_reward_rate: 2, category_rewards: [{ category: 'online', rate: 10, unit: 'multiplier', notes: '10X on Amazon, Flipkart, BigBasket, Swiggy, Uber' }], lounges: [], fuel_surcharge_waiver: true, redemption_options: [{ type: 'cashback', value_per_point_inr: 0.20 }], color: '#166534', best_for: 'First credit card for salaried professionals', highlights: ['10X on top online brands','Low fee easy waiver'], expert_rating: 7.5, active: true, last_verified: '2026-05-01' },
  { id: 'hdfc-swiggy', slug: 'hdfc-swiggy', name: 'Swiggy HDFC Bank Credit Card', bank: 'HDFC', category: ['cashback','dining','entry-level'], tier: 'entry', joining_fee_inr: 500, annual_fee_inr: 500, fee_waiver_spend_inr: 200000, min_income_inr_monthly: 25000, reward_currency: 'cashback', base_reward_rate: 1, category_rewards: [{ category: 'swiggy', rate: 10, unit: 'percent', notes: '10% on Swiggy Food, Instamart, Dineout, Genie' },{ category: 'online-others', rate: 5, unit: 'percent', notes: '5% on other online (cap Rs.1,500/month)' }], welcome_benefit_inr: 500, welcome_benefit_description: '3 months Swiggy One membership', lounges: [], fuel_surcharge_waiver: true, redemption_options: [{ type: 'cashback', value_per_point_inr: 1.0 }], color: '#e97316', best_for: 'Swiggy power users  --  food, groceries, dining', highlights: ['10% on all Swiggy platforms','Swiggy One membership','No cap on Swiggy cashback'], expert_rating: 8.1, active: true, last_verified: '2026-05-01' },
  { id: 'hdfc-freedom', slug: 'hdfc-freedom', name: 'HDFC Freedom Credit Card', bank: 'HDFC', category: ['cashback','entry-level','zero-fee'], tier: 'entry', joining_fee_inr: 0, annual_fee_inr: 0, min_income_inr_monthly: 15000, reward_currency: 'cashback', base_reward_rate: 0.5, category_rewards: [{ category: 'emi', rate: 10, unit: 'multiplier', notes: '10X on EMI transactions' },{ category: 'dining-movies', rate: 5, unit: 'multiplier' }], lounges: [], fuel_surcharge_waiver: true, redemption_options: [{ type: 'cashback', value_per_point_inr: 0.25 }], color: '#0ea5e9', best_for: 'Students and first-timers wanting a free card', highlights: ['Lifetime free','10X on EMI purchases'], expert_rating: 6.5, active: true, last_verified: '2026-05-01' },
  // ===== ICICI =====
  { id: 'icici-sapphiro', slug: 'icici-sapphiro', name: 'ICICI Bank Sapphiro Credit Card', bank: 'ICICI', category: ['premium','travel','lifestyle'], tier: 'premium', joining_fee_inr: 6500, annual_fee_inr: 3500, fee_waiver_spend_inr: 600000, min_income_inr_monthly: 120000, credit_score_min: 750, reward_currency: 'reward-points', base_reward_rate: 2, category_rewards: [{ category: 'international', rate: 4, unit: 'multiplier' },{ category: 'dining', rate: 2, unit: 'multiplier' }], welcome_benefit_inr: 9000, welcome_benefit_description: 'Gift vouchers worth Rs.9,000', lounges: [{ type: 'domestic', network: 'priority-pass', visits_per_year: 4 },{ type: 'international', network: 'priority-pass', visits_per_year: 4 }], forex_markup_percent: 3.5, redemption_options: [{ type: 'cashback', value_per_point_inr: 0.25 },{ type: 'voucher', value_per_point_inr: 0.35 }], color: '#1e40af', best_for: 'ICICI banking customers wanting premium benefits', highlights: ['Rs.9K welcome vouchers','Priority Pass lounges','4X international'], expert_rating: 7.3, active: true, last_verified: '2026-05-01' },
  { id: 'icici-emeralde', slug: 'icici-emeralde', name: 'ICICI Bank Emeralde Private Metal', bank: 'ICICI', category: ['premium','travel','lifestyle'], tier: 'super-premium', joining_fee_inr: 12000, annual_fee_inr: 12000, min_income_inr_monthly: 300000, credit_score_min: 780, reward_currency: 'reward-points', base_reward_rate: 3, category_rewards: [{ category: 'international', rate: 6, unit: 'multiplier' }], welcome_benefit_inr: 12000, welcome_benefit_description: 'EazyDiner Prime + spa vouchers', lounges: [{ type: 'domestic', network: 'priority-pass', notes: 'Unlimited' },{ type: 'international', network: 'priority-pass', notes: 'Unlimited' }], forex_markup_percent: 1.5, golf: { rounds_per_year: 4 }, redemption_options: [{ type: 'cashback', value_per_point_inr: 1.0, best_for: '1:1 statement credit' }], color: '#064e3b', best_for: 'ICICI Wealth/Private banking customers', highlights: ['Unlimited Priority Pass','1:1 cashback redemption','EazyDiner Prime'], expert_rating: 8.6, active: true, last_verified: '2026-05-01' },
  { id: 'icici-coral', slug: 'icici-coral', name: 'ICICI Bank Coral Credit Card', bank: 'ICICI', category: ['entry-level','rewards'], tier: 'entry', joining_fee_inr: 500, annual_fee_inr: 500, fee_waiver_spend_inr: 150000, min_income_inr_monthly: 20000, reward_currency: 'reward-points', base_reward_rate: 1, category_rewards: [{ category: 'dining', rate: 2, unit: 'multiplier' },{ category: 'grocery', rate: 2, unit: 'multiplier' }], lounges: [{ type: 'domestic', network: 'dreamfolks', visits_per_quarter: 1 }], fuel_surcharge_waiver: true, redemption_options: [{ type: 'cashback', value_per_point_inr: 0.25 }], color: '#dc2626', best_for: 'Entry-level card for ICICI account holders', highlights: ['2X on dining/grocery','Movie discounts','Quarterly lounge access'], expert_rating: 6.8, active: true, last_verified: '2026-05-01' },
  { id: 'icici-rubyx', slug: 'icici-rubyx', name: 'ICICI Bank Rubyx Credit Card', bank: 'ICICI', category: ['rewards','lifestyle'], tier: 'mid', joining_fee_inr: 3000, annual_fee_inr: 2000, fee_waiver_spend_inr: 400000, min_income_inr_monthly: 60000, reward_currency: 'reward-points', base_reward_rate: 1.5, category_rewards: [{ category: 'dining-entertainment', rate: 2, unit: 'multiplier' },{ category: 'international', rate: 2, unit: 'multiplier' }], welcome_benefit_inr: 5000, welcome_benefit_description: 'BookMyShow + Yatra vouchers worth Rs.5,000', lounges: [{ type: 'domestic', network: 'dreamfolks', visits_per_year: 4 }], forex_markup_percent: 3.5, redemption_options: [{ type: 'cashback', value_per_point_inr: 0.25 },{ type: 'voucher', value_per_point_inr: 0.30 }], color: '#9f1239', best_for: 'Entertainment and travel with ICICI relationship', highlights: ['Rs.5K welcome vouchers','2X on dining/entertainment','4 lounge visits'], expert_rating: 7.0, active: true, last_verified: '2026-05-01' },
  // ===== Axis =====
  { id: 'axis-ace', slug: 'axis-ace', name: 'Axis Bank ACE Credit Card', bank: 'Axis', category: ['cashback','entry-level'], tier: 'entry', joining_fee_inr: 499, annual_fee_inr: 499, fee_waiver_spend_inr: 200000, min_income_inr_monthly: 15000, reward_currency: 'cashback', base_reward_rate: 1, category_rewards: [{ category: 'bill-pay', rate: 5, unit: 'percent', notes: '5% on bill payments via Google Pay' },{ category: 'swiggy-zomato-ola', rate: 4, unit: 'percent', notes: '4% on Swiggy, Zomato, Ola' }], lounges: [{ type: 'domestic', network: 'visa-airport', visits_per_year: 4 }], fuel_surcharge_waiver: true, redemption_options: [{ type: 'cashback', value_per_point_inr: 1.0 }], color: '#7c3aed', best_for: 'Bill payment + food delivery cashback seekers', highlights: ['5% on Google Pay bill payments','4% on Swiggy/Zomato/Ola','4 free lounge visits'], expert_rating: 8.3, active: true, last_verified: '2026-05-01' },
  { id: 'axis-vistara-infinite', slug: 'axis-vistara-infinite', name: 'Axis Bank Vistara Infinite', bank: 'Axis', category: ['travel','premium'], tier: 'premium', joining_fee_inr: 10000, annual_fee_inr: 10000, min_income_inr_monthly: 150000, reward_currency: 'miles', base_reward_rate: 2, category_rewards: [{ category: 'travel', rate: 6, unit: 'multiplier' }], welcome_benefit_inr: 10000, welcome_benefit_description: '1 Business Class ticket + 10,000 CV Points', milestones: [{ spend_threshold_inr: 750000, reward_inr_equivalent: 15000, description: 'Business Class upgrade voucher on Rs.7.5L spend', period: 'annual' }], lounges: [{ type: 'domestic', network: 'priority-pass', notes: 'Unlimited' },{ type: 'international', network: 'priority-pass', visits_per_year: 6 }], forex_markup_percent: 3.5, redemption_options: [{ type: 'flight', partner: 'Vistara CV Points', value_per_point_inr: 0.50 },{ type: 'transfer', partner: 'Singapore KrisFlyer (1:1)', value_per_point_inr: 1.8 }], color: '#1e3a5f', best_for: 'Vistara/Air India frequent flyers', highlights: ['Business Class welcome ticket','6X on travel','Unlimited domestic lounge','KrisFlyer transfer'], expert_rating: 8.0, active: true, last_verified: '2026-05-01' },
  { id: 'axis-myzone', slug: 'axis-myzone', name: 'Axis Bank My Zone Credit Card', bank: 'Axis', category: ['lifestyle','dining','entry-level'], tier: 'entry', joining_fee_inr: 500, annual_fee_inr: 500, fee_waiver_spend_inr: 200000, min_income_inr_monthly: 20000, reward_currency: 'reward-points', base_reward_rate: 1, category_rewards: [{ category: 'online-shopping', rate: 5, unit: 'multiplier', notes: '5X on Myntra, Ajio, Nykaa' },{ category: 'dining', rate: 5, unit: 'multiplier' }], welcome_benefit_inr: 500, welcome_benefit_description: 'BookMyShow voucher Rs.500', lounges: [{ type: 'domestic', network: 'visa-airport', visits_per_year: 4 }], fuel_surcharge_waiver: true, redemption_options: [{ type: 'cashback', value_per_point_inr: 0.20 }], color: '#5b21b6', best_for: 'Young professionals heavy on fashion and food delivery', highlights: ['5X on Myntra/Ajio/Nykaa','5X on Zomato/Swiggy','4 free lounge visits'], expert_rating: 7.4, active: true, last_verified: '2026-05-01' },
  // ===== Kotak =====
  { id: 'kotak-league-platinum', slug: 'kotak-league-platinum', name: 'Kotak League Platinum', bank: 'Kotak', category: ['rewards','entry-level'], tier: 'entry', joining_fee_inr: 499, annual_fee_inr: 499, fee_waiver_spend_inr: 50000, min_income_inr_monthly: 20000, reward_currency: 'reward-points', base_reward_rate: 1, category_rewards: [{ category: 'weekend', rate: 2, unit: 'multiplier' }], lounges: [], fuel_surcharge_waiver: true, redemption_options: [{ type: 'cashback', value_per_point_inr: 0.25 }], color: '#dc2626', best_for: 'Kotak bank account holders wanting a starter rewards card', highlights: ['2X on weekends','Easy fee waiver'], expert_rating: 6.2, active: true, last_verified: '2026-05-01' },
  { id: 'kotak-royale-signature', slug: 'kotak-royale-signature', name: 'Kotak Royale Signature', bank: 'Kotak', category: ['rewards'], tier: 'mid', joining_fee_inr: 1499, annual_fee_inr: 1499, fee_waiver_spend_inr: 150000, min_income_inr_monthly: 40000, reward_currency: 'reward-points', base_reward_rate: 1.5, category_rewards: [{ category: 'travel', rate: 4, unit: 'multiplier' },{ category: 'dining', rate: 3, unit: 'multiplier' }], lounges: [{ type: 'domestic', network: 'dreamfolks', visits_per_year: 4 }], forex_markup_percent: 3.5, redemption_options: [{ type: 'cashback', value_per_point_inr: 0.25 }], color: '#b45309', best_for: 'Kotak customers wanting mid-tier rewards', highlights: ['4X on travel','3X on dining','Domestic lounge access'], expert_rating: 6.8, active: true, last_verified: '2026-05-01' },
  // ===== Amex =====
  { id: 'amex-gold', slug: 'amex-gold', name: 'American Express Gold Card', bank: 'AmEx', category: ['rewards','dining','lifestyle'], tier: 'mid', joining_fee_inr: 4500, annual_fee_inr: 4500, min_income_inr_monthly: 40000, reward_currency: 'membership-rewards', base_reward_rate: 1, category_rewards: [], milestones: [{ spend_threshold_inr: 150000, reward_inr_equivalent: 4500, description: '4,500 bonus MR points + Rs.4,500 Taj voucher on Rs.1.5L spend', period: 'annual' }], welcome_benefit_inr: 4000, welcome_benefit_description: '4,000 MR points on first spend', lounges: [], forex_markup_percent: 3.5, redemption_options: [{ type: 'transfer', partner: 'Marriott Bonvoy (1:1)', value_per_point_inr: 1.3 },{ type: 'voucher', partner: 'Taj IHCL', value_per_point_inr: 0.50 }], color: '#d97706', best_for: 'Milestone spenders wanting Taj hotel vouchers', highlights: ['Taj IHCL vouchers on milestones','MR points transfer to Marriott','Dining offers at 2,000+ restaurants'], expert_rating: 7.5, active: true, last_verified: '2026-05-01' },
  { id: 'amex-mrcc', slug: 'amex-mrcc', name: 'Amex Membership Rewards Credit Card', bank: 'AmEx', category: ['rewards','entry-level'], tier: 'entry', joining_fee_inr: 1000, annual_fee_inr: 4500, fee_waiver_spend_inr: 150000, min_income_inr_monthly: 25000, reward_currency: 'membership-rewards', base_reward_rate: 0.5, category_rewards: [], milestones: [{ spend_threshold_inr: 150000, reward_inr_equivalent: 3000, description: '18,000 bonus MR points on Rs.1.5L annual spend', period: 'annual' }], welcome_benefit_inr: 2000, welcome_benefit_description: '2,000 MR bonus points', lounges: [], redemption_options: [{ type: 'transfer', partner: 'Marriott Bonvoy', value_per_point_inr: 1.3 },{ type: 'cashback', value_per_point_inr: 0.25 }], color: '#92400e', best_for: 'Amex beginners  --  gateway to the MR ecosystem', highlights: ['Gateway to Amex MR points','Marriott/airline transfers','Strong milestone bonus'], expert_rating: 7.0, active: true, last_verified: '2026-05-01' },
  // ===== IndusInd =====
  { id: 'indusind-pinnacle', slug: 'indusind-pinnacle', name: 'IndusInd Bank Pinnacle Credit Card', bank: 'IndusInd', category: ['premium','travel','lifestyle'], tier: 'super-premium', joining_fee_inr: 60000, annual_fee_inr: 60000, min_income_inr_monthly: 500000, reward_currency: 'reward-points', base_reward_rate: 2.5, category_rewards: [{ category: 'international', rate: 5, unit: 'multiplier' }], welcome_benefit_inr: 60000, welcome_benefit_description: 'Complimentary golf + luxury hotel vouchers', lounges: [{ type: 'domestic', network: 'priority-pass', notes: 'Unlimited' },{ type: 'international', network: 'priority-pass', notes: 'Unlimited' }], forex_markup_percent: 0, golf: { rounds_per_year: 24 }, redemption_options: [{ type: 'cashback', value_per_point_inr: 0.50 }], color: '#312e81', best_for: 'Ultra HNI customers  --  IndusInd Exclusive banking', highlights: ['0% forex markup','24 golf rounds/year','Unlimited lounges'], expert_rating: 8.7, active: true, last_verified: '2026-05-01' },
  { id: 'indusind-celesta', slug: 'indusind-celesta', name: 'IndusInd Bank Celesta Credit Card', bank: 'IndusInd', category: ['premium','travel'], tier: 'premium', joining_fee_inr: 10000, annual_fee_inr: 10000, fee_waiver_spend_inr: 1200000, min_income_inr_monthly: 200000, reward_currency: 'reward-points', base_reward_rate: 2, category_rewards: [{ category: 'travel', rate: 3, unit: 'multiplier' }], lounges: [{ type: 'domestic', network: 'priority-pass', visits_per_year: 12 },{ type: 'international', network: 'priority-pass', visits_per_year: 6 }], forex_markup_percent: 1.8, golf: { rounds_per_year: 6 }, redemption_options: [{ type: 'cashback', value_per_point_inr: 0.40 }], color: '#4c1d95', best_for: 'IndusInd premium banking customers', highlights: ['6 golf rounds','12 domestic lounge visits','Low forex markup'], expert_rating: 7.8, active: true, last_verified: '2026-05-01' },
  { id: 'indusind-iconia', slug: 'indusind-iconia', name: 'IndusInd Bank Iconia Amex', bank: 'IndusInd', category: ['rewards'], tier: 'mid', joining_fee_inr: 3500, annual_fee_inr: 3500, fee_waiver_spend_inr: 400000, min_income_inr_monthly: 60000, reward_currency: 'reward-points', base_reward_rate: 1.5, category_rewards: [{ category: 'weekend', rate: 2, unit: 'multiplier' }], lounges: [{ type: 'domestic', network: 'dreamfolks', visits_per_year: 6 }], redemption_options: [{ type: 'cashback', value_per_point_inr: 0.30 }], color: '#be185d', best_for: 'Weekend shoppers and dining enthusiasts', highlights: ['2X on weekends','6 lounge visits','Amex network acceptance'], expert_rating: 7.0, active: true, last_verified: '2026-05-01' },
  // ===== SBI more =====
  { id: 'sbi-simplyclick', slug: 'sbi-simplyclick', name: 'SBI Card SimplyCLICK', bank: 'SBI', category: ['cashback','shopping','entry-level'], tier: 'entry', joining_fee_inr: 499, annual_fee_inr: 499, fee_waiver_spend_inr: 100000, min_income_inr_monthly: 20000, reward_currency: 'reward-points', base_reward_rate: 0.25, category_rewards: [{ category: 'online-exclusive', rate: 10, unit: 'multiplier', notes: '10X on Amazon, BookMyShow, Cleartrip, Dominos, Lenskart, Netmeds, Swiggy' },{ category: 'online-others', rate: 5, unit: 'multiplier' }], welcome_benefit_inr: 500, welcome_benefit_description: 'Rs.500 Amazon voucher', lounges: [], fuel_surcharge_waiver: true, redemption_options: [{ type: 'cashback', value_per_point_inr: 0.25 }], color: '#1d4ed8', best_for: 'Online shoppers on partner platforms', highlights: ['10X on 7 partner brands','5X on all other online','Rs.500 Amazon welcome'], expert_rating: 7.8, active: true, last_verified: '2026-05-01' },
  { id: 'sbi-bpcl-octane', slug: 'sbi-bpcl-octane', name: 'SBI Card BPCL Octane', bank: 'SBI', category: ['fuel','cashback'], tier: 'entry', joining_fee_inr: 1499, annual_fee_inr: 1499, fee_waiver_spend_inr: 150000, min_income_inr_monthly: 25000, reward_currency: 'reward-points', base_reward_rate: 1, category_rewards: [{ category: 'bpcl-fuel', rate: 7.25, unit: 'percent', notes: '7.25% value back on BPCL fuel (25X points)' },{ category: 'grocery-dining', rate: 3, unit: 'multiplier' }], welcome_benefit_inr: 1500, welcome_benefit_description: '6,000 bonus reward points', lounges: [], fuel_surcharge_waiver: true, redemption_options: [{ type: 'fuel', partner: 'BPCL', value_per_point_inr: 0.25 }], color: '#15803d', best_for: 'BPCL loyal customers  --  highest fuel cashback in India', highlights: ['7.25% back on BPCL fuel','Best fuel card in India'], expert_rating: 8.0, active: true, last_verified: '2026-05-01' },
  { id: 'sbi-air-india-signature', slug: 'sbi-air-india-signature', name: 'Air India SBI Signature', bank: 'SBI', category: ['travel','premium'], tier: 'premium', joining_fee_inr: 4999, annual_fee_inr: 4999, min_income_inr_monthly: 75000, reward_currency: 'miles', base_reward_rate: 1.5, category_rewards: [{ category: 'air-india', rate: 30, unit: 'multiplier', notes: '30 Flying Returns miles per Rs.100 on Air India' }], welcome_benefit_inr: 5000, welcome_benefit_description: '20,000 Flying Returns miles on joining', lounges: [{ type: 'domestic', network: 'priority-pass', visits_per_year: 8 }], forex_markup_percent: 1.99, redemption_options: [{ type: 'flight', partner: 'Air India Flying Returns', value_per_point_inr: 0.50 }], color: '#991b1b', best_for: 'Frequent Air India travelers', highlights: ['30X miles on Air India','20K welcome miles'], expert_rating: 7.5, active: true, last_verified: '2026-05-01' },
  // ===== RBL more =====
  { id: 'rbl-popcorn', slug: 'rbl-popcorn', name: 'RBL Bank Popcorn Credit Card', bank: 'RBL', category: ['lifestyle','dining','entry-level'], tier: 'entry', joining_fee_inr: 0, annual_fee_inr: 0, min_income_inr_monthly: 15000, reward_currency: 'reward-points', base_reward_rate: 1, category_rewards: [{ category: 'movies', rate: 10, unit: 'multiplier', notes: '10X on BookMyShow (free movie ticket monthly)' },{ category: 'dining', rate: 5, unit: 'multiplier' }], welcome_benefit_inr: 1000, welcome_benefit_description: 'Free movie ticket on first transaction', lounges: [], fuel_surcharge_waiver: true, redemption_options: [{ type: 'voucher', partner: 'BookMyShow', value_per_point_inr: 0.25 }], color: '#7c2d12', best_for: 'Movie buffs  --  free ticket every month', highlights: ['Free movie ticket every month','10X on BookMyShow','Lifetime free'], expert_rating: 7.2, active: true, last_verified: '2026-05-01' },
  // ===== Yes more =====
  { id: 'yes-first-preferred', slug: 'yes-first-preferred', name: 'YES FIRST Preferred Credit Card', bank: 'Yes', category: ['rewards'], tier: 'mid', joining_fee_inr: 1499, annual_fee_inr: 1499, fee_waiver_spend_inr: 600000, min_income_inr_monthly: 75000, reward_currency: 'reward-points', base_reward_rate: 1.5, category_rewards: [{ category: 'travel-dining', rate: 6, unit: 'multiplier' }], lounges: [{ type: 'domestic', network: 'priority-pass', visits_per_year: 6 },{ type: 'international', network: 'priority-pass', visits_per_year: 3 }], forex_markup_percent: 1.75, redemption_options: [{ type: 'cashback', value_per_point_inr: 0.25 },{ type: 'flight', partner: 'YES Rewardz', value_per_point_inr: 0.50 }], color: '#1e3a8a', best_for: 'Travel + dining rewards at mid-tier fee', highlights: ['6X on travel/dining','Low forex markup (1.75%)','6 domestic lounges'], expert_rating: 7.5, active: true, last_verified: '2026-05-01' },
  // ===== AU more =====
  { id: 'au-zenith', slug: 'au-zenith', name: 'AU Bank Zenith Credit Card', bank: 'AU', category: ['premium','rewards'], tier: 'premium', joining_fee_inr: 4999, annual_fee_inr: 4999, fee_waiver_spend_inr: 800000, min_income_inr_monthly: 100000, reward_currency: 'reward-points', base_reward_rate: 2, category_rewards: [{ category: 'dining', rate: 10, unit: 'multiplier', cap_inr_monthly: 2000 },{ category: 'travel', rate: 5, unit: 'multiplier' }], welcome_benefit_inr: 5000, welcome_benefit_description: '5,000 reward points + gift voucher', lounges: [{ type: 'domestic', network: 'dreamfolks', visits_per_quarter: 3 },{ type: 'international', network: 'priority-pass', visits_per_year: 4 }], forex_markup_percent: 1.99, golf: { rounds_per_year: 4 }, redemption_options: [{ type: 'cashback', value_per_point_inr: 0.25 }], color: '#7c2d12', best_for: 'AU Bank customers wanting dining + travel rewards', highlights: ['10X on dining','12 lounge visits/year','4 golf rounds'], expert_rating: 7.8, active: true, last_verified: '2026-05-01' },
  { id: 'au-lit', slug: 'au-lit', name: 'AU Bank LIT Credit Card', bank: 'AU', category: ['cashback','entry-level'], tier: 'entry', joining_fee_inr: 499, annual_fee_inr: 499, min_income_inr_monthly: 20000, reward_currency: 'cashback', base_reward_rate: 1, category_rewards: [{ category: 'online', rate: 5, unit: 'percent', notes: 'User picks 2 categories monthly' }], welcome_benefit_inr: 500, lounges: [], fuel_surcharge_waiver: true, redemption_options: [{ type: 'cashback', value_per_point_inr: 1.0 }], color: '#0891b2', best_for: 'Choose-your-own-rewards card', highlights: ['Choose your reward categories','5% on selected categories','Flexible benefit toggle'], expert_rating: 7.3, active: true, last_verified: '2026-05-01' },
  // ===== SC more =====
  { id: 'sc-smart', slug: 'sc-smart', name: 'Standard Chartered Smart Credit Card', bank: 'SC', category: ['cashback','entry-level','zero-fee'], tier: 'entry', joining_fee_inr: 0, annual_fee_inr: 0, min_income_inr_monthly: 25000, reward_currency: 'cashback', base_reward_rate: 1, category_rewards: [{ category: 'online', rate: 5, unit: 'percent', cap_inr_monthly: 1000 }], lounges: [], fuel_surcharge_waiver: true, redemption_options: [{ type: 'cashback', value_per_point_inr: 1.0 }], color: '#0473ea', best_for: 'SC banking customers wanting a simple free cashback card', highlights: ['Lifetime free','5% online cashback','Auto cashback credit'], expert_rating: 7.5, active: true, last_verified: '2026-05-01' },
  { id: 'sc-digismart', slug: 'sc-digismart', name: 'Standard Chartered DigiSmart', bank: 'SC', category: ['cashback','shopping'], tier: 'entry', joining_fee_inr: 49, annual_fee_inr: 49, min_income_inr_monthly: 20000, reward_currency: 'cashback', base_reward_rate: 1, category_rewards: [{ category: 'myntra', rate: 10, unit: 'percent' },{ category: 'netflix-prime', rate: 20, unit: 'percent', notes: '20% off Netflix/Prime (up to Rs.200/month)' },{ category: 'swiggy-zomato', rate: 10, unit: 'percent' }], lounges: [], redemption_options: [{ type: 'cashback', value_per_point_inr: 1.0 }], color: '#0284c7', best_for: 'Millennials heavy on OTT, food delivery and Myntra', highlights: ['20% off OTT subscriptions','10% on Myntra','10% on Swiggy/Zomato','Only Rs.49/month'], expert_rating: 7.8, active: true, last_verified: '2026-05-01' },
  // ===== IDFC more =====
  { id: 'idfc-first-select', slug: 'idfc-first-select', name: 'IDFC FIRST Select Credit Card', bank: 'IDFC', category: ['rewards','zero-fee'], tier: 'mid', joining_fee_inr: 0, annual_fee_inr: 0, min_income_inr_monthly: 35000, reward_currency: 'reward-points', base_reward_rate: 1.5, category_rewards: [{ category: 'over-20k-monthly', rate: 3, unit: 'multiplier' }], lounges: [{ type: 'domestic', network: 'visa-airport', visits_per_quarter: 2 }], forex_markup_percent: 1.5, fuel_surcharge_waiver: true, redemption_options: [{ type: 'cashback', value_per_point_inr: 0.25 }], color: '#9b0c2c', best_for: 'Mid-income earners wanting a free card with lounge access', highlights: ['Lifetime free','3X above Rs.20K spend','8 lounge visits/year'], expert_rating: 8.2, active: true, last_verified: '2026-05-01' },
  { id: 'idfc-first-classic', slug: 'idfc-first-classic', name: 'IDFC FIRST Classic Credit Card', bank: 'IDFC', category: ['rewards','entry-level','zero-fee'], tier: 'entry', joining_fee_inr: 0, annual_fee_inr: 0, min_income_inr_monthly: 15000, credit_score_min: 650, reward_currency: 'reward-points', base_reward_rate: 1, category_rewards: [{ category: 'online', rate: 2, unit: 'multiplier' }], lounges: [], fuel_surcharge_waiver: true, redemption_options: [{ type: 'cashback', value_per_point_inr: 0.25 }], color: '#be123c', best_for: 'First credit card with low income requirement', highlights: ['Lifetime free','Low income requirement','No joining fee'], expert_rating: 6.5, active: true, last_verified: '2026-05-01' },
  // ===== Tata Neu Plus =====
  { id: 'tata-neu-plus-hdfc', slug: 'tata-neu-plus-hdfc', name: 'Tata Neu Plus HDFC Bank', bank: 'HDFC', category: ['shopping','cashback','entry-level'], tier: 'entry', joining_fee_inr: 499, annual_fee_inr: 499, fee_waiver_spend_inr: 100000, min_income_inr_monthly: 20000, reward_currency: 'neucoins', base_reward_rate: 1, category_rewards: [{ category: 'tata-neu-app', rate: 2, unit: 'percent' },{ category: 'tata-partners', rate: 1, unit: 'percent' }], welcome_benefit_inr: 499, welcome_benefit_description: '499 NeuCoins on joining', lounges: [], fuel_surcharge_waiver: true, redemption_options: [{ type: 'voucher', partner: 'Tata Neu (1:1)', value_per_point_inr: 1.0 }], color: '#374151', best_for: 'Tata ecosystem users on a budget', highlights: ['2% NeuCoins on Tata Neu','NeuCoins = 1:1 INR value'], expert_rating: 6.8, active: true, last_verified: '2026-05-01' },
  // ===== Axis Horizon =====
  { id: 'axis-horizon', slug: 'axis-horizon', name: 'Axis Bank Horizon Credit Card', bank: 'Axis', category: ['travel'], tier: 'mid', joining_fee_inr: 2500, annual_fee_inr: 2500, fee_waiver_spend_inr: 300000, min_income_inr_monthly: 50000, reward_currency: 'edge', base_reward_rate: 1, category_rewards: [{ category: 'travel-edge', rate: 5, unit: 'multiplier' },{ category: 'dining', rate: 3, unit: 'multiplier' }], lounges: [{ type: 'domestic', network: 'priority-pass', visits_per_year: 8 }], forex_markup_percent: 3.5, redemption_options: [{ type: 'flight', partner: 'Travel Edge', value_per_point_inr: 1.0 },{ type: 'cashback', value_per_point_inr: 0.20 }], color: '#0369a1', best_for: 'Mid-tier travel card without Magnus income requirement', highlights: ['5X on Travel Edge','8 lounge visits/year','3X on dining'], expert_rating: 7.5, active: true, last_verified: '2026-05-01' },
];

// Merge into main export
SEED_CARDS.push(...MORE_CARDS);

// APR + employment data patch  --  applied after SEED_CARDS is defined
// Standard Indian credit card APRs + employment eligibility
const APR_MAP: Record<string, { apr: number; employment: string[]; interest_free: number }> = {
  'hdfc-infinia':          { apr: 23.88, employment: ['salaried','self-employed'], interest_free: 50 },
  'hdfc-regalia-gold':     { apr: 23.88, employment: ['salaried','self-employed'], interest_free: 50 },
  'hdfc-millennia':        { apr: 23.88, employment: ['salaried','self-employed'], interest_free: 50 },
  'hdfc-diners-black':     { apr: 23.88, employment: ['salaried','self-employed'], interest_free: 50 },
  'hdfc-marriott-bonvoy':  { apr: 23.88, employment: ['salaried','self-employed'], interest_free: 50 },
  'hdfc-moneyback-plus':   { apr: 23.88, employment: ['salaried'], interest_free: 50 },
  'hdfc-swiggy':           { apr: 23.88, employment: ['salaried'], interest_free: 50 },
  'hdfc-freedom':          { apr: 23.88, employment: ['salaried','student'], interest_free: 50 },
  'tata-neu-infinity-hdfc':{ apr: 41.88, employment: ['salaried','self-employed'], interest_free: 50 },
  'tata-neu-plus-hdfc':    { apr: 41.88, employment: ['salaried'], interest_free: 50 },
  'sbi-cashback':          { apr: 45.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'sbi-elite':             { apr: 45.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'sbi-simplyclick':       { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'sbi-bpcl-octane':       { apr: 45.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'sbi-air-india-signature':{ apr: 45.0, employment: ['salaried','self-employed'], interest_free: 50 },
  'icici-amazon-pay':      { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'icici-sapphiro':        { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'icici-emeralde':        { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'icici-coral':           { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'icici-rubyx':           { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'axis-magnus-burgundy':  { apr: 52.86, employment: ['salaried','self-employed'], interest_free: 50 },
  'axis-atlas':            { apr: 52.86, employment: ['salaried','self-employed'], interest_free: 50 },
  'axis-flipkart':         { apr: 52.86, employment: ['salaried','self-employed'], interest_free: 50 },
  'axis-ace':              { apr: 52.86, employment: ['salaried','self-employed'], interest_free: 50 },
  'axis-vistara-infinite': { apr: 52.86, employment: ['salaried','self-employed'], interest_free: 50 },
  'axis-myzone':           { apr: 52.86, employment: ['salaried','self-employed'], interest_free: 50 },
  'axis-horizon':          { apr: 52.86, employment: ['salaried','self-employed'], interest_free: 50 },
  'amex-platinum-travel':  { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'amex-gold':             { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'amex-mrcc':             { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'idfc-first-wealth':     { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 48 },
  'idfc-first-select':     { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 48 },
  'idfc-first-classic':    { apr: 42.0,  employment: ['salaried','student'], interest_free: 48 },
  'kotak-811-dream':       { apr: 45.0,  employment: ['salaried','self-employed','student'], interest_free: 50 },
  'kotak-league-platinum': { apr: 45.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'kotak-royale-signature':{ apr: 45.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'rbl-shoprite':          { apr: 39.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'rbl-popcorn':           { apr: 39.0,  employment: ['salaried','self-employed','student'], interest_free: 50 },
  'yes-marquee':           { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'yes-first-preferred':   { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'sc-ultimate':           { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'sc-smart':              { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'sc-digismart':          { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'au-altura-plus':        { apr: 45.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'au-zenith':             { apr: 45.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'au-lit':                { apr: 45.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'indusind-pinnacle':     { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'indusind-celesta':      { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'indusind-iconia':       { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'hsbc-cashback':         { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 50 },
  'hsbc-premier':          { apr: 42.0,  employment: ['salaried','self-employed'], interest_free: 50 },
};

// Patch all cards with APR + employment data
SEED_CARDS.forEach(card => {
  const data = APR_MAP[card.id];
  if (data) {
    (card as any).apr_percent = data.apr;
    (card as any).eligible_employment = data.employment;
    (card as any).interest_free_days = data.interest_free;
  }
});

//  44 NEW CARDS (takes us from 49 to 93) 
const NEW_CARDS: CreditCard[] = [
  // HDFC
  { id:'hdfc-diners-clubmiles', slug:'hdfc-diners-clubmiles', name:'HDFC Diners Club Miles', bank:'HDFC', tier:'mid', joining_fee_inr:1000, annual_fee_inr:1000, base_reward_rate:1, color:'#1a3a5c', best_for:'Diners Club lounge access with a lower fee', expert_rating:7.2, category:['travel','rewards'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Diners Club lounge access','Milestone benefits'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:23.88, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'hdfc-platinum-times', slug:'hdfc-platinum-times', name:'HDFC Platinum Times', bank:'HDFC', tier:'entry', joining_fee_inr:1000, annual_fee_inr:1000, base_reward_rate:1, color:'#c0c0c0', best_for:'Dining and entertainment discounts', expert_rating:6.5, category:['dining','lifestyle','entry-level'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['25% off dining','Movie discounts'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:23.88, eligible_employment:['salaried'], interest_free_days:50 },
  { id:'hdfc-indianoil', slug:'hdfc-indianoil', name:'HDFC IndianOil Credit Card', bank:'HDFC', tier:'entry', joining_fee_inr:500, annual_fee_inr:500, base_reward_rate:1, color:'#ff6600', best_for:'IndianOil fuel cashback  --  5% back at IOC pumps', expert_rating:7.5, category:['fuel','cashback','entry-level'], reward_currency:'cashback', active:true, last_verified:'2026-05-17', highlights:['5% fuel points at IOC','1% everywhere else'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:23.88, eligible_employment:['salaried','self-employed'], interest_free_days:50 },

  // SBI
  { id:'sbi-simplysave', slug:'sbi-simplysave', name:'SBI SimplySAVE', bank:'SBI', tier:'entry', joining_fee_inr:499, annual_fee_inr:499, base_reward_rate:0.25, color:'#1a3e8c', best_for:'Offline shoppers  --  grocery, dining, departmental stores', expert_rating:6.8, category:['shopping','entry-level'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['10X rewards on grocery','Fee waiver on Rs.1L spend'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'sbi-pulse', slug:'sbi-pulse', name:'SBI Card PULSE', bank:'SBI', tier:'entry', joining_fee_inr:1499, annual_fee_inr:1499, base_reward_rate:1, color:'#e63946', best_for:'Health and fitness enthusiasts  --  gym and pharmacy rewards', expert_rating:7.0, category:['lifestyle','entry-level'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Cult.fit membership','Pharmacy rewards'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried'], interest_free_days:50 },
  { id:'sbi-prime', slug:'sbi-prime', name:'SBI Card PRIME', bank:'SBI', tier:'mid', joining_fee_inr:2999, annual_fee_inr:2999, base_reward_rate:1, color:'#1d3557', best_for:'Mid-tier SBI card with milestone benefits', expert_rating:7.3, category:['rewards','travel','lifestyle'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Milestone vouchers','Lounge access'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'sbi-club-vistara', slug:'sbi-club-vistara', name:'Club Vistara SBI Card PRIME', bank:'SBI', tier:'premium', joining_fee_inr:2999, annual_fee_inr:2999, base_reward_rate:1, color:'#003366', best_for:'Vistara/Air India frequent flyers via SBI', expert_rating:7.8, category:['travel','premium'], reward_currency:'miles', active:true, last_verified:'2026-05-17', highlights:['CV Points earn','Complimentary tickets'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'sbi-aurum', slug:'sbi-aurum', name:'SBI Card AURUM', bank:'SBI', tier:'super-premium', joining_fee_inr:9999, annual_fee_inr:9999, base_reward_rate:2, color:'#b8860b', best_for:'SBI super-premium card with golf and concierge', expert_rating:8.2, category:['premium','travel','lifestyle'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Golf privileges','Priority Pass lounge'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','self-employed'], interest_free_days:50 },

  // ICICI
  { id:'icici-mmt-platinum', slug:'icici-mmt-platinum', name:'MakeMyTrip ICICI Bank Platinum', bank:'ICICI', tier:'entry', joining_fee_inr:0, annual_fee_inr:0, base_reward_rate:1, color:'#e63946', best_for:'MakeMyTrip users  --  hotel and flight cashback', expert_rating:7.0, category:['travel','cashback','zero-fee'], reward_currency:'cashback', active:true, last_verified:'2026-05-17', highlights:['MMT My Cash rewards','Zero annual fee'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'icici-mmt-signature', slug:'icici-mmt-signature', name:'MakeMyTrip ICICI Bank Signature', bank:'ICICI', tier:'mid', joining_fee_inr:2500, annual_fee_inr:2500, base_reward_rate:1.5, color:'#c0392b', best_for:'Heavy MMT users wanting premium travel benefits', expert_rating:7.5, category:['travel','premium'], reward_currency:'cashback', active:true, last_verified:'2026-05-17', highlights:['6% on MMT flights/hotels','Lounge access'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'icici-hpcl-super-saver', slug:'icici-hpcl-super-saver', name:'ICICI Bank HPCL Super Saver', bank:'ICICI', tier:'entry', joining_fee_inr:500, annual_fee_inr:500, base_reward_rate:1, color:'#006400', best_for:'HPCL fuel station loyalists  --  6.5% value on fuel', expert_rating:7.3, category:['fuel','cashback','entry-level'], reward_currency:'cashback', active:true, last_verified:'2026-05-17', highlights:['6.5% on HPCL fuel','Grocery cashback'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'icici-expresspay', slug:'icici-expresspay', name:'ICICI Bank Expressions Credit Card', bank:'ICICI', tier:'entry', joining_fee_inr:499, annual_fee_inr:499, base_reward_rate:0.5, color:'#8e44ad', best_for:'Customisable card design for first-timers', expert_rating:5.5, category:['entry-level'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Custom card design','Basic rewards'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried'], interest_free_days:50 },

  // Axis
  { id:'axis-reserve', slug:'axis-reserve', name:'Axis Bank Reserve Credit Card', bank:'Axis', tier:'super-premium', joining_fee_inr:50000, annual_fee_inr:50000, base_reward_rate:3, color:'#2c003e', best_for:'Ultra HNI Axis customers  --  unlimited lounge, golf, concierge', expert_rating:8.5, category:['premium','travel','lifestyle'], reward_currency:'edge', active:true, last_verified:'2026-05-17', highlights:['Unlimited Priority Pass','Dedicated RM','Golf privileges'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:52.86, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'axis-airtel', slug:'axis-airtel', name:'Airtel Axis Bank Credit Card', bank:'Axis', tier:'entry', joining_fee_inr:500, annual_fee_inr:500, base_reward_rate:1, color:'#e40000', best_for:'Airtel users  --  25% cashback on Airtel bills', expert_rating:8.0, category:['cashback','entry-level'], reward_currency:'cashback', active:true, last_verified:'2026-05-17', highlights:['25% on Airtel recharge','10% on Swiggy/Zomato'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:52.86, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'axis-indianoil', slug:'axis-indianoil', name:'Indian Oil Axis Bank Credit Card', bank:'Axis', tier:'entry', joining_fee_inr:500, annual_fee_inr:500, base_reward_rate:1, color:'#ff6600', best_for:'IndianOil fuel  --  4% value back at IOC pumps', expert_rating:7.2, category:['fuel','cashback','entry-level'], reward_currency:'cashback', active:true, last_verified:'2026-05-17', highlights:['4% on IOC fuel','1% everywhere'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:52.86, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'axis-neo', slug:'axis-neo', name:'Axis Bank NEO Credit Card', bank:'Axis', tier:'entry', joining_fee_inr:250, annual_fee_inr:250, base_reward_rate:0.5, color:'#00b4d8', best_for:'Digital-first users wanting OTT and food delivery discounts', expert_rating:6.8, category:['lifestyle','entry-level'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['OTT vouchers','Food delivery discounts'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:52.86, eligible_employment:['salaried'], interest_free_days:50 },

  // Kotak
  { id:'kotak-white', slug:'kotak-white', name:'Kotak White Credit Card', bank:'Kotak', tier:'premium', joining_fee_inr:3000, annual_fee_inr:3000, base_reward_rate:2, color:'#f5f5f5', best_for:'High-spend Kotak customers wanting premium rewards', expert_rating:7.5, category:['premium','rewards'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Milestone rewards','Lounge access'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:45, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'kotak-privy-league', slug:'kotak-privy-league', name:'Kotak Privy League Signature', bank:'Kotak', tier:'mid', joining_fee_inr:2500, annual_fee_inr:2500, base_reward_rate:1.5, color:'#2d6a4f', best_for:'Kotak Privy League banking customers', expert_rating:7.0, category:['rewards','lifestyle'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Privy League benefits','Golf access'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:45, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'kotak-essentia-platinum', slug:'kotak-essentia-platinum', name:'Kotak Essentia Platinum', bank:'Kotak', tier:'entry', joining_fee_inr:0, annual_fee_inr:0, base_reward_rate:0.5, color:'#8ecae6', best_for:'Grocery and departmental store shoppers', expert_rating:6.0, category:['shopping','entry-level','zero-fee'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['10X on grocery','Zero annual fee'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:45, eligible_employment:['salaried','self-employed'], interest_free_days:50 },

  // AmEx
  { id:'amex-smartearn', slug:'amex-smartearn', name:'American Express SmartEarn', bank:'AmEx', tier:'entry', joining_fee_inr:495, annual_fee_inr:495, base_reward_rate:1, color:'#006fcf', best_for:'Amex beginners wanting cashback on Zomato, Swiggy, Amazon', expert_rating:7.8, category:['cashback','entry-level'], reward_currency:'membership-rewards', active:true, last_verified:'2026-05-17', highlights:['10X on Zomato/Swiggy','5X on Amazon'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','self-employed'], interest_free_days:50 },

  // IDFC
  { id:'idfc-club-vistara', slug:'idfc-club-vistara', name:'Club Vistara IDFC FIRST Bank', bank:'IDFC', tier:'premium', joining_fee_inr:4999, annual_fee_inr:4999, base_reward_rate:2, color:'#003087', best_for:'Frequent Vistara/Air India flyers via IDFC', expert_rating:8.0, category:['travel','premium'], reward_currency:'miles', active:true, last_verified:'2026-05-17', highlights:['Free business class ticket','CV Points earn'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','self-employed'], interest_free_days:48 },
  { id:'idfc-first-wow', slug:'idfc-first-wow', name:'IDFC FIRST Bank WOW Credit Card', bank:'IDFC', tier:'entry', joining_fee_inr:0, annual_fee_inr:0, base_reward_rate:0.67, color:'#e63946', best_for:'FD-backed card for those building credit  --  zero fees', expert_rating:6.8, category:['entry-level','zero-fee'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Zero annual fee','FD-backed approval'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','self-employed','student'], interest_free_days:48 },
  { id:'idfc-first-millennia', slug:'idfc-first-millennia', name:'IDFC FIRST Bank Millennia', bank:'IDFC', tier:'entry', joining_fee_inr:0, annual_fee_inr:0, base_reward_rate:1, color:'#7209b7', best_for:'Young earners wanting a free card with online rewards', expert_rating:7.2, category:['cashback','entry-level','zero-fee'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['5% on online spends','Zero annual fee'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','student'], interest_free_days:48 },

  // RBL
  { id:'rbl-dubai-first', slug:'rbl-dubai-first', name:'RBL Bank World Safari', bank:'RBL', tier:'premium', joining_fee_inr:3000, annual_fee_inr:3000, base_reward_rate:2, color:'#c77dff', best_for:'International travelers wanting no forex markup', expert_rating:7.5, category:['travel','premium'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['No forex markup','Priority Pass lounge'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:39, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'rbl-icon', slug:'rbl-icon', name:'RBL Bank ICON Credit Card', bank:'RBL', tier:'mid', joining_fee_inr:1000, annual_fee_inr:1000, base_reward_rate:1.5, color:'#4cc9f0', best_for:'Dining and weekend entertainment rewards', expert_rating:6.8, category:['dining','lifestyle'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Weekend dining benefits','Movie offers'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:39, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'rbl-fun-plus', slug:'rbl-fun-plus', name:'RBL Bank Fun Plus', bank:'RBL', tier:'entry', joining_fee_inr:0, annual_fee_inr:0, base_reward_rate:0.5, color:'#f72585', best_for:'Entry-level lifestyle and entertainment card', expert_rating:6.0, category:['lifestyle','entry-level','zero-fee'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Movie discounts','Shopping rewards'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:39, eligible_employment:['salaried','self-employed'], interest_free_days:50 },

  // Yes Bank
  { id:'yes-prosperity-cashback', slug:'yes-prosperity-cashback', name:'YES Prosperity Cashback Plus', bank:'Yes', tier:'entry', joining_fee_inr:1499, annual_fee_inr:1499, base_reward_rate:1, color:'#023e8a', best_for:'Cashback seekers with YES Bank relationship', expert_rating:7.0, category:['cashback','entry-level'], reward_currency:'cashback', active:true, last_verified:'2026-05-17', highlights:['5% cashback on selected spends','Fuel surcharge waiver'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'yes-ace', slug:'yes-ace', name:'YES Bank ACE Credit Card', bank:'Yes', tier:'entry', joining_fee_inr:0, annual_fee_inr:0, base_reward_rate:1, color:'#48cae4', best_for:'Zero fee card with basic rewards', expert_rating:6.5, category:['entry-level','zero-fee'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Zero annual fee','Reward on all spends'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried'], interest_free_days:50 },

  // IndusInd
  { id:'indusind-nexxt', slug:'indusind-nexxt', name:'IndusInd Bank Nexxt Credit Card', bank:'IndusInd', tier:'mid', joining_fee_inr:999, annual_fee_inr:999, base_reward_rate:1, color:'#560bad', best_for:'Choose reward type per transaction via card buttons', expert_rating:7.5, category:['rewards','lifestyle'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Toggle between rewards/EMI/cashback','Unique interactive card'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'indusind-legend', slug:'indusind-legend', name:'IndusInd Bank Legend Credit Card', bank:'IndusInd', tier:'mid', joining_fee_inr:2999, annual_fee_inr:2999, base_reward_rate:1.5, color:'#7b2d8b', best_for:'Entertainment and dining rewards', expert_rating:7.2, category:['lifestyle','dining'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Entertainment benefits','Dining discounts'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','self-employed'], interest_free_days:50 },

  // SC
  { id:'sc-manhattan', slug:'sc-manhattan', name:'Standard Chartered Manhattan Platinum', bank:'SC', tier:'entry', joining_fee_inr:999, annual_fee_inr:999, base_reward_rate:1, color:'#0077b6', best_for:'Grocery cashback card  --  5% at supermarkets', expert_rating:7.5, category:['cashback','shopping','entry-level'], reward_currency:'cashback', active:true, last_verified:'2026-05-17', highlights:['5% at supermarkets','Dining privileges'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'sc-super-value-titanium', slug:'sc-super-value-titanium', name:'Standard Chartered Super Value Titanium', bank:'SC', tier:'entry', joining_fee_inr:750, annual_fee_inr:750, base_reward_rate:1, color:'#00b4d8', best_for:'Fuel and utility bill savings', expert_rating:6.8, category:['fuel','cashback','entry-level'], reward_currency:'cashback', active:true, last_verified:'2026-05-17', highlights:['5% on fuel and utilities','Fee waiver on spend'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried'], interest_free_days:50 },

  // AU
  { id:'au-altura', slug:'au-altura', name:'AU Bank Altura Credit Card', bank:'AU', tier:'entry', joining_fee_inr:0, annual_fee_inr:0, base_reward_rate:1, color:'#9d4edd', best_for:'Zero fee entry card with utility cashback', expert_rating:6.8, category:['cashback','entry-level','zero-fee'], reward_currency:'cashback', active:true, last_verified:'2026-05-17', highlights:['Zero annual fee','Utility bill cashback'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:45, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'au-vetta', slug:'au-vetta', name:'AU Bank Vetta Credit Card', bank:'AU', tier:'mid', joining_fee_inr:2999, annual_fee_inr:2999, base_reward_rate:2, color:'#6a0572', best_for:'AU Bank mid-tier with travel and dining benefits', expert_rating:7.5, category:['rewards','travel'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Lounge access','Milestone rewards'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:45, eligible_employment:['salaried','self-employed'], interest_free_days:50 },

  // Federal Bank
  { id:'federal-signet', slug:'federal-signet', name:'Federal Bank Signet Credit Card', bank:'Federal', tier:'entry', joining_fee_inr:0, annual_fee_inr:0, base_reward_rate:1, color:'#2b9348', best_for:'Federal Bank customers wanting a zero-fee rewards card', expert_rating:6.5, category:['rewards','entry-level','zero-fee'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Zero annual fee','Reward on all spends'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'federal-celesta', slug:'federal-celesta', name:'Federal Bank Celesta Credit Card', bank:'Federal', tier:'premium', joining_fee_inr:7000, annual_fee_inr:7000, base_reward_rate:2, color:'#1b4332', best_for:'Premium Federal Bank customers', expert_rating:7.5, category:['premium','travel'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Priority Pass lounge','Concierge service'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','self-employed'], interest_free_days:50 },

  // HSBC
  { id:'hsbc-cashback', slug:'hsbc-cashback', name:'HSBC Cashback Credit Card', bank:'HSBC', tier:'entry', joining_fee_inr:750, annual_fee_inr:750, base_reward_rate:1, color:'#db0011', best_for:'Online shoppers  --  1.5% cashback on all online spends', expert_rating:7.8, category:['cashback','shopping'], reward_currency:'cashback', active:true, last_verified:'2026-05-17', highlights:['1.5% on online spends','0.5% on offline'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'hsbc-premier', slug:'hsbc-premier', name:'HSBC Premier MasterCard', bank:'HSBC', tier:'premium', joining_fee_inr:0, annual_fee_inr:0, base_reward_rate:2, color:'#a4001d', best_for:'HSBC Premier banking customers  --  zero fee premium card', expert_rating:8.0, category:['premium','travel','zero-fee'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Zero fee for Premier customers','Airport lounge access'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'hsbc-live-plus', slug:'hsbc-live-plus', name:'HSBC Live+ Credit Card', bank:'HSBC', tier:'entry', joining_fee_inr:999, annual_fee_inr:999, base_reward_rate:1, color:'#cc0000', best_for:'Dining, food delivery, and grocery cashback seekers', expert_rating:7.5, category:['cashback','dining'], reward_currency:'cashback', active:true, last_verified:'2026-05-17', highlights:['10% on dining/Swiggy/Zomato','1.5% on other spends'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','self-employed'], interest_free_days:50 },

  // One Card
  { id:'onecard', slug:'onecard', name:'OneCard Credit Card', bank:'OneCard', tier:'entry', joining_fee_inr:0, annual_fee_inr:0, base_reward_rate:1, color:'#1a1a1a', best_for:'Metal card with no annual fee  --  app-first experience', expert_rating:7.8, category:['rewards','entry-level','zero-fee'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Metal card, zero fee','5X on top 2 spend categories'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:36, eligible_employment:['salaried','self-employed'], interest_free_days:50 },

  // Bajaj Finserv
  { id:'bajaj-rbl-supercard', slug:'bajaj-rbl-supercard', name:'Bajaj Finserv RBL Bank SuperCard', bank:'RBL', tier:'entry', joining_fee_inr:499, annual_fee_inr:499, base_reward_rate:1, color:'#003f5c', best_for:'Bajaj EMI network users wanting interest-free loans', expert_rating:7.0, category:['shopping','entry-level'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Interest-free emergency loan','Bajaj EMI network'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:39, eligible_employment:['salaried','self-employed'], interest_free_days:50 },

  // IDBI
  { id:'idbi-steel', slug:'idbi-steel', name:'IDBI Bank Imperium Platinum', bank:'IDBI', tier:'entry', joining_fee_inr:500, annual_fee_inr:500, base_reward_rate:0.5, color:'#6c3483', best_for:'IDBI Bank account holders wanting a starter card', expert_rating:5.5, category:['entry-level'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Basic rewards','IDBI account integration'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:45, eligible_employment:['salaried'], interest_free_days:50 },

  // Bank of Baroda
  { id:'bob-eterna', slug:'bob-eterna', name:'Bank of Baroda Eterna Credit Card', bank:'BOB', tier:'premium', joining_fee_inr:2499, annual_fee_inr:2499, base_reward_rate:2, color:'#f77f00', best_for:'BOB customers wanting travel and dining rewards', expert_rating:7.3, category:['premium','travel','rewards'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['10X on travel','Lounge access'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried','self-employed'], interest_free_days:50 },
  { id:'bob-prime', slug:'bob-prime', name:'Bank of Baroda Prime Credit Card', bank:'BOB', tier:'entry', joining_fee_inr:499, annual_fee_inr:499, base_reward_rate:1, color:'#e67e22', best_for:'BOB account holders wanting basic rewards', expert_rating:6.0, category:['rewards','entry-level'], reward_currency:'reward-points', active:true, last_verified:'2026-05-17', highlights:['Basic reward on all spends','Fee waiver on spend'], redemption_options:[], category_rewards:[], lounges:[], devaluations:[], apr_percent:42, eligible_employment:['salaried'], interest_free_days:50 },
];

// Merge new cards into SEED_CARDS
NEW_CARDS.forEach(card => SEED_CARDS.push(card));
