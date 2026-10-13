# CreditIQ transactional booking sandbox — 13 October 2026

## Purpose

This branch turns the existing Concierge approval state machine into a runnable end-to-end transaction sandbox for both FLIGHT and HOTEL cases.

It is deliberately separated from production supplier booking. The first milestone is to prove the complete CreditIQ lifecycle safely:

1. exact option is server-verified,
2. user approval is already recorded,
3. booking starts,
4. supplier/payment outcome is recorded,
5. a booking/reservation reference is produced,
6. the case is marked booked,
7. final cash/booking facts are reconciled.

The sandbox does **not** charge a card, move points, call a paid provider, or issue a real airline ticket/hotel reservation.

## Safety boundary

- Enabled automatically in tests and Vercel preview/development.
- Disabled in Vercel production unless `CREDITIQ_BOOKING_SANDBOX=true` or `1` is explicitly configured.
- Requires Admin authentication.
- Requires a Concierge case at `TRANSFER_APPROVED`, `BOOKING_IN_PROGRESS`, or `BOOKED`.
- Requires `snapshot_trust=SERVER_VERIFIED` and a verified redemption snapshot.
- Requires the normal `buildBookingExecutionPlan` to report an executable booking path.
- Requires a verified final cash amount.
- Traveller/guest first and last names are validated for the simulated checkout but are **not persisted** in reconciliation.
- Booking references are deterministic per case/selection, making retries idempotent at the sandbox reference layer.

## Success lifecycle

`TRANSFER_APPROVED → BOOKING_IN_PROGRESS → BOOKED → RECONCILED`

The route uses the existing `concierge_apply_ops_action` RPC for every transition so the same database state machine and event log are exercised.

A successful test returns a reference in the form:

- Flight: `CIQ-FLT-XXXXXXXXXX`
- Hotel: `CIQ-HTL-XXXXXXXXXX`

These are CreditIQ sandbox references, **not supplier PNRs**.

## Failure simulations

The Admin sandbox supports:

- `SUCCESS`
- `PAYMENT_DECLINED`
- `SUPPLIER_TIMEOUT`

Failure simulations start the booking and then use the normal `FAIL` transition, preserving the audit trail.

## Admin test flow

1. Create a flight or hotel Concierge case from Travel.
2. Operator/admin confirms the exact option with a server-verified snapshot.
3. Request user approval.
4. User approves from Concierge.
5. Open `/admin/concierge`.
6. Expand **Transaction sandbox · preview/test only**.
7. Use synthetic names.
8. Run success, payment-declined and supplier-timeout scenarios.
9. Confirm the success case reaches `RECONCILED` with a sandbox reference.
10. Confirm failure cases reach `FAILED` and never receive a booking reference.

## Automated coverage added

- deterministic flight sandbox reference
- deterministic hotel sandbox reference
- no persisted holder names in reconciliation
- rejects unverified snapshots
- rejects unknown final cash
- preview/test enabled; production disabled by default
- route success sequence: START_BOOKING → MARK_BOOKED → RECONCILE
- route payment failure sequence: START_BOOKING → FAIL
- admin control sends only synthetic holder, participant count and simulation choice

## Real supplier milestone — still required

This branch does not claim a real PNR/reservation. The next provider-backed acceptance gate is:

### Flight — Amadeus TEST

Official Amadeus flow:
1. Flight Offers Search
2. Flight Offers Price
3. Flight Create Orders
4. capture returned flight-order ID / associated-record PNR

CreditIQ already has Amadeus OAuth + Flight Offers Search. A booking adapter still needs to preserve/re-find the exact provider offer, re-price it, send synthetic TEST traveller data, and capture the returned TEST order/PNR. Production ticketing remains a separate commercial/consolidator requirement.

### Hotel — HBX / Hotelbeds TEST

Official HBX hotel flow:
1. `/hotels` availability
2. `/checkrates` when the rate is RECHECK
3. `/bookings` confirmation
4. capture HBX booking reference
5. verify booking detail / cancellation path

CreditIQ already has an HBX availability adapter. The booking adapter must preserve the exact `rateKey` and use TEST credentials/certification access. Production remains gated by HBX commercial approval/certification.

## Definition of “full booking enabled”

Do not call CreditIQ fully transactional until at least one FLIGHT and one HOTEL case complete the provider-backed TEST flow above and the returned supplier references are captured through the same Concierge lifecycle.

After that, production enablement additionally requires supplier commercial approval, payment/ticketing settlement, cancellation/refund handling, monitoring, and explicit production feature gates.
