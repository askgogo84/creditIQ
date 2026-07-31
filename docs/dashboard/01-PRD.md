# Dashboard — Product Requirements Document (PRD)

**Surface:** Wallet / Dashboard — the signed-in home inside the rail shell (`/dashboard`, route group `(shell)`).
**Version:** v1 (honest-data-only).
**Traceability:** every figure below maps to `docs/dashboard-data-audit.md`. Nothing in this PRD requires data the audit marked NOT COMPUTABLE.

## 1. Problem & thesis
A signed-in CreditIQ user needs a single glance that answers *"what do I actually have, and is any of it real?"* The moat is honesty: **"We don't guess your money."** The dashboard's job is to show the user's true points position, split into what's **verified** (from statements) vs **estimated** (typed in), and to make the next honest action obvious — never to fabricate a score or a rupee value.

## 2. Goals (v1)
1. Show **total points across the wallet**, provenance-split verified vs estimated. *(Audit §1 — COMPUTABLE.)*
2. Show the **active portfolio list** with a first-class **empty state** for new users. *(Audit §3 — COMPUTABLE.)*
3. Offer an honest **editorial cards strip** (real art + `best_for` one-liners) to help users discover cards. *(Audit §4 — art + one-liner COMPUTABLE.)*
4. Make the primary action — **add a card / upload a statement** — unmissable, especially from empty state.

## 3. Non-goals (explicitly designed out of v1)
- **Optimisation rate.** No per-user rate. Requires categorized spend that does not exist. *(Audit §2 — NOT COMPUTABLE.)* Not placeholdered.
- **"Trending" cards.** No behavioural ranking exists; the strip is editorial, never labelled "trending." *(Audit §4.)*
- **Points → rupee value stated as fact.** The ×1.8 / ×0.25 multipliers are assumptions; if any ₹ figure appears it is labelled an **estimate range**, never a headline number.
- Card lifecycle status (active/cancelled) — not in schema.

## 4. Users
- **New user (0 cards):** just signed up; sees the empty state; the whole surface is a single call to add their first card.
- **Returning user (1+ cards):** has statement and/or manual cards; sees the provenance-split total and their portfolio.

## 5. Functional requirements

| # | Requirement | Data source | Provenance |
|---|---|---|---|
| FR1 | Display total points = Σ `points_balance` over held cards | `statement_imports` + `manual_cards` via `/api/user-cards` + `/api/manual-cards` | mixed → split |
| FR2 | Split the total into verified (statement) vs estimated (manual) | per-card source flag | verified / estimated |
| FR3 | List held cards: bank, name, ••last4, points, currency, source badge | same merged list | per-card |
| FR4 | Empty state when list length = 0 | list length | n/a |
| FR5 | Primary CTA: add card / upload statement (opens existing add-card modal) | existing `/api/manual-cards`, statement upload | n/a |
| FR6 | Editorial cards strip: art + one-line `best_for`, links to card detail | `SEED_CARDS` (`card_image_url`, `color`, `best_for`) | editorial (labelled) |
| FR7 | Refresh re-fetches the wallet | existing `loadCards` | n/a |

## 6. Honesty rules (non-negotiable, brand-level)
- Verified uses `--ciq-verified`; estimated uses the neutral `--ciq-estimated` grey. Estimated is **understated, never dressed as verified.**
- If the wallet is entirely estimated (all manual, no statements), the gauge must say so plainly and nudge toward uploading a statement.
- No number appears without a provenance treatment. The editorial strip is visibly editorial and separated from the user's own figures.

## 7. Success signals (directional, not analytics spec)
- New users reach "first card added" from the empty state.
- Returning users can tell at a glance how much of their total is verified.
- Zero instances of a fabricated score or headline ₹ value shipping on the surface.

## 8. Dependencies
- Rail shell (`design/shell`) — the surface mounts inside `(shell)/layout.tsx` → `NavShell` → `AppRail`/`TabBar`.
- Existing wallet plumbing: `WalletView`, `HeroGauge`, `/api/user-cards`, `/api/manual-cards`.
- `SEED_CARDS` as canonical card catalog.

## 9. Open decisions
See `docs/OVERNIGHT-QUESTIONS.md` — Q1 (editorial vs trending), Q2 (card-art hosting), Q3 (confirm optimisation-rate omission). v1 proceeds on the honest defaults recorded there.
