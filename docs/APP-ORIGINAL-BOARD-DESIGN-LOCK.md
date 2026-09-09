# CreditIQ App — Original Board Design Lock

Status: **DESIGN SOURCE OF TRUTH**

The four approved CreditIQ mobile design boards shared on 2026-09-09 are the visual specification for the app prototype and subsequent mobile implementation.

## Non-negotiable rule

Do not reinterpret, simplify, modernise, restyle, or replace the approved board composition with a generic design system. Existing implementation components are functional scaffolding only. If code and an approved board disagree visually, the approved board wins.

## Canonical screens represented by the boards

1. Launch / splash
2. Wallet value story
3. Privacy
4. Add cards
5. Sign in
6. Bring balances
7. Choose goals
8. First CIRA opportunity
9. Home
10. Wallet
11. Spend Smart
12. CIRA
13. Flights
14. Hotels
15. Cards
16. My Account / Menu

## Visual rules to enforce

- Midnight/navy full-screen surfaces, not generic black panels.
- Warm ivory/cream setup surfaces where shown in the boards.
- Champagne-gold accents and CTAs; no unrelated accent colours.
- Editorial serif headlines at the same relative scale and line breaks as the boards.
- Scenic travel imagery is part of the information hierarchy, not decorative background filler.
- Credit-card artwork must be large, realistic, layered and proportioned like the boards.
- Dark glass information cards use thin low-contrast borders and compact premium spacing.
- CIRA is a luminous circular/orb treatment and remains a central product character.
- Bottom navigation proportions follow the approved boards; CIRA remains the visually dominant centre action where the six-item navigation is used.
- Do not allow global website typography/theme CSS to override app-preview contrast or typography.
- Primary setup CTAs remain visible without scrolling on supported phone viewports.
- Desktop review mode scales the phone composition to the viewport; it must not redesign the phone layout for desktop.

## Fidelity requirement

Review at 360px, 375px, 390px, 430px and a laptop-height browser. A screen is not considered complete merely because it uses the same colours. Composition, imagery, type scale, spacing, card proportions, and visual hierarchy must visibly match the approved board.

## Travel/data boundary

The visual design may show example values in design-only mock states, but live/investor-demo search screens must preserve CreditIQ truth rules:

- live vs cached is explicit;
- missing fare is not replaced by a demo fare;
- unknown taxes remain unknown;
- projected vs executable redemption paths stay separate;
- irreversible transfers require explicit verification;
- domestic flight/hotel search cannot be called complete until production providers return real inventory across representative India routes and cities.
