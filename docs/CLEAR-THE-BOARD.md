# CreditIQ — Clear the Board
**11 Aug 2026 · every pending item, batched by what it touches**

Supersedes the pending sections of `STATUS-10-AUG.md`. Companion docs: `UIUX-CONSISTENCY-PLAN.md`, `PRICING-ONETIME-IMPLEMENTATION-PLAN.md`, `catalogue-inclusion-and-verification-spec.md`.

---

## The honest framing first

Twenty-odd items, but they are not twenty-odd equal jobs. Three of them are **programmes** measured in weeks and partly manual (re-sourcing earn rates, verifying 73 cards, ingesting 200+ more). The rest is roughly **five working sessions**.

So "finish everything" splits into two different things:

- **Make it true and finished** — every bug closed, every surface consistent, every claim honest. Achievable, ~5 sessions.
- **Make the catalogue complete** — 148 → ~350 cards, all verified. A continuing programme, not a task with an end date.

This plan closes the first completely and sets the second running in the background.

---

## Batching principle

Items are grouped by **what files they touch**, not by priority. Two bugs in the same component are one job; two "urgent" items in different repos are two. Every batch below is one focused session ending in a deploy.

---

## BATCH 0 — Confirm before planning around it (15 min)

- **Did Phase 2 actually land?** You said done; what came back was the plan. Check `/cards` on production for: the three italics ("ranked *honestly*", "Pick cards to *compare*", footer "*The honest one*"), the **CardIQ** wordmark in the footer, the gold gradient button, and ~400px of empty space above the fold at 375px. If they're still there, Phase 2 is Batch 3.
- **`git status` in creditIQ** — `app/delete-account/` and `public/images/auth-bg.jpg` are still untracked. Commit or delete them; an entire route existing only on your machine is not a state to leave.

---

## BATCH 1 — Trust & copy (one session, no logic)

Everything here is a claim the product makes that isn't currently true. All copy and labels, no behaviour, so it ships fast and low-risk.

1. **The "IQ Score" mislabel.** `/best-cards/[category]`, `/banks/[bank]`, `/bank/[slug]`, `/card/[slug]` print `expert_rating` — a hand-set editorial number — labelled "IQ Score", under copy saying the list is ranked by effective reward rate. Rename the editorial score, drop the false methodology claim, and unify the scale (`/best-cards` says /100, `/card/[slug]` says /10, same field).
2. **Sweet Spots disclaimer.** That page republishes scraped creator claims in CreditIQ's voice. One line: these are creator claims CreditIQ hasn't verified.
3. **`emrldco.com`.** `app/layout.tsx:50-53`, an affiliate link-switcher on every page, undisclosed, contradicting the homepage's zero-affiliate-bias claim and the source of the "config is not valid" console error. `git log -S emrldco -- app/layout.tsx` for the history, then decide: disclose it or remove it.
4. **Prompt-injection hardening.** Delimit the scraped `getIgInsights` block in `rag.ts` and label it untrusted data, never instructions.

---

## BATCH 2 — Small independent bugs (one session)

Unrelated to each other, all small, all self-contained.

5. **Nav auth resolution.** Signed-in users land on the signed-out marketing bar on ungated shell routes (`/transfer-partners`, `/sweet-spots`) because `NavShell` renders `<Header/>` while `user === undefined`. Fix: render neither bar during the loading window — a neutral placeholder, then the correct one. Do not gate those routes; they're deliberately public.
6. **Wallet count-up.** `/dashboard` shows 3,68,844 against a true 8,76,499 when the animation stalls, directly under "We don't guess your money". The fix template already exists — LeakMeter: final value as the rendered default, count-up as progressive enhancement.
7. **Prefetch is unverified.** `SectionTabs.test.tsx` mocks `next/link` as a plain `<a>`, so the suite can't prove prefetch works and emits a React warning. Fix the mock or test against a real Link.

---

## BATCH 3 — Cards conversion (one session, if Batch 0 says it's needed)

8. Convert `/cards`, `/compare`, `/card-switch`, `/card-roast` to the shipped route-group pattern. Kills the three italics, the CardIQ wordmark, the gold button and the mobile whitespace as a side effect.
   - ⚠ **Answer first:** these are public crawlable acquisition pages, unlike the app-only Spend/Travel surfaces. Converting the marketing hero to an app panel changes what a signed-out visitor meets on the catalogue's front door. H1 text survives, so SEO impact should be small — but decide deliberately.
   - **Do not touch count copy.** The number is still moving.

---

## BATCH 4 — The Phase 3 cluster (two sessions)

All four items touch the same pages, so they land together or they get built twice.

