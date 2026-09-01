# CreditIQ — Redemption engine, v3.1

**1 Sep 2026 · replaces v3, and through it
`REDEMPTION-FULL-FLOW-2026-09-01.md` and `REDEMPTION-ENGINE-SPEC-2026-09-01.md`**

Nothing is built. This is the spec to lock.

---

## 0. What v3.1 changes

Thirteen corrections, three of which change results rather than types.

**Premature flooring was costing the user money.** v3 computed a per-point value
in paise and floored it before multiplying. At €1 = ₹110.50 that is exact and
harmless; at ₹96.20 it floored 192.4 → 192 and produced ₹7,680 where the correct
figure is ₹7,696. All arithmetic is now integer rationals, rounded once at the
boundary.

**Marriott was modelled with the wrong mechanic.** A dynamic Bonvoy award is
points-plus-taxes buying the night, not points reducing a cash bill. `AWARD_PRICE`
now spans both `PUBLISHED_CHART` (entry from a chart) and `QUOTE_REQUIRED`
(entry from the user). The cash fare is a benchmark in both, never a bill.

**The stop-climbing rule was deleting the answer.** v3 pruned candidates whose
marginal rate fell below the portal rate — before the objective ran. Under
`MINIMISE_CASH_TODAY` that can delete the cheapest candidate. Pruning is now
limited to illegal and Pareto-dominated candidates; marginal rate is a reported
diagnostic.

Everything else is a type-safety or semantics correction, listed inline.

---

## 1. Arithmetic primitives

```ts
/** Integers only, den > 0. Never a JS float in decision logic. */
interface Rational { num: number; den: number }

// compare(a, b) → a.num * b.den <=> b.num * a.den   (cross-multiplication)
// Round ONCE, at the presentation or storage boundary, never mid-chain.
```

Money is integer minor units — paise for INR, cents for EUR. Percentages are
basis points: `max_share_of_eligible_bp = 7000`, `fee_tax_rate_bp = 1800`.
Ratios are integer pairs: `{ fromUnits: 2, toUnits: 1 }`.

### 1.1 FX units, stated once

The 100× error class this closes: v3 wrote `₹110.50/EUR` in prose and `11,050`
in worked examples under names that did not say which.

```ts
interface FxRate {
  base: 'EUR';
  quote: 'INR';
  /** Paise per ONE WHOLE base unit. €1 = ₹110.50 → 11050. Integer. Never 110.5. */
  quoteMinorPerBaseUnit: number;
  as_of: string;
}
```

The offset for `n` programme points under a fixed-value rule, in one integer
expression with a single floor:

```
offsetPaise = floor( n × amount_minor × quoteMinorPerBaseUnit
                     / (rule_points × baseMinorPerBaseUnit) )
```

For Accor, `amount_minor = 4000` cents, `rule_points = 2000`,
`baseMinorPerBaseUnit = 100`:

```
n = 4000, fx = 11050 → 4000 × 4000 × 11050 / (2000 × 100) = 884,000 paise = ₹8,840
n = 4000, fx =  9620 → 4000 × 4000 ×  9620 / 200,000      = 769,600 paise = ₹7,696
```

Test 24 asserts the first figure exactly. An `fx` of `110`, `1105` or `1105000`
each fail it by orders of magnitude.

### 1.2 Rounding, by hop

| Hop | Rule | Direction |
|---|---|---|
| bank → programme points | `floor(bank × toUnits / fromUnits)` | down |
| programme points → bank required | `ceil(need × fromUnits / toUnits)` | up |
| bank required → permitted transfer amount | `ceil` to `min_transfer` then to `transfer_increment` | up |
| permitted redemption amount | largest permitted ≤ max useful | down |
| foreign value → paise | single `floor`, per §1.1 | down |
| fee + tax | `ceil(fee_minor × (10000 + tax_bp) / 10000)` | up |
| portal cap | `floor(eligible × cap_bp / 10000)` | down |
| portal points usable | `floor(capMinor / value_paise_per_point)` | down |

Multi-hop transfers floor at each hop. **Round only in the direction that
cannot flatter the recommendation.**

---

## 2. A · Type model

### 2.1 Rules — a discriminated union on `pricing`

Impossible combinations are now unconstructable rather than merely undocumented.

```ts
type Mechanic = 'CASH_OFFSET' | 'AWARD_PRICE';

interface RulesBase {
  programme_id: string;
  currency_label: string;                  // 'Accor ALL points' — never bare 'points'
  requires_direct_booking: Sourced<boolean>;
  booking_url: string;
}

interface FixedValueRules extends RulesBase {
  pricing: 'FIXED_VALUE';
  mechanic: 'CASH_OFFSET';
  fixed_value: Sourced<{ points: number; amount_minor: number; currency: 'EUR' }>;
  permitted_amounts: Sourced<PermittedAmounts>;
  programme_eligible: Sourced<EligibleBasis>;
  programme_eligible_bounds?: { minMinor: number; maxMinor: number };  // see §5.3
  min_booking_value_rule: Sourced<'MUST_EXCEED_POINTS_VALUE' | 'NONE'>;
}

interface ChartAwardRules extends RulesBase {
  pricing: 'PUBLISHED_CHART';
  mechanic: 'AWARD_PRICE';
  award_chart: Sourced<{
    entries: Array<{
      zone_id: string; cabin: string; fare_tier: string;   // Value | Prime
      points: number;
      taxes_minor?: number;                // absent => UNKNOWN, suppresses the cash figure
    }>;
  }>;
}

interface QuotedAwardRules extends RulesBase {
  pricing: 'QUOTE_REQUIRED';
  mechanic: 'AWARD_PRICE';                 // CORRECTED — was CASH_OFFSET in v3
  quote?: AwardQuote;                      // absent => RecommendedPath 'QUOTE_REQUIRED'
}

interface NotPricedRules extends RulesBase {
  pricing: 'NOT_PRICED';
  mechanic: null;
}

type RedemptionRules =
  | FixedValueRules | ChartAwardRules | QuotedAwardRules | NotPricedRules;

interface AwardQuote {
  programme_points: number;
  taxes_minor?: number;                    // absent => UNKNOWN
  captured_at: string;
  provenance: 'USER_ENTERED' | 'LIVE_LOOKUP';
}

interface PermittedAmounts {
  conservative: { min: number; increment: number };
  disputed: number[];
  max_per_booking?: number;
}

interface EligibleBasis { basis: 'TOTAL' | 'ROOM_ONLY' | 'ROOM_PLUS_TAX'; excluded: string[] }
```

