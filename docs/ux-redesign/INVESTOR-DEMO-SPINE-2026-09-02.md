# CreditIQ — Investor Demo Spine

**Date:** 2 Sep 2026  
**Branch:** `feat/creditiq-ux-ia-v2`  
**Purpose:** define the shortest convincing product journey for an investor who personally uses HDFC, Axis and American Express cards, while proving the larger HNI + Corporate Concierge moat.

This is a demo contract, not a list of every feature in the repository. Every screen should answer one user question and move the investor to the next decision.

---

## 1. The investor should understand CreditIQ in one sentence

> **CreditIQ verifies what your cards and points actually contain, finds the economically best way to use them, shows the exact evidence and transfer path, and can execute the trip for you — for an individual, an HNI or an entire company.**

The product loop is:

**VERIFY → OPTIMISE → BOOK → RECONCILE**

That is also the bridge from consumer software to the Corporate/HNI operating model already used in the investor material.

---

## 2. What we must beat in the demo

### PointsCasa

Current public product pages market:

- one wallet for HDFC, Axis, Amex, airline and hotel balances;
- award search across 15+ airline programmes;
- filtering against what the user's wallet can book;
- blended balances across multiple cards/programmes;
- a step-by-step booking path;
- hotels priced in points across programmes.

Sources:
- https://points.casa/features/balances/
- https://points.casa/features/award-search/
- https://points.casa/features/blend-balances/
- https://points.casa/features/booking/
- https://points.casa/features/hotels/

**Therefore:** “wallet + award search + transfer path” is table stakes. We do not win by copying it.

### SaveSage

Current public product/app pages market:

- card/reward management;
- personalised card recommendations;
- Travel on Points for flights and hotels;
- an AI assistant;
- loyalty programme optimisation;
- human expert consultation.

Sources:
- https://savesage.club/
- https://play.google.com/store/apps/details?id=com.savesage.club

**Therefore:** “AI + rewards + human help” is also not enough by itself.

### CreditIQ demo differentiation

We must visibly prove all five together:

1. **Verified provenance** — statement/AA/manual are visually distinct; a self-entered value never silently becomes fact.
2. **Decision-grade arithmetic** — exact cash, portal and transfer alternatives, with fees, caps, FX, taxes, ratio, transfer delay and irreversibility where known.
3. **Executable path** — not only value-per-point; show the numbered next actions and block exact transfer instructions when a required fact is unresolved.
4. **Execution layer** — “Have CreditIQ Concierge book this” creates a real case, with user approval before irreversible transfer/payment.
5. **Corporate value recovery** — the same evidence model scales from one wallet to company statements, measurable leakage and an ongoing points/travel desk.

---

## 3. Investor demo — the 8 minute version

### Scene 1 — “These are my real cards” (45 sec)

Open **Wallet**.

Show three investor-relevant cards/issuers:

- HDFC
- Axis
- American Express

For every balance show provenance:

- **Verified from statement**
- **Connected** (only when a production data connector genuinely supports it)
- **Self-entered**

Do not flatten those into one confidence level.

Investor takeaway:

> “CreditIQ knows what I actually own, and tells me what it knows versus what I typed.”

### Scene 2 — statement forensics (60 sec)

Upload or select a prepared statement.

Show:

- card identified;
- last four digits;
- reward balance;
- statement period;
- fees/charges detected;
- spend categories;
- rewards earned/observed when source data supports them;
- opportunities with a direct statement-line trail.

The existing investor material already uses a real corporate fee-forensics example with ₹17,301 of recoverable value across finance charges, late fees, DCC markup, EMI interest, FX markup and other fees. Keep that example reproducible from its source statements; never present it as a universal saving.

Investor takeaway:

> “This is not a generic points calculator. It can audit evidence.”

### Scene 3 — Travel: Flights (90 sec)

Click **Travel → Flights**.

Search a route/date that has prepared demo-safe award inventory and cash pricing.

Result rows must show compactly:

- route/date/time;
- airline/programme;
- cabin;
- award cost + taxes;
- cash fare if available;
- freshness/source;
- **Bookable with my cards** state.

