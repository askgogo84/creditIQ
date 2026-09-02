# CreditIQ India Travel Redemption Rails

Date: 2026-09-02
Status: Research contract for implementation; not executable truth by itself.

## Core rule

CreditIQ must separate **inventory discovery** from **redemption execution**.

A flight/hotel result is never hidden just because the user's cards cannot yet redeem it. Search inventory first; then enumerate every legal redemption rail for every card in the user's wallet.

## Redemption rail taxonomy

For each wallet card, CreditIQ should test these rails independently:

1. `BANK_TRAVEL_PORTAL` — use issuer points directly on bank travel portal.
2. `MERCHANT_PAY_WITH_POINTS` — issuer points used at supported travel merchants/OTAs.
3. `LOYALTY_TRANSFER` — bank points -> airline/hotel loyalty currency -> direct award booking.
4. `TRAVEL_VOUCHER` — bank points -> MMT/Yatra/EaseMyTrip/Taj/etc voucher -> booking.
5. `COBRAND_NATIVE` — card earns native loyalty currency (e.g. Marriott Bonvoy / Scapia Coins).
6. `STATEMENT_OFFSET` — pay cash then redeem/cover card charge where supported.
7. `CASH_RETAIN` — pay cash and keep points.

Only sourced rails can enter executable arithmetic. Unsupported cards remain visible with `NO_VERIFIED_REDEMPTION_RAIL`.

## Important: Skyscanner is inventory, not a points wallet

Skyscanner is a search/metasearch layer and redirects customers to an airline/OTA/hotel/agent for booking/payment. CreditIQ may use a Skyscanner itinerary as the common inventory object, but the points redemption happens via a downstream rail (bank portal, merchant, airline/hotel programme, voucher, etc.).

## Major India issuer rails confirmed from issuer/official sources

### HDFC

- SmartBuy supports flight/hotel bookings with points. Current HDFC MITC says eligible premium/travel cards can use points for up to 70% of flight/hotel booking value; other cards may have lower caps/card-specific value.
- Infinia has a separately captured issuer transfer graph in `lib/data/hdfc-transfer-partners.ts` from the logged-in HDFC Reward360 portal (31 Aug 2026). Card scope is INFINIA ONLY.
- Current captured Infinia hotel transfer edges include:
  - IHG One Rewards 1:1
  - Radisson Rewards 1:1
  - Wyndham Rewards 1:1
  - ALL Accor 2 HDFC : 1 ALL
  - Marriott Bonvoy 2 HDFC : 1 Bonvoy
  - Club ITC 2 HDFC : 1 Green Point
- Current captured airline edges include KrisFlyer, Flying Blue, Finnair Plus, Air India Maharaja, Qatar, Aeroplan, Cathay, Etihad, BA Avios, Turkish, United and others.
- WARNING: `lib/data/seed-cards.ts` currently contains an older `Marriott Bonvoy (1:1)` Infinia display entry. The issuer-captured transfer file says 1 HDFC -> 0.5 Bonvoy. The seed display must not be used for decision arithmetic and should be corrected/marked display-only.

### Axis Bank

- TRAVEL EDGE allows EDGE Miles redemption for flights, hotels and experiences.
- Axis also supports points/miles transfer to airline/hotel partners.
- Atlas official terms list hotel partners including Marriott Bonvoy, IHG One Rewards, ITC, Wyndham; Axis/ALL terms separately confirm ALL Accor ratios by card family.
- Current Axis EDGE terms also support direct redemption at travel merchants such as MakeMyTrip, EaseMyTrip, Travel EDGE, IndiGo, Cleartrip, Goibibo and Yatra for eligible cards, with card-specific point values.

### American Express India

- Membership Rewards can be used for airline/hotel bookings on American Express Travel Online.
- Amex supports Pay with Points / Points + Pay and transfer to participating airline and hotel loyalty programmes.
- India public pages do not expose the full current India partner list/ratios unauthenticated. Exact transfer partners, ratio, min/increment and transfer time must be captured from the India account before entering irreversible arithmetic.

### ICICI Bank

- iShop offers flights/hotels and explicitly allows reward-point redemption.
- Official iShop page currently states up to 100% reward-point redemption on flight bookings and up to 90% on hotel bookings (subject to card/offer terms).

### IDFC FIRST Bank

- Travel & Shop in the mobile app supports flight/hotel bookings and reward-point redemption.
- Current terms state 1 Reward Point = INR 0.25 and up to 70% of booking value may be paid with points for covered cards, with the rest on the eligible IDFC FIRST card and monthly/yearly caps.

### YES BANK

- YES Rewardz supports booking flight and hotel tickets using Rewardz points.
- Current issuer notice states up to 70% invoice value on flights/hotels, with monthly point caps varying by card tier (Marquee/Reserv/other cards).

### Kotak