`AWARD_PRICE` spanning both chart and quote is the correction that matters:
whether the entry came from a published chart or from the user changes its
provenance, not its arithmetic. Both yield `programmePoints + awardTaxes`.
Neither ever produces a cash-offset calculation.

### 2.2 Transfer route — absence is a variant, not a null-filled record

```ts
interface ActiveTransferRoute {
  status: 'ACTIVE';
  card_id: string; programme_id: string;
  ratio: Sourced<{ fromUnits: number; toUnits: number }>;
  min_transfer?: Sourced<number>;          // BANK points; absent => RATIO_ONLY
  transfer_increment?: Sourced<number>;    // BANK points; absent => RATIO_ONLY
  duration_hours: Sourced<{ min: number; max: number }>;
  reversible: false;
}

interface EndedTransferRoute {
  status: 'ENDED';
  card_id: string; programme_id: string;
  ended_on: Sourced<string>;               // Etihad Guest, 30 Jun 2026
  historic_ratio?: Sourced<{ fromUnits: number; toUnits: number }>;   // preserved, unusable
}

interface NoTransferRoute {
  status: 'UNAVAILABLE';
  card_id: string; programme_id: string;
  /** Sourced absence beats missing data — plain Regalia genuinely has no
   *  transfer programme, which is different from us holding no edge. */
  absence_state: 'SOURCED_NONE' | 'NOT_CAPTURED';
}

type TransferRoute = ActiveTransferRoute | EndedTransferRoute | NoTransferRoute;
```

`UNAVAILABLE` no longer requires a fabricated ratio or duration. `ENDED` keeps
its historic terms for display and cannot be used for arithmetic.

### 2.3 Balances

```ts
interface BankBalance {
  card_id: string; points: number;
  provenance: 'STATEMENT' | 'SELF_ENTERED';
  expires_on?: Sourced<string>;            // absent = UNKNOWN. No "never expires" value exists.
}

interface ProgrammeBalance {
  programme_id: string; points: number;
  provenance: 'PROGRAMME_LINKED' | 'STATEMENT' | 'SELF_ENTERED';
  expires_on?: Sourced<string>;
  inactivity_rule?: Sourced<{ months: number }>;   // absent = unknown, never 'safe'
}
```

### 2.4 Candidate and plan

```ts
type Objective =
  | 'MINIMISE_CASH_TODAY'
  | 'MAXIMISE_BANK_POINT_EFFICIENCY';   // RENAMED — the metric divides by bank
                                        // points only and does not price the
                                        // pre-existing programme points consumed

interface RedemptionCandidate {
  kind: 'PROGRAMME' | 'PORTAL' | 'CASH';
  mechanic: Mechanic | null;

  programmePointsSpent: number;
  existingProgrammePointsConsumed: number;
  programmePointsReceived: number;
  residualProgrammeBalance: number;
  strandedResidualProgrammePoints: number;

  bankPointsRequiredMinimum: number;       // pure arithmetic requirement
  bankPointsToTransferExact: number | null;// after min + increment; null if unverified
  bankPointsRetained: number;

  offsetMinor: number | null;              // CASH_OFFSET only
  awardTaxesMinor: number | null;          // AWARD_PRICE only
  benchmarkCashFareMinor: number | null;   // AWARD_PRICE only — a comparison, not a bill
  benchmarkState: 'CAPTURED' | 'STALE' | 'UNAVAILABLE' | null;
  feeMinor: number;
  cashPayableMinor: number;

  /** CASH_OFFSET only. Booking-specific. Legitimately exceeds the conversion
   *  rate when it unlocks a latent programme balance. Never rendered without
   *  its qualifier; never used as the programme-level comparison rate. */
  incrementalBookingOffsetPerTransferredBankPointPaise: Rational | null;

  /** AWARD_PRICE only. Depends on benchmarkCashFare, so it inherits that
   *  figure's staleness and must be shown with it. */
  cashAvoidedPerTransferredBankPointPaise: Rational | null;

  /** Diagnostic. NOT a pruning input. */
  marginalRateVsPreviousCandidate: Rational | null;

  instructionBlocked:
    | 'TRANSFER_INCREMENT_UNVERIFIED'
    | 'TRANSFER_MINIMUM_UNVERIFIED'
    | 'PROGRAMME_ELIGIBLE_AMOUNT_UNKNOWN'
    | 'RATIO_SOURCE_CONFLICT'
    | null;

  durationHours: { min: number; max: number } | null;
  irreversible: boolean;
  provenance: Sourced<unknown>[];
}

interface RedemptionPlan {
  pricingState: PricingState;
  transferState: TransferState;
  balanceState: BalanceState;
  ruleState: RuleState;
  recommendedPath: RecommendedPath;
  objective: Objective;

  /** Programme-level, property-independent for FIXED_VALUE. The number that
   *  decides transfer vs portal. Distinct from every per-candidate metric. */
  conversionValuePerBankPointPaise: Rational | null;
  fxState: 'LIVE' | 'UNAVAILABLE';

  candidates: RedemptionCandidate[];
  recommended: RedemptionCandidate | null;
  runnerUpUnderOtherObjective: RedemptionCandidate | null;

  balances: {
    bank: { points: number; expiresOn: string | null };
    programme: { points: number; expiresOn: string | null; latentPoints: number };
  };

  eliminated: Array<{
    reason: 'UNAFFORDABLE' | 'UNAFFORDABLE_AFTER_INCREMENT' | 'ILLEGAL_AMOUNT'
          | 'DOMINATED' | 'TRANSFER_UNAVAILABLE' | 'RULE_UNKNOWN';
    wouldHaveSpent: number;
  }>;

  conflicts: ConflictReport[];
  blockedReason: string | null;
  provenance: Sourced<unknown>[];
}
```

