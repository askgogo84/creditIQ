# Override Audit — seed-cards.ts redemption_options

**Date:** 2026-08-25 · **Scope:** read-only investigation, no code changed.
**Trigger:** live cards price KrisFlyer above published ceilings (hdfc-infinia & hdfc-diners-black at ₹1.80 vs a ₹1.00 issuer ceiling); is the ceiling gate covering seed-cards, and what does a user actually see?

---

## Q1 — Does the prebuild ceiling gate read `lib/data/seed-cards.ts`?

**No. The gate does not cover `seed-cards.ts` at all.** It is running, and it passes — because it only ever inspects a *different* file.

### The gate itself
- File: **`scripts/validate-point-values.ts`**
- Ceiling check: **check #5, lines 121-126** — `pointValueCeilingPaise(c) > issuerCeilingPaise(c)` → build fails.
- Data source: it imports **`CARD_POINT_VALUES` from `lib/data/point-values.ts`** (lines 28-35). Its only `readFileSync` reads **`lib/data/point-values.ts`** (`FILE`, line 37; used at line 130 for the dead-array check).
- Wiring: `package.json` → `prebuild` → `check:point-values` (confirmed running).

### Why the ₹1.80 values slip through
1. **The gate never imports or reads `seed-cards.ts`.** The ₹1.80 KrisFlyer figures live in `CreditCard.redemption_options` (a `seed-cards.ts` structure). `validate-point-values.ts` has zero visibility into that structure — it only knows `point-values.ts`'s `CardPointValue.channels`.
2. **Within `point-values.ts`, hdfc-infinia is disciplined:** KrisFlyer/Marriott are carried as a `transferPartnerUnknown` channel with `value_paise: null` (point-values.ts:168), *precisely so no rupee value exceeds the ₹1.00 issuer ceiling* (see the module note, point-values.ts:43-47). So check #5 has nothing to fire on — the over-ceiling value simply isn't in the file it guards.
3. **No other prebuild gate covers it.** `prebuild` runs `check:card-links`, `check:transfer-graph`, `check:point-values`, `check:airports`. `validate-card-links.ts` *does* import `SEED_CARDS` — but only validates card LINKS and dead arrays (no `redemption_options` / `value_per_point_inr` checks). **Nothing anywhere validates `seed-cards.ts` redemption values against a ceiling.**

**Verdict:** it is *"covered elsewhere and passing"*, not *"covered here and broken."* `point-values.ts` is gated and honest; `seed-cards.ts`'s per-card `redemption_options` are an entirely un-gated parallel data path. The two were never reconciled.

---

## Q2 — User-facing surfaces that render the seven flagged values

### The four cards and their offending values (all LIVE, in `SEED_CARDS`)

| Card | id | line | Flagged option(s) | Breach |
|---|---|---|---|---|
| HDFC Infinia | hdfc-infinia | 38 | KrisFlyer (1:1) **₹1.80**, Marriott (1:1) ₹1.30 | > ₹1.00 issuer max; KF > ₹1.60 |
| HDFC Diners Club Black | hdfc-diners-black | 655 | KrisFlyer (1:1) **₹1.80**, Marriott (1:1) ₹1.30 | > ₹1.00 issuer max; KF > ₹1.60 |
| Axis Magnus Burgundy | axis-magnus-burgundy | 273 | KrisFlyer **(5:4) ₹2.20**, Marriott (5:4) ₹1.60 | KF > ₹1.60 ceiling; **stale 5:4 ratio (graph=5:2)**; correct value ≈ ₹0.64 |
| Axis Vistara Infinite | axis-vistara-infinite | 728 | KrisFlyer (1:1) **₹1.80** | KF > ₹1.60 ceiling |

### Surface map (what renders each card's values)

