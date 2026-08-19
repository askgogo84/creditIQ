# Backend Schema — Travel redesign

**Status:** draft for review · 18 Aug 2026
**Project ref:** consumer Supabase — `yazpphublutdodahfwvr` (NOT `qenhjcooyecmatwducpu`,
which is the AskGogo bot). Check the URL before running anything.

---

## 1. `transfer_partners` — the new table that matters

The transfer ladder is the highest-value thing on the page and there is no clean source
for it today. It gets its own table, with provenance on every field from day one.

```sql
create table transfer_partners (
  id                   uuid primary key default gen_random_uuid(),
  from_currency        text not null,        -- 'hdfc_reward_points'
  to_programme         text not null,        -- 'maharaja_club'
  ratio_from           integer not null,     -- 2  (2 points →)
  ratio_to             integer not null,     -- 1  (→ 1 mile)
  min_transfer         integer,              -- minimum increment, null if none
  duration_days_min    integer,
  duration_days_max    integer,
  bonus_note           text,                 -- '+10000 bonus', time-limited offers
  state                text not null,        -- 'verified' | 'unverified' | 'disputed'
  source               text not null,        -- issuer URL, or 'community'
  as_of                date not null,
  active               boolean not null default true,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

create unique index transfer_partners_pair
  on transfer_partners (from_currency, to_programme)
  where active;
```

**Why ratio is two integers, not a float.** A 2:1 ratio stored as `0.5` loses which
direction it runs, and this codebase already has a live defect where a numeric reward
field carries no unit and the same reward is stored two incompatible ways. Two columns
make the direction unambiguous and unloseable.

**`state` is mandatory and defaults to nothing.** A row with no source does not get
`verified`. The UI renders `unverified` rows differently and never presents them as
CreditIQ's own data.

**`duration_days_*` is load-bearing, not metadata.** It decides whether a route can hold
an award seat. A null duration renders as "transfer time unknown — confirm before you
transfer", never as instant.

**Deferred, not abandoned (Phase 2 status).** This table is not created yet. Phase 2 ships
the identical field shape as a build-gated TypeScript constant — `lib/data/transfer-graph.ts`,
guarded by `scripts/validate-transfer-graph.ts` (`npm run check:transfer-graph`). Reason: the
v1 edge set is tiny (~5 direct edges), changes rarely, has no per-user rows, and needs no RLS
— a table would be ceremony without benefit. It migrates to this table the moment it needs
editorial writes, versioned history, or non-engineer edits. The build gate enforces the same
invariants the SQL does: the `(from_currency, to_programme)` uniqueness (→ `transfer_partners_pair`),
mandatory `state`/`source`/`as_of`, and two-integer ratios.

**One field the code carries beyond this table: `card_name_allowlist`.** The TS edge type has an
optional `card_name_allowlist: string[] | null` that this table does not. It exists because a
flat `(from_currency, to_programme)` row cannot express HDFC's per-card exception — reward-points
→ KrisFlyer applies to Infinia + Diners Black only, **not** Regalia Gold — and a currency-wide
edge would misfire that route onto every HDFC card (a moat violation). When this table is created,
it needs the equivalent (a nullable `card_name_allowlist text[]`, or a join table) or the same
defect returns. Flagged here so the doc and the code do not silently disagree.

## 2. `saved_searches`

```sql
create table saved_searches (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  origin        text not null,
  destination   text not null,
  depart_date   date not null,
  date_flex     integer not null default 0,   -- ±days
  cabin         text,
  created_at    timestamptz default now(),
  last_run_at   timestamptz
);

create index saved_searches_user on saved_searches (user_id);
```

RLS: user reads and writes their own rows only. Follow the pattern already used on the
wallet tables, not the service-role pattern — several existing API routes accept
caller-supplied identity and that class of defect is already logged.

## 3. `award_search_cache`

```sql
create table award_search_cache (
  cache_key     text primary key,   -- hash(origin, destination, date, cabin, programme)
  payload       jsonb not null,
  fetched_at    timestamptz not null default now(),
  expires_at    timestamptz not null
);
```

Short TTL. Award availability is perishable — a cached seat that has gone is worse than
no seat, because the user may transfer points chasing it. **Never serve from cache at the
moment of expand**; re-check live.

## 4. What is NOT stored

- **Cash fares.** Fetched per request, never persisted. A stale cash fare beside a live
  points figure breaks the one comparison the product exists to make.
- **Traveller PII.** No names, no passport numbers, no dates of birth. There is no
  booking, so there is no reason to hold any of it. This keeps the DPDP surface unchanged.
- **Anything the user did after leaving.** We hand off; we do not track the outcome.

## 5. Reads from existing tables

| Need | Source |
|---|---|
| User's cards and balances | `statement_imports` + `manual_cards`, merged as the wallet does |
| Provenance per card | `statement_imports.self_entered` (migration 007) |
| Card → currency mapping | Card catalogue |

⚠ **Use the wallet's existing merge and dedupe logic — do not write a second one.** The
AskGogo portfolio route diverged from the wallet by querying different tables, and that
is exactly how a surface ends up showing 5,000 points when the truth is 71,118.

## 6. Migration order

1. `transfer_partners` + seed with directly-verifiable issuer routes only, `state`
   honest on every row.
2. `saved_searches` + RLS.
3. `award_search_cache`.

Nothing here blocks on the AA kill-switch or the catalogue re-sourcing work.
