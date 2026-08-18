# PRD — Travel redesign (`/trip-planner` → Fly on Points)

**Status:** draft for review · 18 Aug 2026
**Surface:** CreditIQ consumer, Travel section
**Replaces:** the current `/trip-planner` page

---

## 1. The problem

The page asks the user where they are going three times, answers in three different
currencies, and the three answers contradict each other.

Observed on production, one session, Bangalore → Dubai:

| Where on the page | What it says |
|---|---|
| Summary card | Transfer to Air India Flying Returns 1:1, need 40,000 pts |
| Flight row #1 | IndiGo, 28,000 HDFC pts via Singapore KrisFlyer, save ₹9,800 |
| Redeem panel (bottom) | Air India Flying Returns, 40,000 pts, best card HDFC Infinia Metal |

Plus:

- **Two search forms.** The user describes their trip in free text, gets a plan, then
  finds a second structured search form below asking the same thing.
- **"You save vs cash ₹0"** renders inside a card that simultaneously says the points
  cover the trip, while rows below show ₹9,800 and ₹13,600 saved.
- **Date mismatch.** The plan says Aug 22–24; the form beneath is prefilled 25–28.
- **Fifteen outbound buttons** (5 OTAs × 3 airlines) plus two competing how-to columns.
  There is no single next action on the screen.

The user's verdict: *"this whole page is so confusing."*

## 2. Who this is for

A cardholder who has points and a trip in mind, and wants to know two things:

1. What can my points actually get me on this route?
2. What do I do next to get it?

They are not researching loyalty programmes. They will not read a strategy paragraph.

## 3. Goals

**G1 — One input.** The user states the trip once.

**G2 — One list.** Every option is a row in one table, sorted by value to the user.

**G3 — One expand.** Everything else — transfer routes, taxes, value per point, cash
comparison — lives behind a click on the row it belongs to.

**G4 — One action per row.** Redeem goes to the loyalty programme. Cash goes to one link.

**G5 — Zero contradictions.** Any number that appears twice on the page comes from one
source. If two components disagree, one of them is wrong and must be deleted, not hedged.

## 4. Non-goals for v1

- **Booking execution.** No airline exposes an award-booking API to third parties. v1
  hands off; it does not book. This is a permanent constraint, not a phase-2 item.
- **Hotels.** Flights only. The current Hotels toggle is removed.
- **Acting as a travel agent.** No cash ticketing, no money handling. See the corporate
  concierge notes for why (IATA/BSP, GST, TCS).
- **Multi-city and multi-passenger award search.** One origin, one destination, 1 pax.

## 5. What we keep that realise.club does not have

These are the reasons a user would choose CreditIQ over the reference product:

- **Wallet-grounded.** The user's real cards and real point balances, with the
  verified-vs-self-entered distinction carried through into every recommendation.
- **The honest "don't redeem" answer.** Where cash beats points, the page says so and
  says why. No competitor built on affiliate revenue can afford that sentence.
- **Provenance on every claim.** Card-database facts and community-reported sweet spots
  are visually distinct and labelled, the way the Ask AI surface already does it.

## 6. Success measures

| Measure | Why it matters |
|---|---|
| Time from landing to first useful row | The current page buries the answer below two forms |
| Search → row-expand rate | If nobody expands, the row isn't telling them enough |
| Expand → handoff click rate | The real conversion event in a handoff product |
| Count of numbers appearing twice with different values | Target: zero. Currently three |
| Rows abandoned before results finish loading | Progressive results should reduce this |

## 7. Honesty requirements (non-negotiable)

- Award availability, transfer ratios and cash fares each carry their own source and
  freshness. They are not blended into one confident number.
- Anything community-reported is labelled as such and never presented as CreditIQ's
  own verified data.
- A cash price is either live or absent. No "estimated range" presented next to a live
  points figure as though the two are comparable.
- Where the points path is worse than cash, that is the recommendation.

## 8. Open questions for Gogo

1. **Free-text planner — keep or drop?** Recommendation: keep it, but it fills the
   structured form rather than producing its own separate answer.
2. **Seats.aero partner terms** — do they permit commercial display and building a
   handoff funnel on their availability data? Needs checking before this ships.
3. **Which programmes ship in v1?** Realise shows 18. Starting narrower and correct
   beats broad and wrong.