**Latent points.** Programme points below the smallest permitted redemption have
zero standalone redeemable value today and non-zero latent value — adding points
unlocks them. They are never called worthless and never valued at the conversion
rate. What the engine reports is what each candidate does to them.

---

## 3. State model

```ts
type PricingState  = 'FIXED_VALUE' | 'PUBLISHED_CHART' | 'QUOTE_REQUIRED' | 'NOT_PRICED';
type TransferState = 'VERIFIED' | 'RATIO_ONLY' | 'UNAVAILABLE' | 'ENDED';
type BalanceState  = 'SUFFICIENT' | 'SUFFICIENT_VIA_PROGRAMME_BALANCE'
                   | 'PARTIAL' | 'BELOW_MINIMUM';
type RuleState     = 'VERIFIED' | 'SOURCE_CONFLICT' | 'UNKNOWN';

type RecommendedPath =
  | 'TRANSFER_THEN_BOOK' | 'REDEEM_EXISTING_BALANCE' | 'PORTAL'
  | 'CASH_AND_RETAIN' | 'QUOTE_REQUIRED' | 'NO_RECOMMENDATION';
```

### 3.1 `BalanceState`, defined

v3 mislabelled §7.1 as `SUFFICIENT_VIA_PROGRAMME_BALANCE` when the bank balance
alone reached the largest candidate. The state is about **affordability**; that
a candidate consumes existing programme points is a candidate property, reported
per candidate, not a plan-level state.

Let `L` be the legal spend set, `A_bank` those reachable from the bank balance
alone, `A_all` those reachable using bank plus programme balance.

| State | Condition |
|---|---|
| `BELOW_MINIMUM` | `A_all` is empty |
| `SUFFICIENT` | `max(A_bank) = max(L)` |
| `SUFFICIENT_VIA_PROGRAMME_BALANCE` | `max(A_bank) < max(L) = max(A_all)` |
| `PARTIAL` | `A_all` non-empty and `max(A_all) < max(L)` |

`CASH_OFFSET`: `L` is the permitted set filtered by max-useful and eligibility,
so all four states occur. `AWARD_PRICE`: `L` has exactly one member, so `PARTIAL`
is unreachable and `BELOW_MINIMUM` means the single award price is out of reach.

Affordability is evaluated **after** `min_transfer` and `transfer_increment` are
applied. A requirement of 5,600 that rounds to a permitted 6,000 against a
balance of 5,800 is unaffordable, and is eliminated with reason
`UNAFFORDABLE_AFTER_INCREMENT` — not surfaced as a plan the user cannot execute.

### 3.2 Derivation

Precedence governs **elimination**, never generation.

1. Generate all candidates, always, including every zero-transfer candidate.
2. `NOT_PRICED` → suppress programme candidates.
3. `QUOTE_REQUIRED` with no quote → `QUOTE_REQUIRED`; portal and any
   zero-transfer programme candidate still costed.
4. Route `UNAVAILABLE` or `ENDED` → suppress candidates with
   `bankPointsRequiredMinimum > 0`. Zero-transfer candidates survive and can be
   selected as `REDEEM_EXISTING_BALANCE`.
5. Amount-rule `UNKNOWN` → suppress programme candidates.
6. `RATIO_ONLY`, or `programme_eligible` `UNKNOWN` → candidates survive and
   rank; `bankPointsToTransferExact` is null and `instructionBlocked` is set.
7. `BELOW_MINIMUM` → `NO_RECOMMENDATION`, with portal and cash both fully
   costed and neither selected.
8. Otherwise rank per §5.

`ENDED` is the sharpest case for rule 4. Etihad transfers ended permanently on
30 June 2026 and a holder of an Etihad balance can still spend it; v3's
predecessor routed them to the portal and left the balance untouched.

### 3.3 `SOURCE_CONFLICT`, per fact class

v3 applied one policy — conservative intersection — to every conflict. That is
correct for set-valued facts and wrong for numeric ones, where "conservative" is
not well defined and a single reading would have been silently chosen.

```ts
interface ConflictReport {
  fact: 'PERMITTED_AMOUNTS' | 'TRANSFER_RATIO' | 'FIXED_VALUE'
      | 'PORTAL_VALUE' | 'PORTAL_CAP' | 'FEE' | 'ELIGIBLE_BASIS';
  policy: 'INTERSECT' | 'INVARIANCE_TEST' | 'BLOCK';
  readings: unknown[];
  pathInvariant: boolean | null;
  effect: string;
}
```

