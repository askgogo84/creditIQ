-- Short-lived consumer -> CreditIQ Business travel handoff.
-- The raw token is never stored; only SHA-256(token) is persisted.
create table if not exists corporate_travel_handoffs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  token_hash text not null unique,
  payload jsonb not null,
  expires_at timestamptz not null,
  accessed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_corporate_travel_handoffs_user_created
  on corporate_travel_handoffs (user_id, created_at desc);
create index if not exists idx_corporate_travel_handoffs_expiry
  on corporate_travel_handoffs (expires_at);

alter table corporate_travel_handoffs enable row level security;
drop policy if exists "users read own corporate travel handoffs" on corporate_travel_handoffs;
create policy "users read own corporate travel handoffs" on corporate_travel_handoffs
  for select using ((select auth.uid()) = user_id);
