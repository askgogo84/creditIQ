# Dashboard — UI/UX Brief

**Design language:** CreditIQ "Amex-Platinum grade" — gold-on-true-black, premium, honest. Mobile-first, **375px minimum** (non-negotiable). Light + dark toggle.
**Tokens:** use the existing `--ciq-*` system only (no new colours). The surface is wrapped `[data-ciq]`.
**Traceability:** every rendered figure is COMPUTABLE per `docs/dashboard-data-audit.md`.

## 1. Token palette (existing only)
| Role | Token |
|---|---|
| Surface bg | `--ciq-bg` (#080807 dark / #F4F1E9 light) |
| Panel | `--ciq-panel`, `--ciq-panel-2` |
| Ink | `--ciq-ink`, `--ciq-ink-2`, `--ciq-ink-3` |
| Jewelry gold | `--ciq-gold`, `--ciq-gold-2`, `--ciq-gold-soft`, `--ciq-gold-line` |
| Verified | `--ciq-verified` (#4FBF87) — reserved for the moat |
| Estimated | `--ciq-estimated` (#8A857B) — neutral, understated |
| Hairline | `--ciq-line`, `--ciq-line-2` |
| Radii | `--r-sm/md/lg/xl` |

Fonts: `.ciq-display` (Clash Display) headlines, `.ciq-serif` (Instrument Serif) accents, `.ciq-mono` (Space Mono) data labels.

**Gold discipline:** "like jewelry, not paint." One CTA, hairlines, the gauge accent — never a fill everywhere. Verified green is reserved for verified-from-statement only.

## 2. Layout (mobile-first)

### 375px (base)
```
+-----------------------------+
| Hi, {firstName}             |  masthead, ciq-display
| Live · verified wallet      |  eyebrow, ciq-mono, --ciq-ink-3
+-----------------------------+
|      ( gauge )              |  HeroGauge: split fill
|   1,240 pts                 |  count-up, tabular-nums
|   ● 900 verified            |  --ciq-verified
|   ● 340 estimated           |  --ciq-estimated
+-----------------------------+
| Your cards                  |
| [ HDFC Infinia  ••34  900 ] |  row, source badge right
| [ Axis Atlas    ••78  340 ] |
+-----------------------------+
| [   + Add a card        ]   |  single gold CTA
+-----------------------------+
| Cards to know   (editorial) |  section label, --ciq-ink-3
| [img][img][img] ->          |  horizontal scroll carousel
+-----------------------------+
```
Single column. Carousel scrolls horizontally with snap. CTA full-width.

### >=900px (desktop, inside 248px rail)
Two columns (mirrors existing `WalletView` `md:grid-cols-[5fr_6fr]`):
- **Left (identity):** masthead, gauge, honesty credo "We don't guess your money."
- **Right (action):** portfolio list, Add-card CTA, editorial strip beneath.

## 3. The gauge (brand signature)
- Split bar/arc: verified segment `--ciq-verified`, estimated segment `--ciq-estimated`, track `--ciq-line-2`.
- Count-up on the points total; gauge fill animates in. **Both gated by `prefers-reduced-motion`** (already enforced globally for `[data-ciq]`) — reduced-motion users get the final state instantly, no animation.
- Centre label is **points**, not rupees. If any ₹ appears it is a small subordinate "est. ₹X–₹Y" line in `--ciq-estimated`, never the hero.
- All-estimated case: gauge shows a full grey fill + inline "Upload a statement to verify."

## 4. Portfolio row
```
[bank glyph]  Card name              900 pts
              ••1234 · Points        [Verified]  <- --ciq-verified pill
```
- Estimated rows: badge in `--ciq-estimated`, no green.
- `points_balance = 0`: "Estimated · 0 pts" — honest, not hidden.
- Tap → card detail (existing).

## 5. Empty state
- Warm, single-purpose. `.ciq-serif` accent line: *"Let's build your wallet."*
- Two actions: **Add a card** (gold CTA) and **Upload a statement** (ghost/secondary). Upload is framed as the path to *verified*.
- Editorial strip still shows below — a new user always has something real to look at.
- No gauge showing "0", no locked "optimisation" teaser.

## 6. Editorial cards strip
- Section label "Cards to know" in `--ciq-ink-3`, `.ciq-mono`. **Never** "Trending."
- Each tile: card art (`card_image_url`) on a `--ciq-panel-2` base; **fallback = `color` swatch** with card name in `.ciq-display`. Under it, the `best_for` one-liner in `--ciq-ink-2`, clamped to 2 lines.
- Horizontal scroll, snap, momentum. Visually distinct from the user's own figures (a hairline separator + different bg) so editorial never reads as personal data.

## 7. Accessibility & responsiveness
- AA contrast on all text (the `--prov-*`/`--ciq-*` tokens were chosen for ≥5.7:1).
- Tap targets ≥44px. Carousel keyboard-scrollable; rows focusable.
- Tabular figures (`font-variant-numeric: tabular-nums`) on all point counts — no jitter on count-up.
- Works and looks intentional at exactly 375px (verify via 375px iframe — window resize can't shrink the viewport on this machine).

## 8. Motion inventory (all reduced-motion-safe)
| Motion | Where | Reduced-motion |
|---|---|---|
| Count-up | points total | jump to final |
| Gauge fill | hero | show final fill |
| Staggered rise-in | rows (`.ciq-rise`) | show in place |
No new motion primitives; reuse existing CIQ animation classes.
