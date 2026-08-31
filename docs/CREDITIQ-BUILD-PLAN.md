# CreditIQ — Build Plan
**31 Aug 2026 · What to build, in what order, and why**

This is a sequencing document, not a backlog. Everything here is ordered by
what unblocks what. Items marked ⛔ cannot be done by an agent and need Gogo.

---

## Where things actually stand

**Shipped and working (today):**
- `/stay-on-points` renders end to end. Live ECB FX, 20 hand-captured Accor
  Bangkok rates, correct arithmetic, honest degradation, provenance on every
  card. Committed and pushed (`29c81eea`, `7bb17030`).
- The engine (`lib/hotels/engine.ts`) with 27 passing tests including the
  FX-boundary cases. Pure, injectable, reusable for flights.
- `derivePoints` — points derived from cash and live FX, not a stored chart.
- Three providers behind interfaces: rates, fx, photos.
- All 22 HDFC Infinia transfer partners captured from the issuer portal with
  ratios, durations and provenance.
- Catalogue: 51 cards, gated, no unverified per-point value can ship silently.

**The architecture is right.** Every competitor seen this week (points.casa,
PointsFly, Save Sage) does the same thing: published chart + cash rate +
verdict. CreditIQ's version refuses to guess where theirs shows a confident
number it cannot source. That is the hard part and it is done.

**What is missing is coverage, not capability.** Three gaps, in order of cost:

| Gap | Cost | Blocker |
|---|---|---|
| Published award charts | Low — data entry | none |
| Cash rates at scale | Medium — one integration | ⛔ Skyscanner application |
| Per-card transfer ratios | High — one login per bank | ⛔ Gogo, per portal |

---

## PHASE A — Unblock the long pole (do this first, it waits while you sleep)

### A1 ⛔ Apply to Skyscanner Travel API affiliate programme
This is the single highest-leverage action available and it is an application,
not a signup — approval takes days. Starting it tonight means it is live when
the build needs it.

Why Skyscanner specifically: Save Sage and PointsFly both route to it, it
covers Indian fares properly, it is free once approved, and it monetises by
referral — which matches CreditIQ's model of linking out rather than
transacting. Amadeus Self-Service (the obvious alternative) shut down on
17 July 2026.

Fallbacks if declined: Duffel (self-serve, modern REST), Travelpayouts
(affiliate aggregator, easiest onboarding), FlightAPI.io.

**Note the caveat:** Skyscanner's indicative-price tier serves cached quotes.
If CreditIQ uses it, rates must carry `captured_at` and display their age —
the same discipline already applied to the seeded Accor rates. Do not inherit
points.casa's staleness problem while criticising it.

### A2 ⛔ Get Ashish's card, balance, and one real booking
The investor test outranks all feature work. Three things needed:
1. **Which card** — Amex Platinum Charge? Infinia? Ratios and portal rates
   differ per card and every number depends on it.
2. **Approximate points balance** — without it there is no rupee figure, and
   the rupee figure is the pitch.
3. **One recent hotel or flight booking** — property/route, dates, roughly
   what was paid.

With those three, the deliverable is a one-page hand-built analysis of a
booking he actually made, fully sourced. That is the artifact that wins the
meeting. It is the concierge product, already priced (₹3,000–5,000 per booking
+ 15% of realised uplift, capped) — not the software.

---

## PHASE B — Published award charts (ships without anyone's permission)

Every programme below publishes a fixed or chart-based redemption rate. Each
slots into `lib/data/hotel-programmes.ts` (or a new `flight-programmes.ts`) as
`pricing_model: 'fixed'` with source URL and `as_of`. The engine already
handles them. No new architecture.

Priority order — India relevance first:

### B1 Club ITC (Green Points) — HIGHEST PRIORITY
- HDFC Infinia transfers at **1 : 0.5**, 48–96 working hours (captured 31 Aug)
- PointsFly rated a Club ITC redemption **"Good"** where Aeroplan and Maharaja
  were both "Poor" — this is the India hotel story
- ITC Maurya, Grand Chola, Maratha, Gardenia, Fortune — chains a domestic
  business traveller actually books
- Accor cannot compete on India footprint; Marriott cannot be priced
- **Source needed:** Club ITC Green Points redemption rate. Check
  itchotels.com Club ITC terms. If it is a fixed rate, this becomes the
  strongest hotel entry in the product.

### B2 Air India Maharaja Club
- HDFC Infinia at **1 : 0.5**, 48–96 hours
- Air India publishes a points calculator at
  `airindia.com/in/en/maharaja-club/points-calculator.html`
