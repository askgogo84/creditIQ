# SEED_CARDS Integrity Report

*Created during the card-art / SEED_CARDS cleanup pass. Source of truth for what
the runtime catalogue actually is, and where the data-quality landmines are.*

---

## 1. The file is three arrays, only two of which ship

`lib/data/seed-cards.ts` is **not** a single flat array. At runtime the exported
`SEED_CARDS` is assembled from:

| Array | Lines (approx) | Count | Reaches runtime? |
|---|---|---|---|
| `SEED_CARDS` initial literal | L6–717 | 19 | ✅ yes |
| `MORE_CARDS` | L720–777 | 30 | ✅ yes — `SEED_CARDS.push(...MORE_CARDS)` at L780 |
| `NEW_CARDS` | L861–2641 | **82** | ❌ **NO — never pushed** |

**Runtime `SEED_CARDS` = 19 + 30 = 49 cards.**

- **49 unique ids. No internal duplicates. `id === slug` for all 49.** (Verified by
  script, not by eye.)
- `NEW_CARDS` is declared and then never spread into `SEED_CARDS`. Its own header
  comment says: `!!! DEAD CODE - NOT PUSHED TO SEED_CARDS. EDITS HERE HAVE NO EFFECT !!!`
- **The dead block's own descriptive comment is wrong.** It says
  "44 NEW CARDS (takes us from 49 to 93)" — the array actually holds **82** entries,
  and the "NEW_CARDS triage report" it references **does not exist** in `docs/`.
  A stale comment on dead code is exactly how this stayed invisible: the label lied
  about the size, so nobody re-counted. Comments are not a gate; §5 is.

## 2. Which copy of a "duplicate" did the code resolve? → the live one, always

Twelve live ids **also appear** in the dead `NEW_CARDS` block:

```
axis-flipkart, rbl-shoprite, yes-marquee, au-altura-plus, hdfc-moneyback-plus,
icici-sapphiro, icici-rubyx, axis-ace, axis-vistara-infinite, amex-mrcc,
indusind-pinnacle, idfc-first-classic
```

