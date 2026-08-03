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

## Gold-surface dark flash (no pre-paint for `ciq-theme`)

**Every surface still wrapped in `CiqTheme` (`onboarding`, `my-cards`, `feed`, `profile`, `pro`) flashes DARK on load before correcting to the resolved theme.** `CiqThemeProvider` (`components/ciq/ThemeProvider.tsx`) initialises `useState<Theme>('dark')` — a blind default — and only reads the persisted `ciq-theme` key in a mount `useEffect`. So the wrapper paints **dark on SSR and on the first client paint**, then switches once the effect runs.

There is **no pre-paint script for `ciq-theme`.** The single inline pre-paint in `app/layout.tsx` resolves only the site key `creditiq-theme` onto `<html data-theme>` before first paint; nothing does the equivalent for the gold wrapper's own key. And because the wrapper carries `transition: background .3s, color .3s`, the correction is not instant — it renders as a **visible animated fade from dark to the real (usually light) theme** on every gold surface load.

This is **distinct from the theme desync** fixed by the single-writer collapse (all toggles now route through `lib/store.ts`; enforced by `lib/theme-single-writer.test.ts`). The desync was *which* value the gold key held; this is the gold provider having *no pre-paint at all*, so it always starts dark regardless of the stored value. Keeping `ciq-theme` in sync does not fix it — the wrapper still mounts dark then fades.

**Noted, not resolved — and deliberately not fixed.** It **dies with `ciq-theme` in the gold cleanup** (`docs/wallet/06-Implementation-Plan.md` Follow-on task): when the last gold surface migrates to the white/copper system, `CiqTheme`/`ThemeProvider.tsx` is deleted and these surfaces inherit the single site pre-paint that already exists on `<html>`. Adding a second pre-paint for a key slated for deletion would spend effort hardening a system we are removing.

## Card face-ink logic defined twice, diverged (CardMockup vs CreditCard3D)

**Two components render a card face and each picks face-text ink from card-colour luminance with its own formula and its own threshold.** They disagree, and the `110fc889` contrast fix corrected only one.

| | `CardMockup` | `CreditCard3D` |
|---|---|---|
| File | `components/cards/CardMockup.tsx` (`faceInk`, L17–25) | `components/design/CreditCard3D.tsx` (`hexLuma`, L33–40) |
| Formula | **WCAG relative luminance** — sRGB-linearised, `0.2126 R + 0.7152 G + 0.0722 B` | **YIQ / Rec.601 luma** — `(0.299 R + 0.587 G + 0.114 B)`, no linearisation |
| Threshold | **`L > 0.1791`** (the true black/white crossover) | **`luma > 0.6`** |
| Rendered on | `/dashboard` "Cards to know" strip (`EditorialCards`) | `/card/[slug]` detail (`CardDetailClient`) |

Same class as the **double-defined `--bg`** and the two `[data-font]` blocks: one concept, two implementations that silently disagree, and a fix (`110fc889`, "0.3 → 0.1791") that landed on `CardMockup` only. **`/card/[slug]` runs the uncorrected `CreditCard3D` path** — a different formula *and* a threshold >3× higher, so borderline card colours can pick the wrong ink there while the same card is correct on the dashboard strip. No `tsc` or test catches it — both are valid arithmetic.

**Noted, not resolved.** The durable fix is one shared `faceInk` (the WCAG-linear 0.1791 version) consumed by both faces; picking that up belongs to the per-surface rebuilds, not recorded as a patch here.

## Selector-scope collision — `[class*="card"]` (RESOLVED: rule deleted)

**Distinct from the double-definition entries above.** Those are one *key* declared twice with drifting values. This is one *rule* whose selector is so broad it silently styled elements it was never written for.

The rule (formerly `app/globals.css:1031–1035`):
```css
/* Smart Match card fix - light mode */
[class*="card"], .card {
  background: var(--bg-elevated, #fff);
  color: var(--text, #0f172a);
}
```

`[class*="card"]` is a **substring attribute selector** — it matches *every* element whose class contains the string "card". In a **credit-card app**, that is nearly everything: `card-mockup-inner`, `card3d-wrap` / `card3d` / `card3d-holo` / `card3d-shine`, `card-soft`, and even Lucide's `lucide-credit-card` icons. It was authored as a "Smart Match card fix" but behaved as an **app-wide background + text-colour override masquerading as a component fix**.

**What it broke (all confirmed by runtime computed-style audit across `/`, `/cards`, `/smart-match`, `/card/[slug]`):**
- **`card-mockup-inner`** (the dashboard "Cards to know" strip) — painted **opaque white** over the correct dark card tile in light mode → bank/tier labels invisible. This was the reported bug; its root cause is *this rule*, not `CardMockup`.
- **`card3d-shine` / `card3d-holo`** — their radial/linear **gradient** effects were overwritten by the solid `background` shorthand; the 3D holographic/shine layers were wiped.
- **`card3d-wrap` / `card3d`** — transparent 3D-transform containers, forced opaque.
- **`card-soft`** — has its own `background: var(--surface)`; the rule overrode it in dark mode (navy → `#111118`).
- **`lucide-credit-card`** icons — given a stray background.

**Why only light mode read as broken:** the rule is unconditional, but its value `var(--bg-elevated)` is theme-flipped — `#fff` in light (`:root`), `#111118` in dark. It painted in *both* themes; it was only *visible as damage* against the light ground. Dark mode hid it.

**Nothing depended on it.** Every "card"-classed element either owns its background (`card-soft` → `var(--surface)`; `CardRow`/`ciq-tour-card`/the `CreditCard3D` face → inline) or is meant to be transparent/gradient. Even the surface it was named for — the Smart Match result cards (`CardTile` → `card-soft`) — is self-sufficient, so the "fix" fixed nothing and only caused collateral damage. **Deleted, not scoped**: scoping it to `.card-soft` would keep a rule nobody needs; deletion is the correct resolution.

**The lesson — worse to find than double-definition:** you cannot locate this bug by grepping the victim's class name. Searching `card-mockup-inner` in the source finds three rules, none with a background — because **the rule affecting the element was not named after the element.** It only surfaced by inspecting the *computed* style at runtime and discovering a `[class*="card"]` selector matching from a distance. Same NEW_CARDS shape (the data being read was not the data being edited), one layer over into CSS.
## Un-themed light-mode drop-in on a gold surface (RESOLVED)

`app/(shell)/profile/LinkWhatsAppButton.tsx` was a hardcoded light-mode Tailwind "drop-in" (`bg-white` card, `text-slate-500/600` text, `bg-slate-50` code box) rendered inside the gold `[data-ciq]` profile surface. In dark mode its card stayed **white** while its `<h3>` title rendered **light** — invisible, white-on-white.

The subtle part: the title's own `text-slate-900` was **not** the cause. The `[data-ciq] :is(h1..h5){ color: var(--ciq-ink) }` heading-contract rule (`globals.css`, specificity 0,1,1) already overrode it to the theme ink — so the title was correctly light. **The heading contract themes *text*, but nothing themes *backgrounds*.** A single hardcoded panel background is therefore enough to make an already-correct title invisible — and grepping the title's colour would never find the real defect (the `bg-white` at line 36).

Fixed by theming the whole component to `var(--ciq-*)`, matching the "Invite to CreditIQ" card on the same page (`var(--ciq-panel)` card, `var(--ciq-ink)` / contract-rule titles, `var(--ciq-ink-2)` secondary). Distinct from the selector-scope collision and the double-definition entries: this is neither an over-broad selector nor a duplicated key — it is a component that opts out of the token system entirely by hardcoding utilities. Swept all five gold surfaces; this was the only instance.