- Kotak UnBox supports flight/hotel bookings and card-specific point redemption.
- Solitaire Business terms currently state 1 point = INR 0.50 on flight/hotel bookings, up to 90% of cart value, minimum 500 points; partner transfer was described as forthcoming in that product T&C.
- ALL Accor's official Kotak partnership page confirms eligible Kotak card families can convert Kotak points to ALL points, with ratios by card family.

### HSBC India

- HSBC Rewards Marketplace supports real-time transfer to airline and hotel partners.
- HSBC India officially announced 15 airline partners and five global hotel chains: Accor, Marriott Bonvoy, IHG, Shangri-La Circle and Wyndham Rewards.
- HSBC Premier/Prive/TravelOne have 1:1 for most transfer partners per HSBC's official launch communication, but exact partner/card ratios must remain card-specific.
- HSBC also has a Taj co-branded credit card; its native Taj/IHCL benefits are a separate co-brand rail, not a generic HSBC transfer assumption.

### SBI Card

- SBI reward catalogue exposes travel vouchers that are executable booking rails:
  - MakeMyTrip e-Pay/GV for flights/hotels/holidays
  - Yatra vouchers for covered flight/hotel/holiday categories
  - EaseMyTrip vouchers
  - Taj Experiences vouchers for Taj/SeleQtions/Vivanta/Ama Trails & Stays (specific voucher terms; Ginger may be excluded on some vouchers)
- These should be modeled as `TRAVEL_VOUCHER`, including voucher denomination, points cost, combination limit, expiry, excluded offers and balance-payment rules.

### RBL Bank

- RBL states reward points can be redeemed through RBL Rewards for hotel stays and air tickets.
- Product/card point value varies; this is a bank-portal rail and must be card-specific.

### IndusInd Bank

- IndusInd states reward points can be redeemed via IndusMoments for gift vouchers, travel bookings, cashback and future-purchase discounts.
- Exact travel inventory/value/caps require card-specific capture from IndusMoments before execution instructions.

### Scapia / Federal Bank

- Scapia Federal card rewards convert to Scapia Coins.
- Scapia terms currently allow coins to be used in the Scapia app for flights, stays, buses, trains and visas.
- Current published value: 5 Scapia Coins = INR 1 for flights/hotels/stays/buses and other supported travel services.
- Model as `COBRAND_NATIVE` / native travel-wallet redemption.

### AU / Standard Chartered / other issuers

- AU Rewardz catalogue usage is confirmed, but a direct universal flight/hotel points-booking rail was not sufficiently sourced in this research pass.
- Standard Chartered has travel co-brands/offers (e.g. EaseMyTrip), but a generic issuer-points travel portal was not sufficiently verified in this pass.
- For these and other issuers: keep the card in the wallet; do not fabricate a redemption rail. Add rails only when issuer/merchant sources are captured.

## Flight inventory architecture

Run these independently:

### Cash inventory
- Skyscanner Flights Live Prices (preferred broad cash/comparison source once partner API is active)
- Kiwi / Travelpayouts as additional/fallback sources where contractual and coverage requirements are satisfied

### Award inventory
- Seats.aero (already integrated; cached award coverage)
- Evaluate AwardTool API for broader real-time and cached multi-program coverage
- Evaluate AwardWallet Flight Award Search API as another provider (returns miles, taxes/fees, cabins, segments and optional calendars; some providers can use user loyalty credentials)

### Join step
Normalize by itinerary/flight/date/cabin and attach all legal wallet rails. A cash itinerary remains visible even with no award path; an award remains visible even with no wallet transfer route.

## Hotel inventory architecture

A broad cash OTA result is not enough to price a Bonvoy/Hilton/Hyatt/IHG redemption. CreditIQ must run **cash inventory and hotel-award inventory in parallel**.

### Broad cash inventory
- Skyscanner Hotels Live Prices once partner API access is active
- Other contracted hotel supply can be added behind the same normalized provider interface

### Hotel award inventory candidates
- rooms.aero: publicly covers Choice, IHG One Rewards, Hilton Honors, Marriott Bonvoy, World of Hyatt, I Prefer and Wyndham. Data is cached/periodically refreshed and uses unofficial integrations, so treat as discovery evidence, not sole execution truth.
- AwardTool Hotel API: exposes supported hotel list plus hotel award calendar with cash prices, points rates, room types, rate plans, value and booking links.
- AwardWallet Hotel Award Search API: returns hotel reward availability, room types, points rates and cash components; can support account-based searches.
- Direct programme search/checkout remains the final verification boundary before Concierge executes an irreversible transfer.

## Hotel loyalty inventory that CreditIQ should surface

### Marriott Bonvoy
- Search direct points inventory / supported hotel award API.
- Marriott confirms booking on points via `Use Points/Awards` and dynamic property/date pricing.
- Bank rails to consider include HDFC Infinia captured 2:1, Axis transfer partner, HSBC transfer partner, Amex India if confirmed in authenticated partner list, and HDFC Marriott Bonvoy co-brand native Bonvoy points.

