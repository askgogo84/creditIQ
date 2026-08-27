# Supabase → SEED Merge Audit (2026-08-26)

**Input:** `docs/supabase-cards-export-2026-08-26.csv` — **172 of 173 rows** (one row was
lost at the export boundary; per instruction it is **not** recovered and **not**
counted here — every number below is out of 172).
**Audited against:** the 51 live `id === slug` cards in `SEED_CARDS` + `MORE_CARDS`
(`lib/data/seed-cards.ts`). `NEW_CARDS` (dead block) is **not** treated as SEED.
**Rules honoured:** no source edits, no SQL executed, no DB writes. This is the real
per-row audit; it supersedes `docs/MERGE-AUDIT-FRAMEWORK-2026-08-26.md` (written before
the export existed), whose bucket criteria it applies.
**Export columns available:** `id, slug, name, bank, reward_currency, ro_type,
redemption_options` — only 7. Fee/earn/lounge columns are **not** in this export, so
per-card "fields worth carrying over" (for MERGE carry-over and PROMOTE authoring)
needs a fuller re-export (all columns — see framework §4a). Bucketing itself needs only
identity columns, which are present.

---

## Counts per bucket (of 172)

| Bucket | Meaning | Rows |
|---|---:|---:|
| **A — PROMOTE** | Real card **not** in SEED under any id/name spelling | **107** |
| **B — MERGE** | Duplicate of a SEED card under a different id/spelling | **14** |
| **C — MATCHES SEED** | `slug`/`id` already a live SEED card | **51** |
| **D — JUNK** | No usable card identity | **0** |
| | **Total** | **172** |

- The 107 PROMOTE rows contain **13 internal Supabase duplicate pairs** (same card
  stored twice — once slugless, once as a UUID row), so they represent **94 distinct
  real cards**, not 107.
- **D = 0:** every one of the 172 rows has a non-blank `name`. There is no test/debris
  row in this export to drop.

---

## The plain truncate answer

A truncate-and-reseed rebuilds Supabase from SEED's 51 cards, so **every row whose slug
is not one of the 51 is destroyed — that is 121 rows (172 − 51).** Of those 121:

- **107 rows (buckets A) are cards SEED does NOT have → permanent loss.** They are
  **94 distinct products** (13 are stored twice inside Supabase). **These 94 are what a
  human must review / source before any truncate can safely run.**
- **14 rows (bucket B) are alternate spellings/ids of cards SEED already has** → the
  SEED card survives the reseed; only any *richer field* on the Supabase copy is lost
  unless carried over first.
- **0 rows are junk.**

**So: 121 rows would be destroyed; 94 distinct real cards among them are not in SEED and
must be looked at first; 14 are safe once their richer fields (if any) are folded into
the matching SEED card.**

---

## Data-quality findings (relevant to the reseed)

Two ingestion families are still visible in the export and both are healed by the
seed-canonical rebuild — noting them so nothing surprises you mid-migration:

1. **`reward_currency` default.** 124 of 172 rows carry the generic `'points'`; only 48
   carry a real currency (`reward-points` 26, `cashback` 12, `membership-rewards` 3,
   `miles` 3, `edge` 2, `neucoins` 2). The 48 properly-typed rows are almost exactly the
   **SEED-slug family (bucket C)**; the 124 `'points'` rows are the UUID/slugless
   ingestion family (buckets A + B). Any PROMOTE card authored into SEED must set its
   real currency — `'points'` here is a default, not sourced.
2. **`redemption_options` encoding.** 67 rows store it as a JSON **string** (the known
   double-encoding defect), 105 as a proper array. The 67 string rows are concentrated
   in the **SEED-slug (C) family**; the UUID rows are mostly clean arrays. Irrelevant
   after the rebuild (the seeder rewrites the column as native jsonb) but confirms the
   reconciliation §1.3 finding on live data.

---

## A — PROMOTE (107 rows · 94 distinct cards), ranked by how widely held in India

> ⚠ **Prevalence ranking is my market-knowledge judgment, NOT sourced data** — treat the
> tiers as a sourcing-priority hint, not a fact. `[2×]` = stored twice in Supabase
> (slugless + UUID) → author **one** SEED entry. Flags called out inline.

### Tier 1 — mass-market, source first
| Card | Bank | Supabase id(s) |
|---|---|---|
| Slice | SBM/NESFB | `slice` |
| OneCard `[2×]` | OneCard/FPL | slugless + `onecard` |
| Amex SmartEarn `[2×]` | Amex | slugless + `amex-smartearn` |
| Airtel Axis `[2×]` | Axis | slugless + `axis-airtel` |
| SBI SimplySAVE `[2×]` | SBI | slugless + `sbi-simplysave` |
| SBI Card PRIME | SBI | slugless `SBI Card PRIME` |
| Paytm SBI | SBI | `paytm-sbi` |
| Tata Neu Infinity RuPay ⚠variant | HDFC | `tata-neu-infinity-rupay` |
| Uber HDFC | HDFC | `uber-hdfc` |
| Zomato Axis | Axis | `zomato-axis` |
| BPCL SBI (base) | SBI | `bpcl-sbi` |
| HDFC IndianOil | HDFC | slugless |
| ICICI HPCL Super Saver `[2×]` | ICICI | slugless + `icici-hpcl-super-saver` |
| Indian Oil Axis `[2×]` | Axis | slugless + `indian-oil-axis` |
| IRCTC SBI Platinum | SBI | `irctc-sbi-platinum` |

⚠ **`tata-neu-infinity-rupay`** — network (RuPay) variant of SEED's `tata-neu-infinity-hdfc`;
could be a MERGE. RuPay adds UPI-linked earn, so I left it PROMOTE (distinct) pending your call.

### Tier 2 — common / notable
| Card | Bank | Supabase id(s) |
|---|---|---|
| SBI Card PULSE `[2×]` | SBI | slugless + `sbi-card-pulse` |
| Kotak White | Kotak | slugless |
| HSBC Cashback `[2×]` | HSBC | slugless + `hsbc-cashback` |
| HSBC Live+ | HSBC | slugless |
| Federal Scapia | Federal | `federal-scapia` |
| CRED RBL | RBL | `cred-rbl` |
| Fi Federal | Federal | `fi-federal` |
| Kiwi | SBM | `kiwi` |
| Paisabazaar Step UP | SBM | `paisabazaar-step-up` |
| BOB Eterna `[2×]` | BOB | slugless + `bob-eterna` |
| Myntra Kotak | Kotak | `myntra-kotak` |
| Nykaa Kotak | Kotak | `nykaa-kotak` |
| Air India Axis Signature | Axis | `air-india-axis-signature` |
| Axis Vistara Signature ⚠discontinued | Axis | `axis-vistara-signature` |
| IndusInd Legend `[2×]` | IndusInd | slugless + `indusind-legend` |
| IndusInd Nexxt `[2×]` | IndusInd | slugless + `indusind-nexxt` |
| SBI Card AURUM | SBI | slugless |
| Axis Reserve `[2×]` | Axis | slugless + `axis-reserve` |
| MakeMyTrip ICICI | ICICI | `makemytrip-icici` + slugless `MMT Platinum` + slugless `MMT Signature` |
| BookMyShow Axis | Axis | `bookmyshow-axis` |
| BigBasket Axis | Axis | `bigbasket-axis` |
| Citi Cashback (now Axis) | Axis | `citi-cashback` |
| Citi PremierMiles (now Axis) | Axis | `citi-premiermiles` |
| ITC Hotels HDFC | HDFC | `itc-hotels-hdfc` |