| Fact | Policy | Behaviour |
|---|---|---|
| Permitted amounts (set-valued) | `INTERSECT` | plan the intersection of all readings; surface the disputed members; rank normally |
| Transfer ratio | `BLOCK` | no exact instruction under any objective. A wrong ratio on an irreversible transfer is unrecoverable |
| Fixed programme value, portal value, portal cap, fee | `INVARIANCE_TEST` | evaluate the whole plan under **every** reading. If `recommendedPath` is identical across all, recommend and annotate. If it differs, `NO_RECOMMENDATION` with the divergence reported |
| Eligible basis | `INVARIANCE_TEST` | as above, using the bounds in §5.3 |

The invariance test generalises the intersection rule: recommend only what every
published reading agrees on. Readings are few, so the cost is a handful of extra
evaluations.

### 3.4 Why the conservative intersection, for Accor

| Source | Reading | Permitted set |
|---|---|---|
| Accor terms, 21 Aug | minimum 2,000, in 2,000-point increments | 2,000; 4,000; 6,000 … |
| Handoff, 31 Aug | 1,000, then increments of 2,000 | ambiguous |
| ALL T&C effective 13 Jul 2026 | 1,000 = €20 or 2,000 = €40; above 2,000, multiples of 2,000 | 1,000; 2,000; 4,000 … |

Every reading permits 2,000 and its multiples. The disputed value is the 1,000
floor, and it is worth ₹1,924 to a user holding 1,200 points. **Only the
logged-in Accor checkout amount field settles it** — the terms pages are what
disagree.

---

## 4. B · Candidate generation

```
function findPermittedRedemptions(booking, bank, programmeBalance,
                                  rules, route, portal, fx):

  candidates = [ CASH candidate ]                       # always legal

  # ---- portal, on ITS OWN eligible basis ----
  portalEligible = resolve(booking, portal.eligible_basis)      # NOT the programme's
  capMinor       = floor(portalEligible × portal.cap_bp / 10000)
  pointsUsable   = min(bank.points, floor(capMinor / portal.value_paise_per_point))
  feeMinor       = ceil(portal.fee_minor × (10000 + portal.fee_tax_bp) / 10000)
  candidates.push(PORTAL{
      offsetMinor  = pointsUsable × portal.value_paise_per_point,
      cashPayable  = booking.gross − offsetMinor + feeMinor,
      bankRetained = bank.points − pointsUsable,
      residualProgrammeBalance = programmeBalance.points,     # untouched — report it
      strandedResidual = programmeBalance.points < permitted.min
                         ? programmeBalance.points : 0 })

  if rules.pricing == NOT_PRICED: return candidates
  if rules.permitted_amounts?.state == UNKNOWN: return candidates

  # ---- determine the legal spend set, by mechanic ----
  switch rules.mechanic:

    case CASH_OFFSET:                                    # FIXED_VALUE
      programmeEligible = resolveEligible(booking, rules)        # §5.3 if UNKNOWN
      permitted         = rules.permitted_amounts.conservative
      # exact rational; NO per-point floor
      maxUseful = maxN such that offsetPaise(N, rules, fx) <= programmeEligible
      L = [ a in permitted : a <= maxUseful
            and offsetPaise(a, rules, fx) <= programmeEligible ]   # min_booking_value_rule

    case AWARD_PRICE:                                    # PUBLISHED_CHART or QUOTE_REQUIRED
      entry = rules.pricing == 'PUBLISHED_CHART'
              ? rules.award_chart.lookup(route, cabin, fare_tier)
              : rules.quote                              # user-supplied; same shape
      if entry is absent: return candidates + QUOTE_REQUIRED marker
      L = [ entry.programme_points ]                     # indivisible: one candidate

  # ---- THE ZERO-TRANSFER CANDIDATE IS GENERATED FIRST AND UNCONDITIONALLY ----
  for spend in ascending(L):
      fromExisting = min(spend, programmeBalance.points)
      shortfall    = spend − fromExisting
      bankRequired = shortfall == 0 ? 0
                   : ceil(shortfall × ratio.fromUnits / ratio.toUnits)

      if bankRequired > bank.points:
          eliminated.push(UNAFFORDABLE, spend); continue

      exact = null
      if route.status == ACTIVE
         and route.min_transfer.verified
         and route.transfer_increment.verified
         and ratio has no SOURCE_CONFLICT:
             exact = roundUpToIncrement(max(bankRequired, route.min_transfer))
             # CORRECTED: re-check affordability AFTER rounding
             if exact > bank.points:
                 eliminated.push(UNAFFORDABLE_AFTER_INCREMENT, spend); continue

      sent      = exact ?? bankRequired
      received  = floor(sent × ratio.toUnits / ratio.fromUnits)
      residual  = programmeBalance.points + received − spend
      stranded  = (mechanic == CASH_OFFSET and residual < permitted.min) ? residual : 0

      if mechanic == CASH_OFFSET:
          offset      = offsetPaise(spend, rules, fx)
          cashPayable = booking.gross − offset
          awardTaxes  = null;  benchmark = null
      else:
          offset      = null
          awardTaxes  = entry.taxes_minor            # absent => suppress the cash figure
          cashPayable = awardTaxes                   # NOT gross − a notional value
          benchmark   = booking.cash_fare_minor      # comparison only

      candidates.push(PROGRAMME{...})

  return candidates
```

