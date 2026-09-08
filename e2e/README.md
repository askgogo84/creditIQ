# CreditIQ browser QA

CreditIQ uses the installed `playwright` library through `scripts/qa-e2e.ts`; it does not require the separate `@playwright/test` package.

Run against a local server:

```bash
npm run qa:e2e
```

Run against a deployed preview or production URL:

```bash
QA_BASE_URL=https://example.vercel.app npm run qa:e2e
```

The runner checks desktop plus 360x800, 390x844 and 430x932 viewports, horizontal document overflow, unauthenticated Travel protection, protected Travel API behavior, and flight-provider safety.

Authenticated Travel/Wallet/Hotels/Concierge checks run when `PLAYWRIGHT_STORAGE_STATE` points to a valid Playwright storage-state JSON file. Without that fixture they are reported as `BLOCKED`, never as a false pass. Set `QA_REQUIRE_AUTH=1` when an authenticated fixture is mandatory and a missing fixture should fail the run.
