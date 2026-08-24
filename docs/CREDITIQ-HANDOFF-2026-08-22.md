# CreditIQ — Handoff
**Written 22 Aug 2026.** Covers 18–22 Aug: the travel redesign through to production, the data-sourcing work, the seats.aero licensing problem, the points.casa teardown, and every open decision.

Repo: `C:\Users\gover\creditIQ\creditIQ` · Production: `creditiq.app`
Consumer Supabase: `yazpphublutdodahfwvr` · Bot Supabase: `qenhjcooyecmatwducpu`

---

## 1. WHAT IS LIVE ON PRODUCTION

| Commit | What | Status |
|---|---|---|
| `6d177e9a` | Fly on Points board replaces the AI trip planner at `/trip-planner` | LIVE |
| `28021ea4` | `trust_score` removed from all read paths; creators no longer cited in source positions | LIVE |
| `187c74dd` | Axis EDGE → KrisFlyer ratio corrected 5:4 → 5:2 | LIVE |
| `8deef95c` | RAG three-tier provenance across all 7 AI routes | LIVE |
| `47ae7807` | Hotel and globe mockups committed to docs | LIVE |

**Nothing known-wrong is on production.**

### The Fly on Points board (`/trip-planner`)
Replaced a page whose three points figures all came from a language model. Now:
- Real award seats from seats.aero, priced against the user's own wallet cards
- Transfer ladder per row: path, nominal ratio (labelled nominal), hops, days, payable points
- Shortfall named — "19,000 pts · 14,665 short" — with a caveat line when the balance is self-entered
- Honest "Not priced · no known route from your cards" rather than a guessed ratio
- Cash comparison gated behind a button, fetched live per-date, with an explicit labelled fallback to route-level
- Irreversible-transfer warning before the programme handoff
- `/transfer-partners` is now a live transfer calculator (forward default: points → miles; reverse behind a toggle) built on the same `findTransferRoutes` engine and the same shared `Ladder` component

### The RAG three-tier system
All 7 routes (assistant, travel-ai, trip-planner, spend-optimizer, card-switch, card-roast, optimize) now separate:
1. **SOURCED** — issuer-published, stated as fact with its as-of date
2. **CreditIQ estimate** — internal-estimate/seed, presented as our estimate to confirm
3. **COMMUNITY** — scraped claims, attributed and hedged in a delimited untrusted block

Before this, the assistant was told to state the card database "confidently as fact" while that database was largely unverified seed data, and the genuinely sourced constants never reached it at all.

---

## 2. WHAT IS NOT BUILT

**The hotel page.** Three mockups exist in `docs/travel-redesign/` — `stay-on-points-mockup-v2.html`, `stay-on-points-v3.html`, `stay-globe-mockup-v3.html`. Nothing in the app. Blocked on decisions, not code (see §7).

**The landing globe hero.** Built on `feat/landing-globe-hero`, then reversed — the landing page keeps its original cabin-window background. Branch dormant, do not merge, do not delete `HomeHeroBg.tsx` or the video files.

---

## 3. THE MOST IMPORTANT FINDING — seats.aero

**Their reply (Chris, support, 21 Aug):**
- Commercial API: **$20,000/month minimum** for cached data, live searches extra. He stated plainly there is **no lower tier for startups.**
- "Login with Seats.aero": OAuth2, where **paid Pro users spend their own daily allotment** of cached-data API calls through a third-party app at no cost to the developer. Cached only, not live. He recommended this as the best option for starting out.
- There is also an affiliate programme.

**The hard implication:** $20k/mo is ~₹17.6 lakh/month. OAuth requires each user to already hold a seats.aero Pro subscription (~$9.99/mo), and essentially no Indian CreditIQ user does.

**So the Fly on Points board — live right now on a personal Pro key — has no legal path to serving consumer users at scale as currently built.** Their terms exclude commercial and production use. They can revoke the key at their discretion, which would take `/trip-planner` down.

**Three options, none comfortable:**
1. Build the OAuth flow and gate the board to users who connect a seats.aero Pro account. Compliant, tiny audience, sends them subscribers.
2. Find another award data source. Nothing free exists at this quality. Months.
3. Make the board a demo behind your own login while value moves elsewhere.

**And this is why Accor matters** — it needs no seats.aero at all (see §5).

---

## 4. HDFC's OWN PUBLISHED NUMBERS (sourced, verified)

From the SmartBuy Savings Calculator (`https://offers.reward360.in/v1/savings_calculator`), 61 rows captured, verified independently with zero variance:

| Tier | Value per point |
|---|---|
| Infinia, Infinia Metal, Diners Black, Diners Black Metal | **₹1.00** |
| Regalia, Regalia Gold, Diners Privilege | **₹0.50** |
| Tata neu, Tata neu Infinite, Other CC | no points row (cashback cards) |

