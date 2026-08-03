# Hardcoded palette audit — signed-in pages

**Written 2 Aug 2026. The real scope of the white/copper migration.**

## Headline: the migration moved TOKENS. Most pages don't use tokens.

The light-system migration retuned the design tokens (`--bg`, `--ink`, `--copper`, …) and flipped the ground to white. But **most signed-in pages never read those tokens** — their heroes, panels and text are hardcoded hex typed directly into `style={{…}}`. Counts of raw hex per page: **points-optimizer 47, statement-truth 16, card-switch 13, compare/optimize/card-roast 10 each, pro 9, spend-optimizer / transfer-partners / travel / lounge-tracker 6–8**.

So a page is white today **only where it inherits `--bg`**. Where it hardcoded its ground or its hero colours, it is still whatever was typed in. **"The app is now white/copper" is not true yet.** Two pages (`spend-optimizer`, `points-optimizer`) hardcode a `#f1f5f9` slate ground and never went white at all. This doc is the backlog that makes the statement true.

## Per-page inventory

Ground = where the page's background comes from. "token" → inherits `--bg` (now white). "hardcoded" → fixed hex, unaffected by the token change.

| Page | Raw hex | Ground | Hero | Notable hardcoded hex |
|---|---|---|---|---|
| **points-optimizer** | 47 | **hardcoded `#f1f5f9`** (slate — never white) | centred | `#1B3A5C` `#C9972E` `#64748b` `#94a3b8` `#f8fafc` `#f0f4ff` `#3730a3` `#334155` `#475569` `#10b981` `#fffbeb` `#fde68a` `#78350f` `#dc2626` |
| **spend-optimizer** | ~16 | **hardcoded `#f1f5f9`** (slate — never white) | centred | `#1B3A5C` `#C9972E` `#e11d48` `#f59e0b` `#f97316` `#f0fdf4` `#bbf7d0` `#fffbeb` `#fde68a` `#64748b` `#94a3b8` |
| **statement-truth** | 16 | token (+hex fallbacks) → white | left | `#2d7a56`; fallbacks `#FAF5EB` `#142950` `#5A6A8A` |
| **card-switch** | 13 | token → white | centred | `#0f172a` `#8888AA` `#f8fafc` `#C9972E` `#E8B84B` `#08080E` `#0a0a0a` `#1B3A5C` `#0d2240` `#16a34a` `#ef4444` `#15803d` |
| **trip-planner** | ~40 | token `var(--bg)` → white | centred | `#0f172a` `#64748b` `#94a3b8` `#C9972E` `#E8B84B` `#142950` `#1B3A5C` `#0d2240` `#e2e8f0` `#f8fafc` `#16a34a` `#22c55e` `#ef4444` `#dc2626` `#0a0a0a` |
| **card-roast** | 10 | token-as-hex → white | centred | `#142950` `#2A3F6B` `#5A6A8A` `#8C5F12` `#D89B2A` **`#FAF5EB`** `#B97C2C` `#C46A52` `#128293` `#128533` `#B84230` |
| **compare** | 10 | token-as-hex → white | centred | `#142950` `#2A3F6B` `#5A6A8A` `#8C5F12` `#D89B2A` **`#FAF5EB`** `#2d7a56` `#065f46` |
| **optimize** | 10 | token (`--bg`/`--text`) → white | left | `#0a0a0b` `#f5f5f6` `#C9972E` (dark `<select>` inputs) |
| **pro** | 9 | **retired gold `[data-ciq]`** | centred | `#080807` `#C9A24B` (gold — its own migration) |
| **transfer-partners** | 7 | token → white | left | `#fff` on dark cards |
| **travel** | 6 | token → white | left | **`#F5EFE6` (×3)** `#142950` `#2A3F6B` `#8C5F12` `#D89B2A` `#5A6A8A` |
| **lounge-tracker** | 6 | token → white | centred | **`#EFE7D8` (×4)** `#7C8970` (sage) `#142950` `#2A3F6B` `#5A6A8A` `#8C5F12` `#B84230` `#4F8C58` |
| **cards** | via components | token → white | centred | `SectionHeader` / `CardTile` (mostly tokenised) |
| **sweet-spots** | few | token → white | **left (clean)** | fully tokenised |
| **dashboard / WalletView** | few | token → white | n/a | fully tokenised |
| **profile** | — | **retired gold `[data-ciq]`** | narrow | its own migration |

