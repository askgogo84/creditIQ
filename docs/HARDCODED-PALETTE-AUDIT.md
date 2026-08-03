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

## Font debt

The same "tokens moved, the app didn't follow" story as the palette, but for type. The spec target (CLAUDE.md, IA) is **Fraunces ~300 display / Inter body / JetBrains Mono figures**. What actually ships:

- **Body renders Geist, not Inter.** `<body>` sets `font-family: var(--font-geist-sans)` directly (`app/layout.tsx:59`). The `--font-body` token *is* Inter (`globals.css:99`) but the body ignores it, and `--font-inter` is never defined by `next/font` (`layout.tsx:40` loads Geist, Clash, Satoshi, JetBrains — not Inter). So body = Geist everywhere.
- **Display token is Syne, and Syne isn't even loaded.** `--font-display: "Syne"…` (`globals.css:98`); Tailwind's `display` face is `var(--font-syne)` first (`tailwind.config.ts:11`). Neither `--font-syne` nor Syne is loaded by `next/font`, so `h1–h5` fall through Syne → Inter → system. Nothing renders the intended Fraunces display face outside the landing page and a couple of inline uses.
- **Fraunces weight 300 — FIXED (3 Aug 2026).** The app-wide `@import` (`globals.css:5`) previously omitted weight 300, so the spec's Fraunces-300 headline snapped to 400 on any token-driven surface (only the landing page loaded 300, via its own `<link>` at `app/(marketing)/landing/page.tsx:163`). `300` (roman + italic) has now been added to the `globals.css:5` axis. This loads the weight only — nothing yet requests it, so there is no visual change today. It unblocks the display-face unification below.
- **JetBrains Mono is wired into `<Figure>` only.** `--font-jbmono` loads a single static 400 weight (`app/fonts.ts:38`, deliberate — no variable `.woff2` ships) and only `<Figure>` consumes it. The general mono token `--font-mono` is still `"Geist Mono"` (`globals.css:101`), so every other mono surface renders Geist Mono, not JetBrains Mono.
- **10-way `[data-font]` pairing switcher removed 3 Aug 2026** — orphaned CSS, no writer, latently overrode `--font-display`/`--font-body` at `:root`.

Net: the type system that actually ships is **Geist body / Syne-token→system display / Geist Mono** — three faces off-spec — with Fraunces and JetBrains Mono reaching only the landing page and `<Figure>` respectively. Unifying `--font-*` onto Fraunces/Inter/JetBrains Mono is the tracked follow-on (`docs/wallet/06-Implementation-Plan.md`); the Fraunces-300 axis fix above is its prerequisite.

**Display-face unification (Syne token → Fraunces 300) is deferred to the per-surface rebuilds — NOT a global token flip.** It will be introduced **first on Home, as greenfield** (Home is unbuilt, so it can be authored on Fraunces 300 from the start with no regression surface), then **propagated surface by surface** as each is rebuilt. The reason it can't be a single `--font-display` swap: `h1–h5` carry **no shared size scale** — every heading is sized inline per component (`h1–h5` set no `font-size`; see § Typography in `DESIGN.md`). Flipping the token globally would change the face under hundreds of inline-sized headings at once, with no size ramp holding them together — an unbounded visual blast radius. Doing it per surface, starting greenfield on Home, keeps each change reviewable at 375px.

## Radius drift

**Card border-radius appears at six values across the codebase: `12` / `14` / `16` / `20` / `22` / `24`px.** A card-like surface picks a hardcoded number per file; the `--r-*` token scale (`--r-sm 8 · --r-md 14 · --r-lg 22 · --r-xl 32 · --r-2xl 44`, `globals.css:108`) is referenced only a handful of times in components, so nothing pulls these six back to one value.

This is the **same class of defect as the double-defined `--bg` token** (a value defined in two places that silently disagree): drift that **no type check catches** — `tsc` sees valid numbers and valid CSS either way. It only shows up by eye, card next to card. **Noted, not resolved** — the fix (route every card onto one radius token) belongs to the per-surface rebuilds, same as the font and palette debt above; picking the value is a design decision, not recorded here.