| Surface | Route / file | Public? | What it shows | Cards affected |
|---|---|---|---|---|
| **A. Card detail** | `/card/[slug]` — `CardDetailClient.tsx:251-276` | (shell) | "Redemption Paths" table: every option's `Rs.{value.toFixed(2)}` per point, sorted desc, **top value highlighted copper as #1 "best"**. Also computes annual value (line 38, `calculateAnnualValue`) whose points→₹ uses `bestRedemptionValue` = max option value. | **all 4** (each has a detail page) |
| **B. Optimize** | `/optimize` — `optimize/page.tsx` | (shell) | `optimizeRedemption()`: each path shows `Rs.{value}/pt` (line 331) and `points × value` (line 336); headline **"Best redemption" green figure** = points × top value (line 250) + "Gap" leverage number. Any card selectable via dropdown (default hdfc-regalia-gold). | **all 4** (selectable) |
| **C. Landing §03 "Where points go"** | `/` — `app/page.tsx:100-119` | **PUBLIC / crawlable** | `REDEEM_CARD` is **hardcoded to hdfc-infinia**. `hi = 150,000 × ₹1.80 (KrisFlyer) = ₹2,70,000`; `floor = 150,000 × ₹0.50 = ₹75,000`. **The flagship "₹2,70,000 vs ₹75,000" marketing split is exactly the over-ceiling ₹1.80 value.** | **hdfc-infinia** |
| **D. Landing "Fly on Points"** | `/` — `ProductTabs.tsx:95,113-142` | **PUBLIC / crawlable** | `FLY_CARD_IDS = ['hdfc-infinia','axis-atlas','amex-platinum-travel','axis-magnus-burgundy']`. Renders each card's transfer options ranked by ₹/point ("what a point is worth if you transfer it") — surfacing KrisFlyer **₹1.80 (Infinia)** and **₹2.20 (Magnus)**. | **hdfc-infinia, axis-magnus-burgundy** |

### Per-card exposure

| Card | A card detail | B optimize | C landing §03 | D fly-on-points | Public exposure? |
|---|---|---|---|---|---|
| hdfc-infinia | ✅ | ✅ | ✅ (₹2.70L headline) | ✅ (₹1.80) | **YES — both public landing surfaces** |
| axis-magnus-burgundy | ✅ | ✅ | — | ✅ (₹2.20) | **YES — landing fly-on-points** |
| hdfc-diners-black | ✅ | ✅ | — | — | signed-in only |
| axis-vistara-infinite | ✅ | ✅ | — | — | signed-in only |

### Not user-facing (context/AI only, listed for completeness)
- `app/api/optimize/route.ts:31` and `app/api/claude/redemption/route.ts` — feed the AI advisor prompt (JSON of `redemption_options`).
- `lib/rag.ts:38` — AI retrieval context.
- `app/api/admin/*` — admin enrichment/approval, not consumer-facing.

---

## Headline risk

The single most-exposed value is **hdfc-infinia KrisFlyer ₹1.80**: it is the source of the **public, crawlable "₹2,70,000" landing headline** (surface C) *and* appears in the public Fly-on-Points panel (D) *and* both signed-in surfaces (A, B). It exceeds both HDFC's own ₹1.00 issuer ceiling and the ₹1.60 KrisFlyer verified ceiling. **axis-magnus-burgundy ₹2.20** is worse in magnitude and additionally carries the stale 5:4 ratio (graph is 5:2; correct value ≈ ₹0.64), and is public via surface D.

**Structural note:** because all 49 live cards carry their own `redemption_options`, `redemption.ts` defaults are never reached for catalogue cards — so the EDGE 5:2 fix committed in `redemption.ts` (commit e251d5a4) does **not** correct any of these four. The fix has to land in the `seed-cards.ts` per-card blocks, and the ceiling gate should be extended to read `seed-cards.ts` (or the two data paths reconciled) so this class can't regress silently.

---

# Addendum — 2026-08-26 · CIRA "I don't have the Axis Atlas card in my database"

**Trigger:** CIRA on `/travel` said it doesn't have Axis Atlas, yet `axis-atlas` is live in `lib/data/seed-cards.ts:293` (block), redemption at `:318`. Read-only, nothing changed.

## Q1 — How CIRA builds its card list (and it is NOT SEED_CARDS)

**CIRA on `/travel` calls `/api/travel-ai`** (`app/(shell)/(travelgrp)/travel/page.tsx:80`), NOT `/api/assistant`. Both routes build their card context identically:

- `app/api/travel-ai/route.ts:187` → `retrieveRelevantCards(message, { topK: 6, intent: 'travel' })`
- `retrieveRelevantCards` (`lib/rag.ts:236`) → `getAllCards()` (`lib/rag.ts:241`)
- **`getAllCards()` (`lib/supabase.ts:12-22`) reads the live Supabase `cards` table first.** It returns `SEED_CARDS` **only** as a fallback: no client (`:15`), or query error / **zero rows** (`:17`), or a thrown exception (`:20`). With prod Supabase env vars set and the table populated, **SEED_CARDS is never used** — CIRA's "database" is the Supabase `cards` table, not `seed-cards.ts`.

So `axis-atlas` existing at `seed-cards.ts:293` is **irrelevant to CIRA at runtime.** Per the standing memory *"SEED_CARDS is canonical / the Supabase cards table is unreliable (173 rows, dupes, null slugs, UUID ids)"* — CIRA is reading exactly the unreliable path.

**Cannot verify from code:** whether `axis-atlas` is absent from the live `cards` table, or present under a divergent name/slug. That requires a query against ref `yazpphublutdodahfwvr` (`select id, slug, name from cards where name ilike '%atlas%'`). Both outcomes are consistent with the symptom (see Q2).

## Q2 — Why "Axis Atlas" failed to match — DIFFERENT mechanism from the allowlist defect

The "I don't have the card" message is the **Haiku model** obeying rule 1 (`lib/rag.ts:285`, *"NEVER recommend a card not in the database above"*) because Atlas was not in the CARD DATABASE block it was handed. Two code-level causes, both upstream of any name-matching:

1. **Presence:** if `axis-atlas` is missing from (or mis-named in) the Supabase `cards` table, it never enters `allCards` (`lib/rag.ts:241`), never gets scored, never reaches context.
2. **Retrieval cutoff:** even if present, context is capped at **`topK: 6`** (`route.ts:189`; `.slice(0, topK)` at `lib/rag.ts:260`). Scoring (`:245-259`) is keyword + intent + `expert_rating×2`. If six other travel cards outscore Atlas for that query, Atlas is dropped from context and the model truthfully says "not in my database."

**This is NOT the `card_name_allowlist` display-name defect.** That defect lives at `edgeApplies()` (`lib/rag.ts:184-188`): a card that IS in context still loses a transfer **edge** when its `card.name` (from the Supabase row) doesn't `normId`-match a hardcoded allowlist literal (`transfer-graph.ts:95` = `['HDFC Infinia Metal Edition','HDFC Diners Club Black']`). Note the SEED names *do* match those literals exactly (`seed-cards.ts:11`, `:632`) — so the allowlist defect only bites when the **Supabase** row name diverges from the literal.

- **Allowlist defect** = card present, transfer **edge silently dropped** by a `normId` name mismatch (`edgeApplies`).
- **Atlas failure** = card **absent from the retrieved set entirely** (DB presence or `topK` cutoff) — no name-matching involved.

**Shared root cause:** both are downstream of `getAllCards()` sourcing the unreliable Supabase `cards` table instead of the canonical `SEED_CARDS`. Different failure points, same origin.

## Q3 — Live cards whose `redemption_options` omit a partner the graph says their currency can reach

Graph edges (`lib/data/transfer-graph.ts`) and the (bank, reward_currency)→from_currency map (`lib/rag.ts:166-174`):

| from_currency | reaches | ratio | scope |
|---|---|---|---|
| `axis_edge` | Singapore KrisFlyer | 5:2 | all Axis `edge` |
| `axis_edge` | Air India | 1:1 | all Axis `edge` |
| `axis_miles` | Singapore KrisFlyer | 1:1 | all Axis `miles` |
| `hdfc_reward_points` | Singapore KrisFlyer | 1:1 | **allowlist: Infinia Metal Edition, Diners Club Black only** |
| `amex_membership_rewards` | British Airways Avios | 1:1 | all AmEx `membership-rewards` |

Cross-referencing every **live** card (main `SEED_CARDS` array + `MORE_CARDS`; the `NEW_CARDS` block at `seed-cards.ts:853+` is declared-but-never-pushed = dead, `:842`):