The page's own disclaimer: *"Reward point value is taken at the maximum redemption value for each card."* **So these are ceilings, from the issuer.** Their published ₹0.30 cashback rate is the floor.

**The floor-and-ceiling story in the deck now has HDFC's numbers on both ends.**

### Two findings from the same sweep

**The catalogue collapse question, blocked since 10 Aug, now has issuer evidence:**
- Infinia vs Infinia Metal — **identical in all six categories**, every field
- Diners Black vs Diners Black Metal — **differ in all six, in both directions** (Metal better on five; *worse* on Adani Duty Free, 14,985 vs 10,000)

So Diners Black and Diners Black Metal are definitively different products and must never collapse.

**The Regalia insight, which may be the bigger product:** on the same ₹50,000 hotel booking both cards advertise "10x Reward Points." Infinia returns 16,650 pts = ₹16,650 (33.3%). Regalia returns 3,000 pts = ₹1,500 (3.0%). **Eleven times, same banner.** Regalia's cap swallows the headline — it returns exactly 2,000 SmartBuy points whether the multiplier says 3x, 5x or 10x.

### HDFC transfer facts (from HDFC's own T&C)
- Points transfer in **multiples of 100, minimum 100**
- **Maximum 1.5 lakh points per month**
- All transfers final, cannot be reversed
- Most partners credit immediately **except Air India and Singapore Airlines** — and KrisFlyer is our one live edge

### Confirmed absences (important)
- **Emirates Skywards is NOT an HDFC transfer partner.** The BLR→DXB rows showing "no known route" are **correct**, not a gap.
- **Plain HDFC Regalia has no Miles Transfer at all.** Its portal nav is Home / Just For you / Travel & Stays / Shop / Brand Vouchers / Regalia Benefits / Savings Calculator, and Travel & Stays is booking-only. Transfer partners are Infinia / Diners Club Black / Regalia Gold only.

⚠ **Commercially this matters:** Gogo's Regalia holds 61,783 points; his Infinia holds 4,335. The overwhelming majority of his own balance sits on a card that can never reach an award seat. If that pattern generalises — and Regalia-class cards are far more widely held — the Fly on Points board answers a question only a minority of users have.

---

## 5. ACCOR — the one hotel programme buildable with zero crawling

**Primary source:** `https://all.accor.com/a/en/offers/meapac/save-with-reward-points.html`

- Minimum 2,000 points, used in **2,000-point increments**
- **2,000 points = €40**
- Booking total incl. tax must be ≥ the points value
- Up to 1,000,000 points per booking
- **No award chart. No blackout dates. Any brand, any night.**

There is nothing to crawl. The points cost is arithmetic on the cash rate.

### The arithmetic — and it is the whole story

€40 ÷ 2,000 = **€0.02 per Accor point**. HDFC transfers at 2:1, so 2 HDFC points → €0.02.

- At **₹100/€** → exactly **₹1.00 per HDFC point** = exactly HDFC's SmartBuy ceiling. **Dead heat.**
- At **₹110/€** (today) → **₹1.10 per HDFC point**. **Transferring wins by ~10%.**
- At **₹88/€** (early 2025) → **₹0.88**. **SmartBuy won decisively.**

**EUR/INR today: ~₹110–112.** BookMyForex ₹112.06 (20 Aug), Bloomberg ₹111.14 (19 Aug), Xe 30-day avg ₹110.02. Up ~14% over the year; 2025 alone took it from ₹88.55 to ₹105.55.

**Cross-check that raises confidence:** points.casa prints ₹2.23/pt for Accor. €0.02 × 111.5 = ₹2.23 exactly. Their model is the same arithmetic; they simply stop one step earlier than we would.

### What this means for the build
1. **The FX rate can never be a constant.** Not ₹90, not ₹110. Recomputed per request from a dated source, and the verdict flips at ₹100 — which it will, in both directions.
2. That volatility is the feature's reason to exist: *"Accor beats SmartBuy by 10% today because the euro is at ₹110. That was not true last year."* Nobody in the Indian market is saying this.
3. **Accor requires DIRECT booking on all.accor.com** for points to apply. Third-party OTA bookings do not earn or redeem points — so a Booking.com rate is a different number for a different booking and cannot be the basis for the points maths.

---

## 6. POINTS.CASA — the direct competitor

Two founders, Ayan and Kanishk. India-focused, wallet-aware, hotels shipped. **This is CreditIQ's positioning, for the same market, already live.**

Their pricing: ₹399/mo · ₹2,499/yr · ₹99 day pass · ₹40,000 lifetime ("1 Left"). Payments via Dodo Payments.

