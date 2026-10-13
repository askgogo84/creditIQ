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

### Flight — Duffel TEST

Amadeus Self-Service was decommissioned on 17 July 2026, so it is no longer the transactional sandbox target. The old search adapter is fail-closed by default.

Duffel is the supported supplier TEST path on this branch:

1. create an Offer Request for the exact route/date/cabin,
2. prefer the reliable Duffel Airways TEST offer when present,
3. create an instant TEST order with Duffel test balance payment,
4. capture the returned Duffel order ID and airline booking reference,
5. pass the supplier reference through BOOKED → RECONCILED.

The adapter accepts only a `DUFFEL_TEST_TOKEN` beginning with `duffel_test_`. No live Duffel token is accepted by the TEST adapter. The provider call is exposed only through the preview/test Concierge control and supplier TEST mode may start only once from TRANSFER_APPROVED to reduce duplicate-order risk.

### Hotel — HBX / Hotelbeds TEST

Official HBX hotel flow:
1. `/hotels` availability
2. `/checkrates` when the rate is RECHECK
3. `/bookings` confirmation
4. capture HBX booking reference
5. verify booking detail / cancellation path

CreditIQ's HBX availability adapter now preserves the exact `rateKey` and `rateType`. The TEST booking path performs CheckRate only for `RECHECK`, refuses production environment, allows at least 60 seconds for booking confirmation, creates the reservation, captures the returned HBX booking reference, and passes that reference through BOOKED → RECONCILED. Production remains gated by HBX commercial approval/certification.

## Definition of “full booking enabled”

Do not call CreditIQ fully transactional until at least one FLIGHT and one HOTEL case complete the provider-backed TEST flow above with configured provider credentials and the returned supplier references are captured through the same Concierge lifecycle. Code-level mocked tests prove orchestration, not supplier acceptance.

After that, production enablement additionally requires supplier commercial approval, payment/ticketing settlement, cancellation/refund handling, monitoring, and explicit production feature gates.