- ⚠ Chart was **revalued April 2026** — domestic economy down ~28–30%, floor
  now 1,500 points, international standardised into flat tiers (Europe from
  35,000; US/Australia from 40,000; SE Asia and Gulf 12,000)
- ⚠ **Two fare tiers** — Value (cheaper, advance booking) and Prime (peak and
  last-minute). A single points figure per route is wrong. Save Sage's
  identical 7.5K across three differently-priced flights suggests they show
  only one tier.
- Taxes are always cash. Model them separately, as the Accor page already does.

### B3 Singapore KrisFlyer
- HDFC Infinia at **1 : 1** — the best airline ratio available
- Published award chart, zone-based
- Corroborated: creditcards_decoded showed DEL→SIN at ₹1.91/pt and
  DEL→CDG at ₹3.74/pt (single searches, treat as leads not facts)

### B4 Aeroplan, MileagePlus, Flying Blue, Finnair Avios
- Aeroplan 1:0.5, MileagePlus 1:0.5, Flying Blue 1:1, Finnair 1:1 from Infinia
- All publish charts. Lower India relevance than B1–B3.

### B5 Hotel programmes already ruled out — do not build
- **IHG** (1:1) and **Radisson** (1:1) look attractive on ratio but price
  awards **dynamically** and their points are worth ~0.5–0.6 US cents
  (≈₹0.44–0.53). Below Infinia's ₹1.00 portal rate even at 1:1. The good
  ratio does not rescue a weak currency.
- **Marriott** (1:0.5) — dynamic. PointsFly's Marriott tab returned
  "0-0 of 0 Results". Renders NOT_PUBLISHED; that is correct.
- **Wyndham** (1:1) — dynamic, mid-market, low India relevance.

**Rule for all of Phase B:** issuer/programme primary source only. A rate from
a blog goes in as `provenance: 'SECONDARY'` with URL and date, and the build
gate must refuse to use SECONDARY for a verdict. The Axis 5:4 error sat in the
product for months because a confident-looking secondary source was trusted.

---

## PHASE C — Make the product card-agnostic

### C1 Move portal terms out of the page
`app/(shell)/(travelgrp)/stay-on-points/page.tsx` currently hardcodes
`INFINIA_PORTAL` (₹1.00/pt, 70% cap, ₹117 fee). It must read from
`lib/data/point-values.ts` keyed by card id, so switching to Amex or Regalia
is a data change.

Verified portal rates so far:
- **HDFC Infinia:** ₹1.00/pt on hotels and flights, 70% cap, ₹99+GST per
  redemption (issuer portal + live checkout, 31 Aug)
- **HDFC Regalia Gold:** ₹0.50/pt, same 70% cap, same fee (live checkout,
  30 Aug)

### C2 Per-card transfer ratios
Ratios differ by card within the same bank — proven twice:
- Infinia → Maharaja Club **2:1** (issuer portal)
- Regalia Gold → Maharaja Club **3:1** (PointsFly screenshot)
So `hdfc-transfer-partners.ts` must become card-keyed, not bank-keyed.

⛔ Each additional card's ratios need one portal login. Do these only as real
users appear holding them. Do NOT pre-source five banks speculatively.

### C3 Amex — SECONDARY entry only, pending portal capture
Two independent India sources agree:
- **Marriott Bonvoy 1:1** — described as the single best exit
- **Airlines 2:1** (KrisFlyer, BA/Qatar Avios, Cathay, Virgin Atlantic),
  minimum 1,000 MR

They disagree on Flying Blue, Air India and Emirates — so the airline roster
is genuinely uncertain. Write the file as SECONDARY, gate it out of verdicts,
and confirm from the Amex portal when Gogo can log in.

⚠ Also: Amex India has **paused new applications** on SmartEarn, MRCC and Gold.
Etihad Guest transfers **ended permanently 30 June 2026** — still listed in
stale tables.

---

## PHASE D — Flights surface

Reuses the hotel engine almost entirely. Do not rebuild it.

### D1 `lib/data/flight-programmes.ts`
Same shape as `hotel-programmes.ts`. Fixed-rate entries from Phase B.

### D2 Route/award data
Points cost from the published chart (B1–B4). Cash fare from Skyscanner (A1).
Taxes always separate and always cash.

### D3 `/fly-on-points` — replace or extend the existing Board
The current Fly on Points board runs on seats.aero via a **personal Pro key**
that authorises Gogo, not creditiq.app. seats.aero quoted **$20,000/month**
with no startup tier; OAuth requires each user to hold their own Pro
subscription. **There is no legal path to serving users at scale on the
current architecture.**

The chart-based approach sidesteps this entirely — published charts need no
API. This is the fix for the flights product, not an addition to it.

