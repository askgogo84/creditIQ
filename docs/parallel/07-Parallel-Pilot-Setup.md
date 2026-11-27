# Parallel Flights pilot — Credential setup and release gate (27 Nov 2026)

## Verified official API
- Endpoint: `POST https://api.parallel.ai/v1/flights/search`
- Authentication: `x-api-key: PARALLEL_API_KEY` (server-side only)
- Request body: `origins`, `destinations`, `departure_date`, `adults`, `cabin`, `currency: INR`, `sort: price`, `advanced_settings.max_results`.
- Official contract: `price` is a **listed total for all requested travelers**, not the final airline checkout price.
- Response uses `results[].outbound`, `segments`, optional `price`, and `url` (may be airline search/homepage, not confirmed checkout).
- Docs: https://docs.parallel.ai/flight-search/best-practices.md

## Founder-only activation
1. Sign in at https://platform.parallel.ai/settings?tab=api-keys
2. Create a company API key or appropriate account key. Confirm separately that Flights API early access has been enabled. A generic web Search API key without entitlement may return 403.
3. Open the `credit-iq` Vercel project → Settings → Environment Variables. Enter these as **server-only** variables for a preview test first:
   - `PARALLEL_API_KEY`: the secret key; never put in chat, Github, or `NEXT_PUBLIC_*`.
   - `PARALLEL_FLIGHTS_ENABLED`: `true`.
   - `PARALLEL_FLIGHTS_PILOT_USER_IDS`: comma-separated Supabase Auth user UUIDs allowed to run paid flight searches. Never leave this list public/empty and assume the pilot runs.
4. To get your own Auth user UUID, sign in to the CreditIQ Consumer Supabase project and locate your account in Authentication → Users. Do not share personal tokens in chat.
5. Redeploy the preview (Vercel env changes apply to new deployments); test with the allowlisted CreditIQ account.
6. Only after successful production entitlement/price tests, add the same variables to Production and redeploy the reviewed build.

## Expected behavior
- Signed-in `POST /api/flights/fusion` uses Parallel only when all three controls pass (key, flag, allowlist).
- Parallel returns live provider-listed flights → shown with `source=parallel-flights`, total INR price for one adult, route/cabin/airline identity, official quote date; repricing required at checkout.
- Any 401/403, 429, unsupported itinerary, no price, or unavailable provider → existing CreditIQ flight source fallback, never invented prices.
- General public `GET /api/flights/search` **never calls Parallel** and cannot drain credits.
- Group award/return-trip fusion remains explicitly unsupported. Parallel itself supports party counts, but multi-passenger points-and-award math needs a separate validated release.

## Tests / risk gates
- `npm run check:parallel-flights-pilot` verifies official request and normalization with synthetic fixtures; not a live-provider test.
- `npm test`, `npx tsc --noEmit`, `npm run build`, and existing provider validators must all pass.
- After setting the API key, test a dated route with the account pilot user in Preview. Confirm provider returned total, segment cabin, currencies, and airline booking URL; do not purchase/transfer/book.
- Use the Parallel platform's spend cap and inspect Vercel logs for `ACCESS_DENIED`, `RATE_LIMITED`, or fallback volume. Repeated LLM API calls have cost implications even if no booking results.
- Do not broaden the allowlist until rate limits, per-user quotas, and commercial contract are approved.
