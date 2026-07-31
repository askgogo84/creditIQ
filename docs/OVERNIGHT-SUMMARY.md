# Overnight run — summary

**Branch:** `design/tours` (created off `design/shell`, as instructed — not off main).
**Pushed:** **nothing.** Deploy stays gated on your review. All work is local commits on `design/tours`.
**Gates honoured:** `npx tsc --noEmit` = 0 before every commit; scoped `git add` by path (never `git add .`); no new libraries.

---

## ⚠️ First, restore your auth WIP
You launched this run while on `design/auth` with uncommitted work (`app/login/page.tsx`, `app/delete-account/`, `public/images/auth-bg.jpg`). I did not touch or commit it — I **stashed** it so I could branch cleanly. To get it back:

```bash
git checkout design/auth
git stash pop
```
It's `stash@{0}` ("design/auth WIP — parked by overnight tours run 9d2b087f"). Verify with `git stash list`.

---

## What I built, by phase

### Phase 1 — Data audit (report only, no code) · commit `98a784bd`
`docs/dashboard-data-audit.md`. Traced each dashboard element to real code:

| Element | Verdict | Source |
|---|---|---|
| Total points (wallet) | ✅ COMPUTABLE | `statement_imports` + `manual_cards` `.points_balance`, provenance-split |
| Optimisation rate | ❌ NOT COMPUTABLE | needs per-user categorized spend — doesn't exist (no bank sync, MCC work unbuilt) |
| Active portfolio + empty state | ✅ COMPUTABLE | merged wallet list + length-0 |
| Trending carousel — art | ✅ COMPUTABLE | `SEED_CARDS.card_image_url` (+`color` fallback) |
| Trending carousel — one-liner | ✅ COMPUTABLE | `SEED_CARDS.best_for` (no dedicated description field) |
| Trending carousel — "trending" rank | ❌ NOT COMPUTABLE | no honest behavioural signal |

Verified the two load-bearing facts by reading source directly, not just via the search agents: `dashboard/page.tsx:218` (real point sum) and `engine.ts:21-23` (spend mix is a self-declared assumption). No placeholder values proposed.

### Phase 2 — Six docs · commit `dd8db6fe`
`docs/dashboard/` → `01-PRD`, `02-TRD`, `03-App-Flow`, `04-UIUX-Brief`, `05-Backend-Schema`, `06-Implementation-Plan`. Every figure traces to the Phase 1 COMPUTABLE list. NOT-COMPUTABLE items are **designed out of v1, not placeholdered**: optimisation rate omitted (layout hook reserved for when spend categorization lands); "trending" replaced by an honest editorial "Cards to know" strip; points→₹ demoted from headline to a labelled estimate. v1 needs **no new tables, columns, endpoints, or libraries** — it tightens the existing `/dashboard` surface.

### Phase 3 — Reusable tour component · commit `7f60d93b`
Built **once** as a generic component; **not applied to any page.**
- `components/ciq/Tour.tsx` — takes a `steps[]` array + per-step CSS-selector anchor. Card shows `TOUR · STEP n OF m`, title, one paragraph, Skip (left) · dot progress (centre) · Continue/Done (right).
- `components/ciq/Tour.test.tsx` — 13 Vitest/RTL tests (all pass).
- `app/dev/tour-preview/page.tsx` — unlinked isolation harness (dark + light).

Meets every requirement: 375px-safe (`min(320px, 100vw-32px)`), existing `--ciq-*` tokens only (no new colours), `prefers-reduced-motion` opt-out (self-contained, doesn't depend on the global rule), keyboard-navigable (Escape=skip, Arrows navigate, Tab wraps), and **focus trap** with save/restore. `role="dialog"` + `aria-modal` + labelled/described.

---

## Every file touched
```
docs/dashboard-data-audit.md            (new, Phase 1)
docs/OVERNIGHT-QUESTIONS.md             (new, Phase 1)
docs/dashboard/01-PRD.md                (new, Phase 2)
docs/dashboard/02-TRD.md                (new, Phase 2)
docs/dashboard/03-App-Flow.md           (new, Phase 2)
docs/dashboard/04-UIUX-Brief.md         (new, Phase 2)
docs/dashboard/05-Backend-Schema.md     (new, Phase 2)
docs/dashboard/06-Implementation-Plan.md (new, Phase 2)
components/ciq/Tour.tsx                  (new, Phase 3)
components/ciq/Tour.test.tsx            (new, Phase 3)
app/dev/tour-preview/page.tsx           (new, Phase 3)
docs/OVERNIGHT-SUMMARY.md               (new, this file)
```
All commits are on `design/tours`. Nothing pushed.

## What I skipped, and why
- **The dashboard itself** — out of scope. Phase 3 was explicitly "the reusable tour component only. No surfaces, no dashboard." I wrote the dashboard *plan* (Phase 2) but built none of it.
- **Applying the tour to any page** — explicitly forbidden. Only the isolated preview route exists.
- **Optimisation rate & "trending"** — designed out, not faked (see audit).
- **Existing dashboard tech-debt** (e.g. the `×1.8`/`×0.25` ₹ multipliers already live at `dashboard/page.tsx:219-220`) — flagged in the docs as "demote/label," but not changed, since Phase 3 built no surfaces.

## What needs your decision → `docs/OVERNIGHT-QUESTIONS.md`
1. **Q1** — OK to ship an *editorial* cards strip instead of "trending" in v1?
2. **Q2** — Card art is on an external CDN (`asset21.ckassets.com`). Hotlink / self-host / colour-swatch only?
3. **Q3** — Confirm optimisation rate is omitted from v1 (vs a clearly-labelled non-personal illustration).

All three have honest defaults already applied so the run wasn't blocked.

## How to eyeball the tour
```bash
git checkout design/tours
npm run dev
# open http://localhost:3000/dev/tour-preview  -> "Start tour", toggle theme
npx vitest run components/ciq/Tour.test.tsx     # 13 passing
```

## Verify I didn't overreach
```bash
git log --oneline design/shell..design/tours    # exactly 4 commits: audit, docs, tour, summary
git status                                       # clean; nothing pushed
```