### ALL Accor
- Search participating ALL properties and direct points redemption.
- Current public ALL terms say online redemption starts at 1,000 ALL points for EUR 20 and subsequent redemption mechanics are rule-bound; our v3.1 engine still has a checkout-evidence conflict around permitted blocks. Keep exact transfer/redeem instruction gated until logged-in checkout is reconfirmed.
- Bank rails include HDFC, Axis, HSBC, Kotak (ratios card-specific).

### IHG One Rewards
- IHG advertises Reward Nights at 7,000+ destinations and Points + Cash.
- Bank rails include HDFC Infinia captured 1:1, Axis partner and HSBC partner.

### Radisson Rewards
- Direct points redemption and points+cash/award-night style booking is supported at participating Radisson properties.
- HDFC Infinia captured transfer edge is 1:1.

### Wyndham Rewards
- Include direct Wyndham award inventory.
- HDFC Infinia captured 1:1; Axis and HSBC list Wyndham as transfer partner.

### Hilton Honors
- Hilton allows points and Points & Money across its portfolio; direct points availability must be searched separately from cash hotel inventory.
- Do not assume an India bank transfer ratio until sourced for the specific card/account. Amex India public pages confirm hotel transfer partners generically but exact current India partner/rate should be captured from the authenticated rewards account.

### World of Hyatt
- Direct award nights, Points + Cash and other award types exist across participating Hyatt properties.
- Bank transfer rail should only appear where an India issuer/card transfer edge has been explicitly sourced.

### Taj / NeuPass / IHCL
- NeuCoins can be used for stays/dining/spa across participating Taj, Claridges, SeleQtions, Gateway, Vivanta, Ginger, Tree of Life and Ama Stays & Trails; Tata Neu also supports Air India flight use.
- SBI Taj Experiences voucher is a separate voucher rail.
- HSBC Taj co-brand is a separate card-native benefit rail.
- Search IHCL cash inventory broadly, but direct NeuCoin applicability/eligible spend should be validated via Tata Neu/Taj rules.

### Club ITC
- Club ITC supports Reward Nights on ITC Hotels site/app and instant hotel-service redemption.
- Club ITC also supports Green Points -> Marriott Bonvoy conversion and International Travel House vouchers for flight bookings.
- HDFC Infinia captured 2:1 to Club ITC; Axis lists ITC as a transfer partner.

### Shangri-La Circle
- Include when hotel award inventory is available; HSBC India lists Shangri-La Circle as hotel transfer partner.

## Ranking contract

For each search result, generate candidate rails from ALL cards in wallet. A rail must carry:

- issuer/card id
- redemption rail type
- source/provenance
- points currency
- exact rational transfer ratio (if transfer)
- min/increment/caps
- transfer time and reversibility
- required bank points
- existing loyalty balance consumed
- loyalty points received/spent
- taxes/fees/cash remainder
- booking URL / execution destination
- freshness timestamp
- executable vs verification-required status

Rank legal candidates only. Never infer a partner ratio from another card in the same bank.

## UI consequence

Selected flight/hotel panel should show, for example:

```
BEST PATH
HDFC Infinia -> KrisFlyer -> Singapore Airlines

OTHER LEGAL PATHS
Axis Atlas -> KrisFlyer
Amex -> Amex Travel Online (Points + Pay)
ICICI Sapphiro -> iShop
SBI Elite -> MMT voucher
Cash -> Skyscanner booking agent

NOT EXECUTABLE YET
AU Zenith -> no sourced travel redemption rail
```

For hotels:

```
Marriott property
Cash: Skyscanner/OTA/direct cash inventory
Bonvoy award: live/cached award inventory
HDFC Infinia -> Bonvoy
Axis -> Bonvoy
HSBC -> Bonvoy
HDFC Marriott card -> native Bonvoy balance
Cash + retain points
```

## Immediate implementation order

1. Build `redemption_rail_registry` keyed by card/product, not bank name.
2. Convert existing HDFC Infinia captured transfer data into registry entries.
3. Add issuer portal rails: HDFC SmartBuy, Axis Travel EDGE, Amex Travel Online, ICICI iShop, IDFC Travel & Shop, YES Rewardz, Kotak UnBox, RBL Rewards, IndusMoments, Scapia.
4. Add voucher rails for SBI (MMT/Yatra/EaseMyTrip/Taj) with full voucher mechanics.
5. Add hotel award provider interface and proof-of-concept with AwardTool/AwardWallet or rooms.aero discovery data.
6. Keep direct loyalty checkout as the final verification gate before transfer/Concierge execution.
7. Remove stale seed-card redemption options from decision arithmetic; they may remain descriptive only after reconciliation.
