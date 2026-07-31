# Dashboard — App Flow

**Traceability:** every state below shows only COMPUTABLE data (`docs/dashboard-data-audit.md`).

## 1. Entry
User signs in → `(shell)` layout mounts `NavShell` → `AppRail`/`TabBar` → default surface is **Wallet** (`/dashboard`).

```
[Sign in] -> [Shell mounts] -> [Fetch wallet] -> branch on card count
                                     |
                        +-----------+-----------+
                        |                       |
                   0 cards                  1+ cards
                        |                       |
                 [Empty state]           [Portfolio state]
```

## 2. Load sequence
1. Auth resolved (Supabase). If unauthenticated → shell shows marketing header (handled by `NavShell`, out of scope here).
2. `loadCards(userId)`: parallel `GET /api/user-cards` + `GET /api/manual-cards` → merge + dedup.
3. While pending: **skeleton** (existing spinner). No numbers shown until real data resolves — never a placeholder count.
4. Resolve → compute `totalPoints`, `verifiedPts`, `estimatedPts` → render.

## 3. Empty state (0 cards)  — COMPUTABLE (list length 0)
- Headline: honest welcome, no zeroed gauge dressed as an achievement.
- Single primary action: **Add your first card** → opens add-card modal (manual) with a secondary path to **upload a statement** (verified).
- Below the fold: the **editorial "Cards to know"** strip so a new user with nothing still has something real to explore.
- No optimisation rate, no ₹ headline.

```
Empty:
  "Let's build your wallet."
  [ Add a card ]  [ Upload a statement ]
  --- Cards to know (editorial) --- [art][art][art] ->
```

## 4. Portfolio state (1+ cards) — COMPUTABLE
- **Hero:** total points, gauge split verified (green) vs estimated (grey). If 100% estimated → gauge states "all estimated" + nudge to upload a statement.
- **Portfolio list:** one row per card — bank · name · ••last4 · points · currency · source badge (Verified/Estimated).
- **Primary action:** Add card / upload statement (same modal).
- **Editorial strip:** "Cards to know," clearly separated from the user's own figures; each card links to its detail page.
- **Refresh:** re-runs `loadCards`.

```
Portfolio:
  [ ===gauge===  1,240 pts   verified 900 · estimated 340 ]
  Your cards
    HDFC Infinia      ••1234   900 pts   [Verified]
    Axis Atlas        ••5678   340 pts   [Estimated]
  [ + Add card ]
  --- Cards to know (editorial) --- [art][art][art] ->
```

## 5. Add-card flow (reuses existing modal)
```
[Add a card] -> modal (bank, name, last4?, points?, currency)
             -> POST /api/manual-cards (dedup by bank+name+last4)
             -> optimistic insert -> gauge/list update
   or
[Upload a statement] -> existing statement upload -> statement_imports -> Verified card appears
```

## 6. Card discovery flow (editorial strip)
```
[Editorial card] -> /card/[slug]  (existing card detail surface)
```
Art loads progressively; on failure the card renders as a `color` swatch — no broken image, no layout shift.

## 7. Error / edge states
- Wallet fetch fails → inline retry, **not** a zero total (which would misread as "you have nothing").
- A manual card with `points_balance = 0` → shown as **Estimated · 0 pts**, honest, contributes 0 to verified.
- Art CDN down → colour swatches everywhere; surface still fully functional.

## 8. What the user can never reach in v1
- An optimisation-rate screen (does not exist).
- A "trending" list (editorial only).
- A rupee valuation presented as fact.
