// Core domain types for CardIQ

export type Bank =
  | 'HDFC' | 'SBI' | 'ICICI' | 'Axis' | 'Kotak' | 'Amex'
  | 'IDFC' | 'RBL' | 'Yes' | 'IndusInd' | 'SC' | 'AU' | 'AmEx' | 'HSBC' | 'Federal';

export type Category =
  | 'cashback' | 'travel' | 'rewards' | 'premium'
  | 'shopping' | 'dining' | 'fuel' | 'lifestyle'
  | 'business' | 'zero-fee' | 'entry-level' | 'forex';

export type RewardCurrency =
  | 'cashback' | 'points' | 'miles' | 'neucoins' | 'edge' | 'reward-points'
  | 'membership-rewards' | 'krisflyer' | 'avios';

export interface SpendCategoryReward {
  category: string; // 'online', 'dining', 'fuel', 'grocery', 'travel', 'utility', 'rent', 'wallet'
  rate: number;     // e.g. 5 means 5% or 5x
  unit: 'percent' | 'multiplier';
  cap_inr_monthly?: number;
  cap_inr_annual?: number;
  notes?: string;
}

export interface MilestoneBonus {
  spend_threshold_inr: number;
  reward_inr_equivalent: number;
  description: string;
  period: 'monthly' | 'quarterly' | 'annual';
}

export interface LoungeAccess {
  type: 'domestic' | 'international';
  visits_per_year?: number;
  visits_per_quarter?: number;
  network: 'priority-pass' | 'dreamfolks' | 'visa-airport' | 'mc-airport' | 'bank-direct';
  spend_gated?: boolean;
  spend_threshold?: number;
  notes?: string;
}

export interface RedemptionOption {
  type: 'cashback' | 'flight' | 'hotel' | 'voucher' | 'transfer' | 'product' | 'fuel';
  partner?: string;
  value_per_point_inr: number;     // Effective rupee value per point
  min_points?: number;
  notes?: string;
  best_for?: string;
}

export interface Devaluation {
  date: string;             // ISO date
  category: 'reward-rate' | 'lounge' | 'cap-added' | 'fee-hike' | 'exclusion' | 'redemption';
  description: string;
  impact: 'high' | 'medium' | 'low';
  source_url?: string;
}

export interface CreditCard {
  id: string;
  slug: string;
  name: string;
  bank: Bank;
  category: Category[];
  tier: 'entry' | 'mid' | 'premium' | 'super-premium' | 'invite-only';

  // Fees
  joining_fee_inr: number;
  annual_fee_inr: number;
  fee_waiver_spend_inr?: number; // annual spend to waive fee

  // Eligibility
  min_income_inr_monthly?: number;
  min_age?: number;
  credit_score_min?: number;

  // Rewards
  reward_currency: RewardCurrency;
  base_reward_rate: number;   // percent equivalent on non-categorized spend
  category_rewards: SpendCategoryReward[];
  milestones?: MilestoneBonus[];
  welcome_benefit_inr?: number;
  welcome_benefit_description?: string;

  // Lounge & travel
  lounges?: LoungeAccess[];
  forex_markup_percent?: number;
  fuel_surcharge_waiver?: boolean;
  fuel_surcharge_cap_monthly?: number;

  // Redemption
  redemption_options: RedemptionOption[];

  // Insurance & extras
  insurance_inr?: number;
  golf?: { rounds_per_year?: number; lessons?: number };
  movie_offers?: string;

  // Visual / brand
  color: string; // hex for card mockup
  card_image_url?: string;
  bank_logo_url?: string;
  apply_url?: string;
  apply_url_affiliate?: string;

  // Devaluation history
  devaluations?: Devaluation[];

  // Editorial
  best_for: string;
  highlights: string[];
  drawbacks?: string[];
  expert_rating?: number; // 0-10
  user_rating?: number; // 0-5 from user reviews
  user_review_count?: number;

  // APR & eligibility
  apr_percent?: number;
  eligible_employment?: ('salaried' | 'self-employed' | 'student')[];
  interest_free_days?: number;
  cash_withdrawal_fee_percent?: number;

  // Meta
  active: boolean;
  last_verified?: string; // ISO
  data_source?: 'manual' | 'scraped' | 'affiliate-feed';
}

export interface UserSpendProfile {
  monthly_total_inr: number;
  online_inr?: number;
  offline_inr?: number;
  dining_inr?: number;
  fuel_inr?: number;
  grocery_inr?: number;
  travel_inr?: number;
  utility_inr?: number;
  rent_inr?: number;
  wallet_inr?: number;
}

export interface MatchScore {
  card: CreditCard;
  score: number; // 0-100
  annual_value_inr: number; // net value after fees
  reasoning: string;
  warnings?: string[];
}

export interface UserPointsBalance {
  card_id: string;
  points: number;
  expiry_date?: string;
}

export interface RedemptionRecommendation {
  option: RedemptionOption;
  inr_value: number;
  points_used: number;
  ranking: number;
  ai_suggestion?: string;
}
