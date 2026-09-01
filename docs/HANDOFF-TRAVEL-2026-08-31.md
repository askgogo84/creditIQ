# CreditIQ — Travel Handoff
**31 Aug 2026 · Hotels + Flights, domestic and international, with redemption paths**

Read this before touching the travel surfaces. It is the state of play, the
verified data, the decisions already made, and the traps. Everything here is
either sourced from a primary source or explicitly marked otherwise.

---

## 1. What already exists and works

**`/stay-on-points`** — live, committed, pushed (`29c81eea`, `7bb17030`,
`b44f6a5d`). Renders 20 Accor Bangkok hotels with live ECB FX, real captured
cash rates, correct arithmetic and honest degradation.

| File | What it does |
|---|---|
| `lib/hotels/engine.ts` | Pure arithmetic. 27 passing tests. No I/O. |
| `lib/hotels/engine.test.ts` | Includes the FX-boundary cases — the product's core claim |
| `lib/hotels/derive.ts` | Derives points from cash + live FX; no stored award chart |
| `lib/hotels/providers/fx.ts` | Live ECB rate via frankfurter.app, 3s abort timeout, **no fallback constant** |
| `lib/hotels/providers/rates.ts` | `SeededRateProvider` + `rateAgeLabel()` |
| `lib/hotels/providers/photos.ts` | Gradient placeholders + attribution label |
| `lib/data/hotel-programmes.ts` | Programme registry, fixed vs dynamic |
| `lib/data/hotel-seed.ts` | 20 Accor Bangkok hotels, captured 31 Aug |
| `lib/data/hdfc-transfer-partners.ts` | All 22 Infinia partners, ratios + durations |
| `app/(shell)/(travelgrp)/stay-on-points/page.tsx` | Server page |
| `components/ciq/stay-points/StayOnPointsView.tsx` | The UI |

**The engine is programme-agnostic.** Flights reuse it as-is. Do not rebuild.

---

## 2. Verified data — every figure below has a primary source

### HDFC portal redemption (SmartBuy)
| Card | Value/point | Cap | Fee | Source |
|---|---|---|---|---|
| Infinia | **₹1.00** on hotels + flights | 70% of bill | ₹99 + GST | Infinia rewards page + live checkout, 31 Aug |
| Regalia Gold | **₹0.50** | 70% of bill | ₹99 + GST | Live checkout, 30 Aug |

The 70% cap is the sharpest fact in the product: **a user can never clear a
booking with portal points alone.** Transferred points have no such cap. Say
this on every card where points win.

### HDFC Infinia transfer partners — captured from the issuer portal 31 Aug
`https://offers.reward360.in/infinia/miles_transfer/partners`

**1:1** — KrisFlyer (5–7 working days), SpiceClub, AirAsia, Finnair Plus,
Flying Blue, Lotusmiles, **IHG One**, **Radisson**, **Wyndham** (all 24h)

**1:0.5** — **Accor ALL**, **Marriott Bonvoy**, **Club ITC** (48–96h),
**Air India Maharaja** (48–96h), Qatar, Aeroplan, Avianca LifeMiles, Cathay,
Etihad, Thai ROP, British Airways, Turkish, United MileagePlus

⚠ **Ratios differ by card.** Infinia → Maharaja is **2:1**; Regalia Gold →
Maharaja is **3:1** (seen in a PointsFly screenshot). `hdfc-transfer-partners.ts`
must become **card-keyed**, not bank-keyed.

⚠ **Re-capture before any release.** Axis moved EDGE from 5:4 to 5:2 in April
2026 without notice. Update `as_of` every time.

### Accor ALL — verified from all.accor.com terms, 28 + 31 Aug
- **2,000 points = €40** toward a hotel stay
- Redeemable at **1,000**, then in increments of **2,000** only
- Fixed rate applies to **stays**; other redemption types are worth less
- Accor's own terms name **the euro as the reference currency**, INR converted
  daily "for reference only" — direct confirmation that FX is the margin

---

## 3. THE REDEMPTION PATH (the thing to build next)

Currently the page says *whether* to transfer but not *how*. That is the gap.
PointsFly does this well and it is the difference between a verdict and
something actionable.

### Three path shapes

**A · Portal, no transfer** — when the bank portal wins
```
1. Book on HDFC SmartBuy with your points
   → covers up to 70% of the bill (₹X); ₹Y payable by card
   → ₹99 + GST redemption fee
   → no transfer, no waiting, reversible until you pay
```

