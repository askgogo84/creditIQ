# CreditIQ — Status as of 10 Aug 2026

Companion docs in `docs/`: `UIUX-CONSISTENCY-PLAN.md`, `PRICING-ONETIME-IMPLEMENTATION-PLAN.md`, `catalogue-inclusion-and-verification-spec.md`.

---

## ✅ DONE

### Shipped code (branch `feat/gold-retirement`, merging now)
- **Spend + Travel route-group refactor** — `175d6a55`, `25186cce`. `SectionShell` + `PanelFade`; 7 pages moved into route groups, URLs unchanged. Header and body now share one container, so left edges can't disagree; the strip isn't re-rendered on tab change, so its Y is stable by construction; no flash; opacity-only 140ms fade with reduced-motion escape; prefetch on tab links; `/travel` chat fills remaining height (100dvh, not 100vh).
- **XSS fix** — `c9f78b6a`. `parseMarkdown` escapes `& < > "` before the markdown regexes, and `href` is allow-listed to http/https. Was pre-existing, not introduced by the refactor.
- **impeccable waiver** — `c725f5d4`. File-scoped `bounce-easing` ignore for the chat typing indicator; the value-scoped path is broken upstream (detector keeps the leading backtick on JSX template literals).

### Decisions locked
- **One-time payments**, not subscriptions. Free · ₹149 · ₹499 · ₹999.
- **First-run pricing modal** with Free included and one tap out; Escape applies Free.
- **Teal rail** — white/cream content, copper accent, dark teal signed-in rail.
- **Wallet CRUD** — unlimited edits including on verified balances; two badge states only (statement-uploaded = verified tick, everything hand-entered = self-entered).
- **Nav bars stay distinct** — marketing and app bars do different jobs.
- **Catalogue spec §1–§10 approved** — inclusion rule, white-label aliases, lifecycle, two data-depth tiers, per-field verification, canonical key, reversed ingest order.

### Known, diagnosed, not yet fixed
- Nav divergence root cause: two bars selected by auth state; ungated public routes don't pre-refresh the session.
- Card count: true distinct ≈140 (~125 active), not 49 and not 173.
- Earn-rate unit defect and its full propagation.

---

## ⛔ BLOCKING EVERYTHING ELSE

**1. Earn-rate unit defect (spec §10) — P0**
The earn-rate field has no unit. The same reward is stored once as `5` and once as `3.33`, and it is **not recoverable per row** — no migration fixes this, every rate must be re-sourced from the issuer. `rag.ts:16` hardcodes a percentage, `engine.ts:184` divides by 100, `rewards-calculator:12` compounds it, and `iq_score` is tainted. Spend Optimizer, Points Optimizer, Travel AI, Statement Truth and the assistant all consume it.

**2. §11 — the interim ranking policy. YOUR DECISION, still open.**
Because `iq_score` is tainted, the IQ scores and rank orderings live on `/cards` and `/best-cards` right now are computed from unit-ambiguous inputs, under a headline saying "ranked honestly." Options: suppress the ordering; mark it estimated (your own §8 argues this doesn't work for derived orderings); or re-source the top/searched cards first and suppress the rest. My recommendation is the third.

---

## 📋 PENDING — ordered

### Catalogue programme (after §10)
1. Canonical name-key → **freeze the count** (≈140 tracked / ≈125 active)
2. Build `{ value, unit, state, source, asOf }` verification schema
3. **Verify the ~73 we already hold** — Amazon Pay ICICI, Scapia, OneCard, IndiGo 6E, MakeMyTrip ICICI first
4. Resolve ~12–15 likely-discontinued into lifecycle (Vistara co-brands, Citi cards, Amex Gold, HDFC Diners Miles / Platinum Times, ICICI 1mg / Cleartrip, Kotak Essentia)
5. Collapse the 25 duplicate rows + backfill slugs on the 32 slugless cards
6. Then ingest the tail at identity tier — PSU first (BOBCARD +22, PNB +16, Canara +14, Union +10)
   *Universe ≈350–470; gap ≈220–330. Internal only, never public copy.*

### UI phases (can run in parallel — but no count copy until the number freezes)
7. **Phase 2 — Cards group conversion**: template, three italics ("ranked *honestly*", "Pick cards to *compare*", footer "*The honest one*" + "*unbiased*"), the **CardIQ wordmark** in the footer (product is CreditIQ), the gold gradient button, and ~400px of empty space above the fold at 375px
8. **Phase 3 — the gold four** (`/my-cards`, `/feed`, `/profile`, `/pro`) + onboarding + Tour, **teal rail**, **wallet CRUD**. Unblocks deleting `[data-ciq]`, `ciq-theme`, Instrument Serif / Space Grotesk
9. **Phase 4 — Travel page simplification** (spec first; it's "too confusing")
10. **Phase 5 — polish**: radius drift (12/14/16/20/22/24 → one scale), font debt (ships Geist, docs say Inter), `SECTION_TABS` icon factory vs lucide, the pinned-transform bug

### Open bugs
11. **Nav auth resolution** — signed-in users landing on the marketing bar on ungated routes
12. **Wallet count-up** — `/dashboard` shows 3,68,844 against a true 8,76,499 when the animation stalls, directly under "We don't guess your money". Fix template already exists (LeakMeter: final value as rendered default, count-up as enhancement)
13. **`emrldco.com`** — affiliate link-switcher in `app/layout.tsx:50-53` on every page, undisclosed, contradicts the homepage's zero-affiliate-bias claim. Source of the "config is not valid" console error. `git log -S emrldco -- app/layout.tsx`
14. **~44 slugless tiles on `/cards`** that can't route to `/card/[slug]`
15. **Prompt-injection hardening** — delimit and label `getIgInsights` as untrusted in the rag system prompt
16. **Sweet Spots disclaimer** — these are creator claims CreditIQ hasn't verified

### Pricing (after the UI phases)
17. **Razorpay Dashboard check — you, 5 minutes.** Not for prices any more; to find whether any **active auto-renew mandates** exist. They keep debiting after the code stops calling the Subscriptions API.
18. Phase 1 — Subscriptions → Orders, `pro_until`, `RAZORPAY_MODE` env gate
19. Phase 2 — first-run modal
20. The meter (free 5+5 is unenforceable today), then the cap paywall

---

## ❓ DECISIONS WAITING ON YOU
- **§11 ranking policy** during earn-rate re-sourcing (the big one)
- Coupon field on the pricing modal — yes or no
- Whether the pricing modal ever reappears for free users (my recommendation: no)
- Confirm scroll-reset behaviour once this is in production