| Card | id | line | from_currency | Graph reaches | In redemption_options? | **OMITS** |
|---|---|---|---|---|---|---|
| Axis Atlas | axis-atlas | 318 | axis_miles | Singapore KrisFlyer (1:1) | ✗ (Marriott, Air India, Travel Edge) | **KrisFlyer** |
| Axis Magnus for Burgundy | axis-magnus-burgundy | 273 | axis_edge | KrisFlyer + Air India | KrisFlyer ✓, Air India ✗ | **Air India** |
| Axis Horizon | axis-horizon | 768 | axis_edge | KrisFlyer + Air India | ✗ both (Travel Edge, cashback) | **KrisFlyer + Air India** |
| Amex Platinum Travel | amex-platinum-travel | 385 | amex_membership_rewards | BA Avios (1:1) | ✗ (Marriott, Taj, cashback) | **BA Avios** |
| Amex Gold | amex-gold | 734 | amex_membership_rewards | BA Avios (1:1) | ✗ (Marriott, Taj) | **BA Avios** |
| Amex MRCC | amex-mrcc | 735 | amex_membership_rewards | BA Avios (1:1) | ✗ (Marriott, cashback) | **BA Avios** |

**No HDFC omissions:** the `hdfc_reward_points → singapore` edge is allowlisted to Infinia Metal Edition + Diners Club Black, and both list KrisFlyer (`seed-cards.ts:41`, `:658`). Non-allowlisted HDFC cards aren't "reachable" per the graph's own card-scoping, so they don't count. `axis-vistara-infinite` (axis_miles) already lists KrisFlyer (`:728`) — no omission. `sbi-air-india-signature` is `miles` but bank SBI → `cardEdgeCurrency` returns `null` (`lib/rag.ts:171`), no edge.

**Important nuance — this omission is a UI/card-detail gap, NOT a CIRA gap.** `formatSourcedForCards` (`lib/rag.ts:208-234`) injects transfer edges into CIRA's SOURCED block **independently of `redemption_options`** — it derives them from `cardEdgeCurrency` + `TRANSFER_EDGES` directly. So *if* Atlas were in CIRA's retrieved context, CIRA would still be told "transfers to singapore at 1:1" via the SOURCED block. The `redemption_options` omission instead starves the **card-detail "Redemption Paths" table and `/optimize`** (surfaces A/B from Q2 above), which render `redemption_options` directly — those show an incomplete partner list for the six cards.

## Q4 — Where "Community insight" text comes from

**Generated by the model, not a hardcoded string.** There is no literal `"Community insight"` anywhere in the codebase (grep: 0 matches in code; the `/travel` page and `FlightSearch.tsx` have no such label). The flow:

- `getIgInsights()` (`lib/rag.ts:74-119`) reads the Supabase **`intelligence_kb`** table (pgvector `match_intelligence` if a query embeds, else recency).
- `formatInsights()` (`lib/rag.ts:131-139`) formats the rows.
- `buildRagSystemPrompt()` wraps them in the **"COMMUNITY INTELLIGENCE — UNTRUSTED THIRD-PARTY DATA"** fenced block (`lib/rag.ts:276-278`), and rule **6c** (`lib/rag.ts:295`) instructs the model to attribute such claims (*"creators report…, not verified by CreditIQ"*).

So any "Community insight" phrasing in CIRA's reply is **Haiku paraphrasing the COMMUNITY block header + rule 6c**, sourced from `intelligence_kb` rows — not a UI constant and not CreditIQ's own verified data.

---

*Addendum (2026-08-26, Q1–Q2 of CIRA follow-up): no files other than this document were created or modified. The original 2026-08-25 audit above is unchanged.*

---

# Addendum 2 — 2026-08-26 · The Supabase-vs-SEED read split (follow-up to the getAllCards finding)

Read-only, nothing changed.

## Q1 — Every caller of `getAllCards()` and every direct `SEED_CARDS`/`MORE_CARDS` importer

### A. `getAllCards()` callers — the Supabase-first path (`lib/supabase.ts:12`)

| Caller | file:line | Surface served |
|---|---|---|
| `getCardNameList()` | `lib/rag.ts:69` | helper — **no runtime caller found (effectively dead)** |
| `retrieveRelevantCards()` | `lib/rag.ts:241` | the RAG retriever — fans out to 6 AI routes (below) |
| Optimize AI | `app/api/optimize/route.ts:16` | `/optimize` AI answer (also calls `retrieveRelevantCards`) |
| Card Switch AI | `app/api/card-switch/route.ts:16` | Card-switch AI recommendation (also calls `retrieveRelevantCards`) |
| Card Roast AI | `app/api/card-roast/route.ts:16` | Card-roast AI (also calls `retrieveRelevantCards`) |

