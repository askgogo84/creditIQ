> **The real audit now exists:** `docs/MERGE-AUDIT-2026-08-26.md` (run against the
> 2026-08-26 export). Keep this framework for its reusable bucket criteria + export SQL
> for the next export cycle.

# Supabase → SEED Merge Audit — FRAMEWORK (2026-08-26)

> **THIS IS A FRAMEWORK, NOT AN AUDIT.**
> An audit would name every unmatched Supabase row and place it in a bucket. I have
> **not** produced that, and deliberately so: I cannot read the Supabase `cards`
> table (hard rule: *no SQL execution, no DB reads*), and the row data does **not**
> exist anywhere in this repo (verified — see "Why no enumeration" below). Bucketing
> rows I have never seen — from the task brief's aggregates, prior handoff docs, or
> the dead `NEW_CARDS` block — would be **inference about unseen records**, which the
> sourcing skill forbids (*"a null beats a guess"*). So this document gives the
> **decision procedure**: the bucket criteria, the fields each call needs, the exact
> read-only SQL to export the data, and the deterministic algorithm to run over that
> export. Anyone with DB access can produce the real audit in ~20 minutes by running
> §4 and applying §2–§3.

**Scope:** report/framework only. No source files, no DB writes, no SQL executed, no
change to `DRAFT_catalogue_reconciliation.sql`. Target (when run): Supabase project
ref `yazpphublutdodahfwvr`, `cards` table **only**. NEVER `qenhjcooyecmatwducpu`.

---

## Why no enumeration (the honest limitation)

The brief asks to place "every Supabase row not matched to a SEED card (~80 slugged +
44 slugless)" into a bucket, with a full per-row list. That requires the row bodies.
I checked every offline source that could hold them:

| Source checked | Holds the 173 row bodies? |
|---|---|
| `supabase/migrations/*.sql` (incl. `001_initial.sql`) | No — DDL/schema only, zero card INSERTs. |
| `supabase/migrations/DRAFT_catalogue_reconciliation.sql` | No — its DELETE lists are empty placeholders (`/* PASTE ids here */`). |
| `docs/*.md` (reconciliation, sourcing, handoff, audits, status) | No — they cite **aggregates** ("173 rows / 129 distinct slugs / 44 slugless") from prior *live* queries; none paste the rows. |
| `lib/data/seed-cards.ts` `NEW_CARDS` (dead block, 82 entries) | No — this is a **separate hand-authored array**, not a Supabase export. Overlapping ids do not prove row identity. |
| Any JSON/CSV/scrape dump under `scripts/`, `data/`, `.cache/`, `fixtures/` | None exists. |

**Conclusion:** the only way to get the rows is to run the §4 SELECTs against the live
DB. Until then, no true per-row bucketing is possible, and none is invented here.

---

## 1. The goal this feeds

Architecture decision is **already made and not re-litigated here**: `seed-cards.ts` is
canonical; Supabase becomes a derived mirror rebuilt by a seeder (truncate + reseed
from SEED). The danger that decision creates: **a truncate destroys every Supabase row
that is not represented in SEED.** So before any reseed can run, every unmatched
Supabase row must be classified: is it a real card to carry over (PROMOTE), a
duplicate of a SEED card (MERGE), or junk (DROP)? This framework is that gate.

---

## 2. Bucket criteria (apply in this order per row)

Run the tests **top-down**; first match wins. "SEED" = the 51 live `id === slug`
cards in `SEED_CARDS` + `MORE_CARDS`.

### DROP — destroy-safe, no human value
A row is DROP **only if ALL** hold:
- `name` is null/blank/whitespace **or** an obvious test string (e.g. `test`, `xxx`, `asdf`, a bare UUID as name); **and**
- `redemption_options` is empty (`[]`) or absent; **and**
- no distinguishing card fields — `bank` null/blank **and** `reward_currency` null **and** `annual_fee_inr` null/0 with no `category_rewards`, `lounges`, `milestones`, `welcome_benefit_*`, `apply_url`.
- Note: **empty `redemption_options` alone is NOT grounds for DROP** — a valid cashback card legitimately has one/zero options, and a mistyped row can be a full card minus redemptions.

