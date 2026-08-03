# CreditIQ — Product

## The spine

CreditIQ is a **reward optimizer**: tell it a spend, it tells you a card. It beats a plain optimizer on two things a plain optimizer can't do:

1. **Verified numbers.** Upload a statement and an estimate becomes fact. Estimates never wear verified-green; they show as a labelled `≈ ₹low–₹high` range.
2. **It lives in your WhatsApp.** Ask it anything, from anywhere, no app open — live today, tested end to end.

Governing rule: **one number, one meaning.** If a figure appears on two surfaces, one of them is wrong. Nothing invented ships — every figure comes from `SEED_CARDS`, the engine, cached fares, or a verified statement.

Full IA and per-surface intent: `docs/00-SIGNED-IN-IA.md`.

---

## Surfaces

Six destinations are **specified** (IA §2). **Five are built and in the signed-in nav** (`components/ciq/appNav.tsx`): Wallet, Spend, Travel, Cards, You. The sixth, **Home, is specified but not yet built** (see below).

| Surface | Answers | Status | Route |
|---|---|---|---|
| **Home** | "What should I do next?" | **Specified, not yet built** | — (deferred) |
| **Wallet** | "What do I hold, and what's it worth?" | Built | `/dashboard` |
| **Spend** | "Which card for this purchase?" | Built | `/spend-optimizer` |
| **Travel** | "Where can my points take me?" | Built | `/trip-planner` |
| **Cards** | "What else is out there?" | Built (public, crawlable) | `/cards` |
| **You** | "My account, my WhatsApp, my plan" | Built | `/profile` |

Every former destination (~20 legacy links) folds into one of these as a tab, filter, mode, or entry card — nothing is orphaned. Folded routes still light their parent tab via the `match()` rules in `appNav.tsx`.

---

### Home — specified, not yet built

**Home is not shipped.** It is the IA's sixth destination and has **no surface yet** — there is deliberately no Home entry in `appNav.tsx` (adding one pointing at `/dashboard` would collide with Wallet on the shared `href` key and double-light). It will grow out of the current Wallet (`/dashboard`) and split off it when built.

Specified design (IA §4), for the future build — **not describing anything live**:

- **Band 1 — Greeting + wallet summary.** Total points across cards, rupee value as a labelled `≈ ₹low–₹high` range, verified/estimated split shown but never summed. Explicitly **no** fabricated "optimisation rate."
- **Band 2 — Saved Searches.** The section that earns Home its existence: each saved answer carries the searched query, winning card, points, value, and the **channel to transact through**. Revisiting a saved answer must not cost a search.
- **Band 3 — Tools + what changed.** Entry cards for Spend, Travel, and **CreditIQ on WhatsApp** (the hero of this band), plus the feed (devaluations, sweet spots filtered to the user's own transfer partners, fare movements).

Until Home ships, its bound routes `/feed` and `/intelligence` fold under **Wallet** (the `/dashboard` surface they'll grow from), per the `appNav.tsx` Wallet matcher. Move them to Home when it ships.

---

### Wallet — `/dashboard`

Deliberately sparse; owns holdings and nothing else. Each card shows bank, last 4, points balance, and a **Verified** or **Estimated** chip — never conflated. Add-a-card is a searchable catalogue (no card numbers, ever). Upload a statement → the card goes green. Best-move recommendations, tool cards, and trending carousels do **not** belong here — those are Home's.

In-page tabs: Your cards · Statement Truth (verification happens inside Wallet).

### Spend — `/spend-optimizer`

Category pills → optional merchant → amount → **Optimize** → ranked results, each row showing rupee value, sub-range, a **Not in wallet** chip where relevant, and the specific channel to transact through. Controls: **Only my cards**, **Save to Home**, thumbs-down. Signed in, the bank/card pickers disappear — the questions go away.

In-page tabs: Spend Optimizer · Points Optimizer.

### Travel — `/trip-planner`

From / to / date / cabin / range → progressive search that shows which programme is being queried and how far along it is. Results name the card that transfers to each programme beneath every row. With cards added, the count reads *"bookable with your cards."*

In-page tabs: Trip Planner · Ask AI · Sweet Spots · Transfer Partners · Lounges.

### Cards — `/cards`

The public, crawlable, SEO-bearing catalogue. Browse, filter by bank/category/market, compare, card detail. Best-of lists are filters, not pages. Signed in, the only change: **In your wallet** badges and *Add to wallet* elsewhere.

In-page tabs: All Cards · Compare · Switch Wizard · Card Roast.

### You — `/profile`

Profile, plan and remaining searches, statement-upload history, theme, sign out — and the **WhatsApp connect flow** (generate a 6-digit code, deep-link into the chat). This is also surfaced on Home; here is where it's managed and revoked.

In-page tabs: Profile · Plan & searches · WhatsApp.

---

## WhatsApp — the thing to lead with

The strongest differentiator, currently managed on the profile page. It answers questions about the cards you hold, using real balances, and **says so when a balance is self-reported rather than statement-verified**.

> **Blocking honesty issue (IA §5):** structured handlers respect the verified/estimated distinction; LLM fallback paths do not, and have treated a self-reported balance as spendable fact. Fix before driving users into WhatsApp at scale — the honesty is the moat.

---

## Constraints that bind every build

1. **Nothing invented ships.** If it can't be computed, drop the element, not the honesty.
2. **One number, one meaning.**
3. **Points first, rupees as a labelled range.** Estimates never wear verified-green.
4. **White / clean.** Gold `[data-ciq]` is retired.
5. **375px is primary.**
6. **Tours are additive** — no surface may depend on its tour to be understood.
7. **Cutting a destination from the nav requires building its in-page entry point in the same change** — a route resolving is not enough; a human must be able to *click* to it.
