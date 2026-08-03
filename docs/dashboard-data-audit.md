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

---

## Addendum (3 Aug 2026): ANIMATION-GATED CORRECTNESS — the point count is honest in the data, not always on screen

**This qualifies §1.** §1 concludes the wallet total is "COMPUTABLE and honest" — and it is, *as a value*. But the value is not what the user reads. The headline renders through an animation with no completed-state fallback, so an interrupted or stalled frame leaves a **wrong total on screen — not a missing one.**

**The mechanism (source-verified):**
- The headline is the only animated number. `HeroGauge` renders `counted = useCountUp(points)` (`components/ciq/HeroGauge.tsx:54`, `points = totalPoints`), and `useCountUp` seeds `useState(0)` (`:9`) then eases 0 → target over 1400ms (`:8–34`). Displayed digits are `counted`, not `points` (`:92–93`).
- The two numbers that agree with each other are **static**: the verified/estimated split renders `verifiedPoints`/`estimatedPoints` directly (`:110–111`, `:119–120`), and the best-move panel renders `totalPoints` directly (`components/ciq/WalletView.tsx:164`). No animation gates either.
- All three are the **same value** by construction — `totalPoints = vPoints + ePoints` (dashboard `:240`; split `WalletView.tsx:50–51`). So when the headline disagrees with the split, it is never a different aggregation; it is the *same number caught mid-fill.*

**The observed incident:** signed-in production, /dashboard, dark mode — headline **3,68,844 pts** while the split (verified 56,499 + estimated 8,20,000) and best-move both read the true **8,76,499**. `3,68,844 / 8,76,499 = 0.4208` — precisely a cubic-ease-out frame (`1−(1−p)³`) ~17% into the count-up. The headline was showing **42% of the real total.** The progress bar was simultaneously empty because the bar width is gated behind a *separate* one-shot flag — `fill`, `useState(false)` set true only by a double-`requestAnimationFrame` (`:55`, `:67–71`, `:99–102`); its segments read the same real split, but the same stall that froze the count-up left `fill` false, so a wallet with 56,499 verified points drew no verified segment.

**Same class as `Reveal` on /cards.** `.reveal { opacity: 0 }` → `.reveal.in { opacity: 1 }` (`app/globals.css:524–532`), and `.in` is added only when an `IntersectionObserver` fires (`components/design/Reveal.tsx:30`). If the observer never fires — never scrolled into threshold, throttled, disconnected early — correct content sits at `opacity:0` **permanently**. Both are the same defect: **correct data gated behind an animation with no completed-state fallback.** Neither `tsc` nor any test catches it — the data is right; the render path drops it.

**Severity — specific to this product.** CreditIQ's entire argument is that *its numbers are true* ("We don't guess your money"; §1's honesty rule; the verified-vs-estimated gauge is the brand signature). A headline that can display **42% of the real total** under CPU throttling, a background tab, or a single dropped frame is **worse than one that renders plain** — a missing number reads as "loading," but a wrong number reads as a lie, on the one surface whose whole claim is accuracy. This is a higher-severity instance of the class precisely because the animated element *is* the honesty claim.

**Proposed direction (NOT implemented — for when we fix it):** invert the default. The **final value should be the rendered default**, with the count-up applied as *progressive enhancement* on top — so any animation failure (stall, interrupt, dropped frame, reduced-motion edge) leaves the **correct number** on screen rather than an arbitrary intermediate one. Same inversion for the bar: the fill should default to its true width, with the grow-in as enhancement, so a wallet with verified points always shows its verified segment even if `fill` never flips. Do not gate a truth claim on an effect that is allowed to not run.

**Noted, not resolved.** Belongs with the HeroGauge/WalletView render path, not a data change — the underlying total is already correct at 8,76,499.

> Cross-refs: the render/animation-debt catalogue in `docs/HARDCODED-PALETTE-AUDIT.md` collects the sibling "data read ≠ data rendered" defects (over-broad selector, double-defined tokens, face-ink divergence); this one is the data-honesty instance of the same family and is logged here because it qualifies §1. (That file currently also carries unresolved merge-conflict markers — see the hand-off note.)