Opening one row reveals **Best Redemption Path**:

- CASH
- BANK PORTAL
- TRANSFER

For HDFC / Axis / Amex paths show, only when sourced:

- bank balance used;
- transfer programme;
- rational transfer ratio;
- exact bank points required;
- existing airline miles used;
- taxes/fees;
- cash payable;
- transfer SLA;
- expiry/irreversibility warnings;
- source status.

The recommendation engine chooses the winner; the UI explains why.

Investor takeaway:

> “It does the hard part after finding the seat.”

### Scene 4 — Travel: Hotels (90 sec)

Click **Hotels** in the same Travel surface — no separate product mental model.

Search destination/dates.

Each result should show:

- property/photo/location;
- room/rate basis;
- all-in cash total;
- loyalty programme;
- points possibility;
- estimated/verified eligibility state;
- **Best path** and cash left to pay.

Open a property to compare:

- pay cash;
- bank portal;
- transfer/redeem into hotel programme;
- use existing programme balance where relevant.

For Accor, preserve the v3.1 fail-closed launch gates: disputed redemption increment, unknown eligible charge basis and unsourced HDFC transfer min/increment must never become an invented exact instruction.

Current Bangkok seed data remains a truthful fixture/demo fallback, not a claim of live all-hotel inventory.

Investor takeaway:

> “The same exact routing engine works across air and stays.”

### Scene 5 — HNI Concierge (60 sec)

On the winning flight/hotel path show a single CTA:

**Have CreditIQ Concierge book this**

Case creation captures:

- itinerary/property choice;
- traveller/guest count;
- selected redemption path;
- points/balance snapshot;
- source freshness;
- expected cash/taxes/fees;
- transfer instructions that are verified versus pending verification;
- user preferences already known;
- contact channel.

Lifecycle:

`REQUESTED → REVIEWING → OPTION_CONFIRMED → AWAITING_USER_APPROVAL → TRANSFER_APPROVED → BOOKING_IN_PROGRESS → BOOKED → RECONCILED`

Hard rule: CreditIQ does not transfer irreversible points or charge a payment method without explicit user approval at the action boundary.

After booking, reconcile quoted versus actual:

- bank points moved;
- loyalty points spent;
- taxes/cash paid;
- booking reference;
- realised value/saving under the same calculation basis.

Investor takeaway:

> “This is where software turns into premium revenue and retention.”

### Scene 6 — WhatsApp / AskGogo (60 sec)

Switch to WhatsApp.

CreditIQ already exposes a real linking flow in the web app using a 6-digit, 10-minute code and a server-to-server AskGogo link redemption API. Its read-only portfolio endpoint combines manual cards, statement-imported cards and AA-linked cards, and preserves a `verified` flag.

Demo prompts:

- “How many points do I have across HDFC, Axis and Amex?”
- “Which of my cards can get me to Singapore in business class next month?”
- “Show me the hotel option with the least cash out of pocket.”
- “Why are you recommending HDFC instead of Axis?”
- “Send option 1 to concierge.”
- “What still needs my approval?”

WhatsApp must call the same wallet, redemption, travel and concierge services as the web app. The LLM may explain the result; it must not independently recreate transfer arithmetic or silently promote self-entered balances to verified balances.

Investor takeaway:

> “The product follows me; I do not have to reopen an app.”

### Scene 7 — CreditIQ for Business (75 sec)

Switch workspace:

**Personal | Company**

Company home answers a CFO question, not a consumer question:

> “What did our card programme cost us, what value did we leave on the table, and what can CreditIQ recover?”

Show:

- statements/cards analysed;
- spend analysed;
- fee leakage;
- reward leakage/opportunity;
- FX/DCC leakage;
- expiring/stranded points where source data supports it;
- observed recoverable amount;
- annualised opportunity range with a clearly stated basis;
- top three actions;
- “Engage Corporate Concierge.”

The existing demo-safe corporate example is **₹17,301 for one organisation over one year**, explicitly computed from real statements. It must remain labelled as that one dataset, not converted into a broad market claim.

Corporate concierge expands beyond one booking into an operating points/travel desk:

- optimise company-card allocation;
- monitor leakage;
- route corporate reward balances;
- fulfil executive/HNI travel;
- reconcile realised savings/value;
- report back to finance.

Investor takeaway:

> “The consumer engine becomes enterprise software + service.”

### Scene 8 — close (20 sec)

End on one line:

> **CreditIQ is not a points content site. It is a verified financial decision and execution layer for high-value card spend.**

---

## 4. Product IA for the demo build

### Primary left rail

1. Home
2. Wallet
3. Spend
4. Travel
5. Cards

Secondary / bottom:

- Ask CreditIQ
- Profile

Workspace switch appears near identity:

- Personal
- Company

Do not add “Corporate”, “Concierge”, “AI”, “Sweet Spots” or “Transfers” as competing primary destinations.

### Travel

Primary modes:

- **Flights**
- **Hotels**

Supporting tools:

- Sweet Spots
- Transfer Partners
- Lounges

Ask CreditIQ becomes global/contextual after its replacement surface exists; until then the existing Ask AI entry remains reachable so no feature is orphaned.

---

## 5. One Travel result model, two inventory types

The product should render a common decision shell around different inventory.

### Common result contract

- search identity;
- supplier/programme;
- inventory freshness;
- cash price when available;
- award/points price when available;
- taxes/fees;
- wallet reachability;
- candidate paths;
- recommended path;
- exactness/confidence;
- source evidence;
- booking/concierge action.

### Flight-specific

- carrier/flight number;
- departure/arrival;
- duration/stops;
- cabin;
- seats;
- award programme.

### Hotel-specific

- property/brand;
- photo;
- room/rate plan;
- nightly + all-in total;
- taxes/fees;
- cancellation/refundability;
- loyalty programme;
- eligible amount basis when known.

---

## 6. Data-readiness truth table

### Hotels today

Current production path is **not a complete live hotel search**. `SeededRateProvider` reads manually captured Accor Bangkok data and explicitly marks it `is_live=false`.

Build requirement:

- keep seed provider as deterministic fixture/fallback;
- introduce a live provider behind `HotelRateProvider`;
- normalise all-in pricing, room/rate/cancellation and freshness;
- never mix captured and live data without labels.

### Flights today

Current fusion path is stronger:

- cash search;
- Seats.aero award availability;
- user's held cards.

But cash search currently returns a very small cheapest-fare set and award trip enrichment is capped. The UI also has a manual USD/INR convenience rate in one path.

Build requirement:

- broaden itinerary coverage/pagination;
- add timeouts and explicit source/freshness;
- replace manual FX with sourced fail-closed FX;
- move flight transfer decisioning onto the same v3.1 redemption principles used for hotels.

### Wallet today

Three sources are already conceptually represented:

- manual cards;
- statement imports;
- AA-linked cards.

Keep provenance first-class in every consumer.

---

## 7. Account Aggregator: what we can and cannot say

The repository already contains AA prototype scaffolding:

- consent API;
- poll/status/fetch routes;
- `CREDIT_CARD` as a requested FI type in the prototype;
- last-four filtering after returned data is decoded;
- `linked_cards` consumed by the WhatsApp portfolio route.

But this is **not enough to claim production credit-card connectivity**.

Official ecosystem material says:

- AA sharing is customer-consent based;
- HDFC Bank and Axis Bank are live FIP/FIU participants in the AA ecosystem as of the latest Sahamati tables;
- being a live FIP does not mean every product/account type is exposed;
- Sahamati's published account-type activation table historically enumerates savings/current/term/recurring accounts rather than proving consumer credit-card availability for each issuer.

Sources:
- https://sahamati.org.in/what-is-account-aggregator/
- https://sahamati.org.in/fip-fiu-in-account-aggregators-ecosystem/
- https://sahamati.org.in/account-types-activated-on-aas/
- https://api.rebit.org.in/

### Demo-safe AA language

Do **not** say:

> “Enter your mobile number + last four digits and we can pull any HDFC/Axis/Amex card.”

Use:

> “Connect eligible financial accounts through a consented data provider. Where the provider returns multiple accounts, CreditIQ can use the masked number/last four digits to match the card.”