Two properties easy to lose in implementation: the zero-transfer candidate is
generated before any availability check, and affordability is tested twice —
once on the arithmetic requirement, once after increment rounding.

---

## 5. C · Ranking

```
function rankCandidates(candidates, objective, transferState, conflicts):

  survivors = candidates

  # ---- ELIMINATION: only illegal or truly dominated ----
  if transferState in (UNAVAILABLE, ENDED):
      survivors = drop where bankPointsRequiredMinimum > 0

  # Pareto dominance across all three consumed resources.
  # A dominates B iff A costs no more cash, no more bank points and no more
  # existing programme points, and is strictly better on at least one.
  survivors = drop B where exists A in survivors:
      A.cashPayableMinor              <= B.cashPayableMinor
      and A.bankPointsRequiredMinimum <= B.bankPointsRequiredMinimum
      and A.existingProgrammePointsConsumed <= B.existingProgrammePointsConsumed
      and at least one strict

  # ---- DIAGNOSTICS: computed, reported, NEVER used to prune ----
  # v3 pruned on marginal rate here and could delete the very candidate
  # MINIMISE_CASH_TODAY was asked to find.
  for adjacent pairs in ascending programmePointsSpent:
      c.marginalRateVsPreviousCandidate =
          rational(c.offset − prev.offset, c.bankRequired − prev.bankRequired)
  for each c:
      c.incrementalBookingOffsetPerTransferredBankPointPaise =   # CASH_OFFSET
          c.bankRequired > 0 ? rational(c.offsetMinor, c.bankRequired) : null
      c.cashAvoidedPerTransferredBankPointPaise =                # AWARD_PRICE
          c.bankRequired > 0 && c.benchmarkState != UNAVAILABLE
            ? rational(c.benchmarkCashFareMinor − c.awardTaxesMinor, c.bankRequired)
            : null

  # ---- ORDER: objective applies only to survivors ----
  if objective == MINIMISE_CASH_TODAY:
      order by cashPayableMinor asc, then bankPointsRequiredMinimum asc
  if objective == MAXIMISE_BANK_POINT_EFFICIENCY:
      order by the mechanic-appropriate per-bank-point rational desc
              (compare by cross-multiplication, never by float),
              candidates with bankRequired = 0 ranked first

  # ---- INVARIANCE GATE (§3.3) ----
  if any conflict.policy == INVARIANCE_TEST and not conflict.pathInvariant:
      return NO_RECOMMENDATION with all candidates and the divergence reported

  recommended = survivors.first
  runnerUp    = re-rank under the other objective; return if it differs

  return { ordered: survivors, recommended, runnerUp }
```

### 5.1 On the objective

`MAXIMISE_BANK_POINT_EFFICIENCY` is the honest name: the metric divides by bank
points only and does not price the pre-existing programme points a candidate
consumes. A zero-transfer candidate is not economically free merely because it
spends no bank points — it spends programme points, which had latent value.
Pricing that would require a programme-point valuation nobody has sourced, so
the engine reports the consumption rather than monetising it.

`MINIMISE_CASH_TODAY` is the default because §6.2 and §8 both contain cases
where the two objectives select different candidates, and because it reproduces
the intuitive verdicts on both Accor scenarios. The other objective's pick is
always returned as the runner-up, never silently discarded.

### 5.2 Direct-booking exclusivity

`requires_direct_booking = true` (Accor) makes portal and programme candidates
mutually exclusive on one booking. Spend 2,000 points *and* portal the remainder
is not a legal candidate. Where direct booking is not required, it would be, and
the generator should be extended rather than the rule assumed away.

### 5.3 Unknown programme eligibility — and what it actually costs

An `UNKNOWN` eligible basis is handled by evaluating the plan at both ends of
`programme_eligible_bounds` and applying the invariance test.

**The bounds are what make this workable, and v3 did not have them.** Without a
lower bound the range runs to zero, no programme candidate survives at the
bottom, the path is never invariant, and the engine returns `NO_RECOMMENDATION`
on every Accor booking. That is worth stating plainly: unknown eligibility is
not merely blocking the exact instruction as v3 claimed — **unbounded, it blocks
the recommendation itself.**

The bracket is available from data already held: `minMinor` = room-only,
`maxMinor` = gross total. Both are in the seed. With that bracket, invariance
usually holds and the plan ranks; the exact instruction stays blocked either
way. Gate 2 in §9 is therefore the most urgent of the three, and the interim
mitigation is populating `programme_eligible_bounds` from the seed rather than
waiting on Accor.

---

## 6. E · Worked Accor cases

Constants: `fixed_value` 2,000 points = 4,000 cents. Ratio `fromUnits: 2,
toUnits: 1`. Portal 100 paise/point, `cap_bp 7000`, `fee_minor 9900`,
`fee_tax_bp 1800` → `ceil(9900 × 11800 / 10000)` = 11,682 paise. Permitted
`{ min: 2000, increment: 2000 }`.

### 6.1 Transfer wins

Gross ₹12,292 (1,229,200 paise). Programme-eligible ₹11,400. Bank 11,400
Infinia. Programme balance 1,200 ALL. `fx.quoteMinorPerBaseUnit = 11050`.

```
maxUseful : largest n with floor(n × 4000 × 11050 / 200000) <= 1,140,000  → 5,158
L         = {2000, 4000}
A_bank    : 4000 needs 8,000 bank <= 11,400  →  max(A_bank) = 4000 = max(L)
BalanceState = SUFFICIENT          (CORRECTED — v3 said VIA_PROGRAMME_BALANCE)
latentProgrammePoints = 1,200      (below the 2,000 minimum)
```

