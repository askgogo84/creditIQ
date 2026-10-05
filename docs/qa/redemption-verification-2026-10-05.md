# Redemption fixes and remaining acceptance checks — 5 October 2026

## Scope and baseline

GitHub main checked at e85554954a80a35a60068ad3eeb34ed9e56c09bb. The implementation checkout starts at 091efe1f9b7f217132ad8dfc3b47e67eb8c998d1, whose tree matches that release. Before edits: 527 tests across 97 files passed; TypeScript had zero diagnostics. External network was blocked during automated tests and synthetic service credentials were used. The first sandbox test attempt could not launch esbuild; the permitted retry passed.

## Corrected defects

- Apply Accor's published 1,000,000-point online booking cap. Correct the alternative reading: the disputed 1,000-point exception does not imply 3,000/5,000-point increments. Link rule provenance to the actual terms.
- Show one summary per distinct withheld-scenario reason in the advisor, preserving independent cash/portal results and withholding conditional programme amounts.
- Propagate missing-evidence restrictions to the corporate handoff button as well as the personal concierge button. Opening an eligible personal confirmation still does not submit a case.
- Describe captured hotel results as comparisons requiring checkout verification, rather than executable bookings.
- Reject unsafe or malformed query balances without crashing the hotel calculator.

## Final automated verification

- Full suite: **537 passing tests across 100 files**, including ten new regression cases.
- TypeScript: **zero diagnostics**, using `--noEmit --incremental false`.
- Production build: **passed** with synthetic credentials and external networking blocked. A remote CSS font optimization warning was nonfatal; this does not verify production provider configuration.
- Lint: **passed with 20 existing warnings**, no errors.
- Diff whitespace checks passed. React review covered hook order, type-only engine imports, conditional-result confidentiality, and disabled handoff behavior.
- Local evidence outside the repository: `work/gap-checks/october5-final-suite.log`, `october5-types.log`, `october5-build.log`, `october5-lint.log`.

## Signed-in production checks performed on 4 October

The existing signed-in Chrome session reached Home, Wallet, /optimize and /stay-on-points. Home rendered owned cards with balance provenance, selected-card intelligence, source/freshness labels and expandable redemption coverage. Wallet rendered the corresponding sourced and self-entered balances. The advisor loaded the selected owned card, then completed a captured Sofitel comparison through its server endpoint using current FX; it withheld exact transfers and unknown programme payable amounts. The stay page hydrated the supported wallet balance and displayed guarded paths and provider links. No browser errors appeared in the inspected advisor session.

These checks concern the already-deployed release, not the new fixes. They do not prove a live bookable rate, reservation creation, payment, transfer or cancellation. No production case or corporate handoff was submitted. A requested mobile viewport did not take effect (the measured width remained 2560), so this pass provides no new production mobile acceptance result.

## External evidence still required

[Accor membership terms](https://all.accor.com/a/en/loyalty-program/legal/terms-and-conditions.html), effective 23 September 2026, were checked on 4 October. Section 10 contains both a 1,000-point online exception and a separate multiples-of-2,000 clause. Online redemption excludes some taxes; the specific excluded amount depends on checkout. At-hotel rules must not replace online rules. The cap is sourced; the remaining exceptions are not resolved by this patch.

[Accor/HDFC partnership terms](https://all.accor.com/loyalty-program/partners/conditions/hdfc/index.en.shtml) confirm the Infinia ratio but do not establish programme-specific issuer minimums/increments. The [HDFC transfer portal](https://offers.reward360.in/infinia/miles_transfer/partners) redirected to a cardholder verification form. No bank credentials or OTP were entered. A signed-in programme form is required before lifting these gates.

## Acceptance checklist

| Check | Test method / expected result | Status |
| --- | --- | --- |
| Accor cap | Synthetic large booking/balance cannot generate a programme spend above 1,000,000; no exact transfer while issuer facts are missing | Automated regression added |
| Advisor blockers | Many blocked candidates show a single explanation per reason; hidden conditional amounts stay hidden; cash remains visible | Automated regression added |
| Handoffs | Missing-evidence state disables both handoff buttons and makes no request; eligible personal confirmation opens without submission | Automated regression added |
| Invalid balance | Huge integers, infinity-sized input, negatives and fractional input retain unknown balance without an exception | Automated regression added |
| Captured prices | Hotel comparison states checkout verification is required and does not count captured results as executable | Automated regression added |
| Updated signed-in preview | Home → Wallet → advisor → selected captured booking, supported/unsupported card, missing balance and service errors | Pending preview acceptance |
| Mobile | At 375px, inspect element bounds, tap targets, disclosures and result summary for clipping; repeat desktop | Pending browser acceptance |
| HDFC programme rules | Cardholder opens each programme's transfer form; capture minimum, increment, cap, fee, timing and card scope without submitting | Pending cardholder sign-in |
| Accor checkout | Verify permitted point amounts and non-redeemable taxes for selected property/rate/channel, including the 1,000-point case | Pending checkout evidence |
| Live search/quote | Approved provider test access; verify dates, guests, room, currency, price changes and availability loss | Pending provider verification |
| Reservation lifecycle | Provider sandbox: confirmation, payment failure, timeout/retry, duplicate prevention, cancellation/refund and reconciliation | Pending supported booking integration and sandbox |
| Concierge lifecycle | Approved test environment/account: create request, operator review, approval, audit trail and failure/retry; suppress actual sends | Pending controlled operational test |

Production auth was exercised, but a provider link or concierge case is not a confirmed reservation. The existing hotel search/handoff flow does not implement a complete in-app reservation lifecycle. Do not describe the product as fully tested or unlock source gates using mock data. This patch introduces no live booking, transfer, payment, notification, schema change or deployment.
