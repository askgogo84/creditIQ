# Redemption path — state model, schema and acceptance tests

Companion to `redemption-path-mockup-v2.html`. Nothing here is built. Approve
or mark up before the six docs.

---

## 1. The separation

Two computations, two surfaces.

**Programme economics** — one answer per (card × programme × day). Compares a
transferred point against the portal point. For a fixed-value programme like
Accor it does not vary by property at all; it varies with FX and the portal
rate. Renders once, in a band above the results.

**Booking execution** — one answer per (card × programme × booking × balances).
Produces the transfer amount, spendable amount, stranded points, cash remainder
and retained points. Renders per property.

The old design recomputed a verdict per hotel, which meant twenty cards arguing
the same case twenty times while the genuinely per-hotel arithmetic — what you
can actually reach — got a single line.

---

## 2. Four orthogonal states

No four-value enum. Each axis is independent; `recommendedPath` is derived.

```ts
type PricingState =
  | 'FIXED_VALUE'        // Accor: points buy a fixed currency amount
  | 'PUBLISHED_CHART'    // chart exists, no live lookup needed
  | 'QUOTE_REQUIRED'     // dynamic; user supplies the programme's number
  | 'NOT_PRICED';        // no chart, no quote path

type TransferState =
  | 'VERIFIED'           // ratio + minimum + increment + duration all sourced
  | 'RATIO_ONLY'         // ratio sourced, minimum/increment missing
  | 'UNAVAILABLE'        // card has no route to this programme
  | 'ENDED';             // route existed and was withdrawn (Etihad, 30 Jun 2026)

type BalanceState =
  | 'SUFFICIENT'
  | 'SUFFICIENT_VIA_PROGRAMME_BALANCE'   // only reachable because of existing points
  | 'BELOW_MINIMUM'                       // cannot reach the smallest spendable amount
  | 'PARTIAL';                            // can reach a spendable amount, not the optimal one

type RuleState = 'VERIFIED' | 'SOURCE_CONFLICT' | 'UNKNOWN';

type RecommendedPath =
  | 'TRANSFER_THEN_BOOK'
  | 'PORTAL'
  | 'CASH_AND_RETAIN'
  | 'QUOTE_REQUIRED'
  | 'NO_RECOMMENDATION';
```

Derivation rules, in order — first match wins:

1. `TransferState = ENDED` or `UNAVAILABLE` → portal vs cash only.
2. `PricingState = QUOTE_REQUIRED` and no quote supplied → `QUOTE_REQUIRED`.
3. `PricingState = NOT_PRICED` → `NO_RECOMMENDATION`; portal and cash still costed.
4. `RuleState = UNKNOWN` on the amount rule → `NO_RECOMMENDATION` for transfer.
5. `BalanceState = BELOW_MINIMUM` → compare portal-now against cash-and-retain
   on realised value per point, and surface both. Never auto-recommend portal.
6. Otherwise compare value per **bank** point across paths and pick the best.

`RuleState = SOURCE_CONFLICT` never blocks on its own. It restricts the
permitted-amount set to the intersection of all readings and annotates the plan.

---

## 3. `RedemptionRules` schema

Every fact carries its own provenance. This is the shape `point-values.ts`
already established; it extends rather than replaces it.