### What they have that we don't
- ~30+ transfer programmes vs our 5 edges
- 33 transfer bonuses (Marriott→MileagePlus +10k/60k, +5k/60k to ~30 others)
- Hotels, with real photos and a working map
- 83 of 85 flights on BLR→SIN vs our 20 options
- A published value framework: **Unicorn ≥₹4.0/mile · Spectacular ≥₹2.5/mile · Great ≥₹1.7/mile**
- Two-hop routes we can't see, e.g. *"50k Regalia Gold → 16.7k Indigo BluChip @ 3:1 via ALL Accor"*

### What we have that they don't
- **Statement-verified balances.** They ask users to type theirs in. Their own feature list says "Automatic Points Import (soon)" — they don't have it and they're coming for it.
- **Freshness.** A developer comment in their own HTML source documents that **67% of their cached rates are ≤30 days old and only 5% are ≤7 days** — which is why they rescaled the filter cap from 7 to 31 days. Their flight rows say *"Price from 2 months ago."* Our seats.aero data is same-day.
- The Regret Report from actual spend, and the corporate side.

### How they're built
- **Django + htmx 2.0.10, server-rendered.** No React, no Next. 308KB of HTML already containing the points figures. Live rates via `POST /dashboard/hotels/property/{numericId}/rates/refresh/` returning an 833-byte htmx fragment.
- **They do NOT book.** Their own docs: *"Verify before transferring — open the airline or loyalty site and confirm."* The panel says *"You will not be charged here."* Same handoff model as ours.
- **Photos: they hotlink the programme's CDN.** `cache.marriott.com/content/dam/marriott-renditions/{PROPERTY_CODE}/{propcode}-{category}-{assetid}-hor-wide.jpg?downsize={W}px:*`. Zero cost, zero storage. ⚠ It is Marriott's bandwidth, can be blocked any day, and "a competitor does it unchallenged" is not a defence.
- ⚠ **They have the bug we fixed.** Their UI resolves a Regalia to Regalia Gold — the exact mis-resolution the subset guard removed on 20 Aug.

### Their ratio table (observed, NOT a source)
Axis: Atlas 1:2 · Horizon 1:1 · **Magnus 5:2** · **Magnus Burgundy 5:4** · Olympus 1:4 · Privilege 10:1 · Reserve 5:2.
Independent corroboration of the April 2026 Axis devaluation. **Still needs verifying against Axis's own page** — "points.casa says 2:1" is creator-claim-grade by our own standards.

---

## 7. OPEN DECISIONS — these block the hotel page

### 7.1 ⚠ THE AFFILIATE QUESTION (the blocker)
Gogo is onboarding to CJ Affiliate / Booking.com APAC and wants to earn from both sides.

**The structural problem: only the cash side pays.** Points redemptions go direct to the programme and earn nothing. So every affiliate rupee comes from a "book with cash" verdict — the sentence the whole product rests on.

**Option A — Rebate.** *"We earn ~₹850 on this booking and credit it to you."* The commission can't bias the verdict because we don't keep it. Subscription stays the revenue. A line no competitor is running.

**Option B — Keep.** Legitimate, but disclosure goes **on the row next to the verdict**, not in a footer, and deck v9 slide 13 changes from *"we take no commission from any issuer, airline or hotel"* to something true.

**Either way slide 13 is now wrong and it's in the investor deck.**

### 7.2 Photos
No committed source. Options: Google Places Photos (paid per request, caching restricted), programme content feeds (needs partnership), hotlinking the programme CDN (what points.casa does — grey area), or no photos.

### 7.3 seats.aero
Reply to Chris: what does OAuth setup involve, and does the affiliate programme carry any data access?

---

## 8. KNOWN DEFECTS AND DEBT

### ⭐ The root cause worth fixing once
**Cards are matched by DISPLAY NAME against an unreliable Supabase table.** `getAllCards()` reads Supabase first, falling back to SEED_CARDS only on empty/error — and that table has duplicates, null slugs and inconsistent names. This has now caused three separate defect classes:
1. `resolveCardCurrency` upgrading "Regalia" to "HDFC Regalia Gold" (fixed 20 Aug with the subset guard)
2. `point-values.ts` keying on SEED_CARDS slug while prod serves Supabase rows
3. The transfer-graph `card_name_allowlist` matching `'HDFC Infinia Metal Edition'` exactly — if the prod Supabase row is named anything else, `edgeApplies` returns false and the KrisFlyer ratio **silently drops** from the RAG prompt

**Every new data table inherits the same silent-miss failure.** It should key on a stable id.