## Illegibility / wash-out on the new white ground

**Checked before you find it by eye.** Two distinct problems:

**1. No illegible TEXT.** Every title/body colour is a dark ink — `#142950` / `#0f172a` / `#1B3A5C` / `#2A3F6B` / `#5A6A8A` — all ≥ 5:1 on white. The pale colours that exist (`#f5f5f6`, `#e2e8f0`) sit on **dark** chips (`#0a0a0b`, `#1B3A5C`), so they're fine. The only degraded case is `#94a3b8` on small secondary labels: ~3.0:1 on white (was ~2.6:1 on cream) — decorative, borderline in both grounds.

**2. Cream hardcoded as backgrounds — the real wash-out.** Several pages typed the *old* cream ground into element backgrounds. On the new white ground these are **warm patches that no longer match and separate weakly**:
- `travel` — `#F5EFE6` (old `--bg`) as section backgrounds (×3)
- `lounge-tracker` — `#EFE7D8` (old `--bg-2`) as card backgrounds (×4)
- `card-roast` — `#FAF5EB` (old `--paper`) as a card background
- `compare` — `#FAF5EB` (old `--paper`) as card backgrounds (×3)

These are not unreadable, but they are visibly off-palette on white and are the first things to fix — they're cream islands the ground change stranded.

**3. Slate-ground pages never changed.** `spend-optimizer` and `points-optimizer` hardcode `#f1f5f9` as their page ground, so the white change did nothing to them — they sit on light slate with a `#1B3A5C` navy hero, a self-consistent scheme unrelated to white/copper.

## What this means for scope

Making "the app is white/copper" true is **not** a token change — it's converting ~12 pages' hardcoded hex to tokens, page by page, and this is where the centred heroes get their left-aligned headers too. That is the same work as the gold → white surface migration and should be tracked as such. The in-page `SectionTabs` placement (this change) is deliberately *not* that migration — it drops the shared, tokenised tab strip into each page's content column and leaves each page's hardcoded body untouched until its own migration pass.

## Un-themed light-mode drop-in on a gold surface (RESOLVED)

`app/(shell)/profile/LinkWhatsAppButton.tsx` was a hardcoded light-mode Tailwind "drop-in" (`bg-white` card, `text-slate-500/600` text, `bg-slate-50` code box) rendered inside the gold `[data-ciq]` profile surface. In dark mode its card stayed **white** while its `<h3>` title rendered **light** — invisible, white-on-white.

The subtle part: the title's own `text-slate-900` was **not** the cause. The `[data-ciq] :is(h1..h5){ color: var(--ciq-ink) }` heading-contract rule (`globals.css`, specificity 0,1,1) already overrode it to the theme ink — so the title was correctly light. **The heading contract themes *text*, but nothing themes *backgrounds*.** A single hardcoded panel background is therefore enough to make an already-correct title invisible — and grepping the title's colour would never find the real defect (the `bg-white` at line 36).

Fixed by theming the whole component to `var(--ciq-*)`, matching the "Invite to CreditIQ" card on the same page (`var(--ciq-panel)` card, `var(--ciq-ink)` / contract-rule titles, `var(--ciq-ink-2)` secondary). Distinct from the selector-scope collision and the double-definition entries: this is neither an over-broad selector nor a duplicated key — it is a component that opts out of the token system entirely by hardcoding utilities. Swept all five gold surfaces; this was the only instance.
