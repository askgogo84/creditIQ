# Cockpit — Phase R2 FIX

**22 Sep 2026 · reply to PHASE_R1_COMPLETE**

## Verdicts

- **Approved:** 1–8 and 10.
- **Deferred:** 9 (Smartest Move 3-step path) — its steps are transfer
  instructions, which need the unintegrated redemption engine and an unsourced
  HDFC transfer minimum. Building them now fabricates instructions. 11 (orbit
  connection lines) — cosmetic, defer.
- **Not building:** in-place chip modes. The card/redeem/statement/spend modes have
  no data source and would reintroduce demo panels.
- **Hypothesis C closed** — catalogue matching does not drop cards. Replaced by the
  two-loader question (B below).

## Urgent

Fix 1 — the "Goverdhan" greeting fallback — is live in production for every user
without a display name. It is the first commit, isolated, so it can be
cherry-picked to main independently.

## The prompt

```
FIX.

BASELINE: STEP 0 recorded tsc clean and 0 test failures. Any failure from
here is a regression — STOP.

============================================================
APPROVED — implement in this order, ONE COMMIT PER ITEM
============================================================

1. firstName fallback (DashboardHome.tsx:148). Remove the literal
   'Goverdhan'. Use the user's real first name, else "there".
   This bug is LIVE in production for every user without a display name.
   Make it the FIRST commit, touching nothing else, so it can be
   cherry-picked to main on its own.

2. Self-entered dot → grey #B9BCC6, per the design (DashboardHome.tsx:179).

3. CIRA star icon → gold #C9A86A, per the design.

4. Remove the dead .ciq-home-latest* and .ciq-sub-home* CSS from
   components/ciq/creditiq-cockpit.css. Before deleting, re-run git grep
   across .ts, .tsx, .css and .mdx INCLUDING string-built classNames
   (template literals, cn(), clsx()). Report the grep output. If anything
   references them, stop on this item.

5. Fonts. Load Newsreader (NO italic axis) and Instrument Sans via
   next/font in the dashboard module — not the root layout. Apply per the
   design: Newsreader for display text, Instrument Sans for body,
   replacing Avenir Next / Georgia on the Cockpit ONLY. Nothing outside
   .ciq-cockpit may change. Report the weights and subsets loaded.

6. Card-deck empty state per the design (.dc.html lines 241–251):
   "No cards yet", "Add a card" → /wallet, "Upload statement" → the
   existing statement upload route. This removes the ~300px blank block.

7. Orbit hub per the design: total + "reward points" + verified% bar +
   "% verified", driven by summary.verifiedPercent.

8. Orbit programme pills from REAL data. Delete the hardcoded
   KrisFlyer / Maharaja / Accor ALL / Marriott pills. Use the partners the
   summary route already computes per card. Rules:
   - Those partners come from transfer-ladder / transfer-map, which are
     verified:false. Style EVERY pill as estimated, never as verified.
   - If partners exceed the design's pill slots, show the design's slot
     count plus a "+N" pill. Report the slot count used.
   - A user whose cards resolve to no partners gets NO pills — never the
     old four.
   - Do not add a new card-matching path.

10. Selected-card detail panel per the design: name, provenance, points,
    best-use, partner tags, buttons. Use ONLY fields the summary route
    already returns. Partner tags follow item 8's rules. Any field the
    summary lacks: omit it, do not invent it. Buttons route to existing
    pages only.

============================================================
NOT APPROVED — do not build. Mention in the final report.
============================================================

9. Smartest Move 3-step path. Its steps are transfer instructions
   ("move N points to X"). Real instructions need the redemption engine
   on feat/redemption-engine-v31, which is not integrated, and whose HDFC
   transfer minimum/increment is still unsourced. Building the design's
   steps now means shipping fabricated instructions. DEFERRED.

Suggestion chips switching the work panel in place: keep the shipped
behaviour (links). The design's other modes have no data source, and
building them would reintroduce demo panels.

11. Orbit connection lines: deferred.

============================================================
INVESTIGATE AND REPORT — change nothing
============================================================

A. /api/flights/fusion. The dashboard calls it with a fixed BLR→SIN,
   +21 days, economy query. Report: which upstream provider(s) it calls
   and with WHOSE credentials; whether every dashboard load triggers an
   upstream request or hits a cache, and the TTL; any rate limit or cost
   per call. Do not change it.

B. Two loaders. Cockpit totals come from loadDecisionPortfolio
   (statements + manual + linked). /wallet uses /api/user-cards +
   /api/manual-cards. State whether linked cards appear in one and not
   the other — i.e. whether card count or points total can legitimately
   differ between /dashboard and /wallet for the same user.

============================================================
TEST
============================================================
Add the hypothesis-C fixture test: a card that does not match the
catalogue (bank 'Slice', cardName 'Slice Super Card') is KEPT, with its
points in the total and in cardCount. Expected PASS. Keep it permanently —
it guards the invariant.

============================================================
OVERFLOW — measure it properly
============================================================
.ciq-cockpit-main has overflow:hidden and .ciq-cockpit has
overflow-x:hidden at ≤900px. Those CLIP overflow, so document scrollWidth
will read clean while content is cut off. At 360 and 390, report every
element whose getBoundingClientRect().right exceeds the viewport width,
or confirm there are none. Clipped content is a defect, not a pass.

============================================================
SCREENSHOTS, SHIP, REPORT
============================================================
- No italic anywhere. Tap targets at least 44px.
- Screenshots at 1440x900, 1600x900, 390x844, 360x800 into
  docs/design/cockpit/screenshots/, via an unauthenticated harness that
  is created, used and DELETED before commit. Confirm with
    git diff origin/main --stat
  that no harness file is in the branch.
- Re-run npx tsc --noEmit and the full test suite. Zero failures.
- Commit and push feat/cockpit-dashboard. Preview only.
  DO NOT merge. DO NOT deploy to production.
- Final report: every commit and file changed, the fixture test result,
  the A and B findings, the overflow results, the fonts loaded, the
  deferred items, preview URLs for /dashboard and /wallet, the commit
  hash of fix 1 alone, and a phone checklist.
```
