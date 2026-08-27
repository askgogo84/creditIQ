# Catalogue Reconciliation — 2026-08-26

**Scope:** report + draft only. No source files edited, no SQL executed, no DB writes, no commits.
**Author context:** follows the getAllCards / two-catalogue split established in `docs/OVERRIDE-AUDIT-2026-08-25.md`.

Supabase facts are taken as **given** from the task brief (project ref `yazpphublutdodahfwvr`, 173 rows, 129 distinct slugs, 44 slugless, 26 empty redemption_options, 67 double-encoded-string redemption_options, 106 proper arrays, mixed UUID/slug ids, Infinia-Metal duplicated across a UUID row and `hdfc-infinia`, plain HDFC Infinia absent). **I did not re-query the DB** (hard rule: no SQL execution). Where a claim needs a live row I say so.

---

# PHASE 0 — CATALOGUE IDENTITY (report only)

## 0.1 — Which card does the `hdfc-infinia` entry actually describe?

The entry (`lib/data/seed-cards.ts:9-62`): id `hdfc-infinia`, **display name "HDFC Infinia Metal Edition"**, and the data:

| Field | Seed value (`:11-47`) |
|---|---|
| Joining / annual fee | ₹12,500 / ₹12,500 |
| Fee-waiver spend | ₹10,00,000 |
| Base earn | 3.33% (5 RP per ₹150) |
| SmartBuy | 10X, cap **15,000 RP/mo** |
| Lounge | Unlimited Priority Pass (self + guest) |
| Insurance | ₹3 crore |
| Golf | 12 rounds/yr |
| Forex | 2% |
| Min income | ₹2.5L/mo |

**Verdict: the data describes the CURRENT metal card — i.e. the name is right, the id is a legacy slug.** The two real cards:

- **HDFC Infinia "Metal Edition"** (current, relaunched ~2023 as a metal card): fee ₹12,500+GST, 5 RP/₹150 (3.33%), 10X SmartBuy capped **15,000 RP/mo**, unlimited Priority Pass, ₹3cr air-accident cover, golf, ₹10L fee-waiver. **Every field in the seed entry matches this card.**
- **HDFC Infinia (original non-Metal)** — the pre-2023 invite-only predecessor, now closed to new applicants. Broadly similar fee/earn, so the numbers do not by themselves disambiguate, but the "Metal Edition" name and the 15,000 RP/mo SmartBuy cap (a post-relaunch figure) point squarely at the **Metal Edition**.

