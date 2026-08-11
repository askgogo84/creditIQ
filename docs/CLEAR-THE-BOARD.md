# CreditIQ — Clear the Board
**11 Aug 2026 · v2 — reconciled. Batched by the FILES each item touches, not by defect category.**

Supersedes the pending sections of `STATUS-10-AUG.md`. Folds in `HARDCODED-PALETTE-AUDIT.md`, `UIUX-CONSISTENCY-PLAN.md`, `DELETE-ACCOUNT-VERIFICATION.md`, `PRICING-METER-DECISIONS.md`, `SEED-CARDS-INTEGRITY.md` and the two handovers. Companion specs still live: `PRICING-ONETIME-IMPLEMENTATION-PLAN.md`, `catalogue-inclusion-and-verification-spec.md`.

---

## The change in this version

The last board had **three separate batches** — a Cards conversion, a gold-four migration, and a "hardcoded-hex palette" backlog — that each **touched the same ~20 pages**. That meant visiting `/compare`, `/my-cards`, `/travel` etc. up to three times, once per defect category, re-reading and re-deploying each page every time.

They are now **one page-by-page pass** (Batch 3). A page is visited **once** and, on that visit, gets everything it needs:

> **layout conversion · hex→token · cream/slate ground fix · radius unify · kill italics/wordmark/gold**

A page is **done** when it is converted, tokenised and on-system — not when three batches have each brushed past it. `/card/[slug]` and the remaining marketing-hero pages (banks, glossary) join that same pass because it's the same work in the same files.

Everything that is **genuinely independent** of that pass — font debt, `/login` video, dead-file deletion, `/landing` 301, `/optimize` retirement, `reassertTheme` removal, icon unification, the Reveal/count-up polish — drops into the small-bugs batch. Compliance (delete-account, Receipts/Reviews) is its own batch. Data (NEW_CARDS, the WhatsApp honesty leak) folds into the catalogue batch.

---

## The honest framing

Not twenty equal jobs. Three of them are **programmes** measured in weeks and partly manual (re-sourcing earn rates, verifying cards, ingesting the tail). Of the rest, the **page-by-page pass (Batch 3) is now the bulk of the remaining engineering** — many sessions, but bounded, because each page is touched once instead of three times.

- **Make it true and finished** — every bug closed, every surface converted + tokenised, every claim honest. Bounded.
- **Make the catalogue complete** — a continuing programme, not a task with an end date.

This board closes the first and sets the second running in the background.

---

## BATCH 0 — Verify before you schedule anything (≈45 min, you)

The top two are checks only you can run (Phase 2 on prod, the card count). The `/optimize` question and the two "unverified diagnoses" have now been **verified (11 Aug)** — verdicts folded in below.

- **Did Phase 2 actually land?** Check `/cards` on production for the three italics ("ranked *honestly*", "Pick cards to *compare*", footer "*The honest one*" / "*unbiased*"), the **CardIQ** wordmark in the footer, the gold gradient button, and the mobile whitespace above the fold at 375px. If any survive, they get closed inside Batch 3's Cards-group visit — not as a standalone.
- **Card count.** `/cards` reads **173 cards · 36 banks**; `lib/catalogue-stats.ts` holds literals of 49 · 12 with a drift test that should have failed. `git log --oneline -- lib/catalogue-stats.ts` — did the catalogue grow and the literals move with it, or did a branch never merge? Answer feeds Batch 7.
- **`/optimize` — RESOLVED (retire).** One route (`app/(shell)/optimize/page.tsx`) — the abandoned dark redemption optimiser (duplicated CTA block + blank-line cruft). `/points-optimizer` is a *different* tool and **does not read `?points=`/`?bank=`** (no `useSearchParams`), so it can't be a param-preserving alias. Retire it (Batch 2 #9); **not tokenised in Batch 3.**

**✓ VERIFIED (11 Aug) — the two "unverified diagnoses" were run:**

