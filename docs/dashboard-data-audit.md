# Dashboard Data Audit — can we compute it from real data today?

**Branch:** `design/tours` (off `design/shell`)
**Date:** 2026-07-31
**Scope:** Report only. No code changed in this phase.
**Question:** For each element the dashboard spec calls for, can it be computed from real data that exists in the system *today* — and if not, exactly what is missing?

> Rule for this audit: **no placeholder values are proposed.** An element is either COMPUTABLE from a named real source, or NOT COMPUTABLE with the specific missing input named. Anything that can only be shown by inventing a number is marked NOT COMPUTABLE.

---

## Method

Four independent traces were run over the repo: (1) `SEED_CARDS` + card art, (2) the points/optimisation engine, (3) the Supabase schema + cached fares, (4) the existing dashboard surface + shell. The two load-bearing facts below were then re-verified by reading the source directly:

- `app/(shell)/dashboard/page.tsx:218` — `totalPoints = cards.reduce((s, c) => s + (c.points_balance || 0), 0)`
- `lib/engine.ts:21-23` — the spend distribution is labelled in-code as *"an internal spend-shape ASSUMPTION, not a surveyed or sourced distribution."*

## What a real logged-in user actually has

There is **no bank sync of transactions.** A user's real, per-user data is limited to:

| Source | Table | What it holds | Provenance |
|---|---|---|---|
| Uploaded PDF statements | `statement_imports` | `bank, card_name, card_last4, points_balance, points_currency, points_earned_this_month, confidence, imported_at` | **Verified** (read from statement) |
| Manually added cards | `manual_cards` | `bank, card_name, card_last4, points_balance, points_currency` | **Estimated** (user-typed; may be 0) |
| SMS parse (supplementary) | → `statement_imports` | points balance from bank SMS | medium-confidence |
| AA / Finvu link (if used) | `aa_consents`, `linked_cards` | `masked_number, bank, reward_points, cashback_balance` | Verified-ish (aggregator) |
| Onboarding profile | `user_profiles` | `display_name, home_city/home_airport, date_of_birth?, onboarding_complete` | User-supplied |

Read path: `/api/user-cards` (statement_imports) + `/api/manual-cards`, merged and de-duplicated by bank + last4 + name.

**Crucially absent:** categorized transaction/spend data. No table holds "how much this user spent on dining/travel/fuel." `statement_imports.points_earned_this_month` is the only per-period signal, and it is a single number, not a category breakdown. `user_points` exists in `001_initial.sql` but is **schema-only / not operationalized** — the live wallet is `statement_imports` + `manual_cards`, not `user_points`.

Static catalog (not per-user): `SEED_CARDS` — 57 cards in `lib/data/seed-cards.ts`, the canonical source (per the SEED_CARDS-is-canonical rule; the Supabase `cards` table is unreliable).

---

## The four spec elements

### 1. Total points across the user's wallet — ✅ COMPUTABLE

**From:** `statement_imports.points_balance` + `manual_cards.points_balance`, summed per user.
Already computed live at `app/(shell)/dashboard/page.tsx:218` and `lib/fusion-core.ts:212`.

- The **sum is real user data.** It should be shown provenance-split: statement-sourced = **verified** (`--ciq-verified`), manual-sourced = **estimated** (`--ciq-estimated`). The system already carries a `confidence` / source flag per card, so the verified-vs-estimated gauge (the brand signature) is genuinely backed here.
- **Caveat — do NOT conflate the total with a rupee value.** The current `bestValue = totalPoints * 1.8` and `conservativeValue = totalPoints * 0.25` (page.tsx:219-220) are **flat assumption multipliers**, not computed per-card/per-partner redemption. The *point count* is COMPUTABLE and honest; the *rupee conversion* is an estimate and must be labelled as an estimate (or designed out — see §5).
- **Empty state:** zero cards ⇒ total is 0/undefined. Must render an onboarding empty state, not "0 pts" styled as an achievement.

### 2. Optimisation rate — ❌ NOT COMPUTABLE

**What it would require:** the user's *actual spend by category*, compared against optimal-card earn, to yield "you're capturing X% of achievable value." Two of those three inputs do not exist for a real user.

- The engine (`lib/engine.ts` — `calculateAnnualValue`, `matchCards`) **can** score cards, but only against a `UserSpendProfile`. For a real user that profile is **not available**: there is no categorized spend anywhere in the schema.
- The only spend shape the engine has is `DEFAULT_SPEND_MIX`, which the code itself flags as an **assumption, not sourced** (`lib/engine.ts:21-23`). Driving a per-user "optimisation rate" off a fixed assumed spend mix would be presenting a **placeholder as a personal metric** — exactly what this audit forbids.
- No "optimisation rate" is computed or displayed anywhere today. The three `/api/*optimizer` routes are Claude-LLM calls, not a rate.

