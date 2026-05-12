-- CardIQ database schema
-- Run this in Supabase SQL Editor on a new project

-- Enable extensions
create extension if not exists "uuid-ossp";

-- ============================================================================
-- Cards table — canonical credit card data
-- ============================================================================
create table if not exists cards (
  id text primary key,
  slug text unique not null,
  name text not null,
  bank text not null,
  category jsonb not null default '[]',
  tier text not null,

  -- Fees
  joining_fee_inr integer not null default 0,
  annual_fee_inr integer not null default 0,
  fee_waiver_spend_inr integer,

  -- Eligibility
  min_income_inr_monthly integer,
  min_age integer,
  credit_score_min integer,

  -- Rewards
  reward_currency text not null,
  base_reward_rate numeric(5,2) not null default 0,
  category_rewards jsonb not null default '[]',
  milestones jsonb default '[]',
  welcome_benefit_inr integer,
  welcome_benefit_description text,

  -- Lounge & travel
  lounges jsonb default '[]',
  forex_markup_percent numeric(4,2),
  fuel_surcharge_waiver boolean default false,
  fuel_surcharge_cap_monthly integer,

  -- Redemption
  redemption_options jsonb not null default '[]',

  -- Extras
  insurance_inr integer,
  golf jsonb,
  movie_offers text,

  -- Visual / brand
  color text default '#1a1a1a',
  card_image_url text,
  bank_logo_url text,
  apply_url text,
  apply_url_affiliate text,

  -- Devaluation history
  devaluations jsonb default '[]',

  -- Editorial
  best_for text,
  highlights jsonb default '[]',
  drawbacks jsonb default '[]',
  expert_rating numeric(3,1),

  -- Meta
  active boolean not null default true,
  last_verified date,
  data_source text default 'manual',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_cards_slug on cards (slug);
create index if not exists idx_cards_bank on cards (bank);
create index if not exists idx_cards_active on cards (active);

-- ============================================================================
-- Redemptions table — user redemption history (for future "track value" feature)
-- ============================================================================
create table if not exists redemptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  card_id text references cards(id) on delete cascade,
  redemption_type text not null,
  partner text,
  points_used integer not null,
  inr_value integer not null,
  date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_redemptions_card on redemptions (card_id);
create index if not exists idx_redemptions_user on redemptions (user_id);

-- ============================================================================
-- Devaluations table — separate log for tracking changes over time
-- ============================================================================
create table if not exists devaluation_log (
  id uuid primary key default uuid_generate_v4(),
  card_id text references cards(id) on delete cascade,
  date date not null,
  category text not null,
  description text not null,
  impact text not null check (impact in ('high','medium','low')),
  source_url text,
  created_at timestamptz default now()
);

create index if not exists idx_devaluation_card on devaluation_log (card_id);
create index if not exists idx_devaluation_date on devaluation_log (date desc);

-- ============================================================================
-- Applications table — track apply clicks for affiliate revenue accounting
-- ============================================================================
create table if not exists applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  card_id text references cards(id) on delete cascade,
  click_source text,
  affiliate_type text,
  utm_campaign text,
  user_agent text,
  ip_hash text,
  status text default 'clicked',
  approved_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_applications_card on applications (card_id);
create index if not exists idx_applications_user on applications (user_id);

-- ============================================================================
-- User points balances (for logged-in users tracking their cards)
-- ============================================================================
create table if not exists user_points (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  card_id text references cards(id) on delete cascade,
  points integer not null default 0,
  expiry_date date,
  last_updated timestamptz default now(),
  unique (user_id, card_id)
);

-- ============================================================================
-- RLS — anyone can read cards & devaluations; auth required for writes
-- ============================================================================
alter table cards enable row level security;
alter table devaluation_log enable row level security;
alter table redemptions enable row level security;
alter table applications enable row level security;
alter table user_points enable row level security;

create policy "public read cards" on cards
  for select using (true);

create policy "public read devaluations" on devaluation_log
  for select using (true);

-- (Writes happen via service_role key from Vercel cron + admin)