- **`"config is not valid"` — PINNED, and it was emrldco after all.** Emitted by `emrldco.com/chunk.Bi-kQaap.js` (`if(!d){ve("config is not valid")}`), the Travelpayouts affiliate bundle chained from the `emrldco.com/NTMzNDA5.js` tag in the root layout — which is why it fired on both `/` and `/landing` (shared layout). **One defect, not two:** removing the emrldco script (shipped in Batch 1, `ad69350d`) killed the console error too. The earlier "unverified" caveat is retired.
- **pinned-transform — stays a workaround; `Reveal` ruled OUT.** The symptom is real and already worked around (`app/page.module.css:73-76`: `.hm-progfill` snaps per step, no transition). Root cause remains unpinned, but the named suspect `Reveal` is **contradicted by the evidence** — its own `transition: transform` (`globals.css:529-534`) animates fine, so no global rule is universally killing transform transitions, and no universal `transition`/`transform` rule exists in `globals.css`. **Keep the snap; do not schedule a fix.**

**Stale entry corrected:** the previous Batch 0 said `app/delete-account/` was untracked / needed commit-or-delete. **That is wrong.** `git show f77a6638 --stat` confirms the page (`app/delete-account/page.tsx`, 251 lines) **is committed** on `feature/pricing-onetime`. The page is not the problem — the **API route** is (see Batch 4). Removed from here.

---

## BATCH 1 — Trust & copy ✅ SHIPPED (11 Aug · commit `ad69350d`, on `main`)

Every claim the product made that wasn't true, closed.

