# CreditIQ Parallel Shopping — API Pilot and QA (27 Nov 2026)

## 1. Product scope
CreditIQ uses Parallel's Shopping API to retrieve fresh **India-market merchant product listings** behind an authenticated, explicitly allowlisted API, for future best-card research. This is **discovery only**: no purchase, bank card action, merchant checkout, order, or promise of final delivery-inclusive price.

Official docs:
- https://docs.parallel.ai/shopping-search/shopping-search-quickstart.md
- https://docs.parallel.ai/shopping-search/best-practices.md

## 2. Technical contract
- POST https://api.parallel.ai/v1/shopping/search, x-api-key header.
- JSON `search_queries: [publicProductQuery], advanced_settings: { location: 'in', max_results: 10 }`.
- Each result may have title, merchant, url, price, currency, brand, condition, availability.
- India-market only; reject results without INR as financially incomparable. Convert known INR listed price to integer paise. Missing price remains unknown.
- Every result has evidenceState=DISCOVERY_ONLY and requiresCheckoutReverification=true, **never REALIZED savings**. Shipping, taxes, stock and card eligibility require merchant checkout verification.

## 3. Secure activation (separate from Flights)
1. Create key in https://platform.parallel.ai/settings?tab=api-keys and request Shopping API entitlement (generic Search key alone may not be sufficient).
2. In CreditIQ Vercel project Settings → Environment Variables, for Preview first:
  `PARALLEL_API_KEY` (same secret server-only key)
  `PARALLEL_SHOPPING_ENABLED=true`
  `PARALLEL_SHOPPING_PILOT_USER_IDS=<comma-separated verified CreditIQ Auth UUIDs>`
3. Redeploy preview, then signed-in user calls `POST /api/commerce/parallel-shopping` with Bearer token and `{ "query": "Sony WH-1000XM5" }`.
4. On unauthorized user 401/403, bad query 400, Parallel denial 424, quota 429; no unauthenticated access to paid provider.
5. Verify actual listing and privacy/cost before considering Production rollout. API keys must never be copied into chat or public code.

## 4. Release checks
- `npm run check:parallel-shopping-pilot` (synthetic data and injected mock HTTP response)
- `npm run check:parallel-flights-pilot` and `npm run check:travel-shopping-truth`
- `npm test`, `npx tsc --noEmit`, `npm run build`, Vercel preview
- Real provider smoke test after account setup; no private financial data sent to Parallel.
- Customer-facing product recommendations and price tracking need explicit next PRs for verified checkout/issuer rewards, opt-in alerts and cost caps.

## 5. Non-goals
No automatic payments, no purchase orders, no corporate spend authorizations, no real card data exposed, no blanket user access, no unsupported ROI claims. Existing Consumer and Business apps remain unchanged apart from this new gated read-only endpoint.