For the investor demo, statement import is the dependable verified path. AA should appear only as **Connect account (pilot)** until the selected AA/provider proves credit-card discovery and data payloads for the exact issuers used in the demo.

### AA technical cleanup before production

The current provider integration is generic scaffolding. Before enabling it:

- choose the actual AA/provider and implement its exact discovery, consent, FI request and crypto contracts;
- do not rely on a home-grown generic AES interpretation if the provider/spec requires a different key-exchange/envelope;
- store the minimum data necessary;
- add consent lifecycle/revocation/audit UX;
- validate field mapping per FI schema/provider;
- treat last4 as a matching hint, never authentication.

---

## 8. AskGogo / WhatsApp integration contract

Existing CreditIQ pieces:

- `/profile` has a Link WhatsApp flow;
- `/api/wa/link-code` mints a short-lived code;
- `/api/wa/redeem` lets AskGogo consume it server-to-server with shared-secret auth;
- `/api/wa/portfolio` returns the linked user's card portfolio with provenance.

The bot itself lives in the separate `askgogo84/gogo-memory-os` repository.

### Next integration boundary

Add server-to-server CreditIQ actions for AskGogo; never expose database/service keys to the bot:

- `get_wallet`
- `search_flights`
- `search_hotels`
- `get_redemption_plan`
- `explain_redemption_plan`
- `create_concierge_case`
- `get_concierge_case`
- `request_user_approval`

Every action must return structured provenance so WhatsApp can say **Verified**, **Self-entered**, **Live**, **Captured**, **Source conflict**, or **Needs verification** accurately.

---

## 9. Corporate data architecture

The investor material establishes **CreditIQ for Business**, fee forensics, corporate SaaS/service economics, and the Corporate/HNI concierge roadmap. However, this CreditIQ repository and its checked-in `.env.example` expose only one Supabase connection, and the current checked-in migration folder does not visibly establish a company/org schema.

The user's stated Corporate database may therefore be a separate external Supabase/project or older implementation not wired into this branch. Do not merge Corporate into the consumer tables merely because that connection is not visible here.

### Required integration contract if Corporate stays in a separate database

Consumer CreditIQ should address it through a server-side adapter, e.g. `CorporateRepository`, rather than importing a second client throughout UI code.

Minimum domain model:

- organisations
- organisation_members
- corporate_card_accounts
- corporate_statement_imports
- corporate_transactions
- savings_opportunities
- optimisation_recommendations
- travel_requests
- concierge_cases
- approvals
- bookings
- reconciliation_events
- audit_events

The exact table names should follow the existing Corporate database once located; this list is a domain contract, **not a migration instruction**.

### Savings model

Never show a single magic “you will save ₹X” number without basis.

Separate:

1. **Observed recoverable value** — directly evidenced in uploaded period.
2. **Avoidable leakage** — fees/FX/DCC/wrong-channel/wrong-card losses supported by rules + transactions.
3. **Reward opportunity** — incremental value under an alternative card/routing strategy.
4. **Annualised opportunity** — extrapolation from observed period, explicitly labelled and bounded.
5. **Realised value** — only after execution/reconciliation.

Every opportunity should have:

- source transaction/statement refs;
- current card/path;
- recommended card/path;
- observed amount;
- counterfactual amount;
- delta;
- rule/source version;
- confidence;
- whether it is recoverable, avoidable, prospective or realised.

---

## 10. HNI and Corporate Concierge are one execution platform

Do not build two separate booking engines.

Use one `concierge_cases` domain with owner/context:

- `PERSONAL`
- `HNI`
- `CORPORATE`

Additional Corporate fields can include:

- organisation;
- employee/executive;
- cost centre;
- policy;
- approval chain;
- invoice/GST requirements.

Common case state machine:

`REQUESTED`
→ `REVIEWING`
→ `OPTION_CONFIRMED`
→ `AWAITING_USER_APPROVAL`
→ `TRANSFER_APPROVED`
→ `BOOKING_IN_PROGRESS`
→ `BOOKED`
→ `RECONCILED`