### Tier 3 — mid / niche
| Card | Bank | Supabase id |
|---|---|---|
| IDFC FIRST WOW | IDFC | slugless |
| IDFC FIRST Millennia | IDFC | slugless |
| Club Vistara IDFC ⚠discontinued | IDFC | slugless |
| Club Vistara HDFC ⚠discontinued | HDFC | `club-vistara-hdfc` |
| Club Vistara SBI ⚠discontinued | SBI | `club-vistara-sbi` |
| Club Vistara SBI Card PRIME ⚠discontinued | SBI | slugless |
| Kotak PVR Gold | Kotak | `kotak-pvr-gold` |
| Kotak PVR Platinum | Kotak | `kotak-pvr-platinum` |
| Kotak Privy League Signature | Kotak | slugless |
| Kotak Essentia Platinum | Kotak | slugless |
| RBL ICON | RBL | slugless |
| RBL Fun Plus | RBL | slugless |
| RBL World Safari | RBL | slugless |
| Bajaj Finserv RBL SuperCard | RBL | slugless |
| YES ACE | Yes | slugless |
| YES Prosperity Cashback Plus | Yes | slugless |
| YES Bank SELECT | Yes | `yes-bank-select` |
| YES Bank FIRST Business | Yes | `yes-bank-first-business` |
| AU Vetta `[2×]` | AU | slugless + `au-vetta` |
| AU Altura | AU | slugless |
| AU Altitude | AU | `au-altitude` |
| AU Zenith+ ⚠vs `au-zenith` | AU | `au-zenith-plus` |
| SC Manhattan Platinum | SC | slugless |
| SC Super Value Titanium | SC | slugless |
| Federal Signet | Federal | slugless |
| Federal Celesta | Federal | slugless |
| BOB Prime | BOB | slugless |
| BOB SELECT | BOB | `bob-select` |
| Cleartrip ICICI | ICICI | `cleartrip-icici` |
| 1mg ICICI | ICICI | `1mg-icici` |
| Apollo Hospitals SBI | SBI | `apollo-sbi` |
| Ola Money SBI | SBI | `ola-money-sbi` |
| Yatra SBI | SBI | `yatra-sbi` |
| ICICI Expressions | ICICI | slugless |
| ICICI Manchester United | ICICI | `icici-manchester-united` |
| ICICI Platinum Chip | ICICI | `icici-platinum-chip` |
| HDFC Diners Club Miles | HDFC | slugless |
| HDFC Platinum Times | HDFC | slugless |
| HDFC Diners Club Privilege | HDFC | `hdfc-diners-privilege` |
| HDFC BizPower | HDFC | `hdfc-bizpower` |
| SBI ELITE Advantage ⚠vs `sbi-elite` | SBI | `sbi-elite-advantage` |
| SBI Card PRIME Business | SBI | `sbi-prime-business` |
| IRCTC SBI Premier | SBI | `irctc-sbi-premier` |
| IndusInd Platinum Aura Edge | IndusInd | `indusind-platinum-aura-edge` |
| HSBC Premier MasterCard | HSBC | slugless |
| HSBC Visa Platinum | HSBC | `hsbc-visa-platinum` |
| IndiGo HDFC 6E Rewards (non-XL) ⚠vs XL in SEED | HDFC | `indigo-hdfc-6e-rewards` |
| Axis NEO | Axis | slugless |

### Tier 4 — low prevalence / basic / regional PSU
| Card | Bank | Supabase id |
|---|---|---|
| IDBI Imperium Platinum | IDBI | slugless |
| PNB RuPay Platinum | PNB | `pnb-rupay-platinum` |
| Union Bank of India Platinum | Union | `union-bank-platinum` |
| Canara Bank Platinum | Canara | `canara-platinum` |

---

## B — MERGE (14 rows → canonical SEED id)

Each is a duplicate of an existing SEED card under a different id/name spelling. On
reseed the SEED card survives; carry over any richer field from the Supabase row first
(fee/earn columns not in this export — re-export to check before dropping).

| Supabase id | Supabase name | → canonical SEED id |
|---|---|---|
| `air-india-sbi-signature` | Air India SBI Signature Credit Card | `sbi-air-india-signature` |
| `amazon-pay-icici` | Amazon Pay ICICI Credit Card | `icici-amazon-pay` |
| `axis-my-zone` | Axis Bank MY Zone Credit Card | `axis-myzone` |
| `bpcl-sbi-octane` | BPCL SBI Credit Card Octane | `sbi-bpcl-octane` |
| `flipkart-axis` | Flipkart Axis Bank Credit Card | `axis-flipkart` |
| `hdfc-diners-black-metal` | HDFC Diners Club Black Metal Edition | `hdfc-diners-black` |
| `hdfc-infinia-metal` | HDFC Infinia Credit Card Metal Edition | `hdfc-infinia` |
| `icici-emeralde-private-metal` | ICICI Emeralde Private Metal Credit Card | `icici-emeralde` |
| `kotak-811-dreamdifferent` | Kotak 811 DreamDifferent Credit Card | `kotak-811-dream` |
| `marriott-bonvoy-hdfc` | Marriott Bonvoy HDFC Bank Credit Card | `hdfc-marriott-bonvoy` |
| `sbi-card-elite` | SBI Card ELITE | `sbi-elite` |
| `swiggy-hdfc` | Swiggy HDFC Credit Card | `hdfc-swiggy` |
| `yes-bank-marquee` | YES Bank Marquee Credit Card | `yes-marquee` |
| `amex-gold-charge` ⚠JUDGMENT | American Express Gold Charge Card | `amex-gold` |

