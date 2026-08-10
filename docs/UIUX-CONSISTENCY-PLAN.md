# CreditIQ — UI/UX Consistency & Transition Plan
**9 Aug 2026 · v2 — colour decided, wallet CRUD and Travel simplification added**

Goal: every page in a group looks like the same page, moving between them doesn't flash or jump, and the manual wallet is fully editable.

Findings behind this plan came from the Aug 9 production screenshots: misaligned header/body edges on `/spend-optimizer` and `/trip-planner`, an entirely different design on `/cards`, `/compare` and `/card-switch`, and an unsmooth All Cards → Compare switch.

---

## Phase 0 — Settled and outstanding

### 0.1 Colour — DECIDED

**White/cream site with a teal rail.** Content surfaces stay white/cream, copper stays the accent, the signed-in rail takes the dark teal ground.

Two things this pulls in, neither optional:

- **The rail's active state must be retuned for dark.** Today it's a cream pill with copper text on white. On teal, copper drops toward the background — the active item needs to be re-measured for contrast in both themes, not eyeballed.
- **The logo tile is dark navy.** On a teal rail that's dark-on-dark. Re-check it, and the "CreditIQ INTELLIGENCE" lockup beneath it, at both themes.

One honest note: **the realise.club screenshots show a *white* rail with a black active pill.** The teal rail is a fresh design decision, not a copy of the reference — so there's no worked example to match against and it should be built behind a flag and looked at on a phone before it's merged.

### 0.2 Verify the card count — OUTSTANDING

`/cards` reads **173 cards · 36 banks**; `lib/catalogue-stats.ts` holds literals of 49 and 12 with a test that should fail on drift. Either the catalogue grew and the literals moved with it, or that branch never merged.

```bash
git log --oneline -- lib/catalogue-stats.ts
```

---

## Phase 1 — Group layouts (fixes alignment, jump and smoothness in one change)

Highest-leverage item in the plan. Three reported symptoms, one cause.

### The cause

Each section page renders **its own** eyebrow, headline, tab strip and content container. So:

- **Edges disagree** — header on one column, body on another, because nothing forces them to share a container
- **The strip jumps** — re-rendered from scratch on every tab change, so any title-length difference moves it
- **The switch flashes** — the subtree unmounts and `.page-fade` replays its entrance animation on a page whose header was already on screen

### The fix

Move the header and tab strip **up into a shared route-group layout**; siblings swap only the panel below.

```
app/(shell)/(travel)/layout.tsx                ← eyebrow, headline, SectionTabs, container
app/(shell)/(travel)/travel/page.tsx           ← panel only
app/(shell)/(travel)/trip-planner/page.tsx     ← panel only
```

Same for Spend, Cards, Wallet and You.

What this buys structurally rather than by tuning:

- One container wraps header **and** `{children}` → left edges cannot disagree
- The strip isn't re-rendered → **0px variance by construction**, permanently, with no copy tuned to hold it
- No unmount → no `.page-fade` replay → no flash

### Also required

- **Remove `.page-fade` from pages inside a group layout** — it's an arrival animation and you haven't arrived anywhere new. It also carries bottom clearance; confirm the single-layer `body` clearance covers these first
- **Per-group headline decision.** Once the headline is in the layout it's shared, but "Which card earns you the most money?" and "Where are you going?" are per-tab today. Either they move into the panel or each group gets one headline
- **Prefetch siblings** on the tab strip so the panel is warm before the tap

### Transition

Panel-only cross-fade, 120–160ms opacity. No slide, no scale, nothing that moves the header.

```css
@media (prefers-reduced-motion: reduce) { /* no transition */ }
```

**Do not animate layout properties.** `width`, `height` and `transform` on variable-driven values have failed twice here (the pinned-transform bug, the body-background stall). Opacity and colour only.

### Verification

- Rendered-DOM measurement at 375px and desktop, **both themes**
- Tab through every section of every group — strip Y must not move
- Scroll position on section change (the carousel feedback reported landing "either low or upwards")

---

## Phase 2 — Convert the Cards group

`/cards`, `/compare` and `/card-switch` were never converted. That is the whole reason the fonts and layout differ — an unconverted group, not drift.

