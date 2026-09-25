# Cockpit — reconcile, not rebuild

**22 Sep 2026 · supersedes COCKPIT-PHASE2-GO-2026-09-22.md in full**

Phase 1 read `feat/creditiq-hotel-award-join-v1`, which was 309 commits behind
`origin/main`. Every premise in the GO prompt about card management was wrong:
`/wallet` exists, the CRUD split is done, and `origin/main` already ships a wired
Cockpit — `DashboardHome.tsx`, `creditiq-cockpit.css`, `/api/cockpit/*` with tests,
and the six dashboard docs.

The task is therefore a gap report of the shipped Cockpit against the design, then
targeted fixes. Not a parallel build.

Hypothesis to test, not assume: the shipped Cockpit resolves cards against
`SEED_CARDS` through its own path (`catalogueCard`, `resolveRailCardId`). If a card
fails that match it may drop out of totals — a candidate cause of "0 cards / 0
points" on `/dashboard` while `/wallet` shows cards.

```
Option 4 — typed instruction. This REPLACES the earlier GO prompt entirely.
Ignore its card-management, route-move and SectionTabs sections: they were
written against the stale branch and are void.

TASK: reconcile the Cockpit that origin/main already ships against the
approved design. Targeted fixes only. No parallel rebuild. Keep the shipped
/api/cockpit data layer and its tests.

SOURCE OF TRUTH for the visual design, unchanged:
  docs/design/cockpit/CreditIQ Cockpit.dc.html
  (visual reference: docs/design/cockpit/CreditIQ-Cockpit-bundle.html)
Ignore the Concept A/B/C files and CreditIQ Dashboard.dc.html.

============================================================
STEP 0 — BASE
============================================================
  git fetch origin
  git switch -c feat/cockpit-dashboard origin/main
docs/design/cockpit/ is untracked — confirm it carried over.
Leave feat/creditiq-hotel-award-join-v1 alone (0 ahead, 309 behind).

Establish the test baseline ON THIS BRANCH before touching anything:
  npx tsc --noEmit
  the unit test command from package.json
Record every failure. Do NOT assume the old four-failure baseline — main
is 309 commits newer and it may have changed. This recorded list is the
baseline for everything below.

============================================================
PHASE R1 — REPORT ONLY. Do not edit any file.
============================================================

A. VISUAL GAP TABLE. Compare the shipped DashboardHome.tsx and
   components/ciq/creditiq-cockpit.css against the design, section by
   section: rail/shell, greeting + wallet pills, eyebrow, H1, CIRA command
   bar, suggestion chips, Smartest Move card, Live From Your Wallet column,
   card deck, rewards orbit, floating Ask CIRA bar.
   Table: element | design | shipped | gap | fix type (style / structure /
   data) | files.
   Call out specifically anything that compresses content toward the
   centre, creates large blank areas, or differs in typography, colour,
   spacing, card size or proportion.

B. RESPONSIVE. Does the shipped version port the design's
   @container cq rules (1240px, 900px)? Where is the container declared?
   The design's rail is 76px INSIDE its container. Measure the main
   column's actual width at 1440, 1600, 390 and 360 against main's real
   shell, and state at which viewport widths each rule fires versus the
   design. If thresholds drift, give the corrected main-column values.
   At 1440 and 1600 the orbit must be unscaled and the layout two-column.

C. "0 CARDS / 0 POINTS" — test the hypothesis, do not assume it.
   The Cockpit resolves cards against SEED_CARDS via its own path
   (catalogueCard, resolveRailCardId, redemption-rails registry).
   Trace what happens to a user card that does NOT resolve:
   is it dropped from the card count, the points total, or both?
   Write a failing-or-passing UNIT TEST with a fixture card whose name
   does not match the catalogue, and report the result. Compare against
   what the /wallet loader returns for the same fixture.
   Do not query production data.

D. DEMO DATA. List any hardcoded demo value in the shipped Cockpit
   (e.g. ₹26,400, ₹75,000, 43,000 miles, named cards, point counts).
   Each must map to a real source or an honest empty state.
   REPORT the source of any per-point estimate range the Smartest Move
   card uses — file, and whether it carries source and as_of.

E. CONFLICTING STYLING. Identify the "previous experimental /
   subscription dashboard styling" still on main that conflicts with the
   design. File paths. Delete nothing.

F. TOKENS. Are the design's fonts and colours scoped to the Cockpit, or
   do any leak into globals.css or other routes? Newsreader must load
   without its italic axis.

G. Proposed fix list, smallest first, with files and risk for each.

End with exactly:
  PHASE_R1_COMPLETE — awaiting FIX.
Then STOP.

============================================================
PHASE R2 — only after FIX, applying only the approved items.
============================================================
- Targeted fixes only. Do not replace DashboardHome.
- Do not change /api/cockpit behaviour except where C proves a defect,
  and then with a test that fails before and passes after.
- Do not touch /wallet CRUD, /trip-planner, /cira, AwardTool, hotel or
  redemption APIs, Supabase auth, or routing.
- No italic anywhere. Tap targets at least 44px.
- Screenshots at 1440x900, 1600x900, 390x844, 360x800 into
  docs/design/cockpit/screenshots/ via an unauthenticated harness that
  is created, used and DELETED before commit. Confirm with
    git diff origin/main --stat
  that no harness file is in the branch.
- Measure horizontal overflow at 360 and 390 and report the numbers.
- Re-run tsc and tests; any failure not in the STEP 0 baseline is a
  regression — STOP.
- Commit and push feat/cockpit-dashboard. Preview only.
  DO NOT merge. DO NOT deploy to production.
- Final report: every file changed and why, the C test result, every
  demo value and its replacement, overflow numbers, test results against
  the STEP 0 baseline, preview URLs for /dashboard and /wallet, and a
  phone checklist.
```