**There is no first-wins vs last-wins ambiguity at runtime.** Because `NEW_CARDS`
is never pushed, the runtime array contains only the live copy of each id. Every
consumer — `.find(c => c.id === …)` (CompareTray, dashboard add-card picker,
EditorialCards' `new Map()`), `getCardBySlug`, the rewards engine — resolved the
**live** entry. Users have **never** seen the `NEW_CARDS` values.

This is *less* dangerous than a silent last-wins dedup (nothing ambiguous shipped),
but it hides a *different* landmine: the dead block was written as a **corrected /
enriched rewrite** of many live cards, and those corrections never went live.

### The live-vs-dead disagreements are material

For the four originally-flagged collisions, the live (shipped) values vs the dead
(never-shipped) rewrite disagree on facts a user would act on:

| Card | Field | LIVE (shipped) | DEAD `NEW_CARDS` (never shipped) |
|---|---|---|---|
| axis-flipkart | fee-waiver / rating / colour | ₹350k · 8.6 · `#2874f0` (Flipkart blue ✔) | ₹200k · 8.2 · `#f97316` (orange ✘) |
| rbl-shoprite | annual fee / reward type / earn rate | ₹500 · reward-points · 1% | ₹0 LTF · cashback · 0.5% |
| yes-marquee | tier / forex / earn rate | super-premium · 0% forex · 1.65% | premium · 1.75% forex · 2.0% |
| au-altura-plus | tier / reward type | entry · cashback | mid · reward-points |

The file's own comment admits the live `hdfc-moneyback-plus` base rate (2%) is
**wrong** and the dead copy has the correct 0.67% — i.e. **known-wrong data is
live while the fix sits dead.** The remaining collisions have not been triaged.

**This has already caused a production regression once.** An in-file comment at the
live `indusind-pinnacle` entry records that commit `157b2512` *wrongly deleted the
live `MORE_CARDS` entry* because the author had edited "the richer copy" — which was
sitting in the dead `NEW_CARDS` block — and assumed that was the live one. It had to
be restored. That is not a hypothetical risk; it is this exact confusion, shipped,
then reverted. The build gate in §5 exists so it cannot happen a third time.

## 3. `last_verified` is not evidence of verification

Every live card is stamped `last_verified: '2026-05-01'`; every dead `NEW_CARDS`
entry `'2026-05-15'`. Per the catalogue's own history these were **bulk
back-filled once**, not checked per-card. So:

- "Newer date" (the dead block) means **typed later, not verified later.**
- Neither copy of a collision can be treated as authoritative on that basis. Any
  promotion of dead values into runtime must be **re-verified against a real
  source** (bank T&C / paisabazaar), not accepted because the date is higher.

## 4. `card_image_url` — 12 live, all unusable, all render nowhere

All 12 `card_image_url` values are in the **live** array (0 in dead):

- **8** hotlink `asset21.ckassets.com` (EarnKaro/CashKaro CDN) — composed store
  assets; now return **HTTP 403** (hotlink protection).
- **4** are **bank logos, not card art** — 3× ICICI header `logo.png`, 1× HDFC
  Wikipedia logo.
- **None are rendered on any surface** — `card_image_url` has zero references in
  `.tsx`. Every card visual is drawn from `card.color` (CSS) today.

→ Safe to delete all 12. Tracked in commit (b).

## 5. Build gate proposal — never let this reach a human again

Add a validation step (extend `scripts/validate-card-links.ts`, already wired into
the build) that **fails the build** on:

1. **Duplicate id in the runtime `SEED_CARDS`** (import the real exported array,
   assert `new Set(ids).size === ids.length`). This is the primary invariant.
2. **`id !== slug`** for any runtime card.
3. *(soft, warn)* **A live id also declared in `NEW_CARDS`** — surfaces the
   live-vs-dead collision class so a "richer rewrite" can't silently rot in dead
   code again.

Because the gate imports the *assembled* export, it stays green today (49 unique)
and trips the instant a real duplicate is introduced.

## 6. Open decision (NOT yet actioned) — what to do with dead `NEW_CARDS`

The 82-entry dead block is the root of the "duplicate" confusion **and** may hold
genuinely-better data (per §2). Three options, needs a human call:

- **A. Delete the whole block.** Removes ~1,780 lines of dead, misleading code and
  all 12 collisions. Loses the potentially-correct rewrites unless salvaged first.
- **B. Keep as-is.** Status quo — the landmine remains.
- **C. Triage & promote.** Verify each of the 12 collisions against a real source,
  merge only confirmed corrections into the live entry, then delete the block.
  Most correct, most work; this is the only option that fixes known-wrong live data
  (e.g. moneyback-plus 2% → 0.67%).

## 7. Does dead `NEW_CARDS` hold corrections the live 49 are missing?

Short answer: **mostly no, and the block is not uniformly "better."** This section
is the per-card triage of the 12 live↔dead collisions. No code was changed to
produce it; nothing is promoted without a per-card human call.

### ⚠ "Newer date = better" is BACKWARDS on this file — do not trust dates

The dead `NEW_CARDS` entries are stamped `last_verified: '2026-05-15'`; most live
entries `'2026-05-01'`. That looks like the dead copy is newer. **It is not a safe
signal.** Both dates were bulk back-filled (§3), *and* **6 of the 12 live entries
carry an explicit `CORRECTED` / `RESTORED` / `VERIFIED` comment dated 2026-07-27** —
i.e. a human verified the LIVE card *after* the dead copy was typed on 05-15. For
those six, **the dead copy is stale, not a correction.** The clearest proof:
`indusind-pinnacle`'s live entry is annotated `RESTORED` because commit `157b2512`
once shipped the dead copy's values (joining ₹0 vs the real ₹15,000; forex 1.8% vs
0%) and it had to be reverted — **the dead copy already caused a production
regression.** Treat every date on this file as "typed on," never "checked on."

### 🔴 Live is already ahead — dead is stale, do NOT promote its financials