- Align type scale, container and spacing to the converted Travel and Spend pages
- Replace the copper pill "Find my perfect card" with the standard primary button
- **Kill three live italics** (Emphasis rule): "ranked *honestly*." on `/cards`, "Pick cards to *compare*." on `/compare`, "*The honest one*." and "*unbiased*" in the footer. Emphasis from weight, size or colour — never slant
- **Fix the footer wordmark: it reads "CardIQ." and the product is CreditIQ.** Live on production, on every page rendering the footer
- Do not tune copy to hit a layout number — Phase 1 removes the reason anyone ever did

---

## Phase 3 — The last four gold pages, and wallet CRUD

`/my-cards`, `/feed`, `/profile`, `/pro`, plus onboarding and `Tour.tsx`. Until these land, the site is two design systems and the `[data-ciq]` block, the `ciq-theme` key and the Instrument Serif / Space Grotesk declarations can't be deleted. One branch, not four — the `ciq-theme` dual-write only stops when the last surface migrates.

### Wallet CRUD — build it in this phase, not separately

`/my-cards` is one of the four, so the new behaviour and the re-theme should land in the same pass rather than building the page twice.

**Edit points at any time.** Today the balance is captured at add-time. Make it editable on the card at any point — an inline pill with a pencil affordance, tap to edit, save in place. No modal.

**Delete an individual card.** Selection model from realise.club/portfolio: a check circle on the card header, a "N Selected" count chip beside the section title, and a "Delete Selected" button that appears next to Add Card only when something is selected.

Three things the reference doesn't cover and we have to answer:

1. **Confirmation.** Deleting a card destroys its points history. A single undo toast is better than a confirm dialog — faster for the common case, still recoverable
2. **Honesty model.** Manually entered points are 📝 self-reported; bank-verified ones aren't user-editable. Editing a verified balance either downgrades it to self-reported or is blocked — decide which, because silently letting a user overwrite a verified number breaks "We don't guess your money"
3. **Downstream recompute.** Points feed the dashboard gauge, the trip planner's auto-loaded balance and the redemption spread. Editing or deleting has to invalidate those, not leave a stale total on screen

### Known traps, all previously logged

Shared components (`CardRow`, `HeroGauge`, `EstimateRange`, `Tour`, `CardMockup`) default `variant` to `'gold'`, so flipping defaults touches every consumer. `globals.css:231` points every heading at `--ink`, which breaks in **partial** states. A dark panel maps to `--navy`, never to `--ink`.

---

## Phase 4 — Simplify the Travel search page

Queued, not yet specced. It's the five-tab group that drove the whole carousel exercise, and `/trip-planner` carries a free-text trip box, a points balance, a bank selector, an origin, six quick-idea chips and an inspiration grid — before any result exists.

Spec this properly before building: what is the one thing a user comes to that page to do, and what is the shortest path to it. Everything else moves below or behind that. Do it after Phase 1, because the group layout changes what the page owns.

---

## Phase 5 — Residual polish

- Radius drift (12/14/16/20/22/24) → one scale
- Font debt: the app ships **Geist**, the docs say Inter. Pick one and make the docs true
- `SECTION_TABS` still uses its own path-icon factory while the nav is on lucide — one icon vocabulary
- `transition: transform` pinned-to-start bug: root cause unpinned, workaround still in place

---

## Order

```
0  Count verify                      you, minutes
1  Group layouts                     fixes 3 symptoms, unblocks everything
2  Cards group conversion            visible payoff, depends on 1
3  Gold four + wallet CRUD           unblocks the CSS deletion
4  Travel simplification             spec first
5  Polish                            after the systems are one
```

Teal rail ships inside Phase 3 — the rail is part of the same theme pass, behind a flag.

Phase 1 first is not negotiable: converting Cards before the layouts exist means converting it twice.

## Rules for this work

1. Only the files the task needs; no unrelated refactors
2. Small steps, each explained, confirm before the next
3. `tsc` clean and the full test suite green at every step
4. Judge type and layout on a **Vercel preview**, never localhost — dev renders in a Times fallback
5. Every check is a rendered-DOM measurement in both themes, or it didn't happen
