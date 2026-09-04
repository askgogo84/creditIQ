# CreditIQ Global Travel Provider Configuration — 2026-09-04

This document is the activation contract for the Travel provider stack. Do not put credential values in GitHub, logs, screenshots or client-side code.

## 1. Cash flights

Runtime order:

1. Skyscanner Flights Live Prices
2. Amadeus Flight Offers
3. Kiwi Tequila (legacy invited-partner path)
4. Travelpayouts / Aviasales dated cached-fare fallback

### Skyscanner Flights

Required server environment:

- `SKYSCANNER_API_KEY`

The same key may also activate the existing Skyscanner Hotels adapter if the commercial account includes Hotels access.

Authority: cabin-specific live provider inventory. CreditIQ still labels incomplete polling as a provider window rather than claiming the whole market.

### Amadeus Flights

Required server environment:

- `AMADEUS_CLIENT_ID`
- `AMADEUS_CLIENT_SECRET`

Optional environment:

- `AMADEUS_ENV=test|production` (default `test`)
- `AMADEUS_BASE_URL` (explicit contract-specific override; takes precedence)

Safety: sandbox/test is the default. Production must be explicitly enabled after Amadeus provisions the correct product contract.

### Kiwi

- `KIWI_TEQUILA_API_KEY`

Only use with valid commercial/invited-partner access.

### Travelpayouts

- `TRAVELPAYOUTS_TOKEN`
- `TRAVELPAYOUTS_MARKER` (optional attribution marker)

Authority: dated cached fare discovery only. It does not expose reliable cabin classification, so a Business/First search may display the fare only as a reference and must not use it as the premium-cabin cash benchmark.

---

## 2. Award flights

Target order / evidence ladder:

1. AwardTool Flights — commercial access pending; flight adapter finalized only against partner schema.
2. PointsYeah Flights — commercial access pending; adapter finalized only against partner schema.
3. AwardWallet guest-capable live search — already implemented when credentials exist.
4. Seats.aero — current working award discovery.
5. Airline-published guide data — GUIDE only, never seat availability.
6. Direct airline programme verification — final boundary before irreversible transfers.

Environment:

- `AWARDTOOL_API_KEY`
- `POINTSYEAH_API_KEY`
- `AWARDWALLET_API_AUTH`
- `SEATS_AERO_API_KEY`

No provider result may silently become VERIFIED. Provider availability, published charts, transfer ratios and direct seat verification remain separate facts.

---

## 3. Cash hotels

Runtime order currently wired:

1. Booking.com Demand API v3.2
2. Skyscanner Hotels Live Prices

Planned secondary supply after commercial access:

3. Amadeus Hotels (match implementation to provisioned enterprise contract)
4. Expedia Rapid
5. HBX / Hotelbeds

### Booking.com Demand

Required server environment:

- `BOOKING_DEMAND_API_TOKEN`
- `BOOKING_AFFILIATE_ID`

Optional:

- `BOOKING_DEMAND_ENV=sandbox|production` (default `sandbox`)
- `BOOKING_DEMAND_BASE_URL` (explicit override)

Default sandbox base:

- `https://demandapi-sandbox.booking.com/3.2`

Production base:

- `https://demandapi.booking.com/3.2`

The adapter uses the v3.2 search + details flow. It uses CreditIQ's global airport/city dataset as a 50 km coordinate proxy until the Booking account's preferred city/autocomplete capability is enabled. The UI labels the provider and does not claim the proxy is a city centre.

Booking.com pricing rule: store/compare the provider total and retain base/charge separation where returned. Do not advertise base price as the final traveller price.

### Skyscanner Hotels

- `SKYSCANNER_API_KEY`

Existing create/poll pageable provider.

### Planned hotel supply environment names

- `EXPEDIA_RAPID_API_KEY`
- `EXPEDIA_RAPID_SHARED_SECRET`
- `HBX_API_KEY`
- `HBX_SECRET`

These names reserve the configuration contract; adapters are not considered live until implemented and build-tested.

---

## 4. Award hotels

Existing evidence order:

1. AwardWallet date-specific live guest search when the programme permits guest lookup.
2. AwardTool cached property/points-range discovery.
3. Direct programme verification.

PointsYeah Hotels is a commercial-access target and will be inserted when its partner schema is confirmed.

Environment:

- `AWARDWALLET_API_AUTH`
- `AWARDTOOL_API_KEY`
- `POINTSYEAH_API_KEY`

Critical distinction:

- AwardWallet live date-specific rate can enter the date-specific comparison when returned.
- AwardTool `hotel_all` cached ranges are discovery evidence only; they must never be promoted to exact date-specific pricing.
- Direct hotel programme checkout remains the verification boundary.

---

## 5. Diagnostics

Authenticated endpoint:

- `/api/travel/providers`

Internal UI:

- `/travel-qa`

It reports whether each provider is wired and whether required environment variable *names* are present. It never returns credential values.

Statuses:

- `configured` — adapter is wired and required environment variables are present.
- `waiting-access` — commercial/provider access is pending or credentials are absent.
- `waiting-integration` — credentials exist but the provider-specific adapter still needs to be finalized.
- `not-configured` — optional/commercial source not currently active.

---

## 6. Activation procedure when a provider approves CreditIQ

1. Add credentials directly to Vercel — never to chat/GitHub.
2. Keep sandbox/test mode unless the provider explicitly provisions production.
3. Redeploy.
4. Open `/travel-qa` and confirm provider status becomes `configured`.
5. Run representative domestic + international searches.
6. Verify source, cabin, dates, cash/points, taxes, transfer route and availability state independently.
7. Only then enable production authority for that provider.