### Defunct data
- **`axis-vistara-infinite` at seed-cards line 728 SHIPS** and cites Vistara CV Points — Vistara merged into Air India in Nov 2024. ⚠ **The correction already exists at line 2317 inside the dead `NEW_CARDS` block** (correctly updated to Air India FlyingReturns, devaluation dated 2024-11-12) but NEW_CARDS is never spread into SEED_CARDS. Right data, wrong array.
- `sbi-club-vistara` (line 863) also defunct but in the same dead block.
- Unverified suspicion only: `sbi-air-india-signature` and `axis-atlas` reference "Air India Flying Returns" — do not change without checking.

### Missing catalogue base products
- **Axis Magnus** — only "Axis Magnus for Burgundy" present. The more consequential gap; Magnus is very widely held.
- **HDFC Regalia** — only Regalia Gold present. Caused the 20 Aug resolver failure.

### Other open items
- `disable_live_filtering` seats.aero A/B test — never run
- The per-date cash fallback fired on both test searches; confirm whether `departure_at` is wrong before assuming per-date cash works
- Transfer **bonuses** unmodelled — `bonus_note` exists in schema, nothing populates it, and they need a source and expiry
- `/premium` page still claims an RBI-approved Account Aggregator framework for a capability that is switched off
- 19 API routes swallow DB write errors; the money ones are employee/workplace, employee/join-org, subscription/cancel
- Gold `[data-ciq]` remains on `/pro`, `/feed`, onboarding + `Tour.tsx`
- `WhatCreatorsSay.tsx:73` has a 4px side-tab accent border flagged by the impeccable hook — left deliberately for Track 2's UI pass
- Font token unification (Fraunces / Inter / JetBrains Mono) still outstanding

### Track 2 — Sweet Spots, not started
**100% of Sweet Spots is creator-sourced and none survives a primary-source check.** The honest version of that page starts empty and counts up as award charts get read.
- `intelligence_kb.source` holds the *platform* and `source_url` holds the *creator artifact* — a column named `source` meaning "where we heard it" while everywhere else it means a primary document. Rename to `discovery_platform`.
- The scrapers still write `trust_score` and `boostConfirmation` (+0.15 when 2+ sources repeat a claim — **so a repeated rumour scores higher**). Track 1 removed it from read paths only.
- `match_intelligence` RPC still returns `trust_score` in its signature — drop it.
- Order: §13 discovery gate → schema rename + lead state → verified-only page → **then** hotel content.

---

## 9. STANDING RULES ESTABLISHED THIS WEEK

- **Mock before docs.** Clickable HTML mockup approved first, then the six docs, then build.
- **Plan before code.** Agent reports the plan and stops; no unattended production pushes.
- **Discovery ≠ provenance.** A creator tells us where to look; the programme's own chart tells us what is true. They are different fields and must never collapse.
- **A ratio and a rupee value are different facts.** Missing one does not mean missing the other.
- **The connection gate is downgrade-only.** Absence of `navigator.connection` is not a downgrade — an unsupported API must never become an accidental blanket disable.
- **Cutting a destination requires building its replacement in the same change.**
- **Never suppress a design-hook finding** to make it go away; classify it or fix it.

---

## 10. WHAT I'D DO NEXT, IN ORDER

1. **Answer the affiliate question.** Rebate or keep. Everything about the hotel page's verdict logic depends on it.
2. **Fix the card-identity root cause** — match on a stable id, not display name. It has bitten three times and will bite every new table.
3. **Port the Vistara correction** from the dead block to the live entry, and delete the dead `NEW_CARDS` array.
4. **Reply to seats.aero** about OAuth. The board's legal footing depends on it.
5. **Accor Phase 2A** — the HDFC/Axis/Amex → Accor edges with sourced ratios, the 2,000 = €40 rule as sourced data, and a live dated euro rate.
6. **Then** the hotel page, on a foundation that owes nothing to anyone's licence.

---

## FILES OF RECORD

```
docs/travel-redesign/01-PRD-travel-redesign.md
docs/travel-redesign/02-TRD-travel-redesign.md
docs/travel-redesign/03-APP-FLOW-travel-redesign.md
docs/travel-redesign/04-UIUX-BRIEF-travel-redesign.md
docs/travel-redesign/05-BACKEND-SCHEMA-travel-redesign.md
docs/travel-redesign/06-IMPLEMENTATION-PLAN-travel-redesign.md
docs/travel-redesign/travel-redesign-mockup.html      (approved flight board)
docs/travel-redesign/stay-on-points-mockup-v2.html    (hotel cards + globe)
docs/travel-redesign/stay-on-points-v3.html           (points.casa-style grid)
docs/travel-redesign/stay-globe-mockup-v3.html        (globe as data surface)
docs/travel-redesign/search-globe-mockup.html         (searching state)
docs/travel-redesign/preview.html                     (3D WebGL globe)
docs/catalogue-inclusion-and-verification-spec.md     (§12 issuer evidence, §13 discovery gate)
lib/data/transfer-graph.ts    + scripts/validate-transfer-graph.ts
lib/data/point-values.ts      + scripts/validate-point-values.ts
lib/transfer-ladder.ts
lib/cheapest-cash.ts
components/ciq/fly-points/{Board,Ladder,AirportSelect}.tsx
```

