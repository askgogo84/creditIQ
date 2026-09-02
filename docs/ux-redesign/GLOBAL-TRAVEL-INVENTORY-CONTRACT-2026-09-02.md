# CreditIQ — Global Travel Inventory Contract

**Date:** 2 Sep 2026  
**Parent:** `feat/creditiq-wallet-travel-v31`

## Product promise

CreditIQ Travel must not be limited to demo routes, a fixed Indian-city list, Bangkok-only hotels, or a silent top-N subset.

For a user-selected Indian or international origin/destination, CreditIQ should:

1. query every connected provider that supports that search;
2. return every option that provider makes available through its supported pagination/window;
3. merge/dedupe overlapping inventory without hiding materially different fares/rate plans;
4. expose `loaded`, `total/provider_total` when the provider supplies one, `has_more`, and source/freshness;
5. let the user continue loading until the provider is exhausted;
6. never describe a truncated provider page as “all flights” or “all hotels”;
7. never fabricate inventory outside provider coverage.

The truthful product wording is **“all options returned by our connected providers”**, not “every flight/hotel in the world.”

---

## Flights

### Current problem

`app/api/flights/search/route.ts` currently calls Kiwi Tequila with `limit=5`, so cash inventory is deliberately truncated. The Travelpayouts fallback is a cheapest-fare aggregate, not complete itinerary inventory. Award inventory is broader, but only six award records are enriched with full trip details.

### Required contract

- remove hidden `limit=5` behavior;
- introduce provider pagination/window handling;
- API response must include coverage metadata;
- preserve every distinct itinerary/fare returned by provider;
- separate summary inventory from enriched detail so enrichment cost does not hide rows;
- Seats.aero enrichment cap may limit **detail enrichment**, never the number of award summary options returned;
- if cash provider is degraded/fallback-only, UI must label coverage as partial;
- city selections may resolve to one or more airports; multi-airport metro searches should fan out when the resolver supports it;
- origin/destination fields must accept Indian and international airports/cities from the airport dataset, not a hard-coded route list.

Suggested normalized response:

```ts
{
  flights: NormalizedFlight[],
  coverage: {
    provider: string,
    mode: 'FULL_PAGEABLE' | 'PARTIAL_FALLBACK',
    loaded: number,
    provider_total: number | null,
    has_more: boolean,
    next_cursor: string | null,
    fetched_at: string,
  }
}
```

---

## Hotels

### Current problem

The current Hotels production surface is backed by captured Accor Bangkok fixtures. They are truthful and useful for deterministic testing, but they are not a global live-hotel search.

### Required contract

- keep captured Bangkok rates as `CAPTURED/DEMO_FIXTURE`, never as global production inventory;
- add a real `HotelRateProvider` implementation capable of destination/date/occupancy searches;
- destination must be generic: Indian and international cities/regions supported by provider;
- page through provider inventory until exhausted or user stops loading;
- retain separate rate plans/room types when cancellation/refundability/meal basis materially differ;
- normalize taxes, fees, all-in total, currency, room/rate plan, cancellation, booking URL, source and freshness;
- never mix captured and live hotel inventory without an explicit provenance badge;
- if no live hotel provider is configured, say so instead of showing Bangkok for a different city.

Suggested normalized response:

```ts
{
  hotels: NormalizedHotelRate[],
  coverage: {
    provider: string,
    mode: 'FULL_PAGEABLE' | 'CAPTURED_FIXTURE' | 'UNAVAILABLE',
    destination: string,
    loaded: number,
    provider_total: number | null,
    has_more: boolean,
    next_cursor: string | null,
    fetched_at: string | null,
  }
}
```

---

## UI rules

- Show `247 options loaded` / `Load more` when inventory is pageable.
- If the provider says there are 247 total and all 247 are loaded, show `247 provider options`.
- If total is unknown, show `63 loaded · more available` rather than “63 total.”
- The default list may rank/filter for usability, but a visible **All options** mode must let the user access the complete loaded provider set.
- Filters must not silently destroy the canonical result set.
- Wallet reachability is an overlay/filter, not an inventory gate. `Bookable with my cards` must never prevent the user from switching to `All options`.
- Cash and award inventory are separate facts; an award with no cash match remains visible.
- A flight/hotel can be visible even when CreditIQ has no redemption route; the right panel then says `No known wallet route`.

---

## Investor-demo requirement

The demo route will be pre-tested for reliable provider inventory and wallet transfer coverage, but the product code must remain route-agnostic. No BLR→SIN, Bangkok, HDFC, Axis or Amex special-casing may be required for generic search to work.
