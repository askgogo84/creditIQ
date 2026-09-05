-- CreditIQ Dream Trip / Award Watch
-- User-owned travel goals with provider snapshots. No result stored here is treated as
-- verified availability; the last_result payload retains source/evidence labels.

create table if not exists travel_watches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  label text not null,
  origin text not null check (origin ~ '^[A-Z]{3}$'),
  destination text not null check (destination ~ '^[A-Z]{3}$'),
  cabin text not null default 'business' check (cabin in ('economy','premium_economy','business','first')),
  travellers integer not null default 1 check (travellers between 1 and 9),
  target_date date not null,
  flex_days integer not null default 3 check (flex_days in (0,3,7)),
  nonstop_only boolean not null default false,
  preferred_programmes text[] not null default '{}'::text[],
  target_points bigint,
  target_cash_minor bigint,
  alert_channel text not null default 'APP' check (alert_channel in ('APP','EMAIL','WHATSAPP','BOTH')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','PAUSED','BOOKED','CANCELLED')),

  last_checked_at timestamptz,
  last_state text check (last_state is null or last_state in ('BOOK_NOW','VERIFY_FIRST','WAIT','CASH_BETTER','KEEP_POINTS','NO_RESULT')),
  best_award_miles bigint,
  best_cash_minor bigint,
  best_programme text,
  best_date date,
  last_result jsonb not null default '{}'::jsonb,
  last_notified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_travel_watches_user_created
  on travel_watches (user_id, created_at desc);
create index if not exists idx_travel_watches_active
  on travel_watches (status, target_date)
  where status = 'ACTIVE';

alter table travel_watches enable row level security;

drop policy if exists "users read own travel watches" on travel_watches;
create policy "users read own travel watches" on travel_watches
  for select using (auth.uid() = user_id);

-- Browser clients intentionally get no INSERT/UPDATE/DELETE policies. Authenticated
-- Vercel API routes re-check the bearer token, then mutate with the service role.
