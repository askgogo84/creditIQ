# CreditIQ ↔ AskGogo merchant benefits — verified source only

16 November 2026. Draft isolated companion to AskGogo PR #1524.

This endpoint uses the existing server-to-server `verifyGogoServiceRequest` HMAC on the original request bytes, checks exact linked user ID, cart SHA-256, merchant, INR payable amount, and returns a quote payload understood by AskGogo's `creditiq-commerce-adapter.ts`:

POST `/api/internal/gogo/commerce/merchant-benefits`

`contract: gogo-creditiq-merchant-benefits-v1`, `userLinkId`, `cartSha256`, `provider`, `currency`, `totalPaise`, `quotes`.

**Production default**: `CREDITIQ_COMMERCE_ISSUER_EVIDENCE_ENABLED` OFF; zero quotes, no generated rewards or guessed issuer discounts. The additive SQL table stores only cart-exact, immutable, server-only evidence from **future issuer-authorized ingestion**, not card PAN or tokens. Do not backfill with catalogue or manually entered cards; both are ineligible. No public ingest route is created. No DB migration or flag has been applied.

Before live: obtain an authenticated issuer/merchant offers feed, validate the issuer's signature/terms and offer restrictions at ingestion, link account entitlement without sharing cards, test fraud/replay/privacy and accurate offer expiry. The two repositories use existing Gogo service HMAC credentials, but new endpoint and account linkage require live exact-user end-to-end testing. No merchant/purchase/payment credentials are stored here.

No notification to Claude, no deployment and no production writes.
