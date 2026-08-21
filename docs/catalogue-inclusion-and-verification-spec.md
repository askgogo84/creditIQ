# CreditIQ Catalogue — Inclusion & Verification Spec (DRAFT for approval)

**Goal:** CreditIQ carries EVERY live Indian consumer credit card. Scale is made safe not by
excluding cards but by marking every field's provenance — a card can be present and honestly
incomplete. Nothing in this changes the honesty model; it is what lets it scale.

Status: DRAFT — approve line-by-line before any build. No cards are ingested until §6 (schema) exists.

---

## 1. Scope
Every credit card issued to **individuals** in India, from any RBI-licensed bank or its card
subsidiary, or a fintech programme whose card is a true credit card (not prepaid/UPI-only/EMI-financing).

## 2. Inclusion decisions
| Dimension | Decision | Reason |
|---|---|---|
| Charge cards (Amex Plat/Gold) | **IN**, `product_type: charge` | Users carry/earn on them and ask about them; tag, don't hide. |
| Tier variants (Regalia vs Regalia Gold) | **SEPARATE** — only if fee/benefit/eligibility differ | Per-card facts differ by tier; a user holds one tier. Cosmetic-only variants = one card + `variant` — **but only via the verification gate below.** |
| Network variants (same card as Visa & RuPay, same terms) | **ONE card + `network[]`** — **verification-gated** | Network is an attribute, not a product — *when terms are verified-equal.* |
| Co-branded (Swiggy HDFC, Amazon Pay ICICI) | **SEPARATE from base** | Distinct partner/rewards/fees; held as its own product. |
| Secured / FD-backed | **IN**, `secured: true` | Real cards thin-file users hold; tag for filtering. |
| Business / corporate | **REROUTED to business.creditiq.app** + tagged `product_type: business` — NOT dropped | The business catalogue already exists; these belong there, still tracked for statement-matching, never silently deleted. |
| Discontinued-but-held | **STATUS, never excluded** (see §4) | Users still carry them; deleting blinds statement-matching. |

**Verification-gated collapse (approved).** Two rows of an apparent same card may be merged to one canonical record + `variant`/`network` attribute **only when the six core terms — joining fee, annual fee, waiver, earn rate, lounge, milestones — are `verified`-equal.** If any is `verified`-different → two records, older = `discontinued`. If the terms are `unverified` or mutually conflicting → mark `disputed`, keep **both** rows and **both names in statement-matching**, and defer the merge to verification. Never collapse a form a user may still hold — that breaks their statement match. (The four HDFC Infinia/Diners rows are the first `disputed` cases; they lead §8c.)

## 3. White-label re-badges (CHANGE 1)
Some issuers re-badge another issuer's card (BoM / Central Bank / KVB / Karnataka Bank sell
**SBI** ELITE/PRIME/SimplySAVE; several banks sell **OneCard**). These are **ONE canonical record**,
counted **once** under the true product — NOT duplicated per badge, NOT excluded.
- `issued_as: string[]` — every badge/partner name the card is sold under.
- **Search and statement-matching MUST resolve every alias in `issued_as`**, because the badge name
  (e.g. "Bank of Maharashtra SBI Card ELITE") is what prints on the user's statement.
- The canonical record's `issuer` is the true product owner (SBI Card); the selling banks appear only
  in `issued_as`.

## 4. Lifecycle
`lifecycle: active | discontinued | withdrawn` (default `active` on ingest).
- **active** — issuer currently markets it to new applicants.
- **discontinued** — closed to new applicants; existing holders remain (stays tracked, flagged, excluded
  from "currently available" surfaces, included in "we track" + statement-matching).
- **withdrawn** — fully dead, no holders.
- A resolving product URL is **NOT** proof of `active` — verify against the issuer's current LIST + known
  lifecycle events (e.g. Vistara merger, Citi→Axis).

