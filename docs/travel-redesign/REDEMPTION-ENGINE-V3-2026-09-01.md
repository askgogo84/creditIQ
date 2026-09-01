# CreditIQ — Redemption engine, v3

**1 Sep 2026 · replaces `REDEMPTION-FULL-FLOW-2026-09-01.md` and
`REDEMPTION-ENGINE-SPEC-2026-09-01.md` in full**

Not a patch list. Read this instead of the earlier two. Nothing is built.

---

## 0. What changed from v2, and why it matters

v2 pre-committed the answer. Its objective — "the smallest permitted transfer
that produces the largest permitted redemption" — picked the candidate before
any economics ran, which meant a user could never be shown a cheaper transfer
that they might rationally prefer.

v3 splits that into `findPermittedRedemptions()`, which enumerates every legal
way to pay, and `rankCandidates()`, which scores them. Writing it that way
produced a result neither review predicted:

> **Every candidate beyond the first is priced at exactly the programme
> conversion rate.** The first candidate — the smallest one that unlocks a
> stranded programme balance — is priced far higher, because it spends latent
> points that had no standalone value.

Worked in §7.1: the smallest Accor candidate returns ₹2.76 per bank point, the
next returns ₹1.58, and the step between them returns exactly ₹1.105 — the
conversion rate, unsurprising once seen. That structure is invisible under v2's
objective, and it means the right stopping point is a marginal comparison, not
a maximum.

It also forced a second admission: **ranking cannot be objective-free.** At one
exchange rate the candidate with the best rate per point and the candidate with
the lowest cash payable are different candidates. v3 makes the objective an
explicit parameter with a stated default rather than smuggling one in.

Everything else in v3 is either an adopted correction or a consequence of these
two changes.

---

## 1. Domain model

### 1.1 Two redemption mechanics

v2 assumed points offset a cash booking. That is Accor. It is not Air India,
and Air India is the next programme after this ships.

```ts
type Mechanic =
  | 'CASH_OFFSET'    // points reduce a cash booking (Accor: 2,000 pts = €40 off)
  | 'AWARD_PRICE';   // points + taxes BUY the booking (Air India: 12,000 pts + ₹2,850)
```

The distinction is not cosmetic:

| | `CASH_OFFSET` | `AWARD_PRICE` |
|---|---|---|
| Cash payable | gross − offset | award taxes and fees, full stop |
| Cash fare's role | it is the bill | comparison benchmark only |
| Partial redemption | yes, in permitted blocks | no — you buy the seat or you don't |
| Value measure | offset ÷ bank points | (cash fare − award taxes) ÷ bank points |

Under `AWARD_PRICE` the engine must never compute "gross minus a theoretical
points value" and present the difference as a cash remainder. There is no such
remainder. The cash fare is a benchmark that the user does not pay.

### 1.2 Two eligibility domains, never one field

The programme and the portal restrict different things and one number cannot
serve both.

- **`programmeEligibleMinor`** — what the *hotel or airline programme* lets
  points touch. Accor excludes certain charges; the exclusions are uncaptured.
- **`portalEligibleMinor`** — the SmartBuy transaction value the 70% cap
  applies to. Normally the gross booking.

A charge Accor excludes may still count toward SmartBuy's transaction value.
In v2 a single `eligible_minor` fed both, which silently corrupted the portal
figure whenever the programme excluded anything.

### 1.3 Latent programme points

Programme points below the smallest permitted redemption have **zero standalone
redeemable value today and non-zero latent value**: adding points unlocks them.

They are never described as worthless, and they are never valued at the
conversion rate either. What the engine reports is what happens to them under
each candidate — consumed, retained, or left stranded.

### 1.4 Two value metrics that must never be conflated

```ts
/** Programme-level. Property-independent for FIXED_VALUE. Renders in the band
 *  above the results. This is the number that decides transfer vs portal. */
conversionValuePerBankPointPaise: number;          // Accor @ ₹110.50 → 110.5 → 110

/** Booking-specific. What THIS transfer unlocks on THIS bill, including any
 *  latent programme balance it makes spendable. Legitimately higher than the
 *  conversion rate. NEVER presented as the value of an Infinia point, and never
 *  used as the programme-level comparison rate. */
incrementalBookingOffsetPerTransferredBankPointPaise: number;   // e.g. 157
```

v2's single `valuePerBankPointPaise` was the most likely route for a convincing
wrong number to reach a user. It is deleted. Neither replacement may be
rendered without its qualifier in the label.

---

## 2. Arithmetic rules

