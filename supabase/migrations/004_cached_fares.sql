-- 004_cached_fares.sql
-- Cached cheapest flight fares from Travelpayouts (/v1/prices/cheap), refreshed
-- daily by the /api/cron/refresh-fares job and read by /api/fares.
--
-- Design notes:
--   * Codes are stored as Travelpayouts CITY codes (BLR, DEL, BOM, DXB, SIN, BKK,
--     LON, GOI, MAA, HYD, CCU). London is LON, never LHR — TP keys responses by
--     city, so the cron and read API normalise airport -> city.
--   * found_at is the freshness anchor for the UI's "updated Xh ago" label.
--   * expires_at is Travelpayouts' own fare expiry. Read/UI rule: expires_at < now()
--     => the fare is demoted to an ESTIMATE (no gold badge); only future-valid
--     fares earn the champagne-gold "cached" badge.
--   * Table is written by the cron (service role) and read by /api/fares (service
--     role). RLS is ON with no public policies: only the service role touches it.

create table if not exists public.cached_fares (
  id            bigint generated always as identity primary key,
  origin        text not null,            -- TP city code, e.g. BLR
  destination   text not null,            -- TP city code, e.g. DXB / LON
  depart_date   date not null,
  return_date   date,                     -- nullable: null = one-way
  airline       text,                     -- TP airline IATA, e.g. 6E, IX
  flight_number text,
  price_inr     integer not null check (price_inr > 0),
  source        text not null default 'travelpayouts',
  expires_at    timestamptz,              -- TP's own cached-fare expiry
  found_at      timestamptz not null default now(),
  -- NULLS NOT DISTINCT (PG15+) so one-way rows (return_date IS NULL) still dedupe
  -- on upsert. Supabase runs PG15/16; if your instance is older, tell me and I'll
  -- switch to a COALESCE-based expression index.
  constraint cached_fares_route_uniq
    unique nulls not distinct (origin, destination, depart_date, return_date, source)
);

create index if not exists cached_fares_lookup_idx
  on public.cached_fares (origin, destination, depart_date);

alter table public.cached_fares enable row level security;
-- No policies: cron (write) and /api/fares (read) both use the service-role key,
-- which bypasses RLS. Public/anon clients get nothing directly.

comment on table public.cached_fares is
  'Daily-refreshed cheapest Travelpayouts fares for top India routes. City codes only (LON not LHR). found_at = freshness anchor; expires_at<now() => demote to estimate.';
