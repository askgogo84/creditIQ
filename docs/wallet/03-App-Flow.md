# Wallet — App Flow

**Traceability:** every state below shows only COMPUTABLE data (`docs/dashboard-data-audit.md`). The wallet shows **holdings only**; anything interpretive (best move, discovery) is on Home.

## 1. Entry
User signs in → `(shell)` layout mounts `NavShell` → `AppRail`/`TabBar` → first surface is **Wallet** (`/dashboard`).

```
[Sign in] -> [Shell mounts] -> [Fetch wallet] -> branch on card count
                                     |
                        +-----------+-----------+
                        |                       |
                   0 cards                  1+ cards
                        |                       |
                 [Empty state]           [Holdings state]
```

## 2. Load sequence
1. Auth resolved (Supabase). Unauthenticated → redirected to `/login` (handled in `page.tsx`).
2. `loadCards(userId)`: parallel `GET /api/user-cards` + `GET /api/manual-cards` → tag `source` → merge.
3. While pending: **skeleton** (existing spinner). No numbers shown until real data resolves — never a placeholder count.
4. Resolve → compute `totalPoints`, `vPoints`, `estimatedPts`, `estLow/estHigh` → render.
5. Existing behaviour retained: if 0 cards **and** onboarding incomplete → redirect to `/onboarding`. If 0 cards and onboarding complete → wallet **empty state** (below).

## 3. Empty state (0 cards) — COMPUTABLE (list length 0)
The whole surface is a single call to build the wallet. No zeroed gauge dressed as an achievement.

- Warm headline: *"Let's build your wallet."*
- Two actions, honestly framed:
  - **Add a card** (copper CTA) → opens add-card modal → result is an **Estimated** card.
  - **Upload a statement** (secondary) → `/upload-statement` → result is a **Verified** card. Framed as the path to *verified*.
- One line: what "verified" means.
- **No** Best Move, **no** editorial strip, **no** optimisation rate, **no** ₹ headline. (Those lived here before; they're on Home now.)

```
Empty (holdings-only):
  "Let's build your wallet."
  We don't guess your money — verified comes from your statements.
  [ + Add a card ]   [ ↑ Upload a statement ]
```

## 4. Holdings state (1+ cards) — COMPUTABLE
- **Hero gauge:** total points, split fill verified (green) vs estimated (grey).
  - If 100% estimated → gauge states "all estimated" + inline nudge to upload a statement.
  - Rupees, if shown, appear only as the shared `EstimateRange` (`≈ ₹low–₹high`, "estimate" badge) — subordinate, never the hero number.
- **Held-cards list:** one row per card — bank · name · ••last4 · points · currency · source badge (Verified/Estimated).
- **Actions:** Add a card / Upload a statement (same handlers as empty state).
- **Refresh:** re-runs `loadCards`.

```
Holdings (holdings-only):
  [ ===gauge===  1,240 pts   verified 900 · estimated 340 ]
  [ We don't guess your money. ]           <- credo, verified-green accent
  Your cards
    HDFC Infinia   ••1234   900 pts   [Verified]
    Axis Atlas     ••5678   340 pts   [Estimated]
  [ + Add a card ]   [ ↑ Upload a statement to verify more ]
```

Note vs. the old wallet: the "Your best move" block and the "Cards to know" strip are **absent** here — they render on Home.

## 5. Add-a-card flow (reuses existing modal)
```
[Add a card] -> modal (SEED_CARDS-backed picker: bank, card name; last4? points? currency? — NO card number)
             -> POST /api/manual-cards (dedup by bank+name+last4)
             -> reload wallet -> gauge/list update
             -> card appears as ESTIMATED (grey)
```

## 6. Upload-a-statement flow (the verification path — the moat)
```
[Upload a statement] -> /upload-statement (existing)
                     -> statement parsed -> statement_imports row
                     -> back on wallet: card appears as VERIFIED (green)
                     -> the estimate becomes fact
```
This is the single action that turns grey into green. It is the wallet's most important CTA and the reason the surface exists.

## 7. Tour flow (2 steps, first visit, final = Open Add Card)
```
First visit to wallet (no ciq_wallet_tour_v1 flag)
  -> Tour auto-opens
     Step 1  "What verification buys you"  -> anchor #wallet-gauge   [Skip] [Continue]
     Step 2  "Add a card"                  -> anchor #wallet-add     [Skip] [Add a card]
  -> [Add a card] (final)  -> set seen-flag + OPEN the add-card modal   (does the thing)
  -> [Skip] at any point   -> set seen-flag, close
Returning visit -> flag present -> no auto-open ("Take a tour" re-opens it)
```
The final button **does the thing** (opens Add Card) rather than saying "Done" (IA §6).

## 8. Error / edge states
- Wallet fetch fails → inline retry, **not** a zero total (which would misread as "you have nothing").
- A manual card with `points_balance = 0` → shown as **Estimated · 0 pts** — honest, contributes 0 to verified.
- All-estimated wallet → gauge full grey + "Upload a statement to verify" nudge; never shown as if verified.

## 9. What the user can never reach on the wallet in v1
- A best-move / recommendation block (moved to Home).
- An editorial / "Cards to know" strip (moved to Home).
- An optimisation-rate screen (does not exist — NOT COMPUTABLE).
- A "trending" list (NOT COMPUTABLE).
- A rupee valuation presented as fact (only `EstimateRange`).