**Money is integer minor units throughout.** Paise for INR, cents for EUR. No
binary floating-point value ever becomes a user-facing financial number.

**Ratios are integer rationals.** Never `{ from: 1, to: 0.5 }`.

```ts
ratio: { fromUnits: 2, toUnits: 1 }    // 2 bank points → 1 programme point
```

Rounding, by hop, with the direction stated:

| Hop | Rule | Direction |
|---|---|---|
| bank → programme points | `floor(bank × toUnits / fromUnits)` | down — programmes don't credit fractions |
| programme points → bank required | `ceil(need × fromUnits / toUnits)` | up — never under-instruct a transfer |
| bank required → transfer increment | `ceil` to the next permitted transfer amount | up |
| permitted redemption amount | largest member of the permitted set ≤ max useful | down |
| foreign value → paise | `floor(points × amount_minor × fxPaisePerUnit / rule_points)` | down — never overstate the offset |
| fee + tax | `ceil(fee_minor × (1 + tax_rate))` | up — never understate a cost |
| portal points usable | `floor(capMinor / valuePaisePerPoint)` | down |

The governing principle, so a future hop inherits it without asking:
**round in whichever direction cannot flatter the recommendation.**

Multi-hop transfers floor at *each* hop, not once at the end. This matters the
moment a 5:2 ratio lands.

---

## 3. State model

```ts
type PricingState =
  | 'FIXED_VALUE'        // fixed currency amount per block (Accor)
  | 'PUBLISHED_CHART'    // award chart, sourceable once (Air India Maharaja)
  | 'QUOTE_REQUIRED'     // dynamic; user supplies the programme's number (Marriott)
  | 'NOT_PRICED';        // no chart, no quote path

type TransferState =
  | 'VERIFIED'           // ratio + minimum + increment + duration all sourced
  | 'RATIO_ONLY'         // ratio sourced; minimum and/or increment missing
  | 'UNAVAILABLE'        // this card has no route to this programme
  | 'ENDED';             // route existed and was withdrawn (Etihad, 30 Jun 2026)

type BalanceState =
  | 'SUFFICIENT'
  | 'SUFFICIENT_VIA_PROGRAMME_BALANCE'   // reachable only using existing points
  | 'PARTIAL'                             // reaches a permitted amount, not the largest
  | 'BELOW_MINIMUM';                      // cannot reach the smallest permitted amount

type RuleState = 'VERIFIED' | 'SOURCE_CONFLICT' | 'UNKNOWN';

type RecommendedPath =
  | 'TRANSFER_THEN_BOOK'
  | 'REDEEM_EXISTING_BALANCE'   // NEW — no transfer needed or possible
  | 'PORTAL'
  | 'CASH_AND_RETAIN'
  | 'QUOTE_REQUIRED'
  | 'NO_RECOMMENDATION';
```

### 3.1 `REDEEM_EXISTING_BALANCE` and the precedence bug it fixes

v2's first derivation rule sent `UNAVAILABLE` and `ENDED` straight to portal-vs-cash.
That is wrong whenever the user already holds enough programme points: they do
not need a transfer route to spend a balance they own.

`ENDED` is the sharper case. Etihad Guest transfers ended permanently on
30 June 2026, and someone holding an Etihad balance can still spend it. v2 would
have routed them to the portal and left the balance untouched.

Under the candidate model this needs no special branch. The zero-transfer
candidate is generated first and evaluated before transfer availability can
eliminate anything.

### 3.2 Derivation

Precedence applies to *elimination*, never to candidate generation.

1. Generate all candidates, always, including the zero-transfer candidate.
2. `PricingState` is `QUOTE_REQUIRED` and no quote supplied → `QUOTE_REQUIRED`.
   The zero-transfer candidate is still costed if a programme balance exists.
3. `PricingState` is `NOT_PRICED` → transfer candidates suppressed. Portal and
   cash still costed.
4. `TransferState` is `UNAVAILABLE` or `ENDED` → suppress candidates requiring
   `bankPointsRequired > 0`. Zero-transfer candidates survive.
5. Amount-rule `RuleState` is `UNKNOWN` → suppress all programme candidates.
6. `TransferState` is `RATIO_ONLY`, **or** `programmeEligibleState` is `UNKNOWN`
   → candidates survive and rank, but `bankPointsToTransferExact` is null and
   `instructionBlocked` is set. The user gets a target, never an instruction.
7. `BalanceState` is `BELOW_MINIMUM` → `NO_RECOMMENDATION`, with portal and
   cash-and-retain both fully costed and neither selected. The state machine
   wins over v2's test 8, which contradicted it.
