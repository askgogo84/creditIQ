# CreditIQ Playwright E2E

The suite is split between public smoke tests (always runnable) and authenticated tests (enabled when a Playwright storage-state fixture is supplied).

Environment variables:
- `PLAYWRIGHT_BASE_URL` — defaults to `http://127.0.0.1:3000`.
- `PLAYWRIGHT_STORAGE_STATE` — optional path to an authenticated Playwright storage-state JSON file. Authenticated specs should skip when it is absent.

Supported regression viewports: desktop Chrome, 360x800, 390x844 and 430x932.
