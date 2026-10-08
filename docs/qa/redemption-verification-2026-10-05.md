# Redemption fixes and remaining acceptance checks — 5 October 2026

## Wallet loading follow-up — 8 October 2026

The founder reported an existing wallet showing zero active cards on mobile. Confirmed code defects: statement/manual card GET handlers converted database errors into successful empty responses; the dashboard ignored HTTP status and swallowed load failures. Initial card loading could also display the empty wallet before requests completed.

Fixed both read endpoints to return generic 503 errors for configuration/database failures while retaining authenticated owner scoping. Added a shared loader that requires successful, well-formed responses from both card sources. The wallet now distinguishes loading, error and successfully empty states, offers retry/sign-in recovery, and does not overwrite its stored cards when a refresh fails. No database records, permissions, credentials or account ownership were changed.

Validation: 12 new mocked API/page regression tests passed; TypeScript passed with no incremental output. Tests cover database/configuration failure, successful empty owner-scoped reads, expired sessions, one-source failure, retry recovery and failed refresh. External logs: `work/gap-checks/october8-wallet.log` and `october8-wallet-types.log`. Full suite/build were not rerun for this follow-up. Main remained e85554954a80a35a60068ad3eeb34ed9e56c09bb at inspection.

Limit: the affected phone's authenticated requests and underlying saved rows were not inspected. This confirms and fixes the false-empty failure path, not the cause of that particular request failure or restoration on the phone. After release, verify the same account on the affected device, successful statement/manual reads and expected cards. The separate wallet rupee-value label and Hotels mobile overflow are not changed by this patch.

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

## Real booking-link verification — follow-up on 5 October

The deployed Stay on Points page selected ibis Bangkok Sukhumvit 4 but its Check direct link opened hotel 9524, **ibis budget Surabaya Diponegoro, Indonesia**. A second checked old link, 9522, opened **Pullman Sydney Airport, Australia** instead of Novotel Bangkok Sukhumvit 4. This is a high-severity property-identity defect: a customer can leave a Bangkok comparison and start booking a different property/country. Reproduce by selecting the named property and following Check direct on the deployed release. It predates this patch.

Checked the official Accor pages for all 20 currently priced Accor rows. Replaced 18 URLs with the identity-matched official URLs below; SO/ Bangkok and Novotel Siam Square already matched. Some old URLs were not retrievable by the research tool, so those are not asserted to be confirmed 404s. The corrected ibis 7295 page was also opened in Chrome and displayed the correct Bangkok hotel. These are property-page links; they do not preserve dates, room, guests or a quoted price. Rates and checkout must be selected again on Accor.

| Hotel | Previous Accor ID | Verified official property |
| --- | --- | --- |
| Sofitel Bangkok Sukhumvit | 3829 | [5213](https://all.accor.com/hotel/5213/index.en.shtml) |
| SO/ Bangkok | 6835 (unchanged) | [6835](https://all.accor.com/hotel/6835/index.en.shtml) |
| VIE Hotel Bangkok | 6929 | [6469](https://all.accor.com/hotel/6469/index.en.shtml) |
| Movenpick BDMS Wellness Bangkok | 9748 | [B4U9](https://all.accor.com/hotel/B4U9/index.en.shtml) |
| Novotel Bangkok Siam Square | 1031 (unchanged) | [1031](https://all.accor.com/hotel/1031/index.en.shtml) |
| Mercure Bangkok Siam | 7017 | [8015](https://all.accor.com/hotel/8015/index.en.shtml) |
| Movenpick Sukhumvit 15 | 8355 | [B4K2](https://all.accor.com/hotel/B4K2/index.en.shtml) |
| Novotel Platinum Pratunam | 6404 | [7272](https://all.accor.com/hotel/7272/index.en.shtml) |
| Grand Mercure Asoke | 8422 | [6162](https://all.accor.com/hotel/6162/index.en.shtml) |
| Pullman King Power | 5834 | [6323](https://all.accor.com/hotel/6323/index.en.shtml) |
| Mercure Sukhumvit 11 | 8123 | [A247](https://all.accor.com/hotel/A247/index.en.shtml) |
| Pullman Hotel G | 6753 | [3616](https://all.accor.com/hotel/3616/index.en.shtml) |
| Novotel Sukhumvit 4 | 9522 | [A246](https://all.accor.com/hotel/A246/index.en.shtml) |
| ibis Bangkok Siam | 7148 | [8016](https://all.accor.com/hotel/8016/index.en.shtml) |
| Mercure Makkasan | 9011 | [8422](https://all.accor.com/hotel/8422/index.en.shtml) |
| Mercure Surawong | 7178 | [C0Q6](https://all.accor.com/hotel/C0Q6/index.en.shtml) |
| ibis Styles Silom | 9184 | [B6N1](https://all.accor.com/hotel/B6N1/index.en.shtml) |
| ibis Styles Sukhumvit 4 | 9523 | [A237](https://all.accor.com/hotel/A237/index.en.shtml) |
| ibis Sathorn | 7175 | [6537](https://all.accor.com/hotel/6537/index.en.shtml) |
| ibis Sukhumvit 4 | 9524 | [7295](https://all.accor.com/hotel/7295/index.en.shtml) |

The existing captured cash amounts were not independently recaptured or verified against current availability. No cash figures were changed. The two unpriced Marriott/Hyatt rows are outside this Accor link check. Correcting a URL is not proof of the old price capture or a bookable award.

Added 20 property-identity regressions through SeededRateProvider to the rendered Check direct link. Targeted run: **24/24 tests passed** in InvestorHotelWorkspace.test.tsx; no paid provider/network access. TypeScript also passed with zero diagnostics and incremental output disabled. The earlier 537-test full-suite result is before this follow-up, not a rerun of the updated tree. Logs: `work/gap-checks/october5-booking-links.log` and `october5-booking-types.log`; browser evidence: `october5-wrong-hotel.png` and `october5-correct-hotel.png` in the same external directory.

The public partnership terms were rechecked: Infinia, Diners Black and Regalia Gold each list 2 bank points to 1 ALL point; 2,000 ALL points have EUR 40 face value. This does not establish a transfer minimum, permitted increment, available balance, final rupee offset or checkout eligibility. HDFC again stopped at cardholder sign-in; exact issuer instructions remain gated pending authenticated programme-form evidence.

### Live Accor pre-payment check

Using the sample availability link exposed by the corrected ibis 7295 property page, opened 25–26 October 2026, one adult, one room. Accor displayed Superior Room 1 Queen Bed, advance saver/member rate: INR 2,941.38 room + INR 520.62 taxes = INR 3,462.00, equivalent to THB 1,207.60. This is an observed sample quote, not a guaranteed current offer and not the seeded three-night stay. Continued past optional extras without selecting any, reaching Complete your booking in the existing signed-in Accor session.

Stopped at required guest contact/billing details before Confirm. No personal details were entered, no terms accepted, no points applied and no reservation/payment completed. The point selector and checkout-eligible amount were not reached. The page explicitly states that only the hotel-currency amount is guaranteed; INR conversion is indicative and conversion/bank charges are the customer's responsibility. Consequently, this observation cannot lift either Accor gate or establish a guaranteed rupee redemption value. The HDFC login and checkout-data requirements remain real verification blockers.
