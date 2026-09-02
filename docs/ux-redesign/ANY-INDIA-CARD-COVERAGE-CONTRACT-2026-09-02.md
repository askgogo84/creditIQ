# CreditIQ — Any India Card Coverage Contract

**Date:** 2 Sep 2026  
**Applies to:** Wallet, Travel, Redemption, Ask CreditIQ, AskGogo/WhatsApp, Concierge, Corporate

## Product rule

HDFC, Axis and American Express are **demo examples only** because the current investor happens to use those issuers.

The production product must never hard-code those three issuers as the comparison universe.

For every travel/spend/redemption decision, CreditIQ must evaluate **every supported Indian credit card that the user has added to their wallet** and every relevant programme/portal path that can be sourced for those cards.

The UI should therefore say:

- **Best card in your wallet**
- **Compared across your cards**
- **Why this card wins**

—not “HDFC vs Axis vs Amex” as a fixed product concept.

## Candidate generation

Given a user wallet W containing N cards:

1. Load every wallet card with its provenance and balance.
2. Resolve the catalogue identity for each card.
3. Load all applicable redemption routes for that card:
   - issuer travel portal;
   - airline transfer partners;
   - hotel transfer partners;
   - fixed-value redemption paths;
   - programme balances already held;
   - cash-and-retain path.
4. Generate every legal path for the selected flight/hotel/spend decision.
5. Apply sourced caps, fees, transfer ratios, minimums, increments, taxes, FX, eligibility and availability.
6. Fail closed when a required arithmetic-driving fact is unknown or conflicted.
7. Rank surviving paths under the selected objective.
8. Show the winner plus the meaningful alternatives from the user's actual wallet.

No issuer should receive special ranking treatment because of brand, commercial partnership or demo convenience.

## Coverage behaviour

### Supported card with complete rules

Show exact comparison and exact executable instruction when all required facts are sourced.

### Supported card with partial rules

Show the path only to the level that can be proven. Example:

- transfer route exists;
- ratio is verified;
- exact issuer minimum/increment is unknown.

Then CreditIQ may show a target/requirement but must withhold “transfer exactly N now.”

### Card exists in catalogue but has no relevant route

Keep it in the wallet but mark it **No applicable redemption route for this booking**. Do not fabricate a route.

### Card not yet recognised in catalogue

Allow the user to keep the card in Wallet as an unmatched/self-entered card, but do not invent redemption economics. Offer:

**Help CreditIQ identify this card**

and route the card into the catalogue/research pipeline.

## Investor-demo rule

The investor demo may preload:

- HDFC
- Axis
- American Express

because those are the investor's own examples.

However the screen and presenter language must make clear that these are **the cards currently in this sample wallet**, not the only issuers CreditIQ supports.

Preferred demo copy:

> “CreditIQ compares every supported card in your wallet. This investor wallet happens to contain HDFC, Axis and Amex.”

## UI requirements

The comparison panel should scale to arbitrary wallet size.

Do not render twenty issuer rows by default. Instead:

- show the winning card/path;
- show the next 2–4 meaningful alternatives;
- provide **View all compared cards (N)**;
- allow sorting by cash today, bank-point efficiency, value retained and confidence/source state;
- show why paths were blocked or eliminated.

Example:

**BEST PATH**  
HDFC Infinia → KrisFlyer

**Alternatives**
- Axis Magnus → partner programme — ₹X more cash
- Amex Platinum Travel → partner programme — Y more points
- SBI Card Elite — portal path — ₹Z more cash
- ICICI Emeralde — no verified transfer route

**View all 9 cards compared →**

## India-card data model requirement

A card's redemption capability must be data-driven, not component-driven.

At minimum each supported card/issuer path should be able to represent:

- card catalogue id;
- issuer;
- card name/variant;
- points currency;
- wallet balance + provenance;
- portal redemption value;
- portal caps/fees;
- transfer programme;
- rational transfer ratio;
- transfer minimum;
- transfer increment;
- transfer SLA;
- transfer availability/state;
- expiry where sourced;
- source + as-of date;
- confidence/state (`VERIFIED`, `UNKNOWN`, `SOURCE_CONFLICT`, `ENDED`, `UNAVAILABLE`).

The same structure should work for HDFC, Axis, Amex, SBI, ICICI, IndusInd, HSBC, Standard Chartered, IDFC FIRST, Kotak, Yes Bank, AU and any other Indian issuer/card added to the catalogue. This list is illustrative, not an exhaustive or currently verified coverage claim.

## Flight and hotel implication

Flights and Hotels must receive a **wallet**, not a hard-coded issuer list.

Correct API/domain shape:

`planTravelRedemption(searchResult, walletCards, programmeBalances, sourcedRules, objective)`

Incorrect shape:

`compareHdfcAxisAmex(searchResult)`

## AskGogo / Ask CreditIQ implication

User prompts should work generically:

- “Which of my cards should I use for this flight?”
- “Can any of my cards transfer to KrisFlyer?”
- “Show every card I own that can book this hotel.”
- “Why did you choose this card over the others?”

The assistant must call the same wallet-aware decision service as the web UI. It must not maintain a separate three-bank rule set.

## Concierge implication

A Concierge case stores the selected `wallet_card_id` and path, but the case-creation CTA is available for whichever card/path wins. Concierge is issuer-agnostic.

## Corporate implication

Corporate optimisation is also card-agnostic. The engine should compare the full company card portfolio and policy constraints, not a predefined set of issuers.

## Test contract

Before production merge, add tests that prove:

1. comparison works with one card;
2. comparison works with 3 cards;
3. comparison works with 10+ cards;
4. a non-HDFC/Axis/Amex card can win;
5. an unsupported/unmatched card cannot fabricate a route;
6. a conflicted card path cannot beat a sourced path by using an arbitrary reading;
7. adding a new card via data does not require changing Travel UI comparison code;
8. removing a card from Wallet removes it from the comparison universe;
9. provenance survives from wallet card to candidate to recommendation to Concierge/WhatsApp response.

## Commercial independence rule

No bank, card issuer, affiliate, travel supplier or Concierge commercial arrangement may alter ranking. Commercial metadata is disclosed separately from the recommendation engine.