8. Otherwise rank the survivors per §5.

`SOURCE_CONFLICT` never eliminates. It restricts the permitted-amount set to
the intersection of all published readings and annotates every candidate.

### 3.3 Why the conservative intersection

Accor's spendable amounts are disputed across three captures:

| Source | Reading | Permitted set |
|---|---|---|
| Accor terms, 21 Aug | minimum 2,000, in 2,000-point increments | 2,000; 4,000; 6,000 … |
| Handoff, 31 Aug | 1,000, then increments of 2,000 | ambiguous |
| ALL T&C effective 13 Jul 2026 | 1,000 = €20 or 2,000 = €40; above 2,000, multiples of 2,000 | 1,000; 2,000; 4,000; 6,000 … |

Every reading permits 2,000 and its multiples. The disputed value is the
1,000-point floor. The engine plans against `{ min: 2000, increment: 2000 }`
and surfaces 1,000 as a disputed alternative it will not instruct on.

Not academic: a user holding 1,200 Accor points either has ₹1,924 available or
has latent points worth nothing today. **Only the logged-in Accor checkout
amount field settles it.** The terms pages are what disagree.

---

## 4. A · The type model

```ts
interface Sourced<T> {
  value: T;
  state: RuleState;
  source_url: string;
  as_of: string;                  // ISO date; re-captured before every release
  conflict_note?: string;         // required when state = 'SOURCE_CONFLICT'
  readings?: T[];                 // every published reading, when they disagree
}

interface PermittedAmounts {
  conservative: { min: number; increment: number };   // the only set instructed from
  disputed: number[];                                  // surfaced, never instructed
  max_per_booking?: number;
}

interface RedemptionRules {
  programme_id: string;
  currency_label: string;              // 'Accor ALL points' — never bare 'points'
  pricing: PricingState;
  mechanic: Mechanic;

  /** CASH_OFFSET + FIXED_VALUE. Store the foreign amount; never a rupee figure. */
  fixed_value?: Sourced<{ points: number; amount_minor: number; currency: 'EUR' }>;

  /** AWARD_PRICE + PUBLISHED_CHART. */
  award_chart?: Sourced<{
    zones: Array<{
      zone_id: string; cabin: string; fare_tier: string;   // Value | Prime — both, or state which
      points: number;
      taxes_minor?: number;             // absent => UNKNOWN, blocks the cash figure
    }>;
  }>;

  permitted_amounts: Sourced<PermittedAmounts>;         // CASH_OFFSET only

  /** PROGRAMME eligibility. Distinct from the portal's. */
  programme_eligible: Sourced<{
    basis: 'TOTAL' | 'ROOM_ONLY' | 'ROOM_PLUS_TAX';
    excluded: string[];
  }>;

  min_booking_value_rule?: Sourced<'MUST_EXCEED_POINTS_VALUE' | 'NONE'>;
  requires_direct_booking: Sourced<boolean>;
  booking_url: string;
}

/** CARD-keyed. Infinia and Regalia Gold differ; bank-keyed is a known bug source. */
interface TransferRules {
  card_id: string;
  programme_id: string;
  ratio: Sourced<{ fromUnits: number; toUnits: number }>;   // integers only
  min_transfer?: Sourced<number>;                            // BANK points
  transfer_increment?: Sourced<number>;                      // BANK points
  duration_hours: Sourced<{ min: number; max: number }>;
  reversible: false;                                         // literal type
  ended_on?: string;                                         // => TransferState 'ENDED'
}

interface PortalRules {
  card_id: string;
  value_paise_per_point: Sourced<number>;      // 100 Infinia, 50 Regalia Gold
  max_share_of_eligible: Sourced<number>;      // 0.70
  fee_minor: Sourced<number>;                  // 9900
  fee_tax_rate: Sourced<number>;               // 0.18
  /** What the cap applies to. NOT the programme's eligible basis. */
  eligible_basis: Sourced<'TRANSACTION_VALUE' | 'ROOM_ONLY'>;
}

interface BankBalance {
  card_id: string;
  points: number;
  provenance: 'STATEMENT' | 'SELF_ENTERED';
  expires_on?: Sourced<string>;         // absent = UNKNOWN. No "never expires" value exists.
}

/** First-class. Ranking consumes it and residual wealth depends on it. */
interface ProgrammeBalance {
  programme_id: string;
  points: number;
  provenance: 'PROGRAMME_LINKED' | 'STATEMENT' | 'SELF_ENTERED';
  expires_on?: Sourced<string>;
  /** Accor and several airlines lapse points on account inactivity.
   *  The rule is uncaptured — absent means unknown, never 'safe'. */
  inactivity_rule?: Sourced<{ months: number }>;
}

type Objective = 'MINIMISE_CASH_TODAY' | 'MAXIMISE_POINT_VALUE';

interface RedemptionCandidate {
  kind: 'PROGRAMME' | 'PORTAL' | 'CASH';
  mechanic: Mechanic | null;

  programmePointsSpent: number;
  existingProgrammePointsConsumed: number;    // from the pre-held balance
  programmePointsReceived: number;            // from the transfer
  residualProgrammeBalance: number;           // held after this candidate
  strandedResidualProgrammePoints: number;    // residual below the minimum spendable

  bankPointsRequiredMinimum: number;
  bankPointsToTransferExact: number | null;   // null when an input is unverified
  bankPointsRetained: number;

  offsetMinor: number;                        // CASH_OFFSET only
  awardTaxesMinor: number | null;             // AWARD_PRICE only
  feeMinor: number;
  cashPayableMinor: number;

  incrementalBookingOffsetPerTransferredBankPointPaise: number | null;
  marginalRateVsPreviousCandidatePaise: number | null;   // the ₹1.105 structure

  instructionBlocked:
    | 'TRANSFER_INCREMENT_UNVERIFIED'
    | 'TRANSFER_MINIMUM_UNVERIFIED'
    | 'PROGRAMME_ELIGIBLE_AMOUNT_UNKNOWN'
    | null;

  durationHours: { min: number; max: number } | null;
  irreversible: boolean;
  provenance: Sourced<unknown>[];             // every fact this candidate rests on
}

interface RedemptionPlan {
  pricingState: PricingState;
  transferState: TransferState;
  balanceState: BalanceState;
  ruleState: RuleState;
  recommendedPath: RecommendedPath;
  objective: Objective;

  conversionValuePerBankPointPaise: number | null;   // null when FX null
  fxState: 'LIVE' | 'UNAVAILABLE';

  candidates: RedemptionCandidate[];                 // ranked, all survivors
  recommended: RedemptionCandidate | null;
  runnerUpUnderOtherObjective: RedemptionCandidate | null;

  balances: {
    bank: { points: number; expiresOn: string | null };
    programme: { points: number; expiresOn: string | null; latentPoints: number };
  };

  suppressedCandidates: Array<{ reason: string; wouldHaveSpent: number }>;
  conflictNote: string | null;
  blockedReason: string | null;
  provenance: Sourced<unknown>[];                    // carried, not summarised
}
```

