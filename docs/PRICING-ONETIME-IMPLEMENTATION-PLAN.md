# CreditIQ — One-Time Payments + First-Run Pricing Modal
**Implementation Plan · 9 Aug 2026**

Two decisions taken 9 Aug:
1. Paid plans are **one-time purchases for a period**, not subscriptions.
2. On first signup/sign-in a **pricing modal** appears with all four tiers including Free. Free is one tap. Escape applies Free.

The ladder is unchanged: **Free · ₹149 (1 month) · ₹499 (6 months) · ₹999 (12 months)**.

Build in the order below. Phase 1 changes how money moves and must land alone.

---

## Phase 0 — Verify before building (Gogo, ~5 minutes, Razorpay Dashboard)

Nothing in this plan is safe to build until these three are known. The repo cannot answer them: the code sends only a `plan_id`, never an amount.

| Check | Where | Why it blocks |
|---|---|---|
| Do the three Plan objects behind `RAZORPAY_PLAN_MONTHLY` / `_6MO` / `_12MO` cost ₹199 / ₹999 / ₹1499? | Dashboard → Subscriptions → Plans | Confirms what the live checkout actually charges |
| **Are there any active subscriptions?** | Dashboard → Subscriptions → filter Active | Auto-renew mandates keep debiting after the code stops calling the API. They must be cancelled by hand |
| Any completed payments to date? | Dashboard → Transactions | Determines whether this is a clean cutover or a migration with real customers |

If active subscriptions exist, **stop and cancel them before Phase 1 ships.** A customer charged under a model the site no longer sells is a complaint, and on a financial product in India that is the expensive kind.

---

## Phase 1 — Subscriptions → Orders

### What changes

Razorpay has two payment shapes. **Subscriptions** create a recurring mandate against a Plan object created in the Dashboard; the amount lives server-side at Razorpay and never appears in your code. **Orders** are a single charge with an explicit amount in paise. One-time means Orders.

### Files

- `app/api/razorpay/create-subscription/route.ts` → replaced by `app/api/razorpay/create-order/route.ts`
- `app/(shell)/pro/page.tsx:70` — the only caller in the app. Its `PLANS` object at line 12 becomes the single price source
- `lib/` — wherever `isProServer` reads entitlement
- Razorpay webhook handler — `subscription.charged` → `payment.captured`

### Price source of truth

Amounts move **into the repo**, in paise, one object:

```ts
export const PLANS = {
  monthly:     { amount:  14900, months:  1, label: '1 month'   },
  sixmonth:    { amount:  49900, months:  6, label: '6 months'  },
  twelvemonth: { amount:  99900, months: 12, label: '12 months' },
} as const
```

This is a real gain: the "what do we actually charge?" question becomes readable from the code, and `/plans`, `/pro` and the modal can all import one object instead of three surfaces disagreeing.

Keep server-side validation — the client sends a plan key, never an amount. Never trust an amount from the browser.

### Entitlement — the part that breaks quietly

`isPro` currently reads a subscriptions row that Razorpay expires on its own. One-time orders have no such row.

Add to the user record:

```
pro_until          timestamptz  null
pro_plan           text         null   -- monthly | sixmonth | twelvemonth
pro_last_order_id  text         null
```

`isProServer` becomes `pro_until > now()`. On `payment.captured`, set `pro_until = GREATEST(now(), coalesce(pro_until, now())) + interval '<months> months'` — so a renewal bought early **extends** rather than overwrites. That single expression is what makes "renew when you want" true rather than just copy.

**Migration-first, and confirm with a SELECT that returns the columns.**

### Copy that becomes true

`/plans`, `PricingTeaser` and the landing pricing block already say "Pay once. Not a subscription." After Phase 1 that is accurate. `/pro` must lose "auto-renews" everywhere.

### Reversibility

Gate the new path behind `RAZORPAY_MODE=orders`. Unset → old subscription route. Keep both live until a real ₹149 payment has been made and `pro_until` verified in the DB.

---

## Phase 2 — First-run pricing modal

### Trigger

After first successful signup/sign-in, before `/dashboard`. Requires new first-run state — paid users have an entitlement row, free users have nothing.

```
plan_chosen_at  timestamptz  null
```

Null → show the modal. Set → never again. Free is already the default entitlement, so this column only controls the modal, never access.

### Sequencing

The gate sits **in front of** the existing onboarding Tour, and the signed-in redirect to `/dashboard` has to route through it. Map that sequence before writing the component — signup → modal → Tour → dashboard. Two full-screen interruptions back to back is a lot; consider whether the Tour should be deferred to a later session.

### Behaviour

- Four cards: Free · ₹149 · ₹499 · ₹999
- Free's button reads **"Continue free"**; paid buttons read **"Get this plan"**. This asymmetry is what makes a forced choice read as expectation-setting rather than a paywall
- **Escape / back / refresh / outside-click all apply Free** and stamp `plan_chosen_at`. The stamp must be a server call on dismissal, not a client-side close — if the stamp doesn't land, the modal returns next sign-in, which is the trap this decision rules out
- No "are you sure?" on dismissal. No countdown. No pre-selected paid card

### Layout

- **Desktop:** 4 across, or 2×2. Not 3+1 — realise.club's fourth card orphans onto its own row and reads as a mistake
- **Mobile (375px):** Free **first**, "Continue free" reachable without scrolling; paid cards below. This **overrides** the earlier spec of "12-month BEST VALUE first, Free demoted to a footer row" — that ordering makes Free a scroll, which contradicts one-tap
- BEST VALUE badge on the 12-month. Sell it on capability (50 searches/day, all AI features, early access), **not** per-month price — ₹499/6mo and ₹999/12mo are within 8 paise/month of each other

### Undecided

- Coupon field: realise has one. Yes or no?
- Does the modal ever reappear for free users? Recommendation: no. The conversion moment is the paywall at the cap, which is a separate build.

---

## Phase 3 — The paywall at the cap (separate, later)

The higher-converting moment: the user has hit their daily allowance and now knows what a search is worth. Same cards, different headline ("Your free searches are used up"). Blocked on the meter, which is unbuilt — free 5+5 cannot be enforced today.

---

## Sequencing

```
Phase 0  Dashboard check                     Gogo, 5 min
Phase 1  Subscriptions → Orders + pro_until   alone, own branch
         └── verify with a real ₹149 payment
Phase 2  First-run modal                      after Phase 1 proves out
Phase 3  Meter, then cap paywall              later
```

Do not build Phase 2 first. The modal's cards render prices and durations that Phase 1 defines; building against a payment model you're about to replace means building it twice.

---

## Standing rules that apply here

1. Migration-first, confirm with a `SELECT` that returns the table
2. Reversible rollout — `RAZORPAY_MODE` env gate
3. Review the diff before deploy, especially the webhook
4. Test on a phone against a Vercel preview, never localhost (dev renders in a Times fallback)
5. One phase at a time
