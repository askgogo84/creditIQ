# Wallet — UI/UX Brief

**Design language:** CreditIQ **white/copper, realise-clean** — white/light base, copper accents used sparingly. Mobile-first, **375px primary** (non-negotiable).
**Migration note:** the wallet ships today on the **retired gold `[data-ciq]` system and must move to white/copper.** Migration direction is **toward white, never toward `[data-ciq]`** (CLAUDE.md, corrected 1 Aug 2026; IA §8.4). Any agent that "helpfully" repaints toward gold has done the wrong thing.
**Traceability:** every rendered figure is COMPUTABLE per `docs/dashboard-data-audit.md`.

## 1. Palette (white/copper light system)
| Role | Intent |
|---|---|
| Surface bg | white / light |
| Panel | near-white / faint warm off-white |
| Ink | dark ink + two dimmer steps |
| Copper accent | CTAs, hairlines, focus — **accent only, never a fill everywhere, never a data colour** |
| **Verified** | verified-green `#4FBF87` — **reserved for verified-from-statement only** |
| **Estimated** | neutral grey `#8A857B` — understated = honest |
| Hairline | light warm grey lines |

Exact token names are a design-system decision (see 05-Backend-Schema §0). What is **fixed**: green = verified only; grey = estimated; copper = accent only. The old true-black `#080807` / warm-ivory `#F4F1E9` gold base is **retired** — do not use it.

Fonts (unchanged): **Clash Display** headlines, **Instrument Serif** italic accent, **Space Grotesk** UI, **Space Mono** data labels.

**Copper discipline:** "like copper trim, not copper paint." One CTA, hairlines, the gauge accent — never a fill. Verified green stays reserved.

## 2. Layout (mobile-first) — holdings only
The wallet is **deliberately sparse**. Best Move and the editorial strip are **gone from this surface** (they render on Home). What remains is the ledger.

### 375px (base)
```
+-----------------------------+
| ● Live · verified wallet    |  eyebrow, Space Mono, green pulse dot
| Hi, {firstName}.            |  masthead, Clash Display
| Take a tour                 |  small re-open affordance
+-----------------------------+
|      ( gauge )              |  HeroGauge: split fill   #wallet-gauge
|   1,240 pts                 |  count-up, tabular-nums (POINTS, not ₹)
|   ● 900 verified            |  green
|   ● 340 estimated           |  grey
|   ≈ ₹310–₹2,232  [estimate] |  EstimateRange only (subordinate)
+-----------------------------+
| 🛡 We don't guess your money |  credo, green accent, one line
+-----------------------------+
| Your cards                  |          refresh
| [ HDFC Infinia ••34  900 ]  |  row, source badge right
| [ Axis Atlas   ••78  340 ]  |
| [  + Add a card          ]  |  #wallet-add — copper dashed CTA
| [  ↑ Upload a statement   ] |  secondary (verify path)
+-----------------------------+
```
Single column. **No horizontal editorial carousel. No "Your best move" block.** CTA full-width.

### >=900px (desktop, inside 248px rail)
Two columns (mirrors existing `WalletView` `md:grid-cols-[5fr_6fr]`):
- **Left (identity):** eyebrow, greeting, gauge, `EstimateRange`, honesty credo *"We don't guess your money."*
- **Right (holdings):** held-cards list, Add-a-card CTA, Upload-a-statement CTA.
- **Nothing below the grid** — the old full-width `EditorialCards` block is removed.

## 3. The gauge (brand signature — kept, repainted)
- Split bar/arc: verified segment green, estimated segment grey, track a light hairline. **Anchor id `#wallet-gauge`** (tour step 1).
- Count-up on the points total; gauge fill animates in. **Both gated by `prefers-reduced-motion`** — reduced-motion users get the final state instantly.
- Centre label is **points**, not rupees.
- Rupees appear **only** as the shared `EstimateRange` beneath the gauge — a small subordinate `≈ ₹low–₹high` with an "estimate" badge, in grey. Never the hero, never green.
- **All-estimated case:** full grey fill + inline *"Upload a statement to verify."*
- **Empty (0 cards):** no gauge at "0" — the empty state replaces it (§5).

## 4. Card row (kept, repainted)
```
[bank glyph]  Card name              900 pts
              ••1234 · Points        [Verified]   <- green pill
```
- Estimated rows: badge in grey, no green.
- `points_balance = 0`: "Estimated · 0 pts" — honest, not hidden.
- Tap → card detail (existing). Verified/Estimated is the row's only status — there is no "active/cancelled" (not in schema).

## 5. Empty state (0 cards)
- Warm, single-purpose. Instrument Serif accent line: *"Let's build your wallet."*
- Two actions: **Add a card** (copper CTA) and **Upload a statement** (secondary/ghost). Upload is framed as the path to *verified*.
- One honest line: what verified means ("verified comes from your statements").
- **No** gauge showing "0", **no** editorial strip, **no** locked "optimisation" teaser, **no** best-move card.

## 6. Add-a-card modal
- `SEED_CARDS`-backed searchable picker (bank + card name). **No card-number field, ever** — last4 optional only.
- Points balance optional (a new user often doesn't know it) → saves as **Estimated**.
- Inline path: *"Don't know your balance? Upload a statement and we'll verify it."*
- Repaint modal from gold gradient / `--ciq-gold-line` to the white/copper system.

## 7. Tour card (2 steps, light-themed, final = Add Card)
- Reuse the generic `Tour` with `theme="light"` and its ring/button repainted **copper** (currently gold).
- Step 1 anchors `#wallet-gauge` — *"Your points, verified vs estimated."* (what verification buys you).
- Step 2 anchors `#wallet-add` — *"Add a card."* Final button reads **"Add a card"** and, on click, **opens the add-card modal** (not "Done").
- Always skippable, dismissable, never blocking. First visit only (localStorage flag). Re-openable via "Take a tour."

## 8. Accessibility & responsiveness
- AA contrast on all text against the white base (verify green/grey/copper on white ≥ 4.5:1 for text, ≥ 3:1 for the gauge segments/UI).
- Tap targets ≥44px. Rows and CTAs focusable; tour keyboard-navigable (already in `Tour`).
- Tabular figures (`font-variant-numeric: tabular-nums`) on all point counts — no jitter on count-up.
- Works and looks intentional at exactly **375px** — verify via a **375px iframe** (window resize can't shrink the viewport on this machine; see the "verify-375px-via-iframe" note).

## 9. Motion inventory (all reduced-motion-safe)
| Motion | Where | Reduced-motion |
|---|---|---|
| Count-up | points total | jump to final |
| Gauge fill | hero | show final fill |
| Staggered rise-in | rows / blocks (`.ciq-rise`) | show in place |
| Pulse dot | "Live · verified wallet" eyebrow | static dot |
No new motion primitives. Reuse existing animation classes; re-verify none bypass `prefers-reduced-motion` after the repaint.

## 10. What must NOT appear on this surface
Best Move · "Cards to know" / editorial strip · trending anything · optimisation rate · a rupee value stated as fact · any gold `[data-ciq]` token. All of these are either on Home or NOT COMPUTABLE.