`RedemptionPlan.provenance` and per-candidate provenance exist because v2
promised sourced plans and then returned bare numbers. Downstream CIRA must
receive the evidence, not just the figure.

---

## 5. B and C · Pseudocode

### 5.1 `findPermittedRedemptions()`

```
function findPermittedRedemptions(booking, bank, programmeBalance, rules, transfer, fx):

  candidates = []

  # --- always available ---
  candidates.push(CASH candidate: cashPayable = booking.gross,
                  bank retained in full, programme retained in full)

  # --- portal, on its OWN eligible basis ---
  portalEligible = resolve(booking, portal.eligible_basis)
  capMinor       = floor(portalEligible × portal.max_share_of_eligible)
  pointsUsable   = min(bank.points, floor(capMinor / portal.value_paise_per_point))
  feeMinor       = ceil(portal.fee_minor × (1 + portal.fee_tax_rate))
  candidates.push(PORTAL candidate:
      offset        = pointsUsable × portal.value_paise_per_point,
      cashPayable   = booking.gross − offset + feeMinor,
      bankRetained  = bank.points − pointsUsable,
      residualProgrammeBalance = programmeBalance.points)   # untouched — report it

  # --- programme candidates ---
  if rules.pricing == NOT_PRICED:            return candidates
  if rules.pricing == QUOTE_REQUIRED and no quote: return candidates + QUOTE marker
  if rules.permitted_amounts.state == UNKNOWN:    return candidates

  permitted = rules.permitted_amounts.conservative        # conflict → intersection

  if rules.mechanic == CASH_OFFSET:
      programmeEligible = resolve(booking, rules.programme_eligible)
      valuePerPoint     = floor(fixed_value.amount_minor × fx.paisePerUnit
                                / fixed_value.points)
      maxUseful         = floor(programmeEligible / valuePerPoint)
      spendSet          = every a in permitted where a ≤ maxUseful
                          and a × valuePerPoint ≤ programmeEligible

  if rules.mechanic == AWARD_PRICE:
      entry     = award_chart.lookup(route, cabin, fare_tier)
      spendSet  = [entry.points]              # indivisible — one candidate only

  # THE ZERO-TRANSFER CANDIDATE IS GENERATED FIRST AND UNCONDITIONALLY.
  # Transfer availability is a later filter, never a generation gate.
  for spend in ascending(spendSet):
      fromExisting  = min(spend, programmeBalance.points)
      shortfall     = spend − fromExisting
      bankRequired  = ceil(shortfall × ratio.fromUnits / ratio.toUnits)

      if bankRequired > bank.points: continue          # unaffordable, not a candidate

      exact = null
      if transfer.min_transfer.verified and transfer.transfer_increment.verified:
          exact = roundUpToIncrement(max(bankRequired, transfer.min_transfer))
      # else: instructionBlocked, target still returned

      received  = floor((exact ?? bankRequired) × ratio.toUnits / ratio.fromUnits)
      residual  = programmeBalance.points + received − spend
      stranded  = residual < permitted.min ? residual : 0

      if rules.mechanic == CASH_OFFSET:
          offset      = spend × valuePerPoint
          cashPayable = booking.gross − offset
      else:
          offset      = 0
          cashPayable = entry.taxes_minor            # NOT gross − a notional value

      candidates.push(PROGRAMME candidate{...})

  return candidates
```

