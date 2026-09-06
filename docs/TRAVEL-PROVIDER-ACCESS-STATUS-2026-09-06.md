# CreditIQ Travel provider access status — 6 Sep 2026

This document records commercial-access state only. It does not store credentials.

## Cash flights

- Skyscanner Flights Live Prices — application submitted; adapter wired; waiting for API access.
- Amadeus Flight Offers — Travel Sellers / Web Services enquiry submitted; adapter wired; waiting for credentials/product provisioning.
- Kiwi Tequila — legacy invited-partner source; use only if a valid commercial partnership key is configured.
- Travelpayouts / Aviasales — working fallback; cached fare discovery only, not complete live cabin-verifiable inventory.

## Award flights

- AwardTool — 7-day trial requested on 6 Sep 2026 for Real-Time Search + Panorama + Hotel API. Proposed paid package: $2,000/month for 20,000 real-time searches, 100,000 Panorama requests and 100,000 Hotel API requests; no paid activation without explicit approval.
- PointsYeah — commercial API request sent; follow-up pending.
- AwardWallet — existing guest-capable flight search integration; programme-login-required cases fail closed to direct verification.
- Seats.aero — commercial-use request sent 6 Sep 2026, including rooms.aero. Do not treat a personal Pro API entitlement as commercial permission.

## Cash hotels

- Booking.com Demand API — registration in progress; Search/Look/Redirect adapter already wired and defaults to sandbox until production is explicitly enabled.
- Skyscanner Hotels Live Prices — application submitted; existing pageable adapter wired.
- Amadeus Hotels — requested in the Amadeus Travel Sellers/Web Services enquiry; hotel adapter intentionally waits for provisioned enterprise product/schema.
- Expedia Rapid — partner approval required before credentials; not yet applied in this cycle.
- HBX / Hotelbeds — API/commercial enquiry sent 6 Sep 2026; case #60420239 created. Evaluation key is a separate self-service path; production requires certification.

## Award hotels

- AwardWallet Hotel Search — existing live date-specific search adapter.
- AwardTool Hotels — cached discovery adapter already exists; the requested 7-day trial should allow live Hotel API evaluation separately.
- PointsYeah Hotels — commercial API request sent; adapter waits for confirmed production schema.
- rooms.aero — commercial availability requested through Seats.aero; do not assume inclusion until confirmed.
- StayWithPoints — monitoring/watch candidate for Hilton, Hyatt, Marriott and IHG; not considered a live booking-price authority.

## Safety / truth rules

1. Missing provider access is `UNAVAILABLE`, never zero inventory.
2. Cached discovery never becomes live availability.
3. Published programme charts/guides never become verified seats or rooms.
4. Cabin-specific value comparisons require a cabin-verifiable cash fare.
5. Before any irreversible points transfer, the final programme/booking path must be re-verified.
6. No provider trial or evaluation state may auto-convert into a paid commitment without explicit business approval.
