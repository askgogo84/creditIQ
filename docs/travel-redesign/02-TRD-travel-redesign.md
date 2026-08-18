# TRD — Travel redesign

**Status:** draft for review · 18 Aug 2026

---

## 1. What already exists

Before building, the implementing agent must confirm each of these by reading the code —
this list is from prior investigation and may be stale.

| Capability | Where | Confidence |
|---|---|---|
| Award availability | Seats.aero partner data | Exists; terms unverified |
| Live cash price | `trip-planner/live-price` | Exists |
| Flight search | `flights/fusion` | Exists |
| Card catalogue + user wallet | Supabase, `statement_imports` + `manual_cards` | Exists |
| Booking of any kind | — | **Does not exist and will not** |

## 2. Three data classes, never blended

The central technical rule. Each result carries all three separately, and the UI renders
them with different provenance treatments.

**Class A — Award availability.** From Seats.aero. Perishable; a seat found now may be
gone in minutes. Cache aggressively for list rendering, never for the moment a user is
about to transfer points.

**Class B — Transfer routes.** Card currency → loyalty programme, with ratio, hops and
duration. This is our data, and it is the highest-value thing on the page. Modelled per
the catalogue spec's cell shape: `{ value, unit, state, source, asOf }`. `state` is
`verified | unverified | disputed`.

**Class C — Cash fare.** Fetched **only on user request**, per row. Never rendered as an
"estimated range" beside a live points figure — that comparison is the product's core
claim and it cannot rest on a guess.

## 3. The transfer ladder

The feature worth building carefully. Given a card currency and a target programme,
return every viable path.

```
findTransferRoutes(fromCurrency, toProgramme, milesNeeded)
  → Route[] { hops[], combinedRatio, pointsRequired, durationDaysMin, durationDaysMax,
              minTransferIncrement, state, source, asOf }
```

Implementation: a small directed graph over `transfer_partners`, bounded to **2 hops**.
Beyond two hops the combined ratio is always terrible and the duration unusable — the
reference product's own 3-hop examples cost 3.5x the direct route.

Sort by `pointsRequired` ascending, then `durationDaysMax` ascending.

**Duration is not decoration.** It is the field that determines whether an award seat can
survive the transfer. A route whose `durationDaysMax` exceeds a few days cannot be used
for a seat that is available today, and the UI must say so on the route itself.

## 4. Progressive search

Award search across programmes is slow. Stream results as they arrive rather than
blocking on the full set.

- Emit partial results per programme per date as they resolve.
- Surface progress honestly: which programme, how many dates done, percent complete.
- Rows appear as they are found; the list re-sorts on completion, not on every arrival
  (re-sorting under the user's cursor is worse than a brief mis-order).
- A failed programme is reported as failed, not silently dropped. "3 of 8 programmes
  didn't respond" is information; omitting them is a lie by absence.

## 5. Wallet grounding

Every row names which of the user's cards can fund it, and carries that card's
provenance state.

- `In wallet` badge where the user holds the card.
- All cards / My cards toggle, defaulting to **My cards** when the wallet is non-empty.
- A row funded by a self-entered balance is marked as such. We do not tell someone they
  can book a seat on the strength of a number they typed in.

## 6. Caching and limits

| Data | TTL | Reason |
|---|---|---|
| Award availability | Short (minutes) | Perishable |
| Transfer partners | Long | Changes rarely; version it |
| Cash fare | Per-request, no cache | Live or absent |
| Search results per user | Session only | Enables re-sort without re-query |

Rate-limit award search per user. The existing usage-meter model applies — a flight
search is a metered unit.

## 7. Known landmines in this codebase

- **The earn-rate unit defect.** Numeric reward fields are unit-ambiguous across the
  catalogue. Transfer ratios are a *different* field and must be stored with an explicit
  unit from day one rather than inheriting that problem.
- **`.page-fade` and transform transitions.** Transform transitions are pinned to their
  start value somewhere in this codebase and the root cause was never found. If the new
  list needs animation, verify it actually animates rather than assuming.
- **Shell rule.** A Travel tab may not point at a page that renders its own marketing
  header — the user loses the rail and the tab bar they just used.

## 8. Verify before building

1. Seats.aero partner terms — commercial display and funnel rights.
2. Whether `trip-planner/live-price` returns a real live quote or an estimate.
3. Which programmes the current Seats.aero integration actually covers.