1. ✅ **"IQ Score" mislabel** — hand-set `expert_rating` renamed to **"Our rating" /10** across `/card/[slug]`, `/best-cards`, `/banks/[bank]`, `/bank/[slug]`, `/smart-match`. `CardTile` gained `scoreLabel`/`scoreMax` props whose defaults keep the real computed `iq_score` as "IQ Score" /100 on `/cards` untouched. False "ranked by effective reward rate" copy dropped; `/disclosures#rating` rewritten (six factors kept as considerations, "proprietary rating" removed) and anchored. **"IQ Score" name reserved for the future computed metric.**
2. ✅ **Sweet Spots disclaimer** — scraped creator claims labelled not independently verified by CreditIQ.
3. ✅ **emrldco removed** — the undisclosed Travelpayouts link-hijacker deleted from the root layout; the two false "no affiliate links / no issuer money" marketing lines corrected to the true "no affiliate bias". Killed the `config is not valid` error (same defect). The disclosed affiliate links that remain (EarnKaro `getApplyUrl`, hand-placed `tp.media` in `FlightSearch.tsx`, bank IDs) are legitimate per `/disclosures` and stay.
4. ⏭ **Prompt-injection hardening** (rag.ts `getIgInsights`) — **deferred, not shipped**: it's logic, not copy. Its own reviewed step, next after this board update.
+ ✅ **CardIQ → CreditIQ** wordmark fixed where it renders: `/card/[slug]` metadata, the footer wordmark (`Footer.tsx`), and `/bank/[slug]` metadata + stat label (strings only; that page's dark layout is deferred to Batch 3).

---

## BATCH 2 — Small independent bugs (one or two sessions)

Unrelated to each other and to the page pass. All self-contained.

5. **Nav auth resolution.** Signed-in users hit the signed-out marketing bar on ungated shell routes (`/transfer-partners`, `/sweet-spots`) because `NavShell` renders `<Header/>` while `user === undefined`. Render **neither** bar during the loading window — a neutral placeholder, then the correct one. Do not gate those routes; they're deliberately public.
6. **Wallet count-up stall.** `/dashboard` shows 3,68,844 against a true 8,76,499 when the animation stalls, directly under "We don't guess your money". Fix template exists — final value as the rendered default, count-up as progressive enhancement.
7. **Prefetch test.** `SectionTabs.test.tsx` mocks `next/link` as a plain `<a>`, so the suite can't prove prefetch and emits a React warning. Fix the mock or test a real Link.
8. **`/landing` → `/` 301.** Two front doors still exist; the merge shipped but the redirect never did.
9. **Retire `/optimize`** (verified 11 Aug — see Batch 0):
   - `/points-optimizer` **does not** read `?points=`/`?bank=`, so this is a plain retirement, not a param-preserving alias.
   - Repoint the devaluation-alert email CTA (`app/api/alerts/send/route.ts:85`) → `/points-optimizer`. The CTA is generic ("Optimize My Points Now", no params), so **no email copy change is needed and no 404** — the earlier "every alert email 404s" caveat was wrong.
   - 301 `/optimize` → `/points-optimizer`, then delete `app/(shell)/optimize/page.tsx` + `app/api/optimize/route.ts`.
10. **`reassertTheme` removal.** `useEffect(() => { reassertTheme() }, [])` plus the inline pre-paint — the pre-paint stays; the redundant effect was never removed.
11. **Icon vocabulary.** `SECTION_TABS` still runs its own path-icon factory while the nav is on lucide. One vocabulary.
12. **`/login` background video on phones.** `/login` downloads a full mobile background *video* (`auth-bg-mobile.webm` 573 KB / `.mp4` 638 KB) where the 55 KB poster would do — heavier than the 433 KB hero clip already ruled out for mobile. Drop the `<768px` branch to poster-only (the `HeroWindow` matchMedia pattern), retire `auth-bg-mobile.*`. ≈ **>500 KB** saved on the sign-in path.
13. **Reveal / count-up polish.** The IntersectionObserver-driven reveal + count-up animation. *(Verified 11 Aug: `Reveal` is **ruled out** as the pinned-transform cause — its own transform transition animates fine. Polish the animation only; the pinned-transform workaround is unrelated and stays.)*
14. **Dead-file deletion.** Sweep and remove confirmed-dead files as their owners retire: `auth-bg-mobile.*` (after #12), the legacy `creditiq-gold.html` reference, and the untracked `public/images/auth-bg.jpg` decision (commit with the auth surface it belongs to, or delete). Scoped `git add` only.

**Font debt** (independent of the page pass, but two halves — schedule the loadable half here, defer the risky half):
15. **Loadable now:** body renders **Geist**, not the spec's Inter. **The real mechanism is `globals.css:916`** — a universal `*, *::before, *::after { font-family: var(--font-geist-sans) … !important }` rule that forces Geist on everything (verified 11 Aug). `app/layout.tsx`'s `<body>` also sets `--font-geist-sans`, and `--font-inter` is never loaded by `next/font`. **Wiring `--font-body` to Inter does nothing until that `!important` universal rule is removed or scoped** — that's the first move, not a token edit. The general `--font-mono` is still Geist Mono, not JetBrains. Fraunces-300 axis is already added (`globals.css:5`).
    - **Deferred — NOT a global flip:** the display face (Syne-token → Fraunces 300) changes under hundreds of inline-sized headings with no shared size scale — unbounded blast radius. It is introduced **greenfield on Home first**, then propagated **per surface** inside Batch 3, never as one `--font-display` swap.

---

## BATCH 3 — The page-by-page pass (multiple sessions, ONE pass)

**This is the merged batch.** Every signed-in surface + `/card/[slug]` + the marketing-hero pages, each visited **once**. The old Cards-conversion, gold-four and hardcoded-hex batches are dissolved into this.

### Per-page checklist (every page gets all of this on its single visit)

- **Layout →** move header/eyebrow/SectionTabs/container up into the shared route-group layout; page becomes panel-only. Remove `.page-fade` (arrival animation on a page you didn't arrive at). Panel-only cross-fade, 120–160ms opacity. **Opacity and colour only — never animate `width`/`height`/`transform`** (that class of change failed twice here; see Batch 0 unverified pinned-transform).
- **Hex → token.** Convert every raw hex in `style={{…}}` to `--bg`/`--ink`/`--copper`/… A page is only "white/copper" where it reads the tokens.
- **Ground fix.** `spend-optimizer` and `points-optimizer` hardcode a `#f1f5f9` **slate** ground and never went white at all. `travel` (`#F5EFE6` ×3), `lounge-tracker` (`#EFE7D8` ×4), `card-roast`/`compare` (`#FAF5EB`) hardcode the **old cream** ground as element backgrounds — cream islands the token flip stranded. Fix on the visit.
- **Radius unify.** Cards appear at 12/14/16/20/22/24px. Route every card onto one `--r-*` token (value is a design decision, pick per surface).
- **Kill the copy/style defects** on the pages that carry them (see Cards group).
- **Verify:** rendered-DOM measurement at 375px and desktop, **both themes**. Tab through every section — strip Y must not move.

### Step 0 of this batch — build the shared group layouts FIRST

`app/(shell)/(travel)/layout.tsx`, `(spend)`, `(cards)`, `(wallet)`, `(you)` — header + `SectionTabs` + container live in the layout; siblings swap the panel only. This is non-negotiably first: converting any page before its group layout exists means converting it twice. Prefetch siblings so the panel is warm before the tap. Fixes the misaligned edges, the jumping strip and the switch flash in one structural change (one container wraps header **and** `{children}`; strip isn't re-rendered → 0px variance by construction).

### The walk (grouped by route-group — hex counts from the audit)

| Group | Pages (visit once each) | Notable on-visit work |
|---|---|---|
| **Cards** | `/cards`, `/compare` (10), `/card-switch` (13), `/card-roast` (10) | **Kill 3 italics** + **CardIQ→CreditIQ footer wordmark** + replace gold "Find my perfect card" pill with standard primary. Cream `#FAF5EB` islands. |
| **Spend** | `/spend-optimizer` (16), `/points-optimizer` (47) | **Slate `#f1f5f9` ground → white**; navy `#1B3A5C` hero retune. Highest hex count in the app. |
| **Travel** | `/travel` (6), `/lounge-tracker` (6), `/trip-planner` (~40) | Cream islands (`#F5EFE6`, `#EFE7D8`). `/trip-planner`'s *content* simplification is Batch 6 — this visit only tokenises/grounds it. |
| **standalone** | `/statement-truth` (16), `/transfer-partners` (7) | tokens + ground. |
| **Card detail** | `/card/[slug]` | Tokenise + **fix the diverged face-ink**: `CreditCard3D` uses YIQ luma + `>0.6` threshold; the `110fc889` WCAG-linear `0.1791` fix landed on `CardMockup` only, so `/card/[slug]` can pick the wrong ink. Route both faces onto one shared `faceInk`. |
| **Marketing hero** | `/banks/[bank]`, `/bank/[slug]`, `/best-cards/[category]`, glossary | Same layout + hex work. ⚠ These are **public crawlable acquisition pages** — H1 survives so SEO impact is small, but decide the hero→panel change deliberately. *(`optimize` is retired in Batch 2, not converted — confirm in Batch 0.)* |

### The gold four (their visit = the `[data-ciq]` migration + wallet CRUD)

`/my-cards`, `/feed`, `/profile`, `/pro`, plus onboarding and `Tour.tsx`. **One branch, not four** — the `ciq-theme` dual-write only stops when the last surface migrates. Landing these:
- deletes `[data-ciq]`, the `ciq-theme` key, the Instrument Serif / Space Grotesk declarations, and `CiqTheme`/`ThemeProvider.tsx`;
- **kills the gold dark-flash for free** — the flash is `ThemeProvider` defaulting to `dark` with no pre-paint; when the wrapper dies these surfaces inherit the single `<html>` pre-paint. (Deliberately *not* patched separately — don't harden a system you're deleting.)
- `LinkWhatsAppButton` white-on-white is already fixed; no action.

**Wallet CRUD — builds on the `/my-cards` visit, not separately:**
- **Edit points anytime** — inline pill + pencil, save in place, no modal. Editing a **verified** balance downgrades it to self-reported (or is blocked) — decide, because silently overwriting a verified number breaks "We don't guess your money".
- **Per-card delete** — check-circle selection, "N Selected" chip, "Delete Selected" button. Single **undo toast**, not a confirm dialog.
- **Downstream recompute** — editing/deleting must invalidate the dashboard gauge, the trip-planner auto-loaded balance and the redemption spread. No stale total on screen.

### Theme pass riders (land inside the gold-four branch)

- **Teal rail**, behind a flag. Dark-teal signed-in rail, white/cream content, copper accent. Two forced follow-ons: the **active-state contrast must be re-measured for dark** (copper drops toward a teal ground), and the **navy logo tile goes dark-on-dark**. No worked reference (realise.club's rail is white) — look at it on a phone before merge.
- **Scroll-progress ring**, desktop only. Stroke fills with scroll, arrow jumps to top. Stacks above the CIRA FAB, opacity-only fade, reduced-motion → instant jump.

### Traps (all previously logged)

Shared components (`CardRow`, `HeroGauge`, `EstimateRange`, `Tour`, `CardMockup`) default `variant='gold'` — flipping defaults touches every consumer. `globals.css:231` points every heading at `--ink`, which breaks in **partial** states; a dark panel maps to `--navy`, never `--ink`. The injected-`<style>` → CSS-module conversion (19 files, `HARDCODED-PALETTE-AUDIT.md`) rides along per file as each page is visited — not a global codemod.

*If you want wallet CRUD before its group's turn, it can be pulled onto the current gold `/my-cards` standalone — slight duplicate effort, but it's the feature you keep asking for.*

---

## BATCH 4 — Compliance (its own batch)

16. **Delete-account — API-first.** State corrected from the old board:
    - **Page:** committed on `feature/pricing-onetime` (`f77a6638`, `app/delete-account/page.tsx`). Exists. Not the problem.
    - **API:** on `fix/account-deletion-complete` (`0c5e02ba`), **not merged, ~155 behind main**; prod `GET /delete-account` → **404**.
    - **Order (from `DELETE-ACCOUNT-VERIFICATION.md`):** get the Play Console declaration answer first (sets urgency) → cherry-pick `0c5e02ba` → run the reconciled-list query → close any gap in `route.ts`'s `USER_KEYED` → merge → run the burner-account harness (must report a *true* success) → **then** wire the page + link. API before anything user-facing.
17. **Receipts & Reviews.** Both **confirmed invented** and deliberately absent from the new homepage. Decision, not a build: Receipts *could* run off the two countable cells (cards tracked, banks) from the card table; Reviews needs real consented users. Don't ship either as invented content.

---

## BATCH 5 — Payments (two sessions, already half-built)

18. Resume `feature/pricing-onetime` (`f77a6638`). Apply migration `005_pro_onetime_entitlement.sql` in `yazpphublutdodahfwvr`, confirm with the five SELECTs.
19. **STEP 3:** register CreditIQ's own webhook (`https://www.creditiq.app/api/razorpay/webhook`), subscribe `payment.captured` + `payment.failed`, fresh secret, `RAZORPAY_MODE=orders`. AskGogo's STEP 1 guard is deployed.
20. Prove it with a real ₹149 order and `pro_until` visible in the DB. Then drop the `RAZORPAY_MODE` gate and deactivate the three CreditIQ Razorpay plans.
21. **First-run pricing modal** — not designed. Four cards, "Continue free" vs "Get this plan", Free first on mobile, escape applies Free and stamps `plan_chosen_at`. Build only after prices are real.
22. **The meter.** Free 5+5 is unenforceable today; then the cap paywall.

---

## BATCH 6 — Travel simplification (spec first, then one session)

23. `/trip-planner` asks for a free-text trip, a points balance, a bank, an origin, six quick-idea chips and an inspiration grid — before any result exists.
    - **Walk the flow yourself first**, flight then hotel, send screenshots. Spec follows from that. Do it *after* Batch 3's group layouts — they change what the page owns.
    - ⚠ **Settle scope:** the repo has search + pricing (`flights/fusion`, `trip-planner/live-price`, Seats.aero), nothing that books, no hotel path. Booking *through* CreditIQ is an OTA (payment rails, inventory, cancellation liability, agency licensing). Handing off to the airline is what exists and is simplifiable this week. Which do you mean?

---

## BATCH 7 — Catalogue programme + data integrity (background, weeks)

Runs alongside everything above; touches data/lib files nothing else here touches.

**Can finish (~one session + data work):**
24. Canonical name-key → **freeze the count**. Collapse duplicate rows, backfill slugs on the slugless cards. (Depends on Batch 0's count answer.)
25. Build the `{ value, unit, state, source, asOf }` verification schema.
26. **Fix the earn-rate unit defect** — `rag.ts:16` hardcodes a percentage, `engine.ts:184` divides by 100, `rewards-calculator:12` compounds it, `iq_score` is tainted. Unit becomes mandatory on every numeric reward/fee field.
27. **Apply §11:** suppress the numeric IQ score and rank position on every card whose earn rate isn't re-sourced. Suppressed, not "marked estimated".
    - **Carry-over from the rag.ts rule 7 fix:** rag.ts rule 7 tier (a) calls all database card facts "CreditIQ's own verified data". Once the per-field verification state exists, tier (a) must split into verified vs ours-but-unverified — earn rates in particular are unit-ambiguous (§10) and their derived rankings are suppressed (§11).

**Data integrity (folded in):**
28. **`NEW_CARDS` collisions.** The 82-entry `NEW_CARDS` block is declared and **never spread into `SEED_CARDS`** — users have never seen its values. **12 live ids also appear** in the dead block. Triage per `SEED-CARDS-INTEGRITY.md` §7 / [issue #5](https://github.com/askgogo84/creditIQ/issues/5); add a lint guard that flags a live id re-declared in `NEW_CARDS`. **Do NOT blind-promote `NEW_CARDS`** — its values are unverified (for 6/12 the live copy is the better one).
29. **WhatsApp verified/estimate honesty leak.** The structured handlers respect the verified/estimated distinction; the **LLM fallback paths do not**, and have already treated a self-reported balance as spendable fact (`00-SIGNED-IN-IA.md` §174). **Fix before driving users into WhatsApp at scale** — promoting the channel without it scales an honesty leak, and the honesty is the moat.

**Continues indefinitely:**
30. Re-source earn rates, most-searched first (Amazon Pay ICICI, Scapia, OneCard, IndiGo 6E, MakeMyTrip ICICI).
31. Lifecycle the ~12–15 likely-discontinued (Vistara co-brands, Citi, Amex Gold, HDFC Diners Miles / Platinum Times, ICICI 1mg / Cleartrip, Kotak Essentia).
32. Ingest the tail at identity tier — PSU first: BOBCARD +22, PNB +16, Canara +14, Union +10.

---

## Suggested order

```
Today      Batch 0   verify Phase 2, count, /optimize; pin the 2 unverified bugs   ~45 min
Session 1  Batch 1   trust & copy — every false claim closed
Session 2  Batch 2   small independent bugs + loadable font debt
Session 3  Batch 3   Step 0: build the shared group layouts        (unblocks the pass)
Sessions   Batch 3   the walk — Cards → Spend → Travel → card/[slug] → marketing
           Batch 3   gold four (+ [data-ciq] deletion + wallet CRUD + teal rail + ring)
Session N  Batch 4   compliance — delete-account API-first, Receipts/Reviews decision
Session N  Batch 5   payments: migration + STEP 3 + real ₹149 order, then modal + meter
Session N  Batch 6   travel simplification, after you've walked the flow
Background Batch 7   catalogue + NEW_CARDS + WhatsApp leak — starts now, finishes later
```

Batch 3's Step 0 (group layouts) is the single hard prerequisite: convert any page before its layout exists and you convert it twice — the exact mistake this reconciliation removes. Batch 7 items 24–29 can start in parallel at any point.

## Rules that apply throughout

1. One batch per session, deployed before the next starts (Batch 3's walk is per-group).
2. `tsc --noEmit` must return **zero output** — the "5 known errors" rule is stale for this repo.
3. Full suite green after each commit.
4. Migration-first, confirm with a SELECT — never trust "applied".
5. Judge type and layout on a **Vercel preview**, never localhost (dev renders in a Times fallback).
6. Every visual check is a rendered-DOM measurement in **both themes**, or it didn't happen.
7. Check the Supabase ref before every Run: `yazpphublutdodahfwvr` is CreditIQ, `qenhjcooyecmatwducpu` is the bot.
8. Scoped `git add` always — never `git add .`.