Data captured 20 Aug: `HANDOFF.md` and `data.csv` (61-row SmartBuy Savings Calculator sweep).
---

## 11. 23 AUGUST â€” WHAT SHIPPED, AND THE THREE CEILINGS FOUND

**Append to `docs/CREDITIQ-HANDOFF-2026-08-22.md`.** Everything below either supersedes or corrects Â§8 and Â§10 of that document. Read this section before acting on either.

---

### 11.1 SHIPPED TO PRODUCTION (merged to `main`, fast-forward `1f87c34a..6b9f9ffb`)

| Commit | What | Scale |
|---|---|---|
| `4cd527b1` | Airport dataset replaces the 36-airport hardcoded list | 10 files, +3761 âˆ’88 |
| `a4284bb7` | Affiliate default removed; no-link renders no button | 7 files, +140 âˆ’59 |
| `6b9f9ffb` | Scroll-to-results on 13 surfaces; real icons replace `(ok)`/`(x)`/`(!!)` | 13 files, +141 âˆ’20 |

#### Airports (`4cd527b1`)
The trip-planner searched **36 airports, 11 of them Indian**, hardcoded in `AirportSelect.tsx:16-36`. Lucknow, Indore, Chandigarh, Coimbatore, Varanasi, Srinagar and ~100 other Indian airports could not be selected at all. That was the "most cities show nothing found" report.

Now: **3,242 airports** from OurAirports (raw 85,939 rows â†’ `scheduled_service=='yes'` + valid IATA + `type âˆˆ {large,medium}`).

- **Licence verified, not assumed.** OurAirports is public domain. OpenFlights is ODbL â€” attribution + share-alike, rejected as a legal complication for a proprietary product.
- **The generator is a MANUAL refresh** (`npm run gen:airports`), deliberately NOT in prebuild. A build-time fetch would make our deploys depend on a volunteer site's uptime and let the airport list change without a commit.
- `lib/data/airports.generated.ts` is committed and its header records source URL, fetch date, raw row count and filter.
- `scripts/validate-airports.ts` IS a prebuild gate, offline: duplicate IATA, alias integrity, empty-city fallback, count band.
- 30 curated aliases incl. Indian colloquial forms: bombay, madras, calcutta, cochin, trivandrum, vizag, poona, benares, trichy, baroda, mysore, mangalore, gurgaon, panjim.
- Deleted the second list, `CITY_TO_IATA` in `FlightSearch.tsx`, and the DXB-on-no-match default (a silent wrong destination is worse than an empty one).

âš  **Ranking bugs were caught on first spot-check and fixed before ship**: Goaâ†’Genoa, Dubaiâ†’DWC, Londonâ†’LCY, klâ†’Kolhapur, baliâ†’Balivanich. Final ranking is exact alias > exact IATA > exact city > prefix > substring > name substring, with a popular-hub tiebreak and a cap of 8. **Any future dataset change must be re-spot-checked** â€” a bigger list makes bad ranking worse, not better.

#### Affiliate (`a4284bb7`)
`lib/affiliate.ts` had `DEFAULT_AFFILIATE_URL = "https://www.paisabazaar.com/credit-card/"`. Any card slug absent from the ~140-key map sent the user to **Paisabazaar â€” a direct competitor** â€” under a button labelled "Apply Now", silently.

Measured against the LIVE Supabase catalogue (173 active rows):

| | rows resolving to a link |
|---|---|
| Before | 93 |
| After the resolution-order fix | 107 |
| Recovered by ordering alone | 14 |
| Genuine gaps (no affiliate relationship) | 66 |

- `resolveAffiliate` now tries id â†’ slug â†’ name and returns the **first that MATCHES**, not the first non-null. That alone recovered 14 rows whose UUID id shadowed a matching slug.
- Discriminated union: a missing link renders **no button**, never a wrong one.
- Crash guard on `/api/apply/[cardId]` â€” `null.includes` was a 500.
- Two gates: a hard-fail prebuild check over SEED_CARDS, and `npm run audit:affiliate-db` (on-demand, needs creds, not in prebuild) over the live table.