**`retrieveRelevantCards()` consumers** (all therefore Supabase-fed):
`/api/assistant` (CIRA general chat), `/api/travel-ai` (CIRA on /travel), `/api/optimize`, `/api/card-switch`, `/api/card-roast`, `/api/spend-optimizer` (`spend-optimizer/route.ts:43`).

**Also Supabase-first but with NO runtime caller** (only referenced in docs): `getCardBySlug()` (`lib/supabase.ts:24`), `getCardById()` (`lib/supabase.ts:36`). Notably the **card-detail page does NOT use `getCardBySlug`** — it reads `SEED_CARDS` directly (see below). So these three Supabase helpers are dead weight; the only *live* Supabase read is `getAllCards()`.

### B. Direct `SEED_CARDS` importers — the seed-file path (runtime code only; scripts/tests/docs omitted)

**Public / marketing (SSR + landing):**
- `app/page.tsx:12` — landing; `REDEEM_CARD = hdfc-infinia` (`:100`)
- `components/marketing/landing/ProductTabs.tsx:6` — Fly-on-Points + Discover Cards
- `components/marketing/landing/HeroCompute.tsx:6`, `components/marketing/HeroLeak.tsx:5`, `components/Hero.tsx:5`, `app/HomeCardRanks.tsx:4`, `components/marketing/landing/CardRankings.tsx:4` — hero/leak/ranking widgets
- `app/sitemap.ts:2` — per-card sitemap URLs
- `app/about/page.tsx:4`, `app/best-cards/[category]/page.tsx:8`, `app/bank/[slug]/page.tsx:2`, `app/approval-odds/page.tsx:7`, `app/smart-match/page.tsx:8`
- `components/CardCatalog.tsx:4`, `components/DevaluationTicker.tsx:3`, `components/DevaluationAlerts.tsx:4`, `components/ciq/EditorialCards.tsx:4`, `components/CompareTray.tsx:4`

**Signed-in shell:**
- **`app/(shell)/card/[slug]/page.tsx:2`** — **CARD DETAIL page** (`generateStaticParams` + `SEED_CARDS.find`, `:7`/`:11`/`:35`) → this is the page that renders the "Redemption Paths" table (surface A in the original audit)
- `app/(shell)/(cards)/cards/page.tsx:36` — Cards listing (dynamic import)
- `app/(shell)/(cards)/compare/page.tsx:7` — Compare
- `app/(shell)/(cards)/card-switch/page.tsx:7` — Card-switch **page** (picker)
- `app/(shell)/(cards)/card-roast/page.tsx:11` — Card-roast **page** (picker)
- `app/(shell)/(wallet)/dashboard/page.tsx:11` — **Wallet** add-card picker (`:369`)
- `app/(shell)/optimize/page.tsx:8` — Optimize **page** card list (`:22`)
- `app/(shell)/(spend)/spend-optimizer/page.tsx:6` — Spend-optimizer page
- `app/(shell)/banks/page.tsx:1`, `app/(shell)/banks/[bank]/page.tsx:1` — Banks index/detail
- `app/admin/page.tsx:9` — Admin card list

**API / lib:**
- `app/api/cards/route.ts:3` — `/api/cards` endpoint (SEED-backed)
- `app/api/apply/[cardId]/route.ts:2` — affiliate apply redirect
- `lib/transfer-map.ts:33` — transfer-currency resolver (feeds transfer-ladder / travel transfer math), matches by **card NAME**
- `lib/catalogue-stats.ts` / `lib/data/card-art-manifest.ts` — build-time constants (count, art slugs)

`MORE_CARDS` is imported nowhere outside `seed-cards.ts` itself — it is spread into `SEED_CARDS` at `:772` and reaches everyone only through `SEED_CARDS`.

## Q2 — The explicit split: who reads Supabase, who reads seed-cards.ts

