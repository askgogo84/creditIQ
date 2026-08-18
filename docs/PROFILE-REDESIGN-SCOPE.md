# /profile Redesign — Scope (sign-off before build)

**Status:** scoped, awaiting sign-off. No code written yet.
**Goal:** rebuild `/profile` on the white/copper light system (retire its gold `[data-ciq]`), in the realise.club layout, surfacing **real** membership + transaction data and an honest Personal Details form. Nothing invented; every field maps to a column the product already uses.

/ profile is one of the "gold four" (`/profile`, `/pro`, `/my-cards`, `/feed`) still on the retired `[data-ciq]` system — this pass migrates `/profile` only.

---

## 1. Layout (realise.club)

**Desktop — two columns:**
- **Left:** Avatar card (initials · name · email · Member Since · Account Status) → Membership card (plan + "active until \<date>" + "Get a membership" button)
- **Right:** Personal Details (with Edit control) → Transactions

**Appended full-width below the four core sections** (they have no other home in the app, so they stay):
- Referral / Join-code card (Consumer↔Business bridge — real revenue path)
- WhatsApp linking (entry to AskGogo)
- Sign out

**Mobile 375px — single column:** avatar → membership → personal details → transactions → referral → whatsapp → sign out.

---

## 2. Sections & data wiring (all real sources)

| Section | Field | Source | Editable |
|---|---|---|---|
| Avatar | initials / name | `auth.user_metadata.full_name` ‖ email local-part | via Personal Details |
| Avatar | email | `auth` | no |
| Avatar | Member Since | `auth user.created_at` → "MMM YYYY" | no |
| Avatar | Account Status | `getProStatus()` → "Pro" / "Free" (honest, no fake badge) | no |
| Membership | plan + "active until \<DD Mon YYYY>" | `lib/pro.ts getProStatus()` → `pro_until` | — |
| Membership | non-Pro state | "No active membership" + **[Get a membership]** → paywall modal | — |
| Personal Details | Name | `user_profiles.display_name` ‖ auth | yes |
| Personal Details | Email | `auth` | no (read-only) |
| Personal Details | Home city | `GET/POST /api/user-city` (`home_city` + derived `home_city_iata`) | yes |
| Personal Details | Home airport | `user_profiles.home_airport` | yes |
| Transactions | receipts | **new** `GET /api/user/order-history` ← `pro_order_events` | — |
| Transactions | empty state | "No transactions yet. When you buy or renew a plan, your receipts will show up here." | — |

**No** search/usage counter (the meter does not exist). **No** DOB, income, or consultations (never existed on /profile; not added).

---

## 3. Backend

**A. `GET /api/user/order-history` (new).** Bearer auth via `requireAuth`; `user_id` from the token, never the body (IDOR-safe, same pattern as `/api/user-city`). Service-role read (table RLS is service-role only): `pro_order_events WHERE user_id = $token ORDER BY created_at DESC`. Returns `[{ id, plan, amount_paise, applied_pro_until, created_at }]`. UI formats: date, plan label (`lib/plans.ts`), `amount_paise/100` → ₹, expiry.

**B. `PATCH /api/profile` (new) — partial update.** Bearer auth; `user_id` from token. Accepts any subset of `{ displayName, homeAirport }` and updates **only the provided columns** on `user_profiles`. Critically, it does **not** touch `date_of_birth` — this is the fix for the clobbering risk (option a, per your call; we do **not** round-trip values through `/api/onboarding`).

**C. Home city edit** reuses the existing `POST /api/user-city` (already partial-safe: it upserts only `home_city`, `home_city_iata`, `updated_at` — does not null DOB).

No change to `lib/pro.ts`, `lib/plans.ts`, `lib/checkout.ts`, or the webhook.

---

## 4. "Get a membership" paywall modal

- **Reuse the `FirstRunModal` pricing grid** (do not duplicate it), rendered **paid-only**: the three plans from `lib/plans.ts` (₹149 / ₹499 / ₹999), **Free card removed**.
- Make it **openable on demand** from the Membership card (today it only auto-shows once, gated by `/api/first-run`). Implementation: add an on-demand + `hideFree` mode to the shared grid; checkout via `lib/checkout.ts`.
- **Retest the first-run path** after the refactor (it shares the component).

---

## 5. Gold → white/copper migration (follow the WalletView pattern)

- Remove the `<CiqTheme>` / `data-ciq` wrapper on `/profile`.
- Token swaps: `--ciq-panel/-2` → `--surface/--surface-2`; `--ciq-ink/-2/-3` → `--ink/-2/-3`; `--ciq-gold/-2` → `--copper` (accent only, sparingly); `--ciq-line-2` → `--line`; `--ciq-verified` → `--prov-verified`.
- `SectionTabs tone="gold"` → `tone="light"` (or drop if /profile needs no tabs).
- Font classes `.ciq-display/.ciq-mono` → `.w-display` etc.
- Migrate `LinkWhatsAppButton.tsx` tokens too (it uses gold).

---

## 6. Files

- `app/(shell)/profile/page.tsx` — rebuild + migrate
- `app/(shell)/profile/LinkWhatsAppButton.tsx` — token migration
- `components/ciq/FirstRunModal.tsx` — paid-only + on-demand mode (shared grid)
- **new** `app/api/user/order-history/route.ts` (+ test)
- **new** `app/api/profile/route.ts` — partial update: `display_name`, `home_airport` (+ test)
- reuse: `app/api/user-city/route.ts`, `lib/pro.ts`, `lib/plans.ts`, `lib/checkout.ts` (no change)

## 7. Build order

1. Backend routes (order-history + profile partial-update) with IDOR-safe auth + tests.
2. Paid-only on-demand paywall modal.
3. `/profile` rebuild in white/copper, seven sections wired to real data.
4. Mobile 375px pass · `tsc` 0 errors · preview walk (membership states, edit save, transactions empty + populated, undo none here).

## 8. Out of scope (this pass)

- Onboarding wizard changes (including DOB — see below; report-only for now).
- The other three gold pages (`/pro`, `/my-cards`, `/feed`).
- Any profile field beyond the four honest ones.

---

## Appendix — DPDP finding: `date_of_birth` is write-only (report-only, no change yet)

Full trace of `date_of_birth` across the repo:
- **Collected:** onboarding wizard — `app/onboarding/page.tsx` (`dob` input L162, sent in POST L100).
- **Stored:** `user_profiles.date_of_birth` (nullable; migration 002).
- **Read back:** only `GET /api/onboarding` returns it in the profile object — but **both callers use only `onboarding_complete`**: `app/(shell)/(wallet)/dashboard/page.tsx:160` (bounce-to-onboarding check) and `app/onboarding/page.tsx:48` (redirect completed users). Neither reads `date_of_birth`.
- **Feature consumers:** none. Card "eligibility"/"age band" hits are about card criteria (credit score / income / employment), not the user's DOB. The HDFC statement-password "DOB DDMM" text is a **user-facing hint** about their own PDF password format — it does not read the stored value.

**Conclusion:** `date_of_birth` is collected and stored but **never consumed by any feature**. Under DPDP purpose limitation, collecting personal data needs a stated purpose; there is none here. **Recommendation:** stop collecting it in the onboarding wizard (and consider dropping the column) rather than keep a field alive only because a clobbering bug preserved it. Per your instruction, **onboarding is not changed in this pass** — flagged for a decision.