| | Spend 2,000 | Spend 4,000 | Portal | Cash |
|---|---|---|---|---|
| existing programme consumed | 1,200 | 1,200 | 0 | 0 |
| bank required | 1,600 | 5,600 | 8,604 | 0 |
| offset | ₹4,420 | ₹8,840 | ₹8,604 | — |
| fee | — | — | ₹116.82 | — |
| **cash payable** | ₹7,872 | **₹3,452** | ₹3,804.82 | ₹12,292 |
| bank retained | 9,800 | 5,800 | 2,796 | 11,400 |
| residual programme | 0 | 0 | 1,200 stranded | 1,200 stranded |
| incremental offset per transferred bank point | ₹2.7625 | ₹1.5786 | — | — |
| marginal vs previous | — | ₹1.105 | — | — |

Dominance: none. Spend-4,000 beats the portal on cash and bank points but
consumes 1,200 existing programme points the portal leaves alone, so it does not
dominate. All four survive to ranking — which is the point of correction 10.

`MINIMISE_CASH_TODAY` → spend 4,000, ₹3,452.
`MAXIMISE_BANK_POINT_EFFICIENCY` → spend 2,000 at ₹2.7625, returned as runner-up.

The marginal step is exactly ₹1.105 — the conversion rate — and the conversion
rate is identical on all twenty Accor properties. ₹2.7625 and ₹1.5786 are
booking-specific and are neither the value of an Infinia point nor comparable
across properties.

### 6.2 The exchange rate flips it

Same inputs, `fx = 9620`.

```
offset(2000) = floor(2000 × 4000 × 9620 / 200000) = 384,800 = ₹3,848
offset(4000) = floor(4000 × 4000 × 9620 / 200000) = 769,600 = ₹7,696
```

v3 floored the per-point value to 192 paise first and published ₹3,840 and
₹7,680. The premature floor cost ₹16 on the larger candidate.

| | Spend 2,000 | Spend 4,000 | Portal |
|---|---|---|---|
| bank required | 1,600 | 5,600 | 8,604 |
| cash payable | ₹8,444 | **₹4,596** | **₹3,804.82** |
| incremental offset per bank point | ₹2.405 | ₹1.3743 | — |
| marginal vs previous | — | ₹0.962 | — |

`MINIMISE_CASH_TODAY` → portal, ₹3,804.82.
`MAXIMISE_BANK_POINT_EFFICIENCY` → spend 2,000 at ₹2.405, still the best rate on
the board because it is unlocking latent points.

Both defensible, different candidates. This is the case that makes the objective
a parameter rather than a hidden assumption. Note that under v3's stop-climbing
rule the spend-2,000 candidate would have been pruned before the objective ran.

---

## 7. F · Marriott — `QUOTE_REQUIRED` + `AWARD_PRICE`

Corrected mechanic. v3 modelled a dynamic Bonvoy award as a cash offset, which
produced a cash remainder the user never pays.

Benchmark cash fare ₹18,640 (2 nights, captured, dated). Bank 11,400 Infinia.
Bonvoy balance 8,000. Ratio `fromUnits: 2, toUnits: 1`, 48–96h.

With no quote supplied: `RecommendedPath = QUOTE_REQUIRED`. The portal candidate
is still costed, and a zero-transfer programme candidate would be costed too if
8,000 Bonvoy covered the award.

With a user-supplied quote of **50,000 Bonvoy + taxes unknown**:

```
shortfall     = 50,000 − 8,000 = 42,000
bankRequired  = ceil(42,000 × 2 / 1) = 84,000  >  11,400
→ eliminated, reason UNAFFORDABLE.  BalanceState = BELOW_MINIMUM.
→ RecommendedPath = NO_RECOMMENDATION (§3.2 rule 7); portal and cash costed.
```

Portal, for comparison: `cap = floor(1,864,000 × 7000 / 10000)` = 1,304,800;
`pointsUsable = min(11,400, 13,048)` = 11,400; cash payable
`1,864,000 − 1,140,000 + 11,682` = ₹7,356.82.

Two thresholds, both reported, both derived in bank-point currency:

```
portal cash avoided        = 1,864,000 − 735,682 = 1,128,318 paise over 11,400 pts
award beats portal when     1,864,000 / B  >  1,128,318 / 11,400
                       →    B <= 18,832 bank points
                       →    Bonvoy shortfall <= 9,416
                       →    quote <= 17,416 Bonvoy points
affordability ceiling       B <= 11,400 → shortfall <= 5,700 → quote <= 13,700
```

Affordability binds first at **13,700**. The efficiency threshold of **17,416**
is only reachable with a larger bank balance.

⚠ Both thresholds assume `taxes_minor = 0`, which flatters the award. Bonvoy
award taxes are uncaptured; when present they reduce cash avoided and pull both
thresholds down. Until captured, the cash figure is suppressed and the
thresholds carry the assumption explicitly.

---

## 8. G · Air India Maharaja — `PUBLISHED_CHART` + `AWARD_PRICE`

BLR → SIN one way, economy. Ratio `fromUnits: 2, toUnits: 1`, 48–96h. Bank
21,000 Infinia. Maharaja balance 3,000. Benchmark cash fare ₹18,400, captured.

Chart entry, SE Asia zone, **Value tier: 12,000 points + ₹2,850 taxes.**

```
L             = [12,000]                     # indivisible
fromExisting  = 3,000
shortfall     = 9,000
bankRequired  = ceil(9,000 × 2 / 1) = 18,000  <= 21,000
A_bank        : 12,000 alone needs 24,000 > 21,000
BalanceState  = SUFFICIENT_VIA_PROGRAMME_BALANCE     # correct usage of the state
cashPayable   = 285,000 paise = ₹2,850       # the taxes. NOT gross − a notional value.
```