⚠ **`amex-gold-charge`** — not an automatic name match (name differs from "American
Express Gold Card"). Merged on judgment: the Amex India Gold *is* a charge card and
there is only one Gold product; merging is safe (SEED `amex-gold` survives). Confirm
before dropping.

---

## C — MATCHES SEED (51 rows already live)

All 51 SEED cards have exactly one slug-matched Supabase row (several also have a UUID
duplicate — see B and the intra-Supabase list below):

`amex-gold, amex-mrcc, amex-platinum-travel, au-altura-plus, au-lit, au-zenith,
axis-ace, axis-atlas, axis-flipkart, axis-horizon, axis-magnus-burgundy, axis-myzone,
axis-vistara-infinite, hdfc-diners-black, hdfc-freedom, hdfc-infinia,
hdfc-marriott-bonvoy, hdfc-millennia, hdfc-moneyback-plus, hdfc-regalia-gold,
hdfc-swiggy, icici-amazon-pay, icici-coral, icici-emeralde, icici-rubyx,
icici-sapphiro, idfc-first-classic, idfc-first-select, idfc-first-swyp,
idfc-first-wealth, indigo-hdfc-6e-rewards-xl, indusind-celesta, indusind-iconia,
indusind-pinnacle, kotak-811-dream, kotak-league-platinum, kotak-royale-signature,
rbl-popcorn, rbl-shoprite, sbi-air-india-signature, sbi-bpcl-octane, sbi-cashback,
sbi-elite, sbi-simplyclick, sc-digismart, sc-smart, sc-ultimate,
tata-neu-infinity-hdfc, tata-neu-plus-hdfc, yes-first-preferred, yes-marquee`

(Note `idfc-first-swyp` and `indigo-hdfc-6e-rewards-xl` match because they were added to
SEED in the prior commit; the base `indigo-hdfc-6e-rewards` non-XL is a *separate* card
in bucket A.)

---

## D — JUNK (0 rows)

None. Every row in the export has a real name and bank.

---

## Called out separately: cards stored TWICE inside Supabase (13 pairs)

Per your instruction. Each is one real card duplicated as **a slugless row + a UUID
row** — all in bucket A, all NOT in SEED. On promotion, author **one** SEED entry per
pair (do not create two). These 13 pairs = 26 of the 107 PROMOTE rows:

| Card | slugless row | UUID row |
|---|---|---|
| Airtel Axis | `Airtel Axis Bank Credit Card` | `axis-airtel` |
| Amex SmartEarn | `American Express SmartEarn` | `amex-smartearn` |
| AU Vetta | `AU Bank Vetta Credit Card` | `au-vetta` |
| Axis Reserve | `Axis Bank Reserve Credit Card` | `axis-reserve` |
| BOB Eterna | `Bank of Baroda Eterna Credit Card` | `bob-eterna` |
| HSBC Cashback | `HSBC Cashback Credit Card` | `hsbc-cashback` |
| ICICI HPCL Super Saver | `ICICI Bank HPCL Super Saver` | `icici-hpcl-super-saver` |
| Indian Oil Axis | `Indian Oil Axis Bank Credit Card` | `indian-oil-axis` |
| IndusInd Legend | `IndusInd Bank Legend Credit Card` | `indusind-legend` |
| IndusInd Nexxt | `IndusInd Bank Nexxt Credit Card` | `indusind-nexxt` |
| OneCard | `OneCard Credit Card` | `onecard` |
| SBI PULSE | `SBI Card PULSE` | `sbi-card-pulse` |
| SBI SimplySAVE | `SBI SimplySAVE` | `sbi-simplysave` |

Separately, **13 SEED cards also carry a UUID/spelling duplicate** — those UUID rows are
the bucket-B rows above (e.g. `hdfc-infinia` + `hdfc-infinia-metal`, `axis-flipkart` +
`flipkart-axis`), so the same physical card exists up to **three** ways (SEED slug row +
UUID dup + the SEED entry itself).

---

## Judgment calls & flags (review before acting)

1. **`amex-gold-charge` → MERGE `amex-gold`** — judgment, not a name match (see B).
2. **`au-zenith-plus` → PROMOTE (kept distinct)** — SEED `au-zenith` may actually
   describe the Zenith+ SKU (sourcing doc flagged this). Left distinct to avoid
   destroying a real card; resolve `au-zenith` vs Zenith+ before reseed.
3. **`tata-neu-infinity-rupay` → PROMOTE (kept distinct)** — RuPay network variant of
   SEED `tata-neu-infinity-hdfc`; could be MERGE. Your call.
4. **`indigo-hdfc-6e-rewards` (non-XL) → PROMOTE** — genuinely distinct from SEED's
   `indigo-hdfc-6e-rewards-xl` (base vs XL).
5. **`sbi-elite-advantage` / `sbi-prime-business` → PROMOTE** — distinct products, not
   the SEED `sbi-elite` / the base SBI PRIME.
6. **Discontinued Club Vistara / Vistara-Signature cards** (5 rows) — real but the
   Vistara programme merged into Air India; source status before promoting.

---

---

## Re-export for authoring the PROMOTE list (read-only)

The 7-column export was enough to **bucket** but not to **author** SEED entries. Good
news from the schema (`supabase/migrations/001_initial.sql` `create table cards`):
**every field the `CreditCard` type strictly REQUIRES already exists as a column** — so
a full-column export lets you author a complete, type-valid SEED entry. Export these:

```sql
-- Full authoring dump. Add `where ...` (below) to limit to the PROMOTE set.
select
  id, slug, name, bank, category, tier,
  joining_fee_inr, annual_fee_inr, fee_waiver_spend_inr,
  min_income_inr_monthly, min_age, credit_score_min,
  reward_currency, base_reward_rate, category_rewards, milestones,
  welcome_benefit_inr, welcome_benefit_description,
  lounges, forex_markup_percent, fuel_surcharge_waiver, fuel_surcharge_cap_monthly,
  redemption_options, jsonb_typeof(redemption_options) as ro_type,
  insurance_inr, golf, movie_offers,
  color, card_image_url, bank_logo_url, apply_url, apply_url_affiliate,
  devaluations, best_for, highlights, drawbacks, expert_rating,
  active, last_verified, data_source, created_at, updated_at
from cards
order by slug nulls last, id;
```

To get **only the 107 PROMOTE rows**, append (SEED-matched + MERGE ids excluded):

```sql
-- ...same select... from cards
where slug is null
   or slug not in ( /* paste the 51 SEED slugs from bucket C */ )
order by slug nulls last, id;
-- (the 14 MERGE rows in §B share a SEED name; drop them by id after export if present)
```

### Fields SEED carries that the table has NO column for
The export cannot supply these — fill them separately when authoring:

| SEED field | Where it actually comes from | Needed to author? |
|---|---|---|
| `apr_percent` | `APR_MAP` in `seed-cards.ts` (per-bank convention, patched after load) | Optional — set from the bank's APR row, not the export |
| `eligible_employment[]` | `APR_MAP` (same patch) | Optional — same |
| `interest_free_days` | `APR_MAP` (same patch) | Optional — same |
| `cash_withdrawal_fee_percent` | not stored anywhere; issuer MITC | Optional |
| `user_rating`, `user_review_count` | runtime user data | No — never authored |

**So: no REQUIRED SEED field is missing from the table** — the four/six above are all
optional (and the APR trio is applied by the existing `APR_MAP` patch by bank, so you
don't hand-enter them per card).

### ⚠ "Column exists" ≠ "value is usable"
The bucket-A/B rows are the UUID/slugless ingestion family, where (from this export)
**`reward_currency` is the default `'points'` on 124/172 rows** and
`base_reward_rate` / `category_rewards` / `redemption_options` are largely
placeholder/default. Per the sourcing rule, the **reward economics of every PROMOTE card
must still be sourced from the issuer** — the export gives you the reliable *scaffold*
(name, bank, tier, fees, apply_url) but not trustworthy earn/redemption values. Treat
exported reward fields as hints to verify, never as ground truth.

---

*Audit complete. 172/172 rows bucketed (one row lost at export, not recovered).
No source files, DB, or SQL touched.*