Two properties worth stating because they are easy to lose in implementation:
the zero-transfer candidate is generated before any availability check, and an
unaffordable candidate is dropped rather than returned with a warning.

### 5.2 `rankCandidates()`

```
function rankCandidates(candidates, objective, transferState, ruleState):

  survivors = candidates
  if transferState in (UNAVAILABLE, ENDED):
      survivors = drop those with bankPointsRequiredMinimum > 0
      # zero-transfer programme candidates survive → REDEEM_EXISTING_BALANCE

  # marginal structure — the ₹1.105 result
  for each adjacent pair (c[i-1], c[i]) in ascending programmePointsSpent:
      c[i].marginalRate = (c[i].offset − c[i-1].offset)
                        / (c[i].bankRequired − c[i-1].bankRequired)

  for each c:
      c.incrementalOffsetPerBankPoint =
          c.bankRequired > 0 ? floor(c.offset / c.bankRequired) : null

  if objective == MINIMISE_CASH_TODAY:      order by cashPayableMinor asc
  if objective == MAXIMISE_POINT_VALUE:     order by incrementalOffsetPerBankPoint desc,
                                            candidates with bankRequired = 0 first

  # stop-climbing rule: never extend past the point where the marginal rate
  # falls below the best alternative use of a bank point (the portal rate).
  bestAlternative = portalCandidate.offset − fee, per point
  drop any c where c.marginalRate < bestAlternative
       AND a smaller sibling candidate exists

  recommended               = survivors.first
  runnerUpUnderOtherObjective = re-rank under the other objective, take first,
                                return it if it differs

  return { ordered: survivors, recommended, runnerUp }
```

**The objective is an explicit parameter with a stated default of
`MINIMISE_CASH_TODAY`,** because §7.2 and §8 both contain cases where the two
objectives select different candidates. v2 hid an implicit objective inside its
comparison and would have presented one answer as the answer.

`MINIMISE_CASH_TODAY` reproduces the intuitive verdicts on both Accor scenarios,
which is why it is the default. `MAXIMISE_POINT_VALUE` is surfaced as the
runner-up whenever it disagrees, never silently discarded.

---

## 6. D · State coverage matrix

Not the Cartesian product. Every enum member appears at least once, and every
precedence rule that can change `recommendedPath` is exercised.