| | Award booking | Portal | Cash |
|---|---|---|---|
| bank required | 18,000 | 12,880 | 0 |
| existing programme consumed | 3,000 | 0 | 0 |
| **cash payable** | **₹2,850** | ₹5,636.82 | ₹18,400 |
| bank retained | 3,000 | 8,120 | 21,000 |
| cash avoided per transferred bank point | ₹0.8639 | — | — |
| portal cash avoided per bank point | — | ₹0.9909 | — |

The award metric is `cashAvoidedPerTransferredBankPointPaise` =
`(1,840,000 − 285,000) / 18,000`. It is not "value per bank point" and it is not
comparable to §6's `incrementalBookingOffsetPerTransferredBankPoint` — different
mechanics, different denominators of meaning. It also inherits the benchmark
fare's staleness and must be rendered with it.

`MINIMISE_CASH_TODAY` → the award booking, ₹2,850 against ₹5,636.82.
`MAXIMISE_BANK_POINT_EFFICIENCY` → the portal, 99.09 paise against 86.39.
Neither dominates. The objectives disagree harder here than anywhere in the
Accor cases, and both answers are correct for the user who asked that question.

Two chart-specific gaps, flagged rather than guessed: **fare tiers** — Maharaja
publishes Value and Prime, so a single points figure per route is wrong, and
`entries[].fare_tier` carries it — and the **April 2026 revaluation**, which cut
domestic economy roughly 28–30% and flattened international into tiers, making
`as_of` on the chart load-bearing.

---

## 9. D · Coverage matrix

Every enum member appears at least once; every `RecommendedPath` is *selected*
by at least one test; every precedence rule that can change the path is
exercised.

| # | Pricing | Transfer | Balance | Rule | Mech | Selects | Asserts |
|---|---|---|---|---|---|---|---|
| 1 | FIXED_VALUE | VERIFIED | SUFFICIENT | VERIFIED | CASH_OFFSET | TRANSFER_THEN_BOOK | §6.1 exactly: 4 candidates survive, none pruned, marginal 110.5, incremental 276.25 / 157.86 |
| 2 | FIXED_VALUE | VERIFIED | SUFFICIENT | VERIFIED | CASH_OFFSET | TRANSFER_THEN_BOOK | programme balance 0 → 8,000 bank for the same spend. Must not equal #1 |
| 3 | FIXED_VALUE | VERIFIED | SUFFICIENT_VIA_PROGRAMME_BALANCE | VERIFIED | CASH_OFFSET | TRANSFER_THEN_BOOK | bank 5,600 + programme 1,200: bank alone reaches only 2,000 |
| 4 | FIXED_VALUE | VERIFIED | PARTIAL | VERIFIED | CASH_OFFSET | TRANSFER_THEN_BOOK | bank 5,000: 2,000 reachable, 4,000 not; larger candidate absent from `candidates` |
| 5 | FIXED_VALUE | VERIFIED | BELOW_MINIMUM | VERIFIED | CASH_OFFSET | NO_RECOMMENDATION | portal and cash costed, neither selected |
| 6 | FIXED_VALUE | VERIFIED | SUFFICIENT | VERIFIED | CASH_OFFSET | — | `min_booking_value_rule`: 6,000 rejected, spend never exceeds eligible |
| 7 | FIXED_VALUE | VERIFIED | SUFFICIENT | SOURCE_CONFLICT | CASH_OFFSET | TRANSFER_THEN_BOOK | permitted amounts INTERSECT; disputed 1,000 surfaced; path unchanged |
| 8 | FIXED_VALUE | VERIFIED | PARTIAL | SOURCE_CONFLICT | CASH_OFFSET | TRANSFER_THEN_BOOK | the disputed floor would itself change `BalanceState` |
| 9 | FIXED_VALUE | VERIFIED | SUFFICIENT | SOURCE_CONFLICT | CASH_OFFSET | NO_RECOMMENDATION | portal-value conflict, INVARIANCE_TEST fails → divergence reported |
| 10 | FIXED_VALUE | VERIFIED | SUFFICIENT | SOURCE_CONFLICT | CASH_OFFSET | — | ratio conflict → BLOCK: no exact instruction under either objective |
| 11 | FIXED_VALUE | RATIO_ONLY | SUFFICIENT | VERIFIED | CASH_OFFSET | TRANSFER_THEN_BOOK | ranks normally; exact null; target present |
| 12 | FIXED_VALUE | VERIFIED | SUFFICIENT | VERIFIED | CASH_OFFSET | — | **affordability after increment**: need 5,600, increment → 6,000, bank 5,800 → `UNAFFORDABLE_AFTER_INCREMENT` |
| 13 | FIXED_VALUE | VERIFIED | SUFFICIENT | UNKNOWN | CASH_OFFSET | — | eligibility unbounded → NO_RECOMMENDATION (§5.3) |
| 14 | FIXED_VALUE | VERIFIED | SUFFICIENT | UNKNOWN | CASH_OFFSET | TRANSFER_THEN_BOOK | eligibility bounded room-only..gross, path invariant → ranks; instruction still blocked |
| 15 | FIXED_VALUE | UNAVAILABLE | SUFFICIENT_VIA_PROGRAMME_BALANCE | VERIFIED | CASH_OFFSET | REDEEM_EXISTING_BALANCE | `absence_state: SOURCED_NONE`; no fabricated ratio in the record |
| 16 | FIXED_VALUE | ENDED | SUFFICIENT_VIA_PROGRAMME_BALANCE | VERIFIED | CASH_OFFSET | REDEEM_EXISTING_BALANCE | Etihad shape; `historic_ratio` present and unused |
| 17 | FIXED_VALUE | UNAVAILABLE | BELOW_MINIMUM | VERIFIED | CASH_OFFSET | PORTAL | no route, no reachable amount |
| 18 | PUBLISHED_CHART | VERIFIED | SUFFICIENT_VIA_PROGRAMME_BALANCE | VERIFIED | AWARD_PRICE | TRANSFER_THEN_BOOK | §8: cash payable = ₹2,850; no manufactured remainder; objectives disagree, both returned |
| 19 | PUBLISHED_CHART | VERIFIED | BELOW_MINIMUM | VERIFIED | AWARD_PRICE | NO_RECOMMENDATION | award price indivisible: one candidate or none. `PARTIAL` unreachable |
| 20 | PUBLISHED_CHART | VERIFIED | SUFFICIENT | UNKNOWN | AWARD_PRICE | — | `taxes_minor` absent → no cash figure emitted at all |
| 21 | QUOTE_REQUIRED | VERIFIED | — | VERIFIED | AWARD_PRICE | QUOTE_REQUIRED | no quote; portal still costed |
| 22 | QUOTE_REQUIRED | UNAVAILABLE | SUFFICIENT_VIA_PROGRAMME_BALANCE | VERIFIED | AWARD_PRICE | REDEEM_EXISTING_BALANCE | quote supplied, no route, Bonvoy balance covers it |
| 23 | QUOTE_REQUIRED | VERIFIED | BELOW_MINIMUM | VERIFIED | AWARD_PRICE | NO_RECOMMENDATION | §7: thresholds 18,832 bank / 17,416 quote / 13,700 affordability |
| 24 | NOT_PRICED | VERIFIED | — | VERIFIED | — | NO_RECOMMENDATION | programme candidates suppressed; portal and cash costed |
| 25 | FIXED_VALUE | UNAVAILABLE | BELOW_MINIMUM | VERIFIED | CASH_OFFSET | **CASH_AND_RETAIN** | bank 100 points: portal offset ₹100 < fee ₹116.82, so cash **dominates** the portal on both cash and points. Selected under both objectives |
| 26 | FIXED_VALUE | VERIFIED | SUFFICIENT | VERIFIED | CASH_OFFSET | PORTAL | §6.2 at `fx = 9620`; asserts ₹7,696, not ₹7,680 — the premature-floor regression |
| 27 | FIXED_VALUE | VERIFIED | SUFFICIENT | VERIFIED | CASH_OFFSET | PORTAL | FX null: no FX-derived rupee figure; INR-native portal figures intact |
| 28 | FIXED_VALUE | VERIFIED | SUFFICIENT | VERIFIED | CASH_OFFSET | — | fee amortisation `feeMinor / pointsUsed` reported; no external floor asserted |
| 29 | FIXED_VALUE | VERIFIED | SUFFICIENT | VERIFIED | CASH_OFFSET | — | **FX unit guard**: `offset(4000, fx=11050) === 884000` exactly. Fails on 110, 1105 or 1105000 |
| 30 | FIXED_VALUE | VERIFIED | SUFFICIENT | VERIFIED | CASH_OFFSET | — | **no pruning before objective**: §6.2 spend-2,000 present in `candidates` despite its marginal rate |