**B · Transfer then book** — when transferring wins
```
1. Transfer N card points → M programme points   (ratio, e.g. 1:0.5)
   ⚠ takes {duration}, cannot be reversed
   ⚠ confirm availability BEFORE transferring
2. Book direct at {programme booking URL}
3. Taxes and fees (₹Z) payable in cash — points do not cover them
```

**C · Cash** — when points lose
```
1. Pay cash and keep your points
   → your portal would give ₹X for these points; this stay only returns ₹Y
```

### Implementation
Add `redemptionPath()` to `lib/hotels/engine.ts`. Every input already exists:
- ratio + duration + irreversibility → `hdfc-transfer-partners.ts`
- booking URL → `hotel-programmes.ts` / `hotel-seed.ts`
- portal cap, fee, remainder → `portalValuation()`
- points, offset, cash remainder → `derivePoints()`

Render as a numbered step block under the verdict band. Reuse
`speculativeTransferWarning()` — already written, already wired.

**Non-negotiable:** never show path B without the duration and the
irreversibility warning. Transfers take 24h (Accor, most airlines) to 96h
(Maharaja, Club ITC). Award space moves faster than that.

---

## 4. Flights — domestic and international

### The architecture decision that makes this possible
seats.aero quoted **$20,000/month, no startup tier**. The existing Fly on
Points board runs on a **personal Pro key** authorising Gogo, not creditiq.app.
OAuth would require every user to hold their own Pro subscription.
**There is no legal path to serving users at scale on the current design.**

**The fix: published award charts, not live award APIs.** Save Sage and
PointsFly both do exactly this — identical points cost across three
differently-priced flights is a published chart, not live inventory. Charts
need no API and no licence.

### `lib/data/flight-programmes.ts` — same shape as `hotel-programmes.ts`

Build in this order:

**F1 · Air India Maharaja Club** — most India-relevant
- Infinia 1:0.5, 48–96h transfer
- Published calculator: `airindia.com/in/en/maharaja-club/points-calculator.html`
- ⚠ **Revalued April 2026** — domestic economy down ~28–30%, floor 1,500 points;
  international standardised into flat tiers (Europe from 35,000; US/Australia
  from 40,000; SE Asia + Gulf 12,000)
- ⚠ **Two fare tiers — Value and Prime.** A single points figure per route is
  WRONG. Save Sage's identical 7.5K across three fares suggests they show only
  one tier. Model both or state which one is shown.
- Taxes always cash, always separate

**F2 · Singapore KrisFlyer** — best ratio available (1:1)
- Published zone-based award chart
- Corroborating leads (NOT storable): DEL→SIN ₹1.91/pt, DEL→CDG ₹3.74/pt
  from creditcards_decoded, single searches on single dates

**F3 · Flying Blue, Finnair Avios** — both 1:1 from Infinia, both publish charts
**F4 · Aeroplan, MileagePlus** — 1:0.5, lower priority

### Cash fares — the one real blocker
⛔ Needs the **Skyscanner affiliate API** (free once approved, application
takes days, covers Indian fares, monetises by referral — matches the
link-out model). Both Save Sage and PointsFly route to it.
Fallbacks: Duffel, Travelpayouts, FlightAPI.io.
Amadeus Self-Service **shut down 17 July 2026** — ignore anything recommending it.

⚠ Skyscanner's indicative tier serves **cached** quotes. Every rate must carry
`captured_at` and display its age. Do not inherit points.casa's staleness while
criticising it.

---

## 5. Hotels — expanding beyond Accor Bangkok

**H1 · Club ITC (Green Points) — HIGHEST PRIORITY**
- Infinia 1:0.5, 48–96h
- PointsFly rated a Club ITC redemption **"Good"** while rating Aeroplan and
  Maharaja **"Poor"** — this is the India hotel story
- ITC Maurya, Grand Chola, Maratha, Gardenia, Fortune — chains Indian business
  travellers actually book. Accor cannot match the footprint.
- **Needed:** the Green Points redemption rate from itchotels.com Club ITC terms

**H2 · More Accor cities** — same capture method as Bangkok. Mumbai, Delhi,
Dubai, Singapore. The method is proven; it is 15 minutes per city.

**H3 · Ruled out — do NOT build**
- **IHG (1:1)** and **Radisson (1:1)** — attractive ratios, but both price
  **dynamically** and their points are worth ~0.5–0.6 US cents (≈₹0.44–0.53),
  BELOW Infinia's ₹1.00 portal rate even at 1:1. A good ratio does not rescue
  a weak currency.
- **Marriott (1:0.5)** — dynamic. PointsFly's Marriott tab returned
  "0-0 of 0 Results". Renders NOT_PUBLISHED. Correct.