âš  **Supabase holds ZERO tracked links.** `affiliate_url` 0/173, `apply_url_affiliate` 0/173, `affiliate_type` is the constant `"direct"` on all 173, `apply_url` is bare bank homepages on 80/173. The hardcoded map is the only real source. Latent, untouched: `app/api/rewards-calculator/route.ts:80` does `apply_url_affiliate || apply_url` â€” the first is always empty, so it always serves a bank homepage.

âš  **`hdfc-infinia-metal` is in the 66.** That is the UUID duplicate of the flagship card. Do not paper over it with a map alias â€” merging the duplicate pair is the real fix.

#### Scroll + icons (`6b9f9ffb`)
**13 surfaces** submitted and left the user at the top of the page. Now `useScrollToResults` (double-rAF so conditionally-rendered blocks commit first, success path only, respects `prefers-reduced-motion`). `scrollMarginTop` 76 on standalone pages (fixed header), 16 in the signed-in shell.

`(ok)`, `(x)`, `(!!)` were **literal ASCII in the JSX** â€” placeholders never replaced â€” rendering on approval verdicts and switch recommendations. Now `StatusGlyph` SVG. `(x)` maps to a cross (failure), not a warning triangle; the two are different messages.

---

### 11.2 CORRECTIONS TO Â§8 â€” THE DIAGNOSIS WAS WRONG TWICE

Two agent investigations pushed back on stated premises and were right both times. **Record both, because reasoning from Â§8 as written leads to the wrong fix.**

**Correction 1 â€” the schema.** Â§8 and the migration files disagree with production. `iq_score` EXISTS on the live `cards` table (added by a migration later than `001_initial.sql`, along with `affiliate_url`, `affiliate_type`, `min_cibil_score`, `network`). So `getAllCards()` **succeeds** and Supabase serves production. An agent reading `001_initial.sql` concluded the affiliate leak was "essentially unreachable" â€” it was leaking ~46% of the catalogue.

> **STANDING RULE ADDED:** schema questions are answered against the live DB, never against a migration file. The repo's migrations do not describe production.

**Correction 2 â€” the trip-planner path never touches the `cards` table.** The "Not priced Â· no known route from your cards" symptom does NOT come from display-name matching against Supabase. The real chain:

```
Board â†’ POST /api/flights/fusion
  â†’ fetchUserCards()          route.ts:76   reads statement_imports + manual_cards (free text)
  â†’ buildRedemption()         fusion-core.ts:152
     â†’ resolveCardCurrency()  transfer-map.ts:241   matches against SEED_CARDS (49 cards)
     â†’ currencyToEdgeSlug()   fusion-core.ts:144    builds slug from CLEAN seed strings
     â†’ findTransferRoutes()   transfer-ladder.ts:187
```

Wallet cards come from statements as free text. The slug is built from clean SEED strings, so bank-spelling drift **cannot** break this leg. And `card_name_allowlist` is set on exactly **one** edge (`hdfc_reward_points â†’ singapore`); the other four are `null`, so the allowlist is not the gate.

---

### 11.3 â­ THE REAL CEILING â€” THE TRANSFER GRAPH HAS 5 EDGES AND 3 DESTINATIONS

Diagnostic logging on `buildRedemption` (uncommitted, tagged `DIAGNOSTIC (Step 1 â€¦)`) produced the measurement. BLRâ†’LHR returns awards from **british, virginatlantic, flyingblue, aeroplan, american, qantas, alaska**. The graph knows **singapore, air-india, ba**.

Two distinct failure reasons, both confirmed in live logs:

**`no-edge` â€” dominant, and it is not a bug.**
```
bank: 'AmEx', card_name: 'American Express Platinum Travel',
resolvedCurrency: 'membership-rewards', slug: 'amex_membership_rewards',
awardSource: 'british', reason: 'no-edge'
```
The resolver works perfectly. The slug is correct. There is simply no edge. Amex MR India genuinely transfers to BA, Flying Blue, Virgin Atlantic, Aeroplan and Singapore â€” those edges have never been written.

**`currency-unknown` â€” the missing base products, now with a measured cost.**
```
bank: 'HDFC Bank', card_name: 'Regalia Credit Card',
resolvedCurrency: null, slug: null, reason: 'currency-unknown'
```
SEED has `hdfc-regalia-gold` but **no plain HDFC Regalia**. Gogo's own 61,783-point Regalia balance â€” his largest â€” is invisible to the entire pricing engine. **Axis Magnus will fail identically** for every Magnus holder, and Magnus is very widely held.

âš  **The UI renders one string for both.** "We don't know your card" (our gap) and "your points can't reach this programme" (a real answer) are different facts and must not share copy.