| Reads **Supabase `cards`** (via `getAllCards`) | Reads **`seed-cards.ts`** (direct import) |
|---|---|
| CIRA general chat (`/api/assistant`) | Card detail page `/card/[slug]` |
| CIRA travel (`/api/travel-ai`) | Cards listing, Compare, Banks |
| Optimize **AI** (`/api/optimize`) | Optimize **page** (card dropdown) |
| Card Switch **AI** (`/api/card-switch`) | Card Switch **page** (picker) |
| Card Roast **AI** (`/api/card-roast`) | Card Roast **page** (picker) |
| Spend Optimizer **AI** (`/api/spend-optimizer`) | Spend Optimizer **page**, Wallet/dashboard picker |
| | Entire landing + marketing, sitemap, `/api/cards`, `/api/apply`, transfer-map resolver, admin, approval-odds, smart-match, best-cards |

**The clean rule: every AI/LLM answer reads the Supabase table; every rendered/static UI surface reads `seed-cards.ts`.**

**The sharp consequence — four features are split down the middle:** Optimize, Card Switch, Card Roast, and Spend Optimizer each have a **SEED-backed page/picker** feeding a **Supabase-backed AI compute**. A user picks a card from a `seed-cards.ts` dropdown, and the AI reasons over a *different* data source (a Supabase row that may carry different values, a different name, or — as with Axis Atlas — not exist at all). This is exactly the divergence that produced the CIRA "I don't have Axis Atlas" symptom: the picker/detail would have shown it (SEED), the AI couldn't find it (Supabase).

## Q3 — Does the Supabase table carry its own `redemption_options`? (two copies, not one)

**Yes — the column exists and is writable.** `supabase/migrations/001_initial.sql:43`:
```
redemption_options jsonb not null default '[]'
```
So `redemption_options` is **not seed-only**; every Supabase `cards` row has this field (defaulting to an empty array if never written).

**Whether it holds a *copy* of the seed values depends on which seeder ran — and the two seeders disagree:**

| Seeder | Writes redemption_options? | Effect |
|---|---|---|
| `scripts/seed.ts:25` | **YES** — `upsert(card, {onConflict:'slug'})` writes the **whole** SEED object | Supabase rows get a **verbatim copy** of the seed `redemption_options`, including the four breaching values |
| `lib/scripts/seed-supabase-cards.ts:20-41` | **NO** — maps an explicit subset (id, name, bank, fees, lounges, iq_score…) that **omits** `redemption_options` | Those rows keep the `'[]'` default (empty) |

The live table has **173 rows** (per standing memory) — far more than the 49 seed cards — so at least some rows also originate from a scraper/importer that can carry its **own independently-authored** `redemption_options`.

**Conclusion for the four breaching cards** (`axis-magnus-burgundy`, `hdfc-infinia`, `hdfc-diners-black`, `axis-vistara-infinite`): the Supabase table is fully capable of holding a **second, independent copy** of their `redemption_options`, and one of the two seeders (`scripts/seed.ts`) writes exactly that. So **"two sets of wrong values, not one" is a real and likely condition** — and crucially, the two copies feed *different* surfaces:

- **SEED copy** → renders the breaching **rupee-per-point values** on the **card-detail page and Optimize page** (surfaces A/B), which read `seed-cards.ts`.
- **Supabase copy** → feeds **CIRA and the other AI routes**, which read `getAllCards()`.

**Nuance on what the AI actually consumes from the Supabase copy:** `cardToText` (`lib/rag.ts:33-40`, the B1 fix) emits only redemption **path labels** (`type (partner)`), and **strips the rupee value** — so a breaching `value_per_point_inr` in a Supabase row does **not** reach the model as an asserted number. **But the partner *label string* does** — so a stale ratio baked into the label (e.g. Magnus's `"Singapore KrisFlyer (5:4)"`) still leaks to the AI verbatim, even though the rupee figure is suppressed. (The AI's rupee values instead come from the SOURCED block built off `point-values.ts` + `transfer-graph.ts`, not off `card.redemption_options`.)

**Cannot verify from code:** the *actual current contents* of the live Supabase `cards` rows — which seeder ran last, and whether the four cards' rows carry populated, empty, or independently-scraped `redemption_options`. That needs a query against ref `yazpphublutdodahfwvr`:
```
select id, slug, name, redemption_options from cards
where slug in ('axis-magnus-burgundy','hdfc-infinia','hdfc-diners-black','axis-vistara-infinite');
```
The schema + seeder analysis proves the *capacity* for a divergent second copy; only that query confirms the present state.

---

*Addendum 2: no files other than this document were created or modified. Both earlier sections above are unchanged.*
