# CreditIQ — Design System

**The white/copper light system.** White ground, navy ink, copper accents used sparingly. This is the locked target; the gold `[data-ciq]` "Amex-Platinum" system is retired. Source of truth for tokens is `app/globals.css`; this doc describes what those tokens are and how they're meant to be used.

Font migration debt (Geist body, Syne display token, Fraunces loaded 400–700 not 300, JetBrains Mono wired only into `<Figure>`) is tracked in `docs/HARDCODED-PALETTE-AUDIT.md`.

---

## Palette

Light theme (`:root`, `app/globals.css`):

| Role | Token | Value |
|---|---|---|
| Ground | `--bg` | `#FFFFFF` |
| Alt band | `--bg-2` / `--bg-3` | `#F7F5F2` |
| Surface | `--surface` / `--paper` | `#FFFFFF` |
| Surface alt | `--surface-2` | `#F7F5F2` |
| Ink (primary) | `--ink` | `#142335` |
| Ink ramp | `--ink-2 … --ink-5` | `#2A3F6B` · `#5A6A8A` · `#8A95AE` · `#B5BBCB` |
| Copper | `--copper … --copper-4` | `#8C5F12` · `#B5811E` · `#D89B2A` · `#F2C658` |
| Navy (logo) | `--navy … --navy-3` | `#142950` · `#1E3A5F` · `#2A4F7A` |
| Lines | `--line` / `--line-strong` / `--line-soft` | navy @ 10% · 20% · 5% |

Copper is for accents and CTAs, **not** a fill everywhere.

### Merged homepage (home-merge v4)

The merged marketing homepage (`app/page.tsx`, reference `docs/design/home-merge-v4.html`) layers its own literal token set on the white/copper system: a pure-white page ground, a warm cream band, and one teal band colour. Like the landing page, this surface uses fixed hexes and does **not** follow the app light/dark toggle.

| Role | Value |
|---|---|
| Page ground | `#FFFFFF` |
| Cream band | `#F7F1E6` |
| Teal band | `#0E3B3C` |
| Ink (headings) | `#10202A` |
| Body | `#48565E` |
| Muted | `#6E7B82` |
| Hairline | `#E2DCD0` |
| Copper (accent, on light) | `--copper` `#9A6516` |
| Copper on dark (over footage) | `--copper-on-dark` `#D2924A` |
| Verified | `#1A7A5E` |