- **Wyndham (1:1)** — dynamic, mid-market, low India relevance.

**Accor wins not on ratio (2:1 is the worst available) but because its point is
worth a fixed €0.02 ≈ ₹2.22. Halved by transfer that is ₹1.11 vs the portal's
₹1.00.** Rate beats ratio. Apply this test to every new programme.

---

## 6. Card-agnostic refactor (needed before any non-HDFC card)

`page.tsx` hardcodes `INFINIA_PORTAL`. Move it into `lib/data/point-values.ts`
keyed by card id so switching cards is a data change, not an edit. ~20 minutes.
Do this BEFORE adding Amex.

### Amex — SECONDARY only until the portal is captured
Two independent India sources agree:
- **Marriott Bonvoy 1:1** — the single best exit, and better than HDFC's 1:0.5
- **Airlines 2:1** (KrisFlyer, BA/Qatar Avios, Cathay, Virgin), min 1,000 MR

They disagree on Flying Blue, Air India and Emirates — the airline roster is
genuinely uncertain. Write as `provenance: 'SECONDARY'`, gate out of verdicts,
confirm from the portal when possible.

⚠ Amex India has **paused new applications** on SmartEarn, MRCC and Gold.
⚠ **Etihad Guest transfers ended permanently 30 June 2026** — still in stale tables.

---

## 7. Traps — read this section twice

**The FX hang.** An un-timed-out `fetch` in a server component does not fail
loudly. It hangs the render, and Next serves a fallback with a **200 status and
nothing in the terminal**. This cost most of 31 Aug. Both `fx.ts` and
`page.tsx` now have timeouts. **Every network call on a server-rendered path
gets an AbortSignal.**

**Read the dev terminal first.** Nine rounds of filesystem checks found nothing;
the terminal showed the answer immediately.

**Never add a fallback FX rate.** Null is a supported state — the page shows
points and cash and declines to convert. A wrong rupee figure on a money
surface is worse than no figure.

**Secondary sources are leads, not facts.** A creator's "₹3.74/point" is one
search on one date. It belongs in `intelligence_kb` with a date, routing to
verification — never in `transfer-graph.ts`. The Axis 5:4 error lived in the
product for months because a confident screenshot was trusted.

**Label currencies explicitly.** A card showing "6,000 pts" (card points) above
"₹1.11 each" (per card point) next to a programme figure is three currencies in
one column. State which is which.

**Coverage ≠ affordability.** "Your balance covers this" must mean the
transfer, not the stay. Points clearing ₹6,663 of a ₹12,292 bill is not a
covered stay. This exact bug shipped and was caught in review.

---

## 8. Known open items

⛔ = needs Gogo, not an agent

- ⛔ **Skyscanner affiliate application** — the long pole, start immediately
- ⛔ **Ashish's card, balance, one real booking** — the investor test outranks
  all feature work. Without the card every number is a guess.
- ⛔ Club ITC Green Points redemption rate
- ⛔ CJ/Booking terms: may their images sit beside a *points* verdict?
- ⛔ KFS: `indusind-pinnacle` fee (₹5k vs ₹15k), `hdfc-freedom` per-point
  (₹0.15 vs ₹0.25)
- ⛔ Do discontinued cards stay listed? (`axis-vistara-infinite` is `active:
  true`, rated 8.0, discontinued to new applicants)
- ⛔ IQ score: compute from real inputs, or remove the field. **0 of 51 cards
  have a real score** — every one was a hardcoded default.
- Two-store problem: AI routes read Supabase, pages read `seed-cards.ts`.
  94 real cards exist only in Supabase. See `docs/MERGE-AUDIT-2026-08-26.md`.
  Recommendation (a): seed canonical, Supabase rebuilt from it.
- `/api/employee/workplace` throws `supabaseUrl is required` on every page load
- 4 known test failures (SectionTabs ×2, parse-statement IDOR, sms-parse IDOR).
  Anything else is a regression.

---

## 9. Suggested build order

1. **`redemptionPath()`** in the engine + step block in the view. No new data,
   uses everything already built, turns a verdict into an action. **Start here.**
2. **Club ITC** as a fixed programme (H1) — the India hotel story
3. **Card-agnostic portal terms** (section 6) — 20 min, unblocks Amex
4. **Air India Maharaja** as a fixed flight programme (F1), both fare tiers
5. **`/fly-on-points` rebuilt on charts**, replacing the seats.aero dependency
6. **Skyscanner integration** when approved → real cash fares → full coverage
7. Two-store cutover before scaling

The architecture is right and proven against three competitors. What is missing
is coverage, and coverage is data entry plus one integration — not a rebuild.
