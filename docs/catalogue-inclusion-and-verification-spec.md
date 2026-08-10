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