**So:** the id `hdfc-infinia` (looks like "base card") is a misleading slug over data that is actually the **Metal Edition**. There is effectively one live Infinia product today (Metal); a genuinely distinct "base non-Metal Infinia" is a discontinued predecessor, not a second live SKU. Note the id-space collision this creates: `CARD_POINT_VALUES` carries a **separate** id `hdfc-infinia-metal` (`lib/data/point-values.ts:175`) for the same physical card, and per the brief the Supabase table has BOTH a UUID row and an `hdfc-infinia` slug row for it. **One physical card, three id spellings** (`hdfc-infinia`, `hdfc-infinia-metal`, a Supabase UUID). ⚠ *All fee/earn specifics above are stated from domain knowledge and are flagged for hard primary-source verification in Phase 2 (`hdfc-infinia` is card #1 there).*

## 0.2 — Are plain HDFC Infinia / plain HDFC Regalia / plain Axis Magnus absent from the 49 live SEED_CARDS?

Checked against the full 49-entry live list (base array 19 + `MORE_CARDS` 30).

| "Plain" card | Present in the 49? | What exists instead |
|---|---|---|
| **HDFC Infinia** (base, non-Metal) | **Absent** as a distinct entry | only `hdfc-infinia` named "HDFC Infinia **Metal Edition**" (`:9`) |
| **HDFC Regalia** (base, non-Gold) | **Absent** | only `hdfc-regalia-gold` "HDFC Regalia **Gold**" (`:64`) |
| **Axis Magnus** (base, non-Burgundy) | **Absent** | only `axis-magnus-burgundy` "Axis Magnus **for Burgundy**" (`:250`) |

**Confirmed: all three plain variants are absent from the live catalogue.** In each case only the premium/variant SKU is present. (The affiliate map `lib/affiliate.ts` *does* carry keys `hdfc-regalia`, `axis-magnus` at `:8`, `:27` — apply links only, not catalogue entries — so an apply link would resolve but no card page/detail exists.) These three plain cards are on the Phase 2 NEW-cards list.

## 0.3 — The four 404 slugs: what links to them?

Card detail pages come only from `SEED_CARDS` (`app/(shell)/card/[slug]/page.tsx` `generateStaticParams`), and the sitemap emits only `SEED_CARDS.map(card => /card/${card.id})` (`app/sitemap.ts:55-57`). So **none of the four are in the sitemap**, and any internal link to them would have to be a hardcoded href. The apply route (`app/api/apply/[cardId]/route.ts:8-11`) redirects unknown ids to `/` (does not 404).

| 404 slug | In SEED_CARDS? | Internal reference(s) found | Link source verdict |
|---|---|---|---|
| **indigo-hdfc-6e-rewards-xl** | No | **None** anywhere in the repo. (Seed has `kotak-indigo-6e` at `:1458` — a *different* slug, and it's inside the dead `NEW_CARDS` block > `:853`, so not even live.) | **External only** — no internal href, not in sitemap, not in affiliate map. Likely a search-engine-indexed or hand-typed URL, or a Supabase-originated slug. |
| **idfc-first-swyp** | No | `lib/affiliate.ts:64` (AFFILIATE_LINKS key → external `bitli.in/ugti2xb`); `.claude/agents/website-builder.md:33` (agent note) | **No internal card-page link.** The affiliate key only produces an *external* apply URL and only when a card with that id/slug/name already exists — no such card does. So the /card 404 is **external only**; the affiliate entry is an orphan key. |
| **sbi-prime-business** | No | **None.** (Affiliate map has `sbi-prime` at `:55`, not `sbi-prime-business`.) | **External only.** |
| **hdfc-infinia-metal** | No (seed uses `hdfc-infinia`) | `lib/data/point-values.ts:175` (point-values **id**, not a link); docs only | **External only** as a /card URL. It is a real *point-values* id and (per brief) a Supabase UUID-duplicate spelling of the flagship — so a Supabase-fed surface rendering `/card/hdfc-infinia-metal` would 404 against the SEED-only static params. Not linked from any repo href. |

**Summary:** none of the four are linked from the sitemap or from any internal `<a href>`/card list in the repo. `idfc-first-swyp` and `hdfc-infinia-metal` exist as *non-link* references (affiliate key; point-values id). All four 404s are therefore driven by **external URLs and/or Supabase-originated slugs**, not by the code's own link graph. The one actionable internal smell is the **orphan affiliate key `idfc-first-swyp`** and the **`hdfc-infinia-metal` id fragmentation** (same card, three ids).

*Phase 0 complete. Phase 1 below.*

---

# PHASE 1 — RECONCILE THE TWO STORES (report + draft)

## 1.1 — Side-by-side inventory: SEED_CARDS vs Supabase

### The SEED axis — all 49 live ids (canonical id === slug)

**HDFC (10):** hdfc-infinia, hdfc-regalia-gold, hdfc-millennia, hdfc-diners-black, hdfc-marriott-bonvoy, tata-neu-infinity-hdfc, tata-neu-plus-hdfc, hdfc-moneyback-plus, hdfc-swiggy, hdfc-freedom
**SBI (5):** sbi-cashback, sbi-elite, sbi-simplyclick, sbi-bpcl-octane, sbi-air-india-signature
**ICICI (5):** icici-amazon-pay, icici-sapphiro, icici-emeralde, icici-coral, icici-rubyx
**Axis (7):** axis-magnus-burgundy, axis-atlas, axis-flipkart, axis-ace, axis-vistara-infinite, axis-myzone, axis-horizon
**AmEx (3):** amex-platinum-travel, amex-gold, amex-mrcc
**IDFC (3):** idfc-first-wealth, idfc-first-select, idfc-first-classic
**Kotak (3):** kotak-811-dream, kotak-league-platinum, kotak-royale-signature
**RBL (2):** rbl-shoprite, rbl-popcorn
**Yes (2):** yes-marquee, yes-first-preferred
**SC (3):** sc-ultimate, sc-smart, sc-digismart
**AU (3):** au-altura-plus, au-zenith, au-lit
**IndusInd (3):** indusind-pinnacle, indusind-celesta, indusind-iconia

### ⚠ Constraint on the Supabase axis — honest limitation

**A true row-by-row side-by-side requires dumping all 173 Supabase rows, which I cannot do under the hard rule "Do NOT execute any SQL" (a SELECT is SQL execution).** The brief gives only aggregates (173 rows / 129 distinct slugs / 44 slugless / value divergences). Therefore the three lists below are reconstructed from the seed axis + the brief's aggregates, and the field-level "in both" diffs are populated only where the brief names a concrete value. **The exact membership of each list must be confirmed by the read query in §1.6.** I will not fabricate a row list I cannot see.

### Three lists (as far as the constraints allow)

**(A) In both stores** — the 49 seed ids **should** each have a Supabase counterpart by slug (129 distinct Supabase slugs ⊇ the 49 seed slugs is *likely* but unconfirmed). Known field-level disagreements for "in both":

| Card | Field | SEED value | Supabase value (per brief) | Severity |
|---|---|---|---|---|
| axis-magnus-burgundy | KrisFlyer transfer | present, 5:4 ratio, **₹2.20/pt** | **no KrisFlyer entry at all**; only ₹1.00 travel | high — different redemption story per surface |
| hdfc-infinia (Metal) | id / row identity | single `hdfc-infinia` row | **duplicated**: a UUID row **and** an `hdfc-infinia` slug row; plain "HDFC Infinia" absent | high — dup + id fragmentation |
| *(all others)* | name, bank, reward_currency, earn rates, redemption values | *known-divergent in aggregate ("diverge badly"), but not enumerable without the dump* | — | unknown per-field until §1.6 |

**(B) Seed-only** (in SEED, expected missing/mismatched in Supabase): cannot be enumerated precisely without the dump. Candidates flagged by the brief: any seed card whose slug is among the 44 **slugless** Supabase rows (those rows can't match by slug), and cards represented in Supabase only under a UUID id. **Method to derive:** `seed_slugs − supabase_slugs`.

**(C) Supabase-only** — Supabase has **129 distinct slugs vs 49 seed slugs → ≈80 slugs exist only in Supabase**, plus **44 slugless rows** and UUID-id rows. These are cards the app's rendered surfaces (SEED-fed) cannot show but the AI surfaces (Supabase-fed) can "see" — the inverse of the Axis-Atlas symptom. **Method to derive:** `supabase_slugs − seed_slugs`, plus all 44 slugless rows, plus all UUID-id rows whose slug is null.

**Net:** the stores are not a superset/subset relationship — they overlap partially and each holds cards the other lacks. This is the structural root of every "the AI knows a card the page doesn't" and "the page shows a card the AI can't find" defect.

## 1.2 — Triage of the 44 slugless Supabase rows

**I cannot see the 44 rows' contents (no SQL).** Per the hard rule I **delete nothing** and mark none for deletion. What I can give is the decision framework to apply once the rows are dumped (§1.6), and the safe default (KEEP-pending-inspection for all 44):

| Bucket | Criteria | Action |
|---|---|---|
| **MERGE** | Row's `name`+`bank` matches an existing slugged row (or a seed card) → it is a duplicate that lost its slug (the Infinia-Metal UUID dup is exactly this class) | Backfill slug from the canonical entry, copy any richer fields, then fold into the canonical row. **No delete** — mark for merge only. |
| **KEEP** | Row has a real, unique card (name+bank not represented elsewhere) but simply never got a slug | Backfill `slug = normalize(name)`; keep as its own row. |
| **DELETE (proposed only, commented out)** | Row is empty/test junk: null/blank name AND empty redemption_options AND no distinguishing fields | List the id in the DRAFT migration as a **commented-out** DELETE with the id enumerated; never executed here. |

**Default applied now: all 44 → KEEP-pending-inspection.** The 26 rows with empty `redemption_options` overlap this set and are the most likely DELETE/MERGE candidates, but "empty redemption_options" alone is **not** grounds for deletion (a valid cashback card legitimately has one option, and a mis-typed row can have a full card minus redemptions). Triage requires the row bodies.

## 1.3 — The 67 double-encoded rows: live bug or latent?

**Yes, runtime paths consume Supabase `redemption_options`.** Two Supabase-fed consumers (both reached via `getAllCards()`):

1. **`lib/rag.ts` `cardToText`** (`:33` guard, `:38` `.map`) — via `parseField` (`:8-12`). Feeds **all 6 AI routes** (assistant, travel-ai, optimize, card-switch, card-roast, spend-optimizer).
2. **`app/api/optimize/route.ts:31`** — `JSON.stringify(card.redemption_options || [])` straight into the LLM prompt.

Non-Supabase consumers (SEED-fed today, so safe now but latent landmines — **none use `parseField`, they call `.map`/`.length` raw**): `lib/engine.ts:142-143`, `lib/redemption.ts:214`, `components/marketing/landing/ProductTabs.tsx:244`, `app/(shell)/card/[slug]/CardDetailClient.tsx:251`.

**What happens when the value is a string, path by path:**

- **`parseField` (rag.ts:8-12):** `if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }`.
  - **Single-encoded** string `'[{...}]'` → `JSON.parse` → **array** → silently recovered, **works** (parseField masks the encoding defect).
  - **Genuinely double-encoded** string `'"[{...}]"'` → `JSON.parse` → **another string** `'[{...}]'`. The guard `parseField(...)?.length > 0` (rag.ts:33) is **TRUE** for a non-empty string (`.length` = char count — the guard does NOT catch this), then `parseField(...).map(...)` (rag.ts:38) calls `.map` on a **string → TypeError thrown**.
- **Blast radius of the throw:** `retrieveRelevantCards` scores by calling `cardToText(card)` on **every card in `allCards`** (rag.ts:245-247), not just the top-K. So **one** genuinely-double-encoded row anywhere in the 173 makes `cardToText` throw during scoring → `retrieveRelevantCards` throws → the AI route's `catch` returns **HTTP 500**. That is a **total outage of all 6 AI surfaces on every request, independent of the user's query.**
- **`optimize/route.ts:31`:** `JSON.stringify` never throws on a string — it just re-quotes it — so the LLM silently receives `"\"[{...}]\""` gibberish instead of structured options. **Silent data corruption, not a crash.** (In practice optimize 500s earlier at its `retrieveRelevantCards` call if any row is truly double-encoded.)
- **`engine.ts:143` / `redemption.ts:214` / `ProductTabs:244`:** raw `.map`/`.length` with no parse — would **throw** on any string, single or double — but are **SEED-fed today**, so latent. They become live the moment anything runs the engine over `getAllCards()` output.

**Verdict — live vs latent hinges on the encoding depth, which I cannot confirm without reading a row:**
- If the 67 rows are **singly** encoded (one `JSON.parse` → array): **benign for the AI** (parseField recovers them) but **silently corrupts** the `optimize` LLM prompt, and remains a landmine for the four raw consumers.
- If **truly double** encoded (one `JSON.parse` → string): **LIVE, total, query-independent 500 across all 6 AI routes** — the single most severe issue in this whole reconciliation.

**One read settles it** (run manually — I did not execute it):
```sql
select id, jsonb_typeof(redemption_options) as t, left(redemption_options::text, 60)
from cards
where jsonb_typeof(redemption_options) = 'string'
limit 5;
```
If the sampled text still starts with a quote after one cast, it is double-encoded and the AI routes are down.

## 1.4 — Target architecture recommendation

| | **(a) SEED canonical, Supabase rebuilt by a seeder** | **(b) Supabase canonical, seed-cards.ts retired** |
|---|---|---|
| Source of truth | `lib/data/seed-cards.ts` (49, `id===slug`, gated, reviewed in PRs) | Supabase `cards` table |
| How the other side is filled | `scripts/seed.ts` re-seeds Supabase from SEED on each change (truncate+insert) | ~35 UI files rewritten to fetch from Supabase (async, loaders, caching) |
| What breaks | Supabase-only cards (≈80 slugs + 44 slugless) that aren't in SEED get **dropped** unless first promoted into SEED → **must audit/merge the extras before any truncate** | Every static/SSG surface (`generateStaticParams`, sitemap, landing compute) becomes async/dynamic; loses build-time guarantees; the current data-integrity gates (`validate-card-links`, catalogue-stats test) that key off SEED stop protecting prod |
| Data quality | High and reviewable — but only 49 cards; catalogue growth needs code edits | Larger catalogue — but currently 173 dirty rows (dupes, slugless, double-encoded, divergent values); quality is the problem being fixed |
| Consistency win | One store; the two-catalogue split **disappears**; every surface reads the same 49 | One store; but the *dirty* store, so a big clean-up + a write/QA workflow must be built first |
| Rough effort | **Low–Medium.** Reconcile ≈80 extra Supabase cards into SEED (the real work), fix the seeder to write ALL fields incl. `redemption_options` as proper jsonb, run once, then point `getAllCards` at the rebuilt table (or short-circuit to SEED). | **High.** De-dup 173→~one-per-card, backfill 44 slugs, normalize 67 encodings, add an editorial write path + gates, then refactor ~35 files off the SEED import. |

### Recommendation: **(a) — SEED canonical, Supabase rebuilt from it.**

Justification: (1) it matches the standing project rule that **SEED_CARDS is canonical and the Supabase table is unreliable**; (2) it removes the two-catalogue split immediately by making one store a pure projection of the other, killing the entire class of "AI vs page" defects (Axis Atlas, Magnus divergence, the 404s); (3) it is the lower-effort, lower-risk path — the only substantive work is a one-time reconcile of the Supabase-only cards into SEED **before** any rebuild (so no live card is dropped), which is exactly what Phase 2's sourcing pass produces; (4) it keeps the build-time integrity gates that already guard prod. The cost — a 49-card catalogue that grows via code — is acceptable for a founder-reviewed fintech catalogue where **"nothing invented ships"** and each card should be PR-reviewed anyway. Path (b) optimises for catalogue size at the price of building a whole cleaning + editorial-write + QA apparatus around a store the team already declared untrustworthy.

**Immediate corollary for the double-encoding bug (§1.3):** under (a) the fixed seeder writes `redemption_options` as native jsonb arrays, so the 67-row defect cannot recur — the DRAFT normalization in §1.5 is the *interim* fix for the current table until the rebuild lands.

## 1.5 — DRAFT migration

Written to **`supabase/migrations/DRAFT_catalogue_reconciliation.sql`** — prefixed `DRAFT_` so the migration runner (which expects `NNN_name.sql`) will not pick it up. It normalizes the string-encoded `redemption_options` to jsonb arrays, lists all DELETEs **commented out**, and includes a rollback section. **It was NOT executed and NOT added to any sequence.** See §1.6 for the two SELECTs needed to fill in the row-id lists it leaves as placeholders.

## 1.6 — The three read-only queries needed to complete Phase 1 (not executed)

```sql
-- 1) Full row dump for the side-by-side (§1.1):
select id, slug, name, bank, reward_currency, annual_fee_inr,
       jsonb_typeof(redemption_options) as redemp_type, redemption_options
from cards order by slug nulls last, id;

-- 2) The 44 slugless rows for triage (§1.2):
select id, name, bank, reward_currency, redemption_options
from cards where slug is null order by name nulls last;

-- 3) Encoding-depth probe for the 67 rows (§1.3):
select id, jsonb_typeof(redemption_options) as t, left(redemption_options::text, 80)
from cards where jsonb_typeof(redemption_options) = 'string';
```

---

## ⏸ PHASE 1 RECOMMENDATION — STATED CLEARLY

**Adopt architecture (a): keep `lib/data/seed-cards.ts` as the single canonical catalogue and rebuild the Supabase `cards` table from it via a corrected seeder (writing every field, `redemption_options` as native jsonb).** First reconcile the ≈80 Supabase-only slugs + 44 slugless rows **into** SEED (delete nothing until each is classified keep/merge), so the rebuild drops no live card. This collapses the two-catalogue split that causes the Axis-Atlas / Magnus / 404 defects, is the lower-risk and lower-effort option, and preserves the existing build-time gates.

**Most urgent single item surfaced:** the **67 double-encoded `redemption_options` rows** may be a **live, total 500 outage of all 6 AI routes** (not latent) — because `retrieveRelevantCards` runs `cardToText` over *every* row during scoring and `.map()` on a string throws. Confirm depth with the §1.6 probe **before** anything else; if truly double-encoded, the interim jsonb normalization in the DRAFT migration is the immediate mitigation.

*Phase 1 complete. Proceeding to Phase 2 (card sourcing) — results stream to `docs/CARD-SOURCING-2026-08-26.md`.*