**So the board's ceiling is editorial, not engineering.** Every new edge needs a ratio from the issuer's own page with an as-of date. Under Â§9's discovery-vs-provenance rule, "points.casa says 2:1" is creator-claim-grade and does not qualify.

---

### 11.4 THE CATALOGUE â€” FOUR REGISTRIES, THREE INGESTION EVENTS

Live Supabase `cards`, 173 active rows, verified by direct query:

- **93 slug-style ids Â· 80 UUID ids** â€” two ingestion families never reconciled
- **36 distinct bank spellings.** 13 issuers appear twice (HDFC/HDFC Bank, SBI/SBI Card, Axis/Axis Bank, ICICI/ICICI Bank, Kotak/Kotak Mahindra Bank, AU/AU Small Finance Bank, IndusInd/IndusInd Bank, Yes/YES Bank, IDFC/IDFC FIRST Bank, RBL/RBL Bank, AmEx/American Express, Federal/Federal Bank, BOB/Bank of Baroda). **~155 of 173 rows sit on a split-spelled issuer.**
- **OneCard and FPL Technologies are the same issuer under unrelated names.** `SC` is presumably Standard Chartered. No normalisation rule connects either â€” they need explicit mappings.
- **â‰¥13 duplicate card PAIRS** (one slug row + one UUID row for the same physical card), incl. `hdfc-infinia` / `b01ee5dd-â€¦` (both Infinia Metal). Crude name-normalisation undercounts: `sbi-club-vistara` vs `club-vistara-sbi` did not surface. **173 is not 173 distinct cards, and that number is marketed.**
- SEED_CARDS is 49 cards, 12 clean bank spellings, `id === slug`. It is the **convention to normalise TO** â€” it is NOT the live catalogue and flipping to it would drop ~110 cards.

**Registries that do not agree with each other:** SEED_CARDS (49) Â· MORE_CARDS (spread in) Â· NEW_CARDS (76, dead) Â· Supabase (173) Â· `AFFILIATE_LINKS` (~140) Â· `CARDS_WITH_POINTS` in points-optimizer (20) Â· plus local `AIRPORTS` arrays in onboarding and FlightSearch, and a third `CITY_TO_IATA` in `app/api/travel-ai/route.ts:16`.

**The airport data is the counter-example worth copying:** one upstream â†’ one generator â†’ one committed file â†’ one access module â†’ one prebuild gate. That structure is what the card catalogue lacks.

âš  **NEW_CARDS is NOT safe to delete yet.** 76 ids, ~64 existing nowhere else. Check whether plain **HDFC Regalia** or **Axis Magnus** are among them before deleting â€” those are the two known catalogue gaps and the block may be their only source. Note also two naming collisions the exact-match dedupe missed: `amazon-pay-icici` vs `icici-amazon-pay`, `sbi-simply-click` vs `sbi-simplyclick`.

---

### 11.5 DECISIONS MADE

**Â§7.1 CLOSED â€” Option C, subscription credit.** CreditIQ keeps **zero** affiliate commission; commission earned on a cash booking is credited against that user's CreditIQ subscription, never paid out in cash. Excess above the subscription price carries forward as credit indefinitely, never cashed out â€” which keeps us entirely out of payout rails, TDS and GST-on-cashback territory.

The load-bearing part is that **CreditIQ keeps nothing**, which is what unblocks the hotel page's verdict logic. The mechanism is second-order.

âš  **Still pending, and it decides whether the mechanism survives:** the CJ Affiliate publisher-terms check on whether cashback/loyalty-publisher classification catches a pass-through credit. Many advertisers exclude cashback publishers outright.
âš  **Deck v9 slide 13 is false** â€” "we take no commission from any issuer, airline or hotel." Replacement: *"We keep no commission. Where a booking pays us, that money is credited against the user's subscription â€” so a 'book with cash' verdict can never be worth more to us than the truth."*
âš  **"Apply & Earn" is now the wrong copy.** It reads as CreditIQ earning. Under Option C it must say the user does.

**Award data â€” researched, and there is no affordable supply.** seats.aero is $20k/mo commercial, their docs state commercial/production use needs written approval, and API access is regionally restricted (check India eligibility before spending more time). Every alternative â€” point.me, Roame, PointsYeah, AwardFares, AwardTool, rooms.aero â€” is a **consumer subscription product, not a data supplier**. Hotels are worse: Marriott, Hilton, IHG and Hyatt publish no award API; every tool scrapes. AwardHacker shut down in March 2026 because static award charts stopped being able to tell the truth under dynamic pricing.