```ts
interface Sourced<T> {
  value: T;
  state: RuleState;
  source_url: string;
  as_of: string;                 // ISO date, re-captured before every release
  conflict_note?: string;        // required when state = 'SOURCE_CONFLICT'
  readings?: T[];                // every published reading, when they disagree
}

/** Amounts the programme permits in a single redemption. */
interface PermittedAmounts {
  /** Permitted under EVERY reading. The engine only ever instructs from this set. */
  conservative: { min: number; increment: number };
  /** Permitted under SOME reading. Surfaced to the user, never instructed. */
  disputed: number[];
  max_per_booking?: number;
}

interface RedemptionRules {
  programme_id: string;                 // 'accor-all'
  currency_label: string;               // 'Accor ALL points' — for the UI, never 'points'
  pricing: PricingState;

  /** FIXED_VALUE only. Never store a rupee figure — derive from live FX. */
  fixed_value?: Sourced<{
    points: number;                     // 2000
    amount_minor: number;               // 4000
    currency: 'EUR';
  }>;

  permitted_amounts: Sourced<PermittedAmounts>;

  /** What the offset may be applied against. Not the invoice total. */
  eligible_amount: Sourced<{
    basis: 'TOTAL' | 'ROOM_ONLY' | 'ROOM_PLUS_TAX';
    excluded: string[];                 // 'city tax', 'resort fee', 'non-refundable rates'
  }>;

  /** Accor: booking total must be >= the points value. */
  min_booking_value_rule?: Sourced<'MUST_EXCEED_POINTS_VALUE' | 'NONE'>;

  requires_direct_booking: Sourced<boolean>;
  booking_url: string;
}

/** Card-keyed, never bank-keyed. Infinia and Regalia Gold differ. */
interface TransferRules {
  card_id: string;
  programme_id: string;
  ratio: Sourced<{ from: number; to: number }>;   // {from:1, to:0.5}
  min_transfer?: Sourced<number>;                 // BANK points
  transfer_increment?: Sourced<number>;           // BANK points
  duration_hours: Sourced<{ min: number; max: number }>;
  reversible: false;                              // literal — never a variable
  ended_on?: string;                              // set => TransferState 'ENDED'
}

interface PortalRules {
  card_id: string;
  value_paise_per_point: Sourced<number>;         // 100 for Infinia
  max_share_of_eligible: Sourced<number>;         // 0.70
  fee_minor: Sourced<number>;                     // 9900
  fee_tax_rate: Sourced<number>;                  // 0.18
}

interface BankBalance {
  card_id: string;
  points: number;
  provenance: 'STATEMENT' | 'SELF_ENTERED';
  expires_on?: Sourced<string>;                   // absent is UNKNOWN, never 'no expiry'
}
```

Two rules the type system should enforce:

- `min_transfer` and `transfer_increment` are optional, and their absence sets
  `TransferState = 'RATIO_ONLY'`. An engine holding only a ratio may compute a
  *target* and must not emit an exact transfer instruction.
- `expires_on` absent means unknown. There is no representation for "does not
  expire" — nothing in the product may assert that.

---

## 4. `planRedemption()` and its return type

```ts
function planRedemption(input: {
  booking: { gross_minor: number; eligible_minor?: number; nights: number };
  bank: BankBalance;
  programme_balance: number;            // required. No default. Zero is a value, not an absence.
  rules: RedemptionRules;
  transfer: TransferRules;
  portal: PortalRules;
  fx?: { eur_inr: number; as_of: string } | null;   // null is supported; do not convert
  quote?: { programme_points: number; taxes_minor?: number; captured_at: string };
}): RedemptionPlan;
```

Pure. No I/O, no clock, no fetch — same contract as the existing engine.

```ts
interface RedemptionPlan {
  pricingState: PricingState;
  transferState: TransferState;
  balanceState: BalanceState;
  ruleState: RuleState;
  recommendedPath: RecommendedPath;

  balances: {
    bankPoints: number;
    programmePoints: number;
    bankPointsExpireOn: string | null;         // null = unknown, surfaced as unknown
  };

  convertible: {
    maxProgrammePointsFromBank: number;        // floor(bank * ratio)
    maxSpendableOnThisBooking: number;         // capped by eligible amount
    permittedSpendTarget: number;              // the chosen amount from the conservative set
    disputedHigherTarget: number | null;       // better amount only some readings allow
  };

  transfer: {
    bankPointsRequiredMinimum: number;         // the honest floor
    bankPointsToTransferExact: number | null;  // null when increment unverified
    instructionBlockedReason:
      | 'TRANSFER_INCREMENT_UNVERIFIED'
      | 'TRANSFER_MINIMUM_UNVERIFIED'
      | null;
    programmePointsReceived: number;
    durationHours: { min: number; max: number };
    irreversible: true;
  } | null;

  redemption: {
    programmePointsSpent: number;
    programmePointsStrandedAfter: number;      // left in the programme, unspendable
    offsetMinor: number;
    eligibleMinor: number;
    eligibleState: RuleState;                  // UNKNOWN => offset is a ceiling
  };

  bankPointsRetained: number;
  cashRemainderMinor: number;
  valuePerBankPointPaise: number | null;       // null when fx is null

  comparison: {
    portal: { pointsUsed: number; offsetMinor: number; feeMinor: number;
              cashRemainderMinor: number; bankPointsRetained: number;
              valuePerBankPointPaise: number };
    cashAndRetain: { cashMinor: number; bankPointsRetained: number;
                     valueIfHeldPaise: number | null; requiresMoreBankPoints: number };
  };

  bookingUrl: string;
  blockedReason: string | null;
  conflictNote: string | null;
}
```