| # | Pricing | Transfer | Balance | Rule | Mechanic | Asserts |
|---|---|---|---|---|---|---|
| 1 | FIXED_VALUE | VERIFIED | SUFFICIENT_VIA_PROGRAMME_BALANCE | VERIFIED | CASH_OFFSET | §7.1 exactly: 3 candidates, 5,600 target, marginal rate 110, incremental 157 |
| 2 | FIXED_VALUE | VERIFIED | SUFFICIENT | VERIFIED | CASH_OFFSET | programme balance 0 → 8,000 bank for the same spend. Must not equal #1 |
| 3 | FIXED_VALUE | VERIFIED | PARTIAL | VERIFIED | CASH_OFFSET | bank reaches 2,000 but not 4,000; `PARTIAL`; larger candidate absent, not warned |
| 4 | FIXED_VALUE | VERIFIED | BELOW_MINIMUM | VERIFIED | CASH_OFFSET | `NO_RECOMMENDATION`; portal and cash both costed; neither selected |
| 5 | FIXED_VALUE | VERIFIED | SUFFICIENT | VERIFIED | CASH_OFFSET | spend never exceeds `programmeEligible`; `MUST_EXCEED_POINTS_VALUE` honoured |
| 6 | FIXED_VALUE | VERIFIED | SUFFICIENT | SOURCE_CONFLICT | CASH_OFFSET | plans the intersection; `disputed` surfaced; path unchanged |
| 7 | FIXED_VALUE | VERIFIED | PARTIAL | SOURCE_CONFLICT | CASH_OFFSET | conflict × partial: the disputed floor would change `BalanceState` itself |
| 8 | FIXED_VALUE | RATIO_ONLY | SUFFICIENT_VIA_PROGRAMME_BALANCE | VERIFIED | CASH_OFFSET | ranks normally; `bankPointsToTransferExact` null; target present |
| 9 | FIXED_VALUE | VERIFIED | SUFFICIENT | UNKNOWN | CASH_OFFSET | `programmeEligible` UNKNOWN blocks the instruction, not just the label |
| 10 | FIXED_VALUE | UNAVAILABLE | SUFFICIENT_VIA_PROGRAMME_BALANCE | VERIFIED | CASH_OFFSET | **`REDEEM_EXISTING_BALANCE`** — the hole v2 had |
| 11 | FIXED_VALUE | ENDED | SUFFICIENT_VIA_PROGRAMME_BALANCE | VERIFIED | CASH_OFFSET | Etihad shape: route gone, balance still spendable |
| 12 | FIXED_VALUE | UNAVAILABLE | BELOW_MINIMUM | VERIFIED | CASH_OFFSET | no route and no reachable amount → portal vs cash, both costed |
| 13 | PUBLISHED_CHART | VERIFIED | SUFFICIENT_VIA_PROGRAMME_BALANCE | VERIFIED | AWARD_PRICE | §8: cash payable = award taxes only; no manufactured remainder |
| 14 | PUBLISHED_CHART | VERIFIED | PARTIAL | VERIFIED | AWARD_PRICE | award price indivisible: exactly one candidate, or none |
| 15 | PUBLISHED_CHART | VERIFIED | SUFFICIENT | UNKNOWN | AWARD_PRICE | `taxes_minor` absent → no cash figure emitted at all |
| 16 | QUOTE_REQUIRED | VERIFIED | — | VERIFIED | CASH_OFFSET | no quote → `QUOTE_REQUIRED`; portal still costed |
| 17 | QUOTE_REQUIRED | UNAVAILABLE | SUFFICIENT_VIA_PROGRAMME_BALANCE | VERIFIED | CASH_OFFSET | quote supplied, no route, balance covers it → `REDEEM_EXISTING_BALANCE` |
| 18 | QUOTE_REQUIRED | VERIFIED | SUFFICIENT | VERIFIED | CASH_OFFSET | break-even reported in BANK points and as a quote figure; §7.3 numbers |
| 19 | NOT_PRICED | VERIFIED | SUFFICIENT | VERIFIED | — | programme candidates suppressed; `NO_RECOMMENDATION` |
| 20 | FIXED_VALUE | VERIFIED | SUFFICIENT | VERIFIED | CASH_OFFSET | **FX null**: no FX-derived rupee figure; INR-native portal figures intact |
| 21 | FIXED_VALUE | VERIFIED | SUFFICIENT | VERIFIED | CASH_OFFSET | fee amortisation: `feeMinor / pointsUsed` reported; no external floor asserted |
| 22 | FIXED_VALUE | VERIFIED | SUFFICIENT | VERIFIED | CASH_OFFSET | objective flip: the two objectives select different candidates; both returned |

