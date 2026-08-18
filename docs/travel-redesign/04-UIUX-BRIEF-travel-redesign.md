# UI/UX Brief — Travel redesign

**Status:** draft for review · 18 Aug 2026

---

## Design principles for this page

1. **One question, one answer, one action.** If an element does not help the user choose
   a row or act on it, delete it.
2. **Progressive disclosure.** The collapsed row carries the decision. The expand carries
   the explanation. Nothing carries both.
3. **One frame per group.** A bordered element never sits inside another bordered
   element — same rule applied to the wallet restack.
4. **Provenance is visual, not just textual.** Verified, community-reported and estimated
   look different, consistently, everywhere.

## System

Existing tokens only. No new palette.

- **Ground:** white / cream. **Ink:** navy. **Accent:** copper, CTA only.
- **Provenance:** verified green, cached amber, estimated grey — the semantic set already
  in the design system. Never decorative, never a CTA colour.
- **Type:** the shipped light-system faces. **No italics anywhere** — emphasis comes from
  weight, size or colour.
- **Radius:** `--r-lg` on containers. **Padding:** 24 for the search band, 18 everywhere
  else. Two values, no others.
- **No shadows** except the one already used on the search band.

## Layout

**375px first.** This page is where a user sits with their phone deciding whether to burn
80,000 points. It has to work there before it works anywhere.

### Search band

Desktop: one row — From · ⇄ · To · Date · ±days · Cabin · Search.
Mobile: From and To stacked full width, then Date and ±days side by side, then Cabin,
then a full-width Search button. Airport fields are search-select, not free text.

Sticky on scroll once results exist, collapsed to a single summary line the user can tap
to reopen: `BLR → DXB · 21 Aug ±3 · All cabins`.

### Filter row

Horizontally scrollable chips on mobile with the edge-fade treatment already built for
SectionTabs. All cards / My cards sits right-aligned on desktop, first chip on mobile.

### Result row

Desktop is a table. **Mobile is not.** A table with seven columns at 375px is the defect
that made the wallet card rows collapse. On mobile each row becomes a card:

```
┌─────────────────────────────────────────┐
│ 18 Aug Tue          Air India · Maharaja │
│ BLR → DXB   10:30 → 13:30 · 4h 30m       │
│                                           │
│ Economy 20,000        Business 45,000     │
│ ─────────────────────────────────────────│
│ 40,000 pts + ₹3,116                       │
│ HDFC Regalia  [In wallet]                 │
└─────────────────────────────────────────┘
```

Card name never truncates before the route does. Tap target 44px minimum.

### Expanded row

Opens inline beneath its own row, pushing the list down — not a modal, not a drawer.
The user keeps their place in the list.

Three blocks with a hairline between them, no nested frames. The transfer ladder is a
plain stacked list, one route per line, ratio and duration inline.

The `Show cash price` button is copper (it's an action). The `Book on <programme>`
button is copper and full-width at 375px.

## Progress treatment

While searching, a single line with a determinate bar:

```
Searching · Air India · Maharaja Club · 3 of 8 programmes · 14%
```

Determinate, because the total is known. No indeterminate spinner — this search takes
long enough that an unbounded spinner reads as broken.

## Copy rules

- Plain numbers, no strategy paragraphs. If a sentence is needed, it is one sentence.
- Never "estimated" next to a live figure without saying which is which.
- The don't-redeem verdict is stated as plainly as the redeem one. It is not a footnote.
- No exclamation marks, no "smartest way", no "unlock". The page states facts.

## Accessibility

- Every provenance state has a text label, not colour alone.
- The expand is a real disclosure control, keyboard reachable, state announced.
- Contrast: all provenance colours already clear 4.5:1 on both grounds — do not retune
  them for this page.

## Explicit anti-patterns

- No second search form anywhere on the page.
- No summary card restating what the list already says.
- No more than one outbound link per row.
- No animated width transitions on new elements (this codebase has an unresolved
  transform-transition defect).
- No modal over the results list.