### MERGE — same physical card as a SEED card under a different id/spelling
A row is MERGE if it is **not** DROP and it maps to an existing SEED card by:
- **exact slug** already in SEED (a slug-duplicate / UUID-duplicate of a live card); **or**
- **normalized name + normalized bank** matching a SEED card, where:
  - name normalize = lowercase, strip `credit card`/`card`/punctuation/extra spaces;
  - bank normalize = collapse split spellings (`HDFC`=`HDFC Bank`, `SBI`=`SBI Card`, `Axis`=`Axis Bank`, `ICICI`=`ICICI Bank`, `Kotak`=`Kotak Mahindra Bank`, `AU`=`AU Small Finance Bank`, `IndusInd`=`IndusInd Bank`, `Yes`=`YES Bank`, `IDFC`=`IDFC FIRST Bank`, `RBL`=`RBL Bank`, `AmEx`=`American Express`, `Federal`=`Federal Bank`, `BOB`=`Bank of Baroda`, `OneCard`=`FPL Technologies`, `SC`=`Standard Chartered`); **or**
- **transposed/spelling-variant slug** of a SEED slug (token-set match, e.g. `a-b-c` vs `c-b-a`).
- Output must name the **canonical SEED id** to merge into, and list any field on the Supabase row that is *richer* than SEED (non-null where SEED is null) to carry over **before** the row is dropped.

### PROMOTE — a real card that SEED lacks
A row is PROMOTE if it is **not** DROP and **not** MERGE: it has a real name + bank
and does not correspond to any SEED card. Output the fields worth carrying into a new
SEED entry (see §3), each still subject to the sourcing rule (**unsourced fields land
`null`, never estimated**) when the SEED entry is actually authored.

### KEEP-pending (safety default)
Any row that cannot be confidently placed (ambiguous name, partial data) defaults to
**KEEP-pending-inspection** — never DROP on doubt. It blocks the truncate until a human
resolves it.

---

## 3. Fields needed per row to make each call

Export these columns for every row (the §4 dump). Each maps to a decision:

| Field | Needed for | Why |
|---|---|---|
| `id` | all | Identify the row; detect UUID-vs-slug id family. |
| `slug` | MERGE / DROP | Null → slugless (can't route/match by slug); exact-slug match → duplicate. |
| `name` | all | Primary MERGE key (normalized) and the DROP blank/junk test. |
| `bank` | MERGE | Second MERGE key; reveals split-spelling duplicates. |
| `reward_currency` | DROP / PROMOTE | Distinguishing field; null strengthens DROP. |
| `annual_fee_inr`, `joining_fee_inr` | DROP / PROMOTE | Distinguishing fields; carry-over candidates. |
| `category_rewards`, `milestones`, `lounges`, `welcome_benefit_*` | DROP / MERGE | Presence blocks DROP; richer-than-SEED → carry over on MERGE. |
| `redemption_options` + `jsonb_typeof(redemption_options)` | DROP / data-quality | Empty vs populated; **type = `string` flags the double-encoding defect** (see reconciliation §1.3). |
| `apply_url` / affiliate fields | PROMOTE | Real product signal; carry over. |
| `active`, `last_verified`, `created_at`/`updated_at` (if present) | triage | Stale/never-verified rows; ingestion-family dating. |

---

## 4. Exact SQL to export the data (READ-ONLY — run in Supabase SQL editor)

Run against ref `yazpphublutdodahfwvr` only. All four are read-only `SELECT`s.

```sql
-- 4a. FULL ROW DUMP — the input to the whole bucketing algorithm (§5).
select id, slug, name, bank, reward_currency,
       joining_fee_inr, annual_fee_inr,
       jsonb_typeof(redemption_options) as redemp_type,
       redemption_options,
       category_rewards, milestones, lounges,
       welcome_benefit_inr, welcome_benefit_description,
       apply_url, active, last_verified
from cards
order by slug nulls last, id;

-- 4b. THE 44 SLUGLESS ROWS — the hardest bucket (can't match by slug).
select id, name, bank, reward_currency, annual_fee_inr, joining_fee_inr,
       jsonb_typeof(redemption_options) as redemp_type, redemption_options
from cards
where slug is null
order by name nulls last;

-- 4c. DUPLICATE DETECTION — normalized name+bank collisions (MERGE candidates).
select lower(regexp_replace(name, '\s*(credit card|card)\s*$', '', 'i')) as norm_name,
       lower(regexp_replace(bank, '\s*(bank|card)\s*$', '', 'i'))        as norm_bank,
       count(*) as n, array_agg(id) as ids, array_agg(slug) as slugs
from cards
group by 1, 2
having count(*) > 1
order by n desc;

-- 4d. ENCODING-DEPTH PROBE — is redemption_options single- or double-encoded?
select id, jsonb_typeof(redemption_options) as t,
       left(redemption_options::text, 80)      as raw,
       left((redemption_options #>> '{}'), 80) as one_unwrap
from cards
where jsonb_typeof(redemption_options) = 'string'
limit 20;
```

Export 4a as CSV/JSON; that file is what a human (or a follow-up agent **with DB
access**) runs §5 over.

---

## 5. The deterministic bucketing algorithm (run over the §4a export)

```
seed = { the 51 SEED id===slug cards, with normalized name+bank precomputed }

for each row r in dump:
    if is_drop(r):                      -> DROP        (record id + reason)
    elif r.slug in seed.ids:            -> MERGE into r.slug         (exact slug dup)
    elif norm(r.name,r.bank) in seed:   -> MERGE into that seed id   (spelling dup)
    elif token_set(r.slug) in seed:     -> MERGE into that seed id   (transposed slug)
    elif has_real_identity(r):          -> PROMOTE     (list carry-over fields)
    else:                               -> KEEP-pending (ambiguous — blocks truncate)

# is_drop / has_real_identity per §2.
# Emit: counts per bucket + full per-row list (id, bucket, target/reason).
```

**Cross-checks to include in the output (do not skip):**
- Any row whose `redemp_type = 'string'` → tag "double-encoded, fix before reseed" (this is the reconciliation-doc §1.3 landmine; independent of bucket).
- Any PROMOTE row that the Tier-3 sourcing pass already researched (e.g. HSBC Cashback / Live+, Airtel Axis, SBI PRIME, Amex Platinum Charge, and the two now already in SEED — IndiGo 6E XL, IDFC SWYP) → note "sourcing exists in docs/CARD-SOURCING-2026-08-26.md, promote with verified fields only."
- Any MERGE where the Supabase row is **richer** than the SEED survivor → the carry-over list is mandatory, else data is lost at merge.

---

## 6. The question the brief ends on

> *"How many rows would a truncate-and-reseed destroy that a human should look at first?"*

I will not fabricate a number for rows I cannot see. It is **exactly** the count the
algorithm labels **PROMOTE + KEEP-pending** (the MERGE rows are safe to lose *only
after* their carry-over fields are folded into the SEED survivor; DROP rows are
destroy-safe by definition). Compute it directly once §4a is exported:

```sql
-- Rows a truncate would destroy that are NOT already represented in SEED by slug.
-- (Upper bound on "must review first": every unmatched row. Refine down with §5:
--  subtract confirmed DROP and post-carry-over MERGE.)
-- Paste the 51 SEED slugs into the VALUES list before running.
with seed(slug) as (values
  -- ('hdfc-infinia'),('hdfc-regalia-gold'), ...  <- paste all 51 SEED slugs here
  (null)
)
select
  count(*) filter (where c.slug is null)                             as slugless_rows,
  count(*) filter (where c.slug is not null
                     and c.slug not in (select slug from seed))      as slugged_unmatched,
  count(*) filter (where c.slug is null
                     or  c.slug not in (select slug from seed))      as total_to_review
from cards c;
```

Per the brief's aggregates this will land near **~80 slugged-unmatched + 44 slugless
≈ 124 rows** as the **upper bound** a human must review before the first truncate; §5
then splits that into "PROMOTE (carry into SEED)", "MERGE (fold fields, then safe to
drop)", and "DROP (destroy-safe)". **The real numbers come only from running the
queries — not from this document.**

---

## 7. Prior-query hints (verify, do not trust)

These are from earlier **live** queries recorded by other authors — I did **not**
observe these rows and they may be stale. Treat strictly as "patterns to confirm
against the §4 export," never as the audit result:

- `docs/CREDITIQ-HANDOFF-2026-08-22.md` §11.4 (direct-query, 2026-08-22): 173 rows =
  ~93 slug-style ids + ~80 UUID ids; **36 distinct bank spellings**; **≥13 duplicate
  card pairs** (a slug row + a UUID row for the same physical card, e.g. an Infinia
  Metal pair); exact-match dedupe missed spelling/transposition variants (the reason
  §2's MERGE test uses normalized name+bank **and** token-set slug matching).
- `docs/CATALOGUE-RECONCILIATION-2026-08-26.md` §1.3: **67 rows** store
  `redemption_options` as a JSON **string** (single- or double-encoded) — run 4d to
  determine depth; double-encoding is a live-outage risk for the AI routes.

*End of framework. Nothing here was derived from a Supabase row I read — because I
read none. Run §4, then §5, to produce the actual audit.*
