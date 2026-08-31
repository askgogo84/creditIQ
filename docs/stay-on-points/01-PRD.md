# 01 — PRD · Stay on Points

**Product:** CreditIQ hotel points-vs-cash portal
**Route:** `/stay-on-points`
**Date:** 27 Aug 2026
**Status:** mockup approved (`docs/mockups/hotel-portal-mockup.html`), spec open

---

## 1. The problem

An Indian premium cardholder with 8,00,000 HDFC points has no way to know
whether transferring them to a hotel programme beats spending them through
SmartBuy. The bank portal quotes a rupee value. The hotel programme quotes a
points cost. Nobody puts the two numbers next to each other.

Existing players do not solve this for India:
- points.casa does hotel awards but is US-focused and runs on cached rates its
  own code notes are 95% more than a week old
- RewardPoints.Club and Great Indian Miles answer it by hand, as paid advice
- Bank portals have every incentive not to tell you the transfer is better

## 2. What this product does

For a given hotel and stay, show three numbers side by side:
1. **Points cost** to book the stay through the hotel programme
2. **Cash price** for the same room
3. **What your bank portal would give you** for those same points

Then a plain verdict: transfer, or keep your points.

## 3. The insight that makes it worth building

Accor publishes a **fixed** redemption rate: **2,000 points = €40**. No award
chart, no availability lookup, no dynamic pricing. So the rupee value of a
transferred point is pure arithmetic — and it moves entirely with the EUR/INR
rate.

At ~₹110/EUR, transferring beats HDFC SmartBuy by roughly 10%.
At ₹88/EUR, it lost.

**The FX rate is the entire margin.** It must be live on every calculation and
must never be stored as a constant anywhere in the codebase. This is the single
most important rule in this spec.

Nobody in the Indian market is publishing this.

## 4. Scope — v1

### In
- **Accor / ALL** — full computation. Published rate, live FX, real verdict.
- **All other major chains** (Marriott, IHG, Hyatt, Hilton) — displayed in the
  UI with a real cash price and an explicit "points cost not published"
  state. They price awards dynamically; we do not guess.
- **Four search modes:** by city, by hotel, what-my-points-can-book, best-value-now
- **Seeded rate dataset** — one city (Bangkok), ~10-15 hotels, cash rates
  captured manually with a captured-at timestamp
- **Live FX** from a public rate source, refreshed per request
- **Points balance context** — user's stored balance drives the coverage line
  ("covers 3 nights, nothing extra to pay" / "covers 2, third night is ₹12,933")

### Out of v1
- Live cash-rate feed (Booking.com via CJ is in onboarding — see doc 02)
- Licensed hotel photography (placeholder gradients + source label until then)
- Booking execution — we link out, we never transact
- Marriott/IHG/Hyatt award pricing
- Multi-city, multi-room, occupancy variations

## 5. Why seeded data rather than waiting

The cash-rate provider is not live. Building against a seeded dataset gets the
entire product working end to end — arithmetic, verdict logic, honest
degradation, UI — behind a provider interface. When Booking.com lands it is a
config swap, not a rewrite. Nothing built here is thrown away.

This is deliberate: the alternative is waiting on someone else's paperwork
while nothing ships.

## 6. Success criteria

1. A user with a stored points balance can search Bangkok and see, for each
   Accor hotel, whether transferring beats their portal — with the working shown
2. Every displayed number carries provenance: sourced, estimated, or unknown
3. No number is ever shown that was not either published by the programme,
   captured with a timestamp, or fetched live
4. A Marriott hotel renders with a cash price and no invented points cost
5. The page works at 375px

## 7. Non-negotiables

- **Never invent a rate.** A missing value renders as `--`, never as 0 or an
  estimate. This follows the pattern established in commits a87710ce / 022cf548.
- **FX is always live.** Never a constant, never cached beyond the request.
- **Cash rates carry a captured-at timestamp** and display their age.
- **The points-comparison rate and the affiliate rate are different numbers.**
  Accor points require booking direct on all.accor.com. Comparing against an OTA
  rate compares the wrong things. This distinction must survive into the code.
- **Photos disclose their source** on the image itself.

## 8. Open decisions (not blocking v1)

1. Cash-rate provider for v2 — Booking/CJ, Google Hotels, or other
2. Photo licensing route — Booking affiliate feed is the recommended path
3. Whether to pursue Marriott/IHG award data at all, given it needs availability