9. **Gold four:** `/my-cards`, `/feed`, `/profile`, `/pro`, plus onboarding and `Tour.tsx`. Unblocks deleting `[data-ciq]`, the `ciq-theme` key, and the Instrument Serif / Space Grotesk declarations.
10. **Teal rail.** Dark teal signed-in rail, white/cream content, copper accent. Build behind a flag; the copper active state needs a contrast retune on dark and the navy logo tile goes dark-on-dark.
11. **Wallet CRUD.** Edit points at any time (unlimited, including on verified balances — a hand-edited number simply takes the self-entered tick), and per-card delete with an undo toast. Editing or deleting must invalidate the dashboard gauge, the trip planner's auto-loaded balance and the redemption spread.
12. **Scroll-progress ring.** Desktop only, one control: stroke fills with scroll, arrow jumps to top. Stack above the CIRA chat FAB, opacity-only fade, reduced-motion gets an instant jump.

*If you want wallet CRUD sooner, it can be pulled out and built standalone on the current gold `/my-cards` — slightly duplicated effort, but it's the feature you keep asking about.*

---

## BATCH 5 — Payments (two sessions, already half-built)

13. Resume `feature/pricing-onetime` (`f77a6638`). Apply migration `005_pro_onetime_entitlement.sql` in `yazpphublutdodahfwvr` and confirm with the five SELECTs.
14. **STEP 3:** register CreditIQ's own webhook (`https://www.creditiq.app/api/razorpay/webhook`), subscribe `payment.captured` and `payment.failed`, fresh secret, set `RAZORPAY_MODE=orders`. AskGogo's STEP 1 guard is already deployed.
15. Prove it with a real ₹149 order and `pro_until` visible in the database. Then remove the `RAZORPAY_MODE` gate and deactivate the three CreditIQ Razorpay plans.
16. **First-run pricing modal** — not designed yet. Four cards, "Continue free" vs "Get this plan", Free first on mobile, escape applies Free and stamps `plan_chosen_at`. Build only after prices are real.
17. **The meter.** Free 5+5 is unenforceable today. Then the cap paywall.

---

## BATCH 6 — Travel simplification (spec first, then one session)

18. `/trip-planner` currently asks for a free-text trip, a points balance, a bank, an origin, six quick-idea chips and an inspiration grid — before any result exists.
    - **Walk the flow yourself first**, flight then hotel, and send screenshots. Spec follows from that, not from guesswork.
    - ⚠ **Scope question to settle:** I've only seen search and pricing in the repo (`flights/fusion`, `trip-planner/live-price`, Seats.aero), nothing that books, and no hotel path at all. Booking *through* CreditIQ is an OTA — payment rails, inventory, cancellation liability, travel-agency licensing. Handing off to the airline is what exists today and is simplifiable this week. Which do you mean?

---

## BATCH 7 — The catalogue programme (background, weeks)

Runs alongside everything above. Split into what can finish and what continues.

**Can finish (~one session + data work):**
19. Canonical name-key → **freeze the count** (~140 tracked / ~125 active). Collapse the 25 duplicate rows, backfill slugs on the 32 slugless cards.
20. Build the `{ value, unit, state, source, asOf }` verification schema.
21. **Fix the earn-rate unit defect** — `rag.ts:16` hardcodes a percentage, `engine.ts:184` divides by 100, `rewards-calculator:12` compounds it, `iq_score` is tainted. Unit becomes mandatory on every numeric reward and fee field.
22. **Apply §11:** suppress the numeric IQ score and rank position on every card whose earn rate isn't re-sourced. Not "marked estimated" — suppressed.

**Continues indefinitely:**
23. Re-source earn rates, most-searched cards first (Amazon Pay ICICI, Scapia, OneCard, IndiGo 6E, MakeMyTrip ICICI).
24. Lifecycle the ~12–15 likely-discontinued (Vistara co-brands, Citi cards, Amex Gold, HDFC Diners Miles / Platinum Times, ICICI 1mg / Cleartrip, Kotak Essentia).
25. Ingest the tail at identity tier — PSU first: BOBCARD +22, PNB +16, Canara +14, Union +10.

---

## Suggested order

```
Today      Batch 0   confirm Phase 2 + commit delete-account        15 min
Session 1  Batch 1   trust & copy — every false claim closed
Session 2  Batch 2   three small bugs
Session 3  Batch 3   Cards conversion (if still needed)
Session 4  Batch 4a  gold four + teal rail
Session 5  Batch 4b  wallet CRUD + scroll ring
Session 6  Batch 5a  payments: migration + STEP 3 + real ₹149 order
Session 7  Batch 5b  first-run modal
Session 8  Batch 6   travel, after you've walked the flow
Background Batch 7   catalogue — starts now, finishes later
```

Batch 7's items 19–22 can start in parallel at any point; they touch data and lib files that nothing else in this plan touches.

## Rules that apply throughout

1. One batch per session, deployed before the next starts
2. `tsc --noEmit` must return **zero output** — the "5 known errors" rule is stale for this repo
3. Full suite green (89/89 and rising) after each commit
4. Migration-first, confirm with a SELECT — never trust "applied"
5. Judge type and layout on a Vercel preview, never localhost
6. Check the Supabase ref before every Run: `yazpphublutdodahfwvr` is CreditIQ, `qenhjcooyecmatwducpu` is the bot