## 5. Two tiers of data depth (CHANGE 2)
A card at IDENTITY tier is **not a lesser card — it is an honestly incomplete one**; every unfilled field
carries `state: unverified` and says so.
- **IDENTITY tier (~8 fields):** `slug`, `name`, `issuer`, `network[]`, `tier`, `annual_fee`,
  `official_url`, `lifecycle`. Enough to be **present, findable, and honestly marked.** This is what the
  PSU/regional/long-tail gets on first ingest.
- **FULL tier (30–50 fields):** IDENTITY + fees (joining, waiver, forex, APR, add-on), rewards (base rate,
  accelerators, currency, **estimated ₹/point — always marked estimate, never verified-green**, caps,
  redemption, milestones), benefits (lounge dom/intl + PriorityPass, welcome, insurance, fuel-surcharge,
  dining/movie, memberships), eligibility (income, age band, credit-score floor, employment). Built **only
  for cards with real user demand** (searched/held).

## 6. Per-field verification state (must exist BEFORE any ingest)
Every field is a cell, not a scalar:
```
field = { value, unit, state: 'verified' | 'unverified' | 'disputed', source, asOf }
```
- **`unit` is MANDATORY on every numeric reward or fee field** — a number with no unit is uncomparable and
  silently corrupts ranking (see §10). Earn rate: `percent` | `points_per_100` | `points_per_150` |
  `points_per_inr`. Reward value: `inr_per_point`. Fees: `inr`. Forex: `percent`. A legacy unit-less value
  ingests as `disputed` until its unit is established.