### D4 The don't-transfer-speculatively gate
Transfers are irreversible and take 24 hours (Accor, most airlines) to 96
hours (Maharaja Club, Club ITC). Award space moves faster than that. The UI
must never recommend transferring before availability is confirmed.
`speculativeTransferWarning()` already exists in `hdfc-transfer-partners.ts`
and is wired into the hotel page. Reuse it.

---

## PHASE E — Polish and correctness debt

### E1 Hotel images
`photos.ts` renders stable gradients and ships an attribution label so the
layout will not change when a real provider lands. Routes to real photos,
cheapest first:
1. **Booking.com affiliate feed via CJ** — carries a display licence, free,
   already in onboarding. ⛔ Open question for the CJ contact: do the terms
   permit showing their images beside a *points* verdict rather than only
   their cash rate?
2. Google Places Photos — pay per request, caching limits
3. Direct Accor/Marriott/IHG content programme — slow, free, defensible

Then **self-host**. Do not depend on a hotel group's CDN: it is their
bandwidth, generally against their terms, blockable without notice, and it
sits badly against a product whose pitch is verified sourcing.

### E2 Known live defects
- `/api/employee/workplace` throws `supabaseUrl is required` on **every page
  load** in dev. Pre-existing, unrelated to hotels, spamming errors.
- `MISSING ENV` warnings on every request: `OPENAI_API_KEY`,
  `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
- 4 known test failures across 3 files (SectionTabs label rename ×2,
  parse-statement IDOR, sms-parse IDOR). Anything beyond these is a regression.
- ⛔ KFS-pending catalogue values: `indusind-pinnacle` joining fee (₹5k vs
  ₹15k), `hdfc-freedom` per-point (₹0.15 vs ₹0.25). Need manual verification.
- `axis-vistara-infinite` still `active: true` and rated 8.0 despite being
  discontinued to new applicants. ⛔ Product decision: do discontinued cards
  stay listed? (Recommendation: yes, with a status field, since existing
  holders still need the data — but exclude them from recommendations.)

### E3 The IQ score
**0 of 51 cards have a real score.** Every "IQ SCORE n/100" was a hardcoded
default (70 in the seeder, 60 on the tile). Now renders `--/100` sitewide,
which is honest but leaves a visible gap. ⛔ Decide: compute it from real
inputs, or remove the field.

### E4 The two-store problem — the biggest remaining architectural item
Every AI answer reads the Supabase `cards` table; every rendered page reads
`seed-cards.ts`. They disagree. Documented fully in
`docs/MERGE-AUDIT-2026-08-26.md`:
- 172 rows audited, **94 distinct real cards SEED does not have**
- 44 slugless rows, 67 with double-encoded `redemption_options`, mixed
  UUID/slug id conventions, HDFC Infinia Metal duplicated, plain Infinia absent
- **Recommendation (a): `seed-cards.ts` canonical, Supabase rebuilt from it**
- ⚠ A truncate-and-reseed would destroy 107 rows / 94 real cards. Audit and
  promote before any reseed.
- ⛔ This is the one to have reviewed by a second pair of eyes before starting.

---

## What NOT to do

- **Do not chase competitors further.** Four teardowns this month produced four
  backlogs and one shipped feature. points.casa, PointsFly and Save Sage have
  all now been seen doing the same thing CreditIQ already does better.
- **Do not scrape competitor numbers as facts.** A creator's ₹3.74/point is one
  search on one date. It belongs in `intelligence_kb` as a dated lead that
  routes to verification — never in `transfer-graph.ts`.
- **Do not pre-source five banks' ratios speculatively.** One login per bank,
  driven by real users holding those cards.
- **Do not build cash-rate scraping.** Use a licensed feed.
- **Do not add a fallback FX constant.** An un-timed-out fetch in a server
  component hung the render for most of 31 Aug and served a 200 with the wrong
  content and nothing in the terminal. Both the provider and the page now have
  timeouts. Never add a stored rate.

---

## Suggested order

1. **Tonight, ⛔:** Skyscanner application. Ask Ashish's secretary for card,
   balance, one booking.
2. **Next session:** B1 Club ITC + B2 Air India Maharaja charts. Both India-
   relevant, both publishable, both slot into the existing registry.
3. **Then:** C1 portal terms out of the page (20 min, needed for any non-HDFC
   card).
4. **When Ashish's card lands:** C3 or C2 for that card, then build the
   one-booking analysis by hand.
5. **When Skyscanner approves:** D1–D3, flights on published charts.
6. **Before scaling:** E4, the two-store cutover.

The thing that has actually cost time is building on unverified data. Every
item above either uses a primary source or refuses to compute. Keep it that way.