**Missing to make it computable:** real per-user categorized spend. That is the roadmap "statement MCC categorization" work (README Phase 4) and is **not built.** Until it lands, an optimisation *rate* cannot be shown honestly.

### 3. Active portfolio list + empty state — ✅ COMPUTABLE

**From:** the same merged `statement_imports` + `manual_cards` list already rendered by `WalletView`.

- The list of cards a user holds is real. Each row's `bank, card_name, card_last4, points_balance, points_currency` is present, with a verified/estimated flag.
- **Empty state is fully derivable** (list length 0) and must be a first-class design, since a brand-new user's honest state is *zero cards*.
- Note: "active" here = present in the wallet. There is **no card lifecycle status** (active/cancelled/blocked) in the schema, so "active" cannot mean "not cancelled." If the spec intends lifecycle status, that is NOT COMPUTABLE; if it means "cards in your wallet," it is COMPUTABLE.

### 4. Trending cards carousel (real card art + one-line descriptions) — ⚠️ SPLIT

Decomposed into its three claims:

- **Real card art — ✅ COMPUTABLE (with a hosting caveat).** `SEED_CARDS[].card_image_url` exists on the cards and points at real artwork. **Caveat:** the URLs are an **external CDN** (`asset21.ckassets.com`), not self-hosted in `public/`. That is a hotlink/availability/right-to-use risk for a shipped surface — flagged in OVERNITE-QUESTIONS. `color` is a reliable local fallback per card.
- **One-line description — ✅ COMPUTABLE (via an existing field, not a new one).** There is **no dedicated `description` field**, but `SEED_CARDS[].best_for` is a real, editorial one-line string (e.g. *"High spenders who travel internationally — best redemption value among Indian cards"*). Using `best_for` as the one-liner is real data, not a placeholder. `highlights[]` is a secondary source.
- **"Trending" (the ranking itself) — ❌ NOT COMPUTABLE.** There is **no trending computation and no honest signal to build one.** The `applications` table logs apply-clicks with timestamps and *could* in principle aggregate a most-applied list, but (a) it is not implemented, and (b) there is no reason to believe there is enough real click volume to make "trending" truthful. Presenting a hardcoded set *as if* it were trending would be a placeholder dressed as data.

**Net for the carousel:** a **curated / editorial** cards carousel — real art + real `best_for` one-liners — is COMPUTABLE and honest. A **behaviourally-trending** carousel is NOT COMPUTABLE. The existing `card-roast` page already uses an honest hardcoded `CURATED` list of 6 — that is the correct pattern to reuse, *labelled as editorial, never as "trending."*

---

## Summary

| Spec element | Verdict | Real source | If NOT computable, what's missing |
|---|---|---|---|
| Total points (wallet) | ✅ COMPUTABLE | `statement_imports` + `manual_cards` `.points_balance`, provenance-split | — (but ₹ conversion is an estimate, label it) |
| Optimisation **rate** | ❌ NOT COMPUTABLE | — | Per-user **categorized spend** (statement MCC work, unbuilt) |
| Active portfolio list | ✅ COMPUTABLE | merged wallet list + length-0 empty state | — (no lifecycle "active/cancelled" status exists) |
| Trending carousel — art | ✅ COMPUTABLE | `SEED_CARDS.card_image_url` (+`color` fallback) | external-CDN hosting caveat |
| Trending carousel — one-liner | ✅ COMPUTABLE | `SEED_CARDS.best_for` | (no dedicated description field; `best_for` stands in) |
| Trending carousel — **"trending" ranking** | ❌ NOT COMPUTABLE | — | Real behavioural signal (apply-click aggregation unbuilt / low volume) |

## What this constrains for Phase 2 (dashboard docs)

Design **in** for v1:
- Total points, provenance-split (verified vs estimated) — the brand-signature gauge.
- Active portfolio list with a real, designed empty state.
- A **curated/editorial** cards strip using real art + `best_for` one-liners — named "Editorial picks" / "Cards to know," **not** "Trending."

Design **out** of v1 (not placeholdered):
- **Optimisation rate** — omit until categorized spend exists. (A non-personal *"cards better for a typical spender"* module could stand in later, but it is not the same metric and must not be labelled as the user's rate.)
- Any **rupee value of points** stated as fact — either omit or explicitly label as an estimate range.
- Any **"trending"** framing — replaced by editorial curation.

Open decisions raised to `docs/OVERNIGHT-QUESTIONS.md`: external card-art hosting, and whether an editorial strip is an acceptable substitute for "trending" in v1.