Side states:

- `NEEDS_INFORMATION`
- `PRICE_CHANGED`
- `AWARD_UNAVAILABLE`
- `CANCELLED`
- `FAILED`

The Concierge dashboard should be an internal operations surface first; the customer sees case status, evidence, approvals and reconciliation.

---

## 11. Demo fixtures versus production claims

The investor demo can be deterministic without being deceptive.

For every data object add/display provenance:

- `LIVE`
- `CAPTURED_AT`
- `STATEMENT_VERIFIED`
- `SELF_ENTERED`
- `PUBLISHED_RULE`
- `SOURCE_CONFLICT`
- `DEMO_FIXTURE`

Demo fallback is allowed when a third-party API fails, but the UI must say **Demo fixture / captured data** rather than pretending it is live.

This is especially important for:

- Bangkok hotel seed rates;
- flight availability/fare API outages;
- transfer rules under dispute;
- Account Aggregator pilot connectivity.

---

## 12. Build plan — investor-demo priority

### P0 — visual product spine

- [x] Travel nav visibly exposes **Flights** and **Hotels**.
- [ ] build full-width Travel shell with Flights/Hotels primary segmented control;
- [ ] compact result cards/table;
- [ ] right-side Best Redemption Path panel on desktop;
- [ ] bottom-sheet path on mobile;
- [ ] persistent Wallet summary in Travel;
- [ ] verification/source chips standardised.

### P0 — HDFC / Axis / Amex demo readiness

- [ ] choose exact three card products used in demo;
- [ ] verify transfer partner/ratio/cap/min/increment facts used in the demo;
- [ ] create deterministic demo wallet balances;
- [ ] run at least one flight path where each issuer is considered;
- [ ] run at least one hotel path where multiple issuers/portal/cash alternatives are compared;
- [ ] show why the winner wins and why others lose;
- [ ] no unsourced exact transfer instruction.

### P0 — Concierge demo

- [ ] case domain/API;
- [ ] “Have CreditIQ Concierge book this” CTA;
- [ ] case status panel;
- [ ] explicit approval checkpoint;
- [ ] reconciliation summary;
- [ ] demo internal concierge queue.

### P0 — WhatsApp bridge

- [x] link-code + redeem + portfolio bridge exists;
- [ ] structured Travel/Redemption API for AskGogo;
- [ ] create concierge case from WhatsApp;
- [ ] approval handshake;
- [ ] verified/self-entered language parity with web.

### P1 — Corporate demo

- [ ] locate/connect the existing separate Corporate datastore;
- [ ] do not invent a new database until that is resolved;
- [ ] Company workspace switch;
- [ ] corporate statement upload/select demo;
- [ ] forensics dashboard with traceable savings cards;
- [ ] observed vs annualised vs realised value separation;
- [ ] Corporate Concierge handoff.

### P1 — inventory depth

- [ ] live hotel provider;
- [ ] broaden cash flight inventory;
- [ ] replace manual flight FX;
- [ ] normalise freshness/source metadata;
- [ ] graceful demo-safe provider fallbacks.

### P2 — AA pilot

- [ ] select production AA/provider;
- [ ] verify supported credit-card account discovery for HDFC/Axis/Amex;
- [ ] implement provider-specific consent/discovery/FI crypto contract;
- [ ] masked-number matching;
- [ ] consent status/revoke/audit UX;
- [ ] only then remove “pilot” label.

---

## 13. Demo success criteria

The demo passes only if an investor can answer all of these without explanation from the presenter:

1. What cards/balances does CreditIQ know about?
2. Which values are verified versus self-entered?
3. What flight/hotel can those balances actually reach?
4. Which path costs the least cash today?
5. How many bank points move and to where?
6. What facts are verified and what is still uncertain?
7. What happens before an irreversible transfer?
8. Can CreditIQ execute the booking for me?
9. Can I ask the same thing on WhatsApp?
10. What does the same engine do for a company?
11. How is a corporate savings number evidenced?
12. Where does CreditIQ make money without corrupting the recommendation?

If those twelve are obvious, the product story is stronger than a feature-comparison demo.
