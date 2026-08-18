# Implementation Plan — Travel redesign

**Status:** draft for review · 18 Aug 2026
**Repo:** `C:\Users\gover\creditIQ\creditIQ`

Build phase by phase. Each phase is its own branch, its own review, its own preview URL.
Do not hand the agent more than one phase at a time.

---

## Phase 0 · Today, before anything else (30 min)

The demo-safe one-line fixes on the existing page. Not part of the redesign.

- Fix **"You save vs cash ₹0"** — it contradicts its own card.
- Fix the **date mismatch** between the plan and the prefilled search form.
- Delete **two of the three contradicting recommendation blocks**. Keep whichever one is
  computed from real data; the other two go.

Ships to production on its own. Everything below is a separate track.

---

## Phase 1 · Read-only investigation (no code)

Establish ground truth before designing against assumptions.

- What does the Seats.aero integration actually cover — which programmes, which routes,
  what response shape, what rate limits?
- Does `trip-planner/live-price` return a live quote or an estimate?
- Where does the current page get each of its three contradicting recommendations?
- What already exists that can be reused vs what is genuinely new?

**Deliverable:** a findings doc. No edits.

**Blocking, in parallel and not by the agent:** confirm Seats.aero's partner terms permit
commercial display and a handoff funnel.

---

## Phase 2 · The transfer ladder (backend, no UI)

The highest-value piece, and independently useful — Ask AI and the corporate desk both
want it.

- `transfer_partners` migration.
- Seed with **directly-verifiable issuer routes only.** An honest 12 rows beats an
  impressive 60 with invented ratios. `state` truthful on every row.
- `findTransferRoutes()` — 2-hop bounded graph search, returning ratio, combined ratio,
  hops, duration, provenance.
- Unit tests on the ladder maths. **The harness imports the real function** — no mirrored
  logic. This codebase has already been burned twice by tests that copied source instead
  of importing it.

**Done when:** given a card and a programme, the function returns correct routes with
honest provenance, and the tests would fail if the real implementation changed.

---

## Phase 3 · Search + result list (UI, no expand)

- New search band, 375px first, sticky-collapsed on scroll.
- Progressive result streaming with the determinate progress line.
- Result row — table on desktop, card on mobile.
- Filters that re-filter fetched results rather than re-querying.
- Wallet grounding: `In wallet` badges, All cards / My cards defaulting to My cards.

**Done when:** a search returns a usable list at 375px and at desktop, results stream in,
and a failed programme is reported rather than silently dropped.

---

## Phase 4 · The expanded row

- Miles + taxes by cabin.
- `Show cash price` — fetched on request only, never pre-rendered.
- The transfer ladder rendered, with duration risk marked on routes too slow to hold a
  seat.
- The don't-redeem verdict where cash wins, stated as plainly as the redeem one.
- One outbound action per row, with the irreversibility confirmation before handoff.

**Done when:** a user can open a row and know exactly what to do next, in one screen, at
375px.

---

## Phase 5 · Delete the old page

Only after Phases 3 and 4 are verified on a preview.

Removed: the second search form, the summary paragraph card, the Cheapest/Best-value
strip, the two how-to columns, the Hotels toggle, the bottom Redeem panel, four of five
OTA buttons per row.

⚠ **Standing rule:** cutting a destination requires building its replacement entry point
in the same change. Check what links into `/trip-planner` before removing anything.

---

## Standing constraints for every phase

- **Plan before coding.** State files, changes and risks; wait for approval.
- **Limit scope.** Only files required for that phase.
- **Match existing patterns.** No new libraries, no new abstractions unless asked.
- **375px is the primary target**, not an afterthought.
- **No italics.** Emphasis by weight, size or colour.
- **Never blend the three data classes** — availability, transfer routes and cash fare
  each keep their own source and freshness.
- **Verify on a deployed preview, not localhost** — gated pages redirect to `/login`
  without a real session.
- **Commit per phase.** Do not batch three phases into one commit.

## Sequence summary

| Phase | Ships | Depends on |
|---|---|---|
| 0 · Bug fixes | Today | — |
| 1 · Investigation | Doc only | — |
| 2 · Transfer ladder | Backend | Phase 1 |
| 3 · Search + list | UI | Phase 2 |
| 4 · Expanded row | UI | Phase 3 |
| 5 · Delete old page | Cleanup | Phases 3, 4 verified |
