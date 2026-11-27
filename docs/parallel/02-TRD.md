# TRD — CreditIQ Parallel Flights + Travel Data (27 Nov 2026)

## Existing public flight provider chain
- GET /api/flights/search retains Skyscanner, gated legacy Amadeus, Kiwi MCP, Kiwi legacy and cached Travelpayouts.
- Optional adults=1..9; unsupported child/infant/round-trip inputs fail closed with 400/422.
- Only sources with group-total offer evidence may return 2+ adult fares. Skyscanner and Amadeus quote all-passenger totals; Kiwi MCP, Kiwi legacy and Travelpayouts are skipped for groups pending independent price verification.
- Public GET never invokes Parallel; it remains safe to call without a paid Parallel key.

## Official Parallel Flights early-access integration
- POST https://api.parallel.ai/v1/flights/search with x-api-key header.
- Body origins:[from], destinations:[to], departure_date, adults, cabin, currency:'INR', sort:'price', advanced_settings.max_results.
- Per https://docs.parallel.ai/flight-search/best-practices.md the returned price is the **lowest listed fare for all requested travellers**, not a guaranteed airline checkout price. Booking links may go to airline search/homepage. No ticketing or payment.
- Adapter validates route/date, carrier identity, cabin evidence and HTTPS booking URL; skips missing prices and incomplete itineraries.
- For now Parallel feeds only POST /api/flights/fusion for **one-adult, one-way** searches after verified bearer auth. The group award comparison is not yet trustworthy for more than one passenger.
- Pilot controls: PARALLEL_API_KEY present, PARALLEL_FLIGHTS_ENABLED=true, PARALLEL_FLIGHTS_PILOT_USER_IDS includes verified CreditIQ Auth user ID. All three required.
- On 401/403/429, missing inventory or provider timeout, fall back to existing cash sources and annotate source attempt; no private wallet data sent to Parallel.
- Flag defaults off. No credentials, new libraries or DB migration in this release.

## Travel watcher and shopping
- Existing lib/flights/fare-watch.ts is a pure decision component, not a scheduled/persistent monitor. A separate opt-in DB schema, cost cap, deduplication, and notifications require staging approval.
- lib/commerce/offer-truth.ts is pure, no shopping orders. Parallel Shopping search results are store listing prices, **not** full checkout totals until shipping/tax are known.

## Required verification
- Run npm run check:parallel-flights-pilot, npm run check:travel-shopping-truth, npm test, npx tsc --noEmit and npm run build.
- Test vendor data with a configured, authorized preview key; test proper currency, source, date, cabin, price and booking URL, plus 403 provider denial and fallback.
- Do not claim paid API entitlement until Parallel confirms it for the account.
- See 07-Parallel-Pilot-Setup.md for founder-only key/allowlist instructions.