Coverage: all 4 `PricingState`, all 4 `TransferState`, all 4 `BalanceState`,
all 3 `RuleState`, both `Mechanic`, 5 of 6 `RecommendedPath` (`CASH_AND_RETAIN`
is covered by #4's costing, which reports it without selecting it).

Three v2 tests are deliberately gone. Old test 8 asserted `CASH_AND_RETAIN` on
`BELOW_MINIMUM`, contradicting the derivation rules — the state machine wins.
Old test 10 asserted against a ₹0.30 portal floor that appears nowhere in the
schema; worse, that floor is not properly sourced in the product either, so it
should not be load-bearing anywhere. Old test 12 forbade all rupee figures under
null FX, which would have suppressed correct INR-native portal numbers.

---

## 7. E · Worked Accor examples

Constants: 2,000 ALL = €40 (4,000 cents). Infinia → Accor `fromUnits: 2,
toUnits: 1`. Portal: 100 paise/point, 70% cap, fee `ceil(9900 × 1.18)` =
11,682 paise. Permitted set `{ min: 2000, increment: 2000 }`.

### 7.1 Transfer wins — three candidates, and the structure

Bill gross ₹12,292 (1,229,200 paise). Programme-eligible ₹11,400. Bank 11,400
Infinia. Programme balance 1,200 ALL. FX ₹110.50.

```
valuePerProgrammePoint = floor(4000 × 110.50 / 2000)   = 221 paise
maxUseful              = floor(1,140,000 / 221)         = 5,158
spendSet (≤ 5,158)                                      = {2000, 4000}
latentProgrammePoints  = 1,200 (below the 2,000 minimum) — zero standalone
                         value today, unlocked by any candidate below
```

| | Spend 2,000 | Spend 4,000 | Portal | Cash |
|---|---|---|---|---|
| existing consumed | 1,200 | 1,200 | 0 | 0 |
| bank required | 1,600 | 5,600 | 8,604 | 0 |
| offset | ₹4,420 | ₹8,840 | ₹8,604 | — |
| fee | — | — | ₹116.82 | — |
| **cash payable** | **₹7,872** | **₹3,452** | **₹3,804.82** | ₹12,292 |
| bank retained | 9,800 | 5,800 | 2,796 | 11,400 |
| residual programme | 0 | 0 | 1,200 stranded | 1,200 stranded |
| incremental per bank pt | ₹2.76 | ₹1.579 | ₹0.9864 | — |
| marginal vs previous | — | **₹1.105** | — | — |

The marginal rate between the two programme candidates is 442,000 ÷ 4,000 =
110.5 paise — exactly the conversion rate, and above the portal's ₹0.9864, so
climbing to 4,000 is correct. Under `MINIMISE_CASH_TODAY`: spend 4,000,
₹3,452 payable. `MAXIMISE_POINT_VALUE` selects the 2,000 candidate at ₹2.76 per
bank point, returned as the runner-up.

The ₹2.76 and ₹1.579 figures are `incrementalBookingOffsetPerTransferredBankPoint`.
Neither is the value of an Infinia point. The value of an Infinia point into
Accor is ₹1.105 and it is the same on all twenty properties.

Note the portal and cash rows leave the 1,200 ALL points stranded. v2 omitted
that from the comparison, which flattered the portal.

### 7.2 The exchange rate flips it, and the objectives disagree

Same inputs, FX ₹96.20 → `valuePerProgrammePoint` = 192 paise (floored from
192.4 — the floor costs the user ₹1.60 on 4,000 points and is the correct
direction).

| | Spend 2,000 | Spend 4,000 | Portal |
|---|---|---|---|
| bank required | 1,600 | 5,600 | 8,604 |
| offset | ₹3,840 | ₹7,680 | ₹8,604 |
| cash payable | ₹8,452 | ₹4,612 | ₹3,804.82 |
| incremental per bank pt | ₹2.40 | ₹1.371 | ₹0.9864 |
| marginal vs previous | — | ₹0.96 | — |

The marginal step is now ₹0.96, below the portal's ₹0.9864, so the stop-climbing
rule holds at 2,000. But under `MINIMISE_CASH_TODAY` the portal wins outright
(₹3,804.82). Under `MAXIMISE_POINT_VALUE` the 2,000 candidate wins at ₹2.40 per
bank point — still the best rate on the board, because it is unlocking latent
points.

**Both are defensible and they select different candidates.** That is the case
that makes the objective a parameter rather than a hidden assumption.

One constraint closes off the obvious hybrid: `requires_direct_booking` is true
for Accor, so points and SmartBuy cannot both apply to one booking. Spend 2,000
*and* portal the remainder is not a legal candidate. For a programme where
direct booking is not required, it would be.

### 7.3 Quote required — Marriott, priced in bank currency

Bill ₹18,640. Bank 11,400. Bonvoy balance 8,000. Ratio `fromUnits: 2, toUnits: 1`.

Portal effective rate at **this** point count — v2 reused the 8,604-point rate
and was wrong, because a flat fee amortises differently at every volume:

```
portal points usable = min(11,400, floor(1,304,800 / 100)) = 11,400
portal effective     = (1,140,000 − 11,682) / 11,400 = 98.975 paise
```

Break-even against ₹0.98975: bank points ≤ 1,864,000 / 98.975 = **18,832**,
i.e. a quote of 8,000 + (18,832 ÷ 2) = **17,416 Bonvoy points or fewer**.
v2 published 18,897 and 17,416's predecessor 17,448; both were wrong.

Affordability binds first: 11,400 bank points reach 5,700 Bonvoy, so the
reachable ceiling is a quote of **13,700**. The tab's conclusion survives; its
published numbers did not.

---

## 8. F · Worked `AWARD_PRICE` example — Air India Maharaja

The mechanic that v2's model could not express.

BLR → SIN, one way, economy. Infinia → Maharaja `fromUnits: 2, toUnits: 1`,
48–96h. Bank 21,000 Infinia. Maharaja balance 3,000. Cash fare ₹18,400.

Chart entry, SE Asia zone: **12,000 points + ₹2,850 taxes**, Value tier.

```
spendSet          = [12,000]              # indivisible — no permitted-amount ladder
fromExisting      = 3,000
shortfall         = 9,000
bankRequired      = ceil(9,000 × 2 / 1)   = 18,000
cashPayable       = 285,000 paise         = ₹2,850   ← the taxes, NOT gross − offset
bankRetained      = 3,000
```

| | Award booking | Portal | Cash |
|---|---|---|---|
| bank required | 18,000 | 12,880 | 0 |
| existing programme consumed | 3,000 | 0 | 0 |
| **cash payable** | **₹2,850** | **₹5,636.82** | ₹18,400 |
| bank retained | 3,000 | 8,120 | 21,000 |
| value per bank point | ₹0.864 | ₹0.9909 | — |

`(18,400 − 2,850) ÷ 18,000 = 86.4 paise` for the award; the portal is
`(1,288,000 − 11,682) ÷ 12,880 = 99.09 paise`.

**The objectives disagree again, and harder.** `MINIMISE_CASH_TODAY` picks the
award booking — ₹2,850 out of pocket against ₹5,636.82. `MAXIMISE_POINT_VALUE`
picks the portal, because 86.4 paise is below 99.09. A user optimising for cash
today and a user optimising for point efficiency should get different answers
on this booking, and the engine must not pretend otherwise.

Under the `CASH_OFFSET` model v2 would have computed `18,400 − (12,000 ×
some notional point value)` and reported a cash remainder the user never pays.

Two chart-specific gaps, both flagged rather than guessed:

- **Fare tiers.** Maharaja publishes Value and Prime. A single points figure per
  route is wrong. `award_chart.zones` carries `fare_tier`; either both tiers are
  modelled or the UI states which is shown.
- **The April 2026 revaluation.** Domestic economy fell roughly 28–30%,
  international standardised into flat tiers. `as_of` on the chart is
  load-bearing and must be re-captured before release.

---

## 9. G · Launch gates and non-blocking unknowns

### Hard gates — the feature cannot ship without these

1. **Accor's permitted redemption amounts**, from the logged-in checkout amount
   field. Decides tests 1, 3, 4, 5, 6, 7 and whether 1,200 latent points are
   worth ₹1,924 or nothing.
2. **Accor's programme-eligible basis** — which charges points cannot touch.
   Under §3.2 rule 6 an `UNKNOWN` here *blocks the exact transfer instruction*,
   because a user who transfers against an upper-bound offset and then finds
   half the bill ineligible has made an irreversible mistake on our arithmetic.
3. **HDFC's transfer minimum and increment**, per programme, from the Infinia
   portal. Without both, `bankPointsToTransferExact` is null on every path.

These three together are the difference between "here is exactly what to
transfer and how to book" and "here is roughly what you'd need." The headline
promise is the former. **Until all three land, the flagship scenario ships as a
target plus two cautions — correct, and not a headline feature.**

### Non-blocking — ship with the state, resolve after

4. **Bonvoy award taxes.** Affects `QUOTE_REQUIRED` only. Ships with
   `taxes_minor` absent and the cash figure suppressed (test 15).
5. **HDFC points validity, per card.** Gates `CASH_AND_RETAIN` copy only. Until
   captured, no output may imply points persist.
6. **Accor account-inactivity lapse rule.** Same treatment — absent means
   unknown, never safe.
7. **Air India fare tiers and post-revaluation chart.** Gates the F1 flights
   build, not this one.

---

## 10. Integration note

`app/api/.../redemption-route.ts` (May 2026) generates prose advice from
`lib/redemption.ts`'s hand-authored per-point tables — figures with no source
and no `as_of`. Once `planRedemption()` returns candidates carrying provenance,
that route consumes them instead. `RedemptionPlan.provenance` exists for this
reason: v2 promised sourced plans and returned bare numbers, which would have
left CIRA with the right figure and none of the evidence.

Out of scope for this build. Recorded so it is not lost.
