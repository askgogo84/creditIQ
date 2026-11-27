# PRD — CreditIQ Travel Search & Fare Watch (27 Nov 2026)
## Goal
Preserve one truthful cash-vs-award flight decision across CreditIQ Consumer, Business and AskGogo. Fix group passenger fare correctness; enable price alert decisioning; prepare Parallel Flights/Shopping early-access integrations without inventing provider API contracts.
## Customers
Personal users, families, corporate employees, finance travel coordinators.
## Required
1. Exact number of adult passengers shown in live provider offers (1–9).
2. Explicit fail-closed handling for unsupported child ages and round trips; never show a one-adult quote for a family.
3. Cached dated fares cannot masquerade as live offers.
4. Price watchers compare same route/dates/cabin/passengers/currency; alert only on verified current bookable offers, avoid duplicate alerts.
5. Shopping quote intake must distinguish observed product prices from hypothetical card rewards.
6. Parallel Flights/Shopping must be gated until developer entitlement, endpoint shape and provider response are confirmed.
## Non-goals
No payments, tickets, bookings, points transfers, live issuer account access or secret ingestion. No tracking without explicit opt-in.
## Acceptance
See 06-Implementation-Plan.md. Maintain existing one-adult API behavior.