# 04 — UI/UX Brief · Stay on Points

**Reference:** `docs/mockups/hotel-portal-mockup.html` (approved 27 Aug)
**Constraint:** mobile-first, tested at 375px minimum, touch targets ≥ 44px

---

## 1. Design language

Inherits CreditIQ's settled light theme. Do not introduce a new palette.

| Token | Value | Use |
|---|---|---|
| bg | `#FBFAF7` | page |
| surface | `#FFFFFF` | cards, panels |
| ink | `#14181F` | primary text |
| ink-2 | `#5A6270` | secondary |
| ink-3 | `#8A919C` | meta, provenance |
| line | `#E7E3DA` | borders |
| accent | `#B4802F` | primary action, eyebrow |
| good / good-soft | `#1F7A4D` / `#EDF7F1` | points-win verdict |
| warn / warn-soft | `#8A6D3B` / `#FBF5E8` | close-call, cash-wins |
| unknown / unknown-soft | `#6B7280` / `#F3F4F6` | not-published |

**Typography:** system stack. Emphasis comes from weight, size and colour —
**never slant**. No italic anywhere, no script or handwritten faces. Headline
800 weight, −0.02em tracking. Numbers 800 weight so they read as data.

## 2. Layout

Single column to 760px, two columns above. Max width 430px mobile / 960px
desktop. The card is the unit — it must be legible and complete in isolation,
because it will be screenshotted and shared.

## 3. Component inventory

| Component | Notes |
|---|---|
| `SearchModes` | 4 pill tabs, horizontally scrollable on mobile, selected = filled ink |
| `SearchPanel` | swaps fields by mode; 16px inputs to prevent iOS zoom |
| `BalanceStrip` | dark inset card, points balance + change link |
| `ChainFilter` | scrollable chips; **status dot** — green = computable, grey = not published |
| `FxNote` | accent-soft callout explaining why the euro rate is the margin |
| `HotelCard` | photo, identity, verdict band, coverage line, provenance, actions |
| `VerdictBand` | the headline; colour by state; the visual centre of the card |
| `PointsCashSplit` | 3-col grid: points \| VS \| cash |
| `CoverageLine` | plain sentence, bold on the number that matters |
| `ProvenanceRow` | dot + source text; dot colour matches the honesty tier |
| `MathsPanel` | expands in place, one row per input with its source |

## 4. The verdict band is the design

Everything else is supporting. It gets the colour, the largest type after the
hotel name, and the top of the card's lower half. A user scrolling a list
should be able to read only the bands and get the answer.

## 5. Honesty in the UI — non-negotiable

This page states rupee figures people will act on. The display rules from
commits a87710ce and 022cf548 apply without exception:

- An unknown value renders `--`, never `0`, never an estimate
- The "est" suffix means **we estimated it**, not **we don't know it**. Never
  attach it to an unknown.
- Provenance dot on every card: green = live/published, amber = estimated,
  grey = unknown
- Cash rates show their age when older than an hour ("captured 2 days ago")
- Photos carry a source label rendered on the image itself
- `CASH_WINS` is presented as useful advice, not an error

## 6. Empty and error states

| State | Copy direction |
|---|---|
| No results | Name the cities actually covered in v1. Do not imply broader coverage. |
| FX down | "We can't convert to rupees right now, so we're not going to guess." Points cost still shown. |
| No balance | "Add your points balance to see what this covers." → `/wallet` |
| Chain not computable | "Marriott prices awards by date, so we can't tell you the points cost without checking availability. We'd rather show nothing than guess." |

## 7. Mobile specifics

- Search modes and chain chips scroll horizontally, never wrap to two rows
- The points/cash split stays 3-column at 375px — it is the comparison, it must
  not stack
- Card photo 170px tall; do not grow it on mobile at the expense of the verdict
- Sticky nothing. The page is short enough.

## 8. Accessibility

- Verdict is never colour-only — the headline text states it
- 4.5:1 contrast minimum on all text
- Tabs are real buttons with `role="tab"` and `aria-selected`
- Chips use `aria-pressed`
