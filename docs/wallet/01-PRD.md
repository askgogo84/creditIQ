# Wallet — Product Requirements Document (PRD)

**Surface:** Wallet — the "what do I hold, and what's it worth?" destination inside the signed-in shell (`/dashboard`, route group `(shell)`).
**Version:** v1 (honest-data-only, holdings-only, white/copper).
**Traceability:** every figure below maps to `docs/dashboard-data-audit.md`. Nothing in this PRD requires data the audit marked NOT COMPUTABLE.
**Reads with:** `docs/00-SIGNED-IN-IA.md` §4 (Wallet). Where this PRD and the IA doc meet the data audit, the audit wins.

## 1. Problem & thesis
A signed-in CreditIQ user needs one truthful ledger: *"what cards do I hold, how many points are on them, and how much of that is real?"* The moat is honesty — **"We don't guess your money."** The wallet's only job is to be that ledger: the user's true points position, split into **verified** (from statements) vs **estimated** (typed in), plus the two actions that grow it — add a card, upload a statement. Everything that *interprets* those holdings (best move, editorial discovery, tools) lives on **Home**, not here.

## 2. What the wallet owns — and only this
Per IA §4, the wallet is **deliberately sparse. It owns holdings and nothing else.**

- Cards, each with bank, last 4, points balance, and a **Verified** or **Estimated** chip — never conflated.
- Total points across the wallet, provenance-split.
- Add a card (searchable catalogue, no card numbers ever).
- Upload a statement → the card goes verified.
- One line explaining what verified means.

**If a number appears on two surfaces, one of them is wrong** (IA §2). Wallet owns holdings. Home owns what changed and what to do next. Nothing here restates Home.

## 3. Goals (v1)
1. Show **total points across the wallet**, provenance-split verified vs estimated. *(Audit §1 — COMPUTABLE.)*
2. Show the **held-cards list** with a first-class **empty state** for new users. *(Audit §3 — COMPUTABLE.)*
3. Make the primary actions — **add a card** and **upload a statement** — unmissable, especially from the empty state.
4. Where a rupee value is shown at all, show it **only** as the shared `EstimateRange` (`≈ ₹low–₹high`, badged "estimate"). *(Audit §1 caveat.)*
5. Migrate the surface **off the retired gold `[data-ciq]` system to white/copper.** *(IA §8.4; CLAUDE.md, corrected 1 Aug 2026 — migration direction is toward white, never toward `[data-ciq]`.)*

## 4. Explicitly designed OUT of the wallet
These are removals, not redesigns. **Do not delete the components — Home will consume them.** (IA §4, §3.)

| Element | Where it goes | Why it leaves the wallet |
|---|---|---|
| **Best Move** (`components/ciq/BestMove.tsx`) | **Home** (Band 3 / tools) | It's a recommendation, not a holding. Interpreting points ≠ ledger. |
| **"Cards to know" editorial strip** (`components/ciq/EditorialCards.tsx`) | **Home** | Discovery of *other* cards is Home's job; the wallet shows what you already hold. |
| **Optimisation rate** | Nowhere (v1) | NOT COMPUTABLE — needs categorized spend that doesn't exist. *(Audit §2.)* Not placeholdered. |
| **"Trending" framing** | Nowhere | No honest behavioural signal. *(Audit §4.)* |
| **Points → rupee stated as fact** | Nowhere | The ×0.25 / ×1.8 multipliers are assumptions; rupees appear only as `EstimateRange`. |
| Card lifecycle status (active/cancelled) | Nowhere | Not in schema. *(Audit §3.)* |

After these move off, the wallet is **correct at its current size** — it stops "carrying the gauge, the best move, and the card list at once" (IA §4). No tabs needed.

## 5. Users
- **New user (0 cards):** just signed up; sees the empty state; the whole surface is a single call to add their first card or upload a statement.
- **Returning user (1+ cards):** has statement and/or manual cards; sees the provenance-split total and their held cards.
- **All-estimated user (manual only, no statements):** sees an honest all-grey gauge and a clear nudge to upload a statement to verify.

## 6. Functional requirements

| # | Requirement | Data source | Provenance |
|---|---|---|---|
| FR1 | Display total points = Σ `points_balance` over held cards | `statement_imports` + `manual_cards` via `/api/user-cards` + `/api/manual-cards` | mixed → split |
| FR2 | Split the total into verified (statement) vs estimated (manual) | per-card `source` flag | verified / estimated |
| FR3 | List held cards: bank, name, ••last4, points, currency, source badge | same merged list | per-card |
| FR4 | First-class empty state when list length = 0 | list length | n/a |
| FR5 | Primary action: **Add a card** (opens existing add-card modal) | `POST /api/manual-cards` | estimated result |
| FR6 | Secondary action: **Upload a statement** | existing `/upload-statement` → `statement_imports` | verified result |
| FR7 | Any ₹ shown only via shared `EstimateRange` (`≈ ₹low–₹high` + "estimate" badge) | `EstimateRange.tsx` (low ≈ ×0.25, high ≈ ×1.8) | estimated (labelled) |
| FR8 | Refresh re-fetches the wallet | existing `loadCards` | n/a |
| FR9 | 2-step first-visit tour; final button **opens Add Card** (not "Done") | `Tour.tsx` + localStorage seen-flag | n/a |

## 7. Honesty rules (non-negotiable, brand-level)
- Verified uses the reserved verified-green (`#4FBF87`); estimated uses the neutral grey (`#8A857B`). **Estimated is understated, never dressed as verified.**
- The **point count is real; the rupee value is not.** Points are the headline. Rupees appear only as the shared `EstimateRange`, so the format can never drift between surfaces (one number, one meaning — IA §8.2).
- If the wallet is entirely estimated (all manual, no statements), the gauge must say so plainly and nudge toward uploading a statement.
- No number appears without a provenance treatment.
- Copper is an **accent** (CTAs, hairlines), never a data colour and never the verified/estimated signal.

## 8. Success signals (directional, not analytics spec)
- New users reach "first card added" or "first statement uploaded" from the empty state.
- Returning users can tell at a glance how much of their total is **verified**.
- Zero instances of a fabricated score, a "trending" label, or a headline ₹ value shipping on the surface.
- The wallet reads as *the truthful ledger everything else (Home, Spend, Travel) reads from.*

## 9. Dependencies
- Rail shell (`design/shell`): the surface mounts inside `(shell)/layout.tsx` → `NavShell` → `AppRail`/`TabBar`. Wallet is the first nav item.
- Existing wallet plumbing: `WalletView`, `HeroGauge`, `CardRow`, `EstimateRange`, `/api/user-cards`, `/api/manual-cards`, `/upload-statement`, the add-card modal in `app/(shell)/dashboard/page.tsx`.
- `SEED_CARDS` as the canonical catalogue **for the Add-a-card picker** (not for any on-wallet editorial strip).
- The white/copper light token set (target design system per CLAUDE.md).

## 10. Decisions
- **Add-card picker source — RESOLVED (amendment 2): `SEED_CARDS`-backed searchable picker, picker-only, NO free-text fallback.** Free-text produces "Amex" / "American Express" / "amex plat" for one and the same card and breaks every downstream match — the same class of bug already visible in the WhatsApp portfolio's "Amex Amex" rendering. The picker is backed by `SEED_CARDS` (bank + card name); **no card numbers ever** (last4 optional only). Implemented in Implementation-Plan Step 4.
- **Where the search/quota meter shows** (Home? You?) is out of scope for the wallet (IA §9).
- The wallet does **not** need tabs (IA §4) — confirmed, not an open question.