The objective function, stated once so it does not drift: **the smallest
permitted transfer that produces the largest permitted redemption at or below
the eligible amount.** Not the largest transfer, not the largest balance
conversion. Points that leave the card cannot come back.

---

## 5. Twelve acceptance tests

All figures below use: Accor 2,000 = €40, EUR/INR 110.50, Infinia→Accor 1:0.5,
portal ₹1.00/pt with a 70% cap and ₹99 + 18% GST = ₹116.82.

| # | Case | Input | Expected |
|---|---|---|---|
| 1 | Smallest transfer, not the largest | bill ₹12,292, bank 11,400, programme 1,200 | `permittedSpendTarget` 4,000, `bankPointsRequiredMinimum` 5,600, `bankPointsRetained` 5,800, `offsetMinor` 884000, `cashRemainderMinor` 345200, stranded 0 |
| 2 | Programme balance is load-bearing | same as #1 but programme 0 | requires 8,000 bank points for the same 4,000 target; `balanceState` stays SUFFICIENT but retained drops to 3,400. Must not silently equal #1 |
| 3 | Never overshoot the eligible amount | bill ₹12,292, bank 40,000, programme 0 | target stays 4,000, not 6,000 — 6,000 (₹13,260) exceeds the bill and breaches `min_booking_value_rule` |
| 4 | Eligible amount below gross | bill ₹12,292, eligible ₹9,800 | target 4,000 (₹8,840 ≤ ₹9,800); with eligible ₹8,000 target drops to 2,000. Never plans against gross when eligible is supplied |
| 5 | Unverified eligible amount is a ceiling | eligible omitted | `eligibleState` UNKNOWN, `offsetMinor` computed but flagged; UI must render it as an upper bound |
| 6 | Source conflict restricts, never blocks | permitted_amounts SOURCE_CONFLICT, optimal would be 3,000 | plans 2,000 from the conservative set, `disputedHigherTarget` 3,000, `conflictNote` populated, `recommendedPath` still TRANSFER_THEN_BOOK |
| 7 | Ratio without increment blocks the instruction | `transfer_increment` absent | `transferState` RATIO_ONLY, `bankPointsToTransferExact` null, `instructionBlockedReason` TRANSFER_INCREMENT_UNVERIFIED, `bankPointsRequiredMinimum` still returned |
| 8 | Below minimum offers two options, recommends neither by default | bill ₹5,180, bank 1,600, programme 0 | `balanceState` BELOW_MINIMUM, `recommendedPath` CASH_AND_RETAIN, both branches costed: portal ₹0.93/pt after fee vs ₹1.105/pt held; `comparison.cashAndRetain.requiresMoreBankPoints` 2,400 |
| 9 | Unknown expiry is never "no expiry" | as #8, `expires_on` absent | `bankPointsExpireOn` null and the retain recommendation carries the unknown-validity caveat. Test asserts no string in the output claims points do not expire |
| 10 | Fee drag scales the small-redemption verdict | bill ₹1,400, bank 1,200 | portal effective rate falls below the ₹0.30 floor once ₹116.82 is spread over 980 points; verdict must not be PORTAL |
| 11 | Quote flow prices in bank currency | Marriott, bill ₹18,640, bank 11,400, programme 8,000, quote 50,000 | needs 42,000 Bonvoy = 84,000 bank; `balanceState` PARTIAL→insufficient, `recommendedPath` PORTAL, break-even reported as a bank-point figure (18,897) and a quote figure (17,448), not a bare Bonvoy threshold |
| 12 | Null FX degrades, never estimates | `fx` null, Accor, any balances | `valuePerBankPointPaise` null, points and permitted amounts still returned, `recommendedPath` NO_RECOMMENDATION, no rupee figure anywhere in the output |

Test 12 restates the standing rule from section 7 of the handoff as an
assertion, so a fallback constant cannot be reintroduced without failing the
suite.

---

## 6. What this needs from you

- The Accor amount rule, from the logged-in checkout amount field. Resolves
  tests 1, 3, 4, 6 and 8.
- HDFC's minimum and step size for transfers to Accor and to Bonvoy, from the
  Infinia portal. Until then test 7 is the shipped behaviour on every path.
- Whether Bonvoy award bookings carry cash taxes, and Accor's excluded charges.
- Infinia points validity, for test 9.
