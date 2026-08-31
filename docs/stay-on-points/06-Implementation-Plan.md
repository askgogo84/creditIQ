# 06 — Implementation Plan · Stay on Points

**Rule: one phase per Claude Code session. Verify and commit before the next.**
Do not ask for the whole thing in one shot.

---

## Phase 1 — Data layer, no UI

**Files created**
- `lib/data/hotel-programmes.ts` — registry, 5 programmes
- `lib/data/hotel-seed.ts` — 10–15 Bangkok hotels
- `lib/types.ts` — hotel types appended, not a new file

**Done when:** `tsc` clean; both files import cleanly; every seeded hotel has a
`cash_captured_at`; Accor entries have `points_per_night`, dynamic ones null.

**Do not:** touch any existing file except `lib/types.ts`. No UI. No routes.

---

## Phase 2 — The engine, pure and tested

**Files created**
- `lib/hotels/engine.ts` — all arithmetic, zero I/O
- `lib/hotels/engine.test.ts`

**Must implement:** points→value, value→INR via injected FX, portal comparison
from `point-values.ts`, verdict thresholds (±5%), coverage/top-up.

**Tests that must exist:**
- EUR/INR = 110 → Accor beats HDFC SmartBuy (POINTS_WIN)
- EUR/INR = 88 → cash wins (CASH_WINS)
- balance covers all / some / none
- dynamic programme → NOT_PUBLISHED, never a computed number
- FX null → comparison suppressed, points cost still returned

**Done when:** every test passes and the FX boundary cases are explicit. That
boundary is the product; if it is not tested, the product is not built.

**Do not:** import React, fetch anything, or read a file. Pure functions only.

---

## Phase 3 — Providers

**Files created**
- `lib/hotels/providers/rates.ts` — interface + `SeededRateProvider`
- `lib/hotels/providers/fx.ts` — interface + `LiveFxProvider`
- `lib/hotels/providers/photos.ts` — interface + `PlaceholderPhotoProvider`

**Critical:** `LiveFxProvider` returns null on failure. It must not have a
fallback constant. Add the grep gate from doc 05 §5 in this phase so the rule is
enforced from the moment it exists.

**Done when:** providers satisfy their interfaces, FX failure returns null and is
tested, no EUR/INR literal exists anywhere.

---

## Phase 4 — Page and components

**Files created**
- `app/(shell)/(travelgrp)/stay-on-points/page.tsx` — server component
- `components/ciq/stay-points/` — the components from doc 04 §3

**Reuse, do not rebuild:** the `Metric` / `EstimatedValue` components and
`isFieldUnknown()` from `lib/data/unverified-cards.ts`. The `--` pattern is
already implemented — use it.

**Done when:** the page matches the approved mockup at 375px; all four search
modes render; all five verdict states render with real seeded data; provenance
row on every card.

**Do not:** introduce a new colour, a new spacing scale, or any italic type.

---

## Phase 5 — Gates and nav

- Extend `scripts/validate-point-values.ts` with the three hotel passes from
  doc 05 §5
- Add `/stay-on-points` to `appNav.ts` under Travel, next to Fly on Points
- Add to sitemap
- Cross-link from the Fly on Points board

**Done when:** `npm run check:point-values` passes with the new gates and fails
correctly when a rate is deliberately broken. Prove the gate fires before
trusting it — this is the lesson from e9a58cac.

---

## Phase 6 — Verify and ship

- `npx tsc --noEmit` → 0
- `npm run check:card-links` → pass
- `npm run check:point-values` → pass, hotel gates included
- `npm run build` → only the known Windows `/icon` next-og failure
- tests → only the 4 known failures, nothing new
- **Push, then confirm the Vercel deploy reaches Ready.** Production was broken
  for an hour on 27 Aug because a push was not followed up.

Then open on a phone: `https://www.creditiq.app/stay-on-points`

---

## Standing rules for every phase

- Plan before coding; state files to change and risks first
- Only touch files the phase names
- Match existing patterns; no new libraries
- After each phase: summarise every file changed, flag risks, list what to test
- Never invent a rate, a ratio, or an FX number
- Commit per phase, push only after the phase verifies

## What is explicitly out

Booking execution, live rate feed, licensed photos, Marriott/IHG award pricing,
multi-city, occupancy variants. All v2 or later.