Rules:
- **Teal appears at most twice per page** — reserved for full-width band sections, not scattered as a general UI colour.
- **Copper is the only accent.** No second accent hue.
- **Copper has two named values, one role.** On light grounds copper is `#9A6516`; on the dark hero footage that value **fails contrast** (≈1.3:1 over the clip), so the hero uses a lightened, same-hue `--copper-on-dark` `#D2924A`. Both are defined once in `app/page.module.css` (the `--copper-on-dark` token is scoped to `.hm-hero`) and referenced by token — never re-typed as a loose hex in a component.
- **No italic or oblique anywhere** — the [Emphasis](#emphasis) rule governs. This is why the hero's "booked" is set **roman in copper**, never italic.

### Provenance (the moat) — one value per theme, one meaning

| Meaning | Token | Light value |
|---|---|---|
| Verified (from statement) | `--prov-verified` | `#1B6B42` |
| Cached | `--prov-cached` | `#7D5410` |
| Estimated | `--prov-estimated` | `#635C51` (neutral grey — understated = honest) |

Verified-green is **reserved** for statement-verified numbers. Estimated wears neutral grey, never green. `<Figure>` and the landing pills read only these three.

---

## Typography ramp

Read from `app/globals.css`. Fonts are still off-spec (see the font-debt pointer above); the sizes below are what actually renders regardless of which face resolves.

**Body / base:** `16px`, line-height `1.55` (`body`, L200).

There is a consistent **UI-chrome size ramp**:

| Size | Role | Selector |
|---|---|---|
| `18px` | Nav brand / wordmark | `.nav__brand` (display, 600) |
| `17px` | Mobile-menu links | `.mobile-menu a` (500) |
| `16px` | Body / base | `body` |
| `15px` | Buttons | `.btn` (body, 500) |
| `14px` | Nav links | `.nav__link` (500) |
| `13.5px` | Filter / chip pills | (body, 500) |
| `13px` | CIRA float button | (display, 500) |
| `12px` | Devaluation ticker | `.deval` (mono) |
| `11px → 10px` | Data labels | `.label` / `.label-copper` — `10px`, bumps to `11px` ≥768px (mono, uppercase, `letter-spacing 0.18em`) |
| `10px` | Small status pills | (mono, uppercase) |

**Headings have no shared size scale — flag as undecided.** `h1–h5` (L235) set family, weight `700`, line-height `0.96`, letter-spacing `-0.025em`, but **no `font-size`**. Every heading is sized inline per component, so there is no ramp to cite — e.g. the landing hero is `clamp(40px, 6.4vw, 84px)` (`HeroCompute.tsx:80`), and other headings pick their own clamps. This is an inconsistency, not a decided scale: a shared display ramp (h1/h2/h3 sizes) does not exist yet and needs to be decided.

Note also the weight mismatch: the base `h1–h5` rule requests weight `700`, while the design intent is Fraunces `~300`. That divergence is part of the font debt, not a settled decision.

---

## Emphasis

Emphasis is carried by **weight, size, or colour — never by slant.**

- **No italic or oblique faces for emphasis.** This includes the italicised-contrast-word-in-a-headline device (e.g. "We don't *guess*").
- **No script, handwritten, or brush faces anywhere** — including decorative annotations and callouts.
- Italic is permitted **only where it carries meaning**: a direct quotation, or a publication/product title. Never for stress or visual interest.
- When Fraunces is introduced as the display face, use **the roman only.** Its italic is out of scope.

---

## Border radii

Read from `app/globals.css` and component usage.

**Token scale** (`:root`, L108–112):

| Token | Value |
|---|---|
| `--r-sm` | `8px` |
| `--r-md` | `14px` |
| `--r-lg` | `22px` |
| `--r-xl` | `32px` |
| `--r-2xl` | `44px` |

**Pills:** `999px` is the settled full-round value (buttons, chips, nav links, badges) — by far the most-used radius (~53 component uses).

**Unified card radius — undecided.** The token scale is barely used: across components the `--r-*` tokens are referenced only a handful of times (`r-sm`/`r-md`/`r-lg` once each), and card-like surfaces pick a hardcoded number instead. What's actually in the codebase for card/panel corners:

| Radius | Where |
|---|---|
| `12px` | ~20 component uses |
| `14px` | `--r-md`; also hardcoded (~14 uses); a couple of globals blocks (L724, L1107) |
| `16px` | ~13 component uses; globals L551 |
| `20px` | ~10 component uses |
| `22px` | `--r-lg`; the card-ish globals blocks at L330/L344 |
| `24px` | globals L715; a couple of components |

So a card can be `12`, `14`, `16`, `20`, `22`, or `24` depending on the file. **There is no single unified card radius today** — it needs to be decided and then applied (ideally by routing every card onto one token). Listing rather than picking, per the brief.

---

## Fonts (intent vs. reality)

**Intent:** Fraunces (display, ~300) · Inter (body) · JetBrains Mono (figures) — the settled landing-page language.

**Reality:** off-spec on every count — see `docs/HARDCODED-PALETTE-AUDIT.md` § Font debt. Unifying `--font-display` / `--font-body` / `--font-mono` onto Fraunces / Inter / JetBrains Mono is the tracked follow-on in `docs/wallet/06-Implementation-Plan.md`.

---

## Motion

Kept: count-up value, gauge fill, staggered rise-in (`.w-rise`), bobbing CIRA button. The verified-vs-estimated animated gauge bar is the signature — keep it central. Dropped: the gold-glint hero.

All motion respects `prefers-reduced-motion` (`.w-rise` is neutralised under it, L299).

---

## Constraints

- **Mobile-first, 375px minimum.** Non-negotiable.
- **Migration direction is toward white/copper only** — never migrate a surface back toward gold `[data-ciq]`.