**The reframe this forces.** Stop asking "where can I fly with points" (needs award data we cannot buy â€” fails closed, looks broken). Ask **"what is MY balance worth, and what should I do with it"** â€” which needs only:
1. **Global coverage layer** â€” airports (done, free) + Amadeus Self-Service for cash (150k hotels, 400+ airlines, free monthly quotas, ~â‚¬0.001â€“0.025/call beyond, no IATA cert)
2. **Rules layer** â€” transfer ratios, Accor's 2,000 = â‚¬40, HDFC's SmartBuy values, Hyatt's chart (one of the few programmes still publishing one). Free, sourceable, and the actual moat.
3. **Live award seats** â€” optional enrichment. When absent, the answer is still complete.

**Domestic is a different answer on the same page.** Indian domestic award inventory is genuinely thin (IndiGo has no award programme). The real domestic question was never "can I get an award seat" â€” it is **"which of my cards should I book this with, and what do I get"**: SmartBuy multipliers, EDGE rates, milestone progress, lounge access at both airports. Data we already hold, for cards users already have. Nobody in this market shows it.

**Hub-transit â€” accepted as a real feature, not yet specified.** BLRâ†’SGN returns zero; BLRâ†’KUL returns 19 options incl. Qantas business at 46,000. The honest answer is "nothing direct, but there is award space to KUL." âš  Chaining awards means two bookings, possibly two programmes, **no protection if leg 1 is delayed** â€” a self-transfer. If the page suggests it, it must say so plainly, and the hub set (SIN, KUL, DXB, DOH, BKK, HKG) needs a rule, not a guess.

**Mobile app â€” sequenced after web, tool decision made.** Not Replit: their mobile support is iOS-first and does not guide Google Play publishing â€” which is precisely what blocked the July attempt. **The July app did not fail to build.** Five tabs merged, EAS working, an APK that ran on device. It failed to *ship*: identity verification, Android device verification, phone verification, and an account-deletion endpoint committed but never tested or deployed. **None of that is a tooling problem, and all of it has waiting time â€” start it in parallel, today.**

---

### 11.6 NEXT, IN ORDER

1. **Add plain HDFC Regalia and Axis Magnus to SEED_CARDS** with correct reward currencies. Smallest change with the largest measured effect â€” it makes the biggest balance in a real wallet visible to the engine. Check NEW_CARDS first (11.4).
2. **Split the two empty states.** `currency-unknown` (our gap) must not read the same as `no-edge` (a real answer).
3. **The transfer graph.** Amex MR India, HDFC, Axis partner lists with ratios and as-of dates, from issuer pages only. This is reading and typing, and it is the difference between 3 destinations and thirty.
4. **Merge the â‰¥13 duplicate Supabase pairs**, keeping the slug-id row; normalise `bank` to SEED's 12 short forms with explicit mappings for OneCard/FPL and SC.
5. **Amadeus Self-Service account** â€” unblocks the cash half of every verdict, and the hotel page.
6. **Then** hotels on Accor (arithmetic, no licence), then hub-transit, then the app.

**Parallel, no code, start now:** Play Console verification, and the CJ publisher-terms check.

---

### 11.7 UNCOMMITTED / PARKED

- **Diagnostic logging** in `lib/fusion-core.ts` and `app/api/flights/fusion/route.ts`, tagged `DIAGNOSTIC (Step 1 â€¦)`. Remove once the miss rate is characterised. Emits duplicate lines per award Ã— card Ã— cabin â€” that is expected.
- Branch `fix/travel-search-and-affiliate` merged but not deleted.
- Two design-hook findings classified as intentional, left unchanged: meter-fill width transitions at `rewards-calculator:146` and `statement-truth:221` (domain-appropriate, contained, nothing reflows).
- Side-tab accent borders at `rewards-calculator:196` and `WhatCreatorsSay.tsx:73` â€” parked for the Track 2 UI pass.
- Nine decorative emoji left as text in `credit-simulator` ACTIONS and `application-status` STATUS_TIPS â€” channel markers, not status glyphs, no clean icon mapping.
- The two inverted affiliate aliases (`flipkart-axis`, `amazon-pay-icici`) were approved but **not yet added**.

---

### 11.8 STANDING RULES ADDED TODAY

- **Schema questions are answered against the live DB, never a migration file.** The repo's migrations do not describe production.
- **A gate that validates the wrong list is worse than no gate** â€” it manufactures false confidence. Validate the catalogue production actually serves.
- **Data files get one upstream, one generator, one committed output, one access module, one gate.** Never a second hand-maintained copy.
- **A miss must be loud.** No silent fall-through to a fabricated default; and "we don't know" must never share copy with "the answer is no."
- **Test the ranking, don't declare it.** The airport spot-check caught five wrong resolutions that would have shipped.
- **Log first, fix second.** Six lines of logging settled a question two rounds of confident diagnosis got wrong.