| id | Why live wins | Only possibly-salvageable from dead |
|---|---|---|
| `hdfc-moneyback-plus` | live `CORRECTED` 07-27 (base 2%→0.67%; the fix already landed) | `credit_score_min: 680`, `forex 3.5%` (missing fields) |
| `icici-rubyx` | live `CORRECTED` 07-27; dead base 0.5 vs live 1.5 | `credit_score_min: 720` |
| `axis-vistara-infinite` | live `CORRECTED` 07-27; dead base 1.5 vs live 2 | `credit_score_min: 740` |
| `amex-mrcc` | live `CORRECTED` 07-27 (fees/tier/income) | dead colour `#006FCF` (real Amex blue) vs live `#92400e`; `credit_score_min: 720` |
| `indusind-pinnacle` | live `RESTORED` 07-27, paisabazaar-sourced; dead = the regression copy | nothing — live is authoritative |
| `idfc-first-classic` | live `CORRECTED`/verified; dead base 0.75 vs live 1 | `credit_score_min` if sourced |

### 🟡 Genuine conflict, live NOT yet corrected — needs a source, no safe call

| id | Disagreement (live → dead) |
|---|---|
| `rbl-shoprite` | **fee ₹500 → ₹0 lifetime-free**, reward-points → **cashback**, base 1% → 0.5%. Fundamentally different product. |
| `yes-marquee` | tier super-premium → premium, **forex 0% → 1.75%**, base 1.65 → 2.0. Live's "0% forex" is a bold claim. |
| `au-altura-plus` | reward-points ↔ **cashback**, tier entry → mid. |
| `icici-sapphiro` | **base 2% → 1.0%** (live's 2% base looks high), income 120k → 150k, credit 750 → 730. |
| `axis-ace` | **base 1% → 1.5%** (dead's 1.5 may be the real base), income 15k → 30k. |
| `axis-flipkart` | fee-waiver 350k → 200k, income 25k → 20k, rating 8.6 → 8.2. (Colour resolved: live blue `#2874f0` is correct.) |

### 🟢 Cross-cutting enrichments dead adds that live lacks (plausible, unverified)

- **`credit_score_min`** — live omits it on ~10 of these 12; dead supplies 670–750.
- **`forex_markup_percent: 3.5`** — the standard Indian-card forex; live omits it on
  several. A reasonable default, still per-card unconfirmed.

### Bottom line

Dead `NEW_CARDS` is **not** a trove of corrections. For 6/12 the live copy is the
verified one and dead is outdated. Its real value is **two missing fields**
(`credit_score_min`, `forex_markup_percent`) and maybe **two genuine base-rate fixes**
(`axis-ace`, `icici-sapphiro`) — all still unverified. **4 collisions are real
product-fact conflicts** (`rbl-shoprite`, `yes-marquee`, `au-altura-plus`,
`icici-sapphiro`) that only a bank-T&C / paisabazaar check can settle. Those 4 are
surfaced to users as "being re-verified" in the UI (see the `UNVERIFIED_CARDS` set in
`lib/data/unverified-cards.ts`) — an honest flag beats a confident wrong number.

## 8. What a real verification process would look like (no research done — shape only)

Hand-fixing 4 cards does not fix the catalogue: 49 cards, `last_verified`
bulk-backfilled once and meaning nothing (§3), no process. Before spending research
time on instances, here is the shape of the problem.

### Where authoritative data comes from (in trust order)
1. **Issuer MITC / T&C PDF** — the legal source of truth for fees, rates, caps,
   forex, waivers. Authoritative but unstructured (PDF) and changes without notice.
2. **Issuer product page** — current welcome offers / benefits; marketing tone, so
   soft on caps and exclusions.
3. **Aggregators** (paisabazaar, cardinsider, technofino, Live From A Lounge) — good
   for cross-checks and devaluation news; secondary, sometimes wrong.
4. **RBI notifications** — regulatory caps (forex, interest ceilings).

### Fields are not all equally volatile → re-check cadence must differ
- **High churn (re-check ~quarterly / on-alert):** reward rates, welcome benefits,
  milestone thresholds, lounge counts, fees, devaluations. These move when issuers
  reprice.
- **Low churn (rarely):** name, network, tier, colour, `credit_score_min`, income
  eligibility.
- Implication: a single card-level `last_verified` is the wrong model. Provenance
  should be **per volatile field**, with a volatility class driving cadence.

### Automatable vs needs-a-human
- **Automate — detection, not truth:** snapshot each issuer source page on a
  schedule and diff it; when the page changes, open a "re-verify X" task. Also:
  cross-source consistency checks (does our rate match paisabazaar within tolerance?)
  and staleness reports (what hasn't been re-checked in N days). The devaluation feed
  already does a slice of this.
- **Human sign-off required — extraction and judgement:** reading a T&C PDF and
  pulling the correctly-*capped* rate (the in-file Infinia note shows a naive number
  running ~13× too high), resolving live-vs-source conflicts, and mapping a marketing
  "up to X%" onto our `base_reward_rate`. An LLM can *draft* the extraction with
  citations; a human approves, because users act on these as financial facts.

### Proposed process shape
1. **Per-field provenance:** replace the single `last_verified` with
   `{ value, source_url, verified_at, verified_by }` on volatile fields (at minimum a
   real per-card `verified_at` + `sources[]`). Until then, `last_verified` should be
   **null**, not bulk-set — "unknown" must not masquerade as "checked."
2. **Snapshot + diff bot:** store a hash/snapshot per issuer source; a scheduled job
   diffs and files re-verify tasks. Automates *when to look*, never *what to write*.
3. **LLM-drafted extraction + human approval:** the re-verify task ships a draft with
   citations; a human approves; approval stamps provenance.
4. **Consistency gate:** flag cards whose values disagree with a secondary source
   beyond tolerance — the same NEW_CARDS-vs-live class, but against the outside world.
5. **Public honesty:** cards not verified under this process render an
   "unverified / estimated" flag — same principle as the verified-vs-estimated points
   moat. "We don't guess your money" should extend to "we don't guess your card's
   terms."

### Rough cost (labour hours, honest estimate — not researched)
- **Initial pass:** ~15–30 min/card for a trained non-expert (read MITC + product
  page, fill ~15 fields, cite) → **≈12–25 h one-time** for 49 cards. LLM-drafting
  could cut it to ~10 min/card of human review → **≈8–12 h**.
- **Ongoing WITH change-detection:** re-verify fires only on real changes, ~20–40% of
  cards/quarter → **≈3–8 h/quarter**.
- **Ongoing WITHOUT detection:** a blind quarterly re-check of all 49 ≈ the full
  initial cost *every quarter* — unsustainable, which is precisely why detection (not
  hand-fixing) is the thing worth building first.

This maps cleanly onto the CLAUDE.md hiring thesis (advisors = ex-UPSC aspirants,
teachers, journalists): reading a primary document and extracting the true number is
exactly their skill, and exactly what should not be faked by a bulk date-stamp.

### Contested inputs poison RANKINGS in a way the UI cannot mark — the strongest case for the process

We can grey a contested *number* and badge a contested *row* (the `--prov-estimated`
treatment now does both, from a single component). **We cannot grey a *rank
position*.** A contested `base_reward_rate` / fee / `reward_currency` flows through
`calculateAnnualValue` → `matchCards`, which **sorts the whole catalogue by that
value** (`lib/engine.ts` L279–304). So a single wrong input does not just mislabel
one card — it can **reorder the list**, and every card above and below the contested
one inherits a position that is partly a function of a disputed number, with **no
visible mark on them**. The row badge can say "this row's slot is uncertain"; it
cannot say "row 3 might really be row 6," and it cannot mark the innocent rows whose
rank shifted because a contested card was mis-valued.

Approval odds have the same property: `approvalProbability` consumes the contested
`min_income_inr_monthly` / `credit_score_min`, and the results are **sorted** by it.

Ranking is therefore the one surface where honesty is **impossible without correct
inputs** — no provenance styling can rescue it. That makes the verification process
(§8 above) a **prerequisite for trustworthy ranking, not a nice-to-have.** It is the
strongest argument in this document for actually doing the work: every ranked surface
the product leans on to help people *compare and choose* is silently degraded for as
long as the inputs are unverified, and the degradation cannot be shown to the user.

### Where contested values still render UNMARKED (the complete list)

The `--prov-estimated` treatment reaches every value/row routed through
`EstimatedValue` / `UnverifiedRowBadge` (`components/cards/Unverified.tsx`). **Marked
(8 surfaces):** card-detail metrics + computed value; marketing & design card tiles'
fee + primary value + ranked-row badge; the two marketing ranking tables (value + row);
approval-odds % + row; smart-match %; both compare pages' contested cells (and the
head-to-head suppresses its WINNER verdict when either side is contested); and
`/rewards-calculator`'s "your card" result (keyed on the selected slug — the surface
where a contested base rate does the most damage, because the user enters their own
spend so the output reads as a personal fact). For completeness, the places a contested
value can STILL render without a mark — by deliberate choice or by nature — are:

1. **Rank / sort position itself** — a computed ordering cannot be greyed (above). The
   row badge flags the contested row; neighbouring rows shift silently.
2. **`/rewards-calculator` "best for you" card** — only the user's *selected* card is
   marked. If the engine's recommended `best_card` is itself flagged, its figure is not
   greyed: `result.best_card` carries no slug to key on (only name / apply_url), so it is
   not keyable without threading the slug through the result shape.
3. **Marketing `CardTile` feature chips** (`getKeyFeatures`: "Rs.X/year", "Y% rewards").
   The tile carries the row badge when ranked (CardCatalog), marking the whole card; the
   individual chip values are not greyed.
4. **`/card/[slug]` `reward_currency` headline** — appears only as prose ("Every way to
   spend your <currency>"), not a data metric; greying a word mid-heading reads as
   broken. Carried instead by the greyed computed value on the same page.
5. **approval-odds reason text** — free-text ("Income Rs.X below Rs.Y required") may cite
   a contested income; the % and row are marked, the sentence is not.
6. **Any slug NOT in `UNVERIFIED_CARD_FIELDS`** — the treatment is only as complete as
   that map (see the scaling limit below); a newly-discovered conflict renders
   confidently until it is added.
7. **DB-sourced numbers** — `compare/[slug]` reads the `cards` table; the mark is keyed
   on the URL slug (correct), but the displayed NUMBER is whatever the DB row holds,
   which may differ from SEED_CARDS.

Items 1 and 7 are structural (can't be fixed by styling); 2–6 are deliberate scope
calls. This list is exhaustive as of this pass — if a 9th surface is found, it belongs
here.

### This treatment is a MAP-BASED PATCH — do NOT extend the list to 40 slugs

The whole treatment works because **four slugs happen to sit in a hardcoded set**
(`UNVERIFIED_CARD_FIELDS` in `lib/data/unverified-cards.ts`). That is fine for four
known conflicts surfaced by one dead-code collision. **It does not scale.** In a
catalogue where any card can be contested at any time — a bank reprices, a scraper
disagrees with the stored value, a verification lapses — maintaining a parallel
hardcoded list of "which fields on which cards are disputed" is a second source of
truth that will silently drift from reality, exactly like `NEW_CARDS` did.

**The durable version is a per-field verification STATE on the card data itself**, not a
side-list. Each volatile field carries `verified | unverified | disputed` (plus the
provenance from §8: `source_url`, `verified_at`, `verified_by`), and the UI reads *that
state* — `EstimatedValue`/`UnverifiedRowBadge` switch on `field.state === 'disputed'`
instead of `isFieldUnverified(slug, field)`. Then a newly-contested card is marked the
instant its data is marked, with no code change and no list to extend. **If you find
yourself adding a fifth, sixth, … slug to `UNVERIFIED_CARD_FIELDS`, stop and build the
state field instead** — that is the signal the patch has outlived its purpose.

### What this treatment does and does not achieve

**Does:** it marks uncertainty *at the point a contested value renders* — greys the
number to estimated-provenance, exposes the reason, and (on the head-to-head compare)
withholds a verdict computed from a disputed number. A user who reads the value sees
that it is being re-verified.

**Does not:** it cannot mark uncertainty in a **rank position**, or in **any ordering
derived from a contested value**. When a disputed input flows through
`calculateAnnualValue` → `matchCards` and the list is sorted, the contested card's *row*
can be badged but its *position* cannot, and the innocent cards whose position shifted
because of it carry no mark at all. **This limit is not fixable by UI** — only correct
inputs fix it. That is the boundary of what marking can buy, and the reason §8's
verification process is the real fix, not this treatment.

**Do not blind-promote `NEW_CARDS` into runtime** — its values are unverified
(§3) and would overwrite shipped financial facts.
