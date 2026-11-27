# TRD — Provider-first Travel Data
- Keep existing GET /api/flights/search provider chain: Skyscanner, Amadeus legacy gated, Kiwi MCP, Kiwi legacy, cached Travelpayouts.
- Extend GET with optional adults=1..9; do not infer child ages or round trips from unknown data. Invalid requests return HTTP 400/422.
- Skyscanner, Kiwi MCP, legacy Kiwi and Amadeus already take adults; propagate values. Exclude Travelpayouts fallback for adults>1 because it is cached and not party-specific.
- Keep POST /api/flights/fusion and AskGogo bridge single-seat until group-aware award math is implemented; reject/label incompatible group requests.
- New library /lib/flights/fare-watch.ts: pure eligibility and threshold logic, no network, no DB.
- New library /lib/flights/parallel-readiness.ts: gate source status without claiming an available Flights API. Parallel Search API web excerpts must never qualify as ticketable fares.
- No new SDK/dependencies, no credentials in commits, no PII sent to Parallel.
- Monitor API / backend jobs require separate opt-in, persistence, idempotency, privacy and spend cap review.