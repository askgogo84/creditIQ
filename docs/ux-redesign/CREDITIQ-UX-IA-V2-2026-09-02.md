# CreditIQ UX / IA v2 — 2 Sep 2026

## Goal

Turn CreditIQ from a collection of strong tools into one coherent product journey. The redesign must preserve CreditIQ's moat: verified numbers, explicit provenance, wallet-aware recommendations, and no invented financial facts.

This document starts from `docs/00-SIGNED-IN-IA.md` but updates it for the redemption-engine v3.1 work and the current Travel implementation.

## 1. Current-state audit

### Primary navigation

The intended signed-in shell already has a compact five-item rail:

- Wallet
- Spend
- Travel
- Cards
- You

`Home` was designed but deferred. `Ask AI` is currently treated as a Travel section tab even though the older IA says Travel AI should be the search itself rather than a separate destination.

Signed-out/public pages still render the marketing Header, so the same route can look structurally different before and after authentication. This is intentional in `NavShell`, but it makes preview QA confusing and should be made visually consistent.

### Travel section tabs today

- Fly on Points -> `/trip-planner`
- Ask AI -> `/travel`
- Sweet Spots -> `/sweet-spots`
- Transfer Partners -> `/transfer-partners`
- Lounges -> `/lounge-tracker`

`/stay-on-points` belongs to the Travel matcher but has no Travel section-tab entry. That is why the new hotel redemption experience feels bolted on.

### Hotel inventory today

The hotel search is **not a live/comprehensive hotel search**.

`Stay on Points` uses `SeededRateProvider`, backed by a manually captured Accor Bangkok dataset. The provider is explicitly `is_live=false`. Current records are captured starting-from member rates, tax-separated, with source/date provenance. FX is live and fail-closed, but hotel availability/rates are not.

Implication: the current page is a redemption-engine demo on a truthful captured dataset, not yet a general hotel-search product.

### Flight inventory today

The flight stack is more live, but still not comprehensive.

Cash fares:
- `/api/flights/search` tries Kiwi Tequila first.
- It asks for only 5 cheapest results.
- If Kiwi is unavailable, Travelpayouts is used as a fallback and also returns a small cheapest-fare set.
- Network calls currently do not have the same explicit timeout/fail-closed discipline as the hotel FX provider.

Award availability:
- Seats.aero is queried live.
- Fusion matches live award results to cash flights and the user's wallet cards.
- Only the lowest-mileage 6 awards are enriched with per-flight trip detail because each enrichment costs a Seats.aero call.
- Remaining awards can be summary-only.
- Redemption options from the legacy flight fusion are explicitly unverified; the new v3.1 redemption engine has not yet replaced flight redemption arithmetic.

Implication: CreditIQ currently finds a useful subset of live cash/award opportunities, but does **not** pull every flight, every fare family, every itinerary detail, or every award seat across all loyalty programmes.

## 2. Navigation decision

### Desktop signed-in rail

Use one persistent primary rail:

1. Home
2. Wallet
3. Spend
4. Travel
5. Cards

Bottom of rail:
- Ask CreditIQ
- Profile / You

`Ask CreditIQ` is a global action, not a bucket of unrelated AI tools.

Until Home is built, keep the current five-item rail but do not add more top-level destinations.

### Mobile

Bottom navigation should carry the highest-frequency destinations only:

- Home
- Wallet
- Spend
- Travel
- Cards

Profile moves to avatar/account access in the header. Ask CreditIQ becomes a persistent action/button rather than a sixth nav tab.

## 3. Travel IA v2

Do not expose every feature as a peer tab. Organize by user task.

### Primary Travel modes

- **Flights** — search cash + award options, then show the best wallet-aware redemption path.
- **Hotels** — search live hotel inventory, then show cash / portal / programme redemption paths.

### Supporting Travel intelligence

- Transfer Partners
- Lounges
- Sweet Spots

These remain accessible but are secondary to the search journey. Sweet Spots should also surface contextually on the Travel overview/results rather than requiring a separate destination for discovery.

### Ask CreditIQ

Make it contextual and global:

- Ask from a flight result
- Ask from a hotel result
- Ask from a card
- Ask from Wallet

The assistant should receive the selected result/context automatically. It should not force the user to leave a task and open a generic AI page.

### Route target

Preferred canonical routes:

- `/travel` — Travel landing/search shell
- `/travel/flights`
- `/travel/hotels`
- `/travel/transfers`
- `/travel/lounges`
- `/travel/sweet-spots`

Keep compatibility redirects/aliases from:

- `/trip-planner` -> `/travel/flights`
- `/stay-on-points` -> `/travel/hotels`
- `/transfer-partners` -> `/travel/transfers`
- `/lounge-tracker` -> `/travel/lounges`
- `/sweet-spots` -> `/travel/sweet-spots`

Do not perform route migration until the new shell is ready; avoid breaking inbound links.

## 4. Travel page flow

### Step 1 — Search

One Travel entry point with a clear `Flights | Hotels` mode switch.

Flights inputs:
- From
- To
- Departure / return
- Passengers
- Cabin
- Flexible-date range

Hotels inputs:
- Destination
- Check-in / check-out
- Rooms / guests
- Optional hotel programme / chain filter

Wallet context is automatic when signed in. Do not ask the user to re-enter balances CreditIQ already knows.

### Step 2 — Results

Results should be scan-friendly, not 20 full execution plans stacked vertically.

Each result card/row shows only:
- identity (flight/hotel)
- key itinerary/property details
- all-in cash price
- best ranked/executable points path
- cash still payable
- one-line why
- confidence/provenance state
- `View path`

### Step 3 — Detail / execution panel

Desktop: sticky right-side detail panel.
Mobile: full-screen detail or bottom sheet.

The panel owns:
- best path
- alternative paths
- numbered execution steps
- exact vs arithmetic-target distinction
- fees/taxes/FX
- transfer duration and irreversibility
- source evidence/provenance
- booking CTA

This removes repeated evidence tables from every result card and uses desktop width productively.

## 5. Desktop layout

Current Stay on Points uses a narrow ~760px content column and leaves substantial white space on desktop.

Target authenticated Travel workspace:

- 220–248px global app rail
- up to ~1280px Travel workspace
- search/filter bar across workspace
- results column ~60–65%
- sticky selected-result detail ~35–40%

For signed-out demo pages, retain the marketing header but use the same Travel workspace dimensions so the product does not radically change shape after login.

## 6. Data architecture required

Keep four layers separate.

### A. Search inventory layer

Hotels must normalize:
- provider property ID + canonical property ID
- hotel name / chain / programme
- coordinates / area
- star/category
- images
- room type
- rate plan
- occupancy
- member/public rate where applicable
- taxes/fees
- all-in total
- refundable/cancellation terms
- availability
- booking/deep link
- provider/source
- fetched timestamp
- live/cached/captured state

Flights must normalize:
- provider itinerary ID
- airline / operating carrier
- flight number(s)
- airport/terminal
- departure/arrival timestamps
- duration
- stop count + layover details
- aircraft where available
- cabin/fare family
- baggage where available
- cash fare + currency
- taxes/fees
- booking/deep link
- provider/source
- fetched timestamp

### B. Loyalty / redemption truth layer

Owns:
- issuer transfer ratios
- transfer min/increment
- transfer duration
- irreversible flag
- programme redemption rules
- award charts
- dynamic/quote-required state
- portal caps/fees
- provenance + as-of

### C. Decision layer

Use the v3.1 pure redemption engine for both hotels and flights.

Never let provider UI code recompute recommendation arithmetic.

### D. Presentation layer

Consumes normalized inventory + redemption plan only.

No financial decision arithmetic in React components.

## 7. Provider gaps to close

### Hotels — BLOCKING for general release

Current: manual Accor Bangkok seed only.

Required next:
- one live hotel inventory/rate provider with broad geographic coverage
- provider adapter implementing `HotelRateProvider` or a v2 replacement
- pagination / result breadth
- room/rate-plan detail
- taxes and cancellation terms
- property images
- live/cached freshness
- canonical property deduplication

Seed data remains useful for deterministic demos/tests, but must never masquerade as a live search.

### Flights — improve breadth and detail

Current:
- Kiwi or Travelpayouts cash results, capped at a small result set
- Seats.aero live award availability
- only 6 awards enriched with detailed trip data

Required next:
- explicit provider timeout + failure metadata
- increase/stream result breadth rather than `limit=5`
- preserve multiple itineraries/fare families
- normalize provider response into one `FlightInventoryResult`
- paginate/load more
- expose provider coverage/freshness
- stop defaulting unknown origin in Travel AI to BOM
- move flight redemption math to v3.1 engine
- Air India published-chart integration after the current hotel pass

## 8. Confidence vocabulary

Use three user-visible states consistently across the product:

- **Executable** — every execution-critical fact is verified enough to give an exact instruction.
- **Best-ranked, verification needed** — economics rank consistently but an irreversible/exact step is blocked.
- **Not priced / quote required** — CreditIQ cannot safely calculate the programme path.

Do not use generic green `Best` for a transfer path that cannot yet be executed.

## 9. Implementation phases

### Phase A — IA and shell
- add Hotels to Travel navigation
- rename `Fly on Points` -> `Flights`
- stop treating `Ask AI` as a Travel peer destination
- introduce Travel overview/search shell
- make desktop layout use available width
- make global/contextual Ask CreditIQ entry point
- preserve old routes through aliases/redirects

### Phase B — Travel results UX
- compact result cards/rows
- selected-result detail panel
- filters
- mobile result detail
- reusable confidence/provenance components
- Flights and Hotels share the same interaction grammar

### Phase C — hotel live inventory
- live hotel provider adapter
- normalized hotel inventory schema
- room/rate/tax/cancellation/image detail
- pagination and freshness
- feed each result to v3.1 redemption engine

### Phase D — flight data hardening
- normalize live cash and award providers
- broaden cash results
- timeouts/fail-closed status
- detailed itinerary enrichment strategy
- v3.1 flight redemption integration
- Air India published chart first

### Phase E — Home and cross-product cleanup
- build Home as the post-login command center
- saved searches/trips
- contextual WhatsApp / Ask CreditIQ
- remove duplicate/orphaned tool destinations
- reconcile tests and route labels with final IA

## 10. Non-negotiables

1. No invented data.
2. No stale/captured result presented as live.
3. No exact transfer instruction when min/increment/eligibility is unresolved.
4. One source of truth for each financial fact.
5. No financial decision math in UI components.
6. Search providers may fail independently; the UI must say which layer failed.
7. Results must show all-in money where provider data permits it.
8. Old URLs remain usable during migration.
9. 375px mobile and desktop workspace are both first-class.
10. New UX work happens on `feat/creditiq-ux-ia-v2`, based on the tested redemption branch.