- **verified** — confirmed against a primary source (issuer official page, or a user's statement). ONLY
  this earns verified-green.
- **unverified** — ingested, unconfirmed. **Default for every field of every newly ingested card.** Renders
  neutral/grey — "we list it, we haven't checked this field."
- **disputed** — sources conflict, or a user's statement contradicts the stored value (feeds the moat).

## 7. Canonical name-key (freezes the count)
One deterministic key so the number stops moving: `key = normalize(issuer_canonical) + '|' +
normalize(product_name)`. Bank spellings normalize to a canonical issuer first (so "BOB"/"Bank of Baroda"
collapse). Dedup on `key`. **The public count is frozen the moment this key + this rule are applied.**

**Deferral to the verification gate (CHANGE 3).** The key does **NOT** strip network/tier-cosmetic tokens
by default — that would pre-empt the §2 verification gate. Cosmetic-token stripping (collapsing
`… Visa`/`… RuPay`/`… Metal Edition` onto one record) is applied **only to a pair whose six core terms are
`verified`-equal.** Any pair with `unverified` or conflicting terms stays **two rows** (both
statement-matchable, flagged `disputed`) until verified. No cosmetic stripping on unverified pairs.

## 8. Ingest order (CHANGE 3 — do NOT start with the PSU tail)
a. **Freeze the count** under §2–§4 rule + §7 canonical key.
b. **Build the §6 `{value, unit, state, source, asOf}` schema** so every ingest arrives `unverified` and unit-tagged. **Fix the §10 earn-rate unit defect as part of this step — it is a precondition, not a follow-up.**
c. **VERIFY THE ~73 WE ALREADY HOLD FIRST** — the searched cards, all `unverified` today. Priority:
   Amazon Pay ICICI, Federal Scapia, OneCard, IndiGo 6E (HDFC), MakeMyTrip ICICI, then the rest.
d. **Resolve the ~12–15 likely-discontinued into `lifecycle`** (Vistara co-brands, Citi cards, Amex Gold,
   HDFC Diners Miles / Platinum Times, ICICI 1mg/Cleartrip, Kotak Essentia).
e. **THEN ingest the tail at IDENTITY tier** — PSU first within the tail (BOBCARD, PNB, Canara, Union: the
   biggest high-confidence gap), deferring RBL-legacy and the TLS/403-blocked sites (UCO, Bank of India)
   until manually verified on Jarvis.

## 9. Public-copy rule
Public surfaces print **only the frozen counted number** (`we track ~N` / `~M currently available`) —
never the estimated universe or the gap. The ~350–470 universe / ~220–330 gap figures are **internal
planning only** and carry confidence tiers; they are never blended into a single public figure.

## 10. Earn-rate unit defect (P0 — LIVE today, fix in §8b before any ingest)
`base_reward_rate` is a **single unit-less numeric column** (no `*_unit` field). Values mix percentages
(`1/1.5/2…`, ~163 rows) with points-style encodings (`5/6/8/15`, ~6 rows provably not %), and the per-row
unit is **not recoverable from the data alone**. `category_rewards` is shape-inconsistent (object
`{default,smartbuy}` ×80 with no unit, JSON-string/other ×67, empty ×26). There is **no reward-value
(₹/point) column at all**. Fees are unit-safe (unit in the column name).

This is consumed, unit-blind, by:
- `lib/rag.ts:16` — hardcodes `'… + '%'` on every base rate → corrupts the AI grounding for **Spend
  Optimizer** (confirmed: `retrieveRelevantCards` + `buildRagSystemPrompt`), **Points Optimizer**,
  **Travel AI**, **statement-truth**, and the shared **assistant/WhatsApp** advice paths. (It also drops the
  80 object-form `category_rewards` rows via an array-only `.length` check.)
- `lib/engine.ts:184` — `base_reward_rate / 100` (assumes %).
- `app/api/rewards-calculator:12` — base rate defaults to `unit: 'percent'`.
- **Card rankings** sort by the stored `iq_score`; if it was computed under the %-assumption it is tainted —
  provenance unverified, must be recomputed after units are fixed.

**Required before ingest:** add `unit` to every numeric reward/fee cell (§6); backfill `base_reward_rate`
and `category_rewards` units (unrecoverable rows → `disputed`, verified against a primary source in §8c);
add an `inr_per_point` reward-value field; make `rag.ts`/`engine.ts`/`rewards-calculator` unit-aware;
recompute `iq_score`. Until then, cross-card earn-rate ranking is comparing incommensurable numbers.

## 11. Interim ranking policy during earn-rate re-sourcing (DECISION: option C)
Re-sourcing every card's earn rate from the issuer (§10) is not instant. Between now and a fully
re-sourced catalogue, the IQ score and every rank position that derives from earn rate are computed from
the unit-ambiguous input §10 describes — while the surfaces around them say "ranked *honestly*" and "ranked
by effective reward rate." This section governs the interim. **Chosen: option C — re-source the top and
most-searched cards first; show score + rank only for re-sourced cards; suppress both for the rest.**

Rejected alternatives, for the record: (A) suppress every ordering catalogue-wide until fully re-sourced —
honest but blanks the product's core surface for the whole re-sourcing window; (B) keep the orderings and
label them "estimated" — **§8 already rules this out**: a rank is a property of the *whole ordering*, not of
one row, so a neighbouring row inherits a shifted position with nothing on it to mark. You cannot honestly
label a derived ordering; you can only show it or withhold it.

### 11a. The suppression rule
- **Re-sourced card** = its earn rate is re-sourced from the issuer, unit-tagged per §6, and `verified`.
  Such a card shows its numeric `iq_score` and its rank position **normally**.
- **Not-yet-re-sourced card** = the numeric IQ score **and** the rank position are **SUPPRESSED** — absent,
  not rendered. **Not** labelled "estimated," not greyed, not asterisked. Gone. (§6's grey `unverified`
  treatment is for a card's own *fields*; it does **not** apply to a cross-card *ordering*, per §8.)
- **A rank is a property of the ordering, so it is suppressed at the ordering level, not the row level.** A
  ranking surface may print positions only across a contiguous re-sourced block from the top: as soon as the
  ranked set contains one not-yet-re-sourced card at or above the visible cut, **no** positions render on
  that surface until its ranked population is clean. A surface never shows "#3 … #5" with #4 blanked — that
  re-introduces exactly the shifted-neighbour lie §8 forbids.
- **The card stays fully present throughout** — listed, searchable, filterable, statement-matchable, and its
  own `verified`/`unverified` fields (fee, lounge, forex, welcome) render as normal per §5–§6. Only the
  cross-card **score** and the cross-card **ordering** disappear. Suppression removes a comparison we can't
  stand behind; it never removes a card.

### 11b. Which surfaces this touches (inventory — three groups)
Every surface that prints an `iq_score`, a rank position, or a "best/top" ordering falls into exactly one
group. Only **Group 1** is governed by 11a.

**Group 1 — earn-rate-derived (SUPPRESS score + rank per 11a until re-sourced).** Ordering traces to the
§10 defect (`iq_score`, or `engine.calculateAnnualValue` which consumes `base_reward_rate/100` +
`category_rewards`):
- `app/(shell)/cards/page.tsx` + `CardsClient.tsx` — ordered by Supabase `iq_score`; prints a numeric
  `IQ Score /100` on **every** tile (no rank badge). Hero: "ranked *honestly*."
- `app/api/cards/route.ts`, `app/api/app-config/route.ts` (top-20 featured), `app/api/employee/corporate-card/route.ts`,
  `lib/supabase.ts` (`getAllCards`) — all `.order('iq_score', …)`; feed the app home, the mobile config, and
  corporate onboarding.
- `app/smart-match/page.tsx` — ordered by `engine.matchCards` (earn-rate); rank badge 1–12 + numeric tile score.
- `app/HomeCardRanks.tsx` — `matchCards` annual value; live positions 01–06 on the homepage.
- `components/marketing/landing/CardRankings.tsx` — `matchCards` annual value; also prints `base_reward_rate%`.
- `app/(shell)/(spend)/spend-optimizer/page.tsx` — AI ranking (via `rag.ts`) from earn rates; 🥇🥈🥉 + `netAnnualValue`.
- `app/(shell)/card-roast/page.tsx` — `calculateAnnualValue` on a single card; suppress the annual-value
  figure + letter grade until that card is re-sourced (no cross-card rank, but the number is earn-rate-derived).

**Group 2 — editorial `expert_rating`, NOT earn-rate (do NOT suppress — but fix the false framing).** These
sort by the hand-set `expert_rating` (0–10), unrelated to the §10 defect; re-sourcing earn rates neither
fixes nor changes them. They are honest *as an editorial ranking* — but today they mislabel and overclaim:
- `app/best-cards/[category]/page.tsx` — sorts by `expert_rating`; renders rank badge + `IQ Score /100`
  (= `expert_rating × 10`) under copy that reads **"Ranked by effective reward rate."** That copy is false
  (it's an editorial rating, not a reward-rate computation) and the number is **mislabelled** "IQ Score,"
  conflatable with the Group-1 `iq_score`. *(Category membership is a separate axis: `fuel`/`forex`/`lounge`/
  `lifetime_free` filter on unit-safe fields; `travel`/`cashback`/`shopping`/`dining` filter on `category[]`
  tags — neither is earn-rate, so the filters stand; only the ordering copy + score label are wrong.)*
- `app/(shell)/banks/[bank]/page.tsx`, `app/bank/[slug]/page.tsx` — `expert_rating` sort + rank + `IQ Score /100`.
- `app/(shell)/card/[slug]` — single "CreditIQ Score /10" (= `expert_rating`), no ranking.
- **Required fix (not suppression):** stop calling `expert_rating × 10` an "IQ Score" (rename to an
  editorial label, e.g. "Editor rating," distinct from the earn-rate `iq_score`), and drop/soften the
  "ranked by effective reward rate" claim to what it actually is until the earn-rate `iq_score` is live.

**Group 3 — neither earn-rate nor tainted (leave untouched).**
- `app/approval-odds/page.tsx` — orders by `approvalProbability` (income + CIBIL), not rewards.
- `app/(shell)/compare/page.tsx` — user-chosen order; no score, no rank.
- `app/(shell)/card/[slug]` redemption list — sorts by `value_per_point_inr`, and
  `app/(shell)/(spend)/points-optimizer/page.tsx` — ranks *redemption paths* (not cards) by value-per-point.
  Both depend on the reward-**value** (`inr_per_point`) field §10 flags as *missing*; that is a separate
  estimated-value gap, tracked under §10, **not** suppressed here.

### 11c. Re-sourcing priority order
**"Most-searched" is not measurable today.** The `/cards` search box filters client-side only and logs
nothing; there is no card-pageview tracking; `@vercel/analytics` is installed but unused; the one real
demand signal — apply-clicks into the `applications` table — is **defined but not wired**
(`app/api/apply/[cardId]/route.ts` still carries the `// TODO: log click` stub). So the priority list is a
**judgement call**, not a data pull. (If we want it data-driven, wire search-query + apply-click logging
first; that is a prerequisite for any future *data*-ordered version of this list, not a blocker for starting
re-sourcing now.) The judgement list reuses the §8c demand ordering:

1. **Tier 1 — unblocks the most Group-1 top slots (highest-demand held cards).** The §8c leaders first:
   **Amazon Pay ICICI, Federal Scapia, OneCard, IndiGo 6E (HDFC), MakeMyTrip ICICI**, then the top-of-catalogue
   premium/co-brand set that occupies the visible top of `/cards`, `HomeCardRanks`, the landing table and
   `spend-optimizer` (Infinia, Regalia Gold, Axis Atlas/Magnus, SBI Cashback, Amex Platinum Travel/MRCC,
   ICICI Emeralde, Tata Neu Infinity, IDFC First Wealth/Select).
2. **Tier 2 — the remainder of the ~73 already-held cards (§8c).** Completing this set makes every Group-1
   ranking surface's top-20 fully re-sourced, because those top slots are drawn almost entirely from the held
   set. `smart-match` is spend-variable, so guaranteeing a clean top-12 for any plausible profile needs the
   broader held base, not just the top-20 — Tier 2 supplies it.
3. **Tier 3 — the IDENTITY-tier tail (§8e).** These never had a trustworthy earn rate; they ingest with score
   + rank **already suppressed** by 11a and stay that way until re-sourced on demand. No separate action —
   suppression is their default state, not a regression.

**Exit condition.** 11a suppression lifts for a card the moment its earn rate is `verified` + unit-tagged;
it lifts for a *surface* when every card at or above its visible cut is re-sourced. When the full held set
(Tiers 1–2) is re-sourced and `iq_score` is recomputed under §8b, every Group-1 surface shows a complete,
honest ordering and this section is retired.

## 12. Issuer evidence log — HDFC Infinia/Diners collapse (2026-08-20)

**Source:** HDFC SmartBuy Savings Calculator — `https://offers.reward360.in/v1/savings_calculator`
(61 captured rows, zero variance). Feeds the §2 verification-gated collapse rule for the four `disputed`
HDFC Infinia/Diners rows.

**Finding — the two pairs resolve in OPPOSITE directions, on the issuer's own data:**
- **Infinia vs Infinia Metal Edition — IDENTICAL** across all six SmartBuy earn categories. Issuer evidence
  that the pair is a cosmetic (material-only) variant → **collapse candidate** under §2: one canonical record
  + `variant`, *once the six core terms (§2) are also `verified`-equal.* This note supplies the earn-category
  half of that evidence; the fee/waiver/lounge/milestone half still needs the same source treatment before the merge.
- **Diners Club Black vs Diners Club Black Metal Edition — DIFFERENT** in all six categories, in **both**
  directions (each wins some, loses others). Issuer evidence that these are **distinct products** → **keep as
  two records** under §2 (`verified`-different ⇒ never collapse); collapsing them would break statement-matching
  for holders of either form.

**Caveat — value ≠ earn.** All four cards return the same per-point *redemption value* ceiling (Rs 1.00/pt) in
the same calculator (recorded in `lib/data/point-values.ts`). Equal redemption value does **not** imply equal
earn structure — the collapse decision rides on the six earn categories above, not on the shared Rs 1.00 value.

**Status:** evidence filed, not acted on. No row is merged or split until the §2 six-core-terms gate is run
against this and the fee/benefit sources.

## 13. Discovery gate — a creator tells us where to look, not what is true (DRAFT)

**The load-bearing distinction: DISCOVERY and PROVENANCE are different fields and must never collapse into
one.** A creator (Instagram/YouTube/Reddit handle) is a *demand signal* — evidence that a redemption is worth
checking. The programme's own award chart / issuer page is *provenance* — evidence of what the number is. The
first tells us **where to look**; the second tells us **what is true**. Conflating them is how an unverified
claim inherits a source's authority. This section forbids the collapse at the schema level.

### 13a. `source` is reserved; discovery gets its own field
- **`source` + `asOf` keep exactly the meaning they carry in `lib/data/point-values.ts` and
  `lib/data/transfer-graph.ts`: a PRIMARY DOCUMENT** — the programme's award chart, the issuer's own page, or
  a user's statement — plus the date it was read. A field is `verified` (green-eligible) only when `source`
  points at such a document, per §6. **A creator handle or a social post URL is NEVER a valid `source`.**
- **Discovery is a separate field — `discovered_via = { handle, platform, url, seen_at }`** — carrying who
  surfaced the lead and when. It is INTERNAL queue metadata. It **can never be rendered in a position where a
  `source` belongs** — no "Source →" link, no "via @handle" byline that implies the creator vouches for the
  number. The creator is how we found it; the creator is not why it's true.
- **Schema debt this creates (see reconcile plan):** the live `intelligence_kb.source` column holds the
  *platform we scraped* (`'youtube'|'reddit'|'instagram'`) and `source_url` holds the *creator's post*. That
  column is a discovery field wearing the reserved name. It must be renamed (`discovery_platform`) so the word
  `source` can only ever mean a primary document, here as everywhere else.

### 13b. The lead queue and the gate
- A named property or redemption enters a **queue as a LEAD** — `discovered_via` populated, `source` NULL,
  state `lead`. A lead is NOT a Sweet Spot and does not publish.
- A lead becomes a Sweet Spot **only** when someone checks the programme's own award chart, records a real
  `source` + `asOf`, and the rate is stated as a field per §6 — **the same gate as every other number in this
  spec.** No shortcut, no "creator trust" substitute for reading the chart.
- **An unverified lead does not appear on any public surface — not behind a disclaimer, not greyed, absent.**
  (Per §8/§11a's principle: honesty is achieved by withholding a claim we can't stand behind, not by labelling
  it. A disclaimer on a published unverified claim is the pattern this section retires.) Sweet Spots gets
  SMALLER before it gets bigger: it becomes a list of programme-verified redemptions only, and the creator
  stream becomes an internal verification queue.

### 13c. No popularity proxy for truth
Engagement (subscribers, upvotes, likes) is a **demand signal** — legitimate input to *which leads to verify
first*, and nothing more. It **must not be rendered, stored, or named as a measure of correctness** (no
`trust_score`). A redemption is `verified` against a primary source or it is a `lead`; there is no "0.7 true."
Consensus among creators raises priority, never provenance — a repeated rumour is still a rumour.

**Status:** DRAFT — approve before build. Lands BEFORE any Accor/hotel redemption content enters Sweet Spots,
so hotel award-chart claims arrive through the gate rather than inheriting the current source-slot leak.