Test 25 is the selecting case for `CASH_AND_RETAIN` that v3 lacked. It is not
contrived: any Infinia balance under 117 points makes the flat ₹116.82 fee
exceed the portal offset, so paying cash strictly dominates redeeming. For
Regalia Gold at ₹0.50 a point the threshold is 234.

Test 30 exists because v3's pruning bug would pass every other test.

---

## 10. Launch gates and non-blocking unknowns

### Hard gates

1. **Accor's permitted redemption amounts**, from the logged-in checkout amount
   field. Decides tests 1–8 and whether 1,200 latent points are worth ₹1,924.
2. **Accor's programme-eligible basis.** Per §5.3 this is now the most urgent of
   the three: unbounded, it blocks the *recommendation*, not just the
   instruction. Interim mitigation — populate `programme_eligible_bounds` from
   room-only and gross, both already in the seed, which restores ranking while
   leaving the instruction blocked.
3. **HDFC's transfer minimum and increment**, per programme. Without both,
   `bankPointsToTransferExact` is null on every path, and test 12's
   affordability recheck cannot run at all.

Until all three land the flagship case ships as a target plus cautions, not
"transfer exactly N".

### Non-blocking

4. **Bonvoy award taxes** — affects `QUOTE_REQUIRED` only; ships with the cash
   figure suppressed (test 20) and both §7 thresholds carrying the assumption.
5. **HDFC points validity, per card** — gates `CASH_AND_RETAIN` copy only.
6. **Accor account-inactivity lapse rule** — absent means unknown, never safe.
7. **Air India fare tiers and the post-revaluation chart** — gates the F1
   flights build, not this one.

---

## 11. Integration note

`app/api/.../redemption-route.ts` (May 2026) generates prose advice from
`lib/redemption.ts`'s hand-authored per-point tables — no source, no `as_of`.
Once `planRedemption()` returns candidates carrying provenance, that route
consumes them. `RedemptionPlan.provenance` and `RedemptionCandidate.provenance`
exist for this reason.

Out of scope for this build. Recorded so it is not lost.
