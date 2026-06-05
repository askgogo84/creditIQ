# CreditIQ Mobile App Build Handoff

Use this document to hand off the mobile app build to Claude or another coding agent.

## Repo And Current Preview

- Repo: `C:\Users\gover\creditIQ\creditIQ`
- Mockup route: `app/mobile-mockups/page.tsx`
- Preview URL while dev server is running: `http://localhost:3001/mobile-mockups`
- Brand logo asset: `public/creditiq_logo_512.png`
- Technical/product spec: `qa-notes/creditiq-mobile-app-technical-breakup.md`
- CIRA preview image: `qa-notes/mobile-mockups-cira-screen.png`
- Overview preview images:
  - `qa-notes/mobile-mockups-preview.png`
  - `qa-notes/mobile-mockups-cira-preview.png`
  - `qa-notes/mobile-mockups-dashboard-preview.png`

## Build Goal

Build the CreditIQ mobile app experience from the approved mockup direction. Do not copy SaveSage. Use the competitor screenshots only as a UX reference and gap analysis.

CreditIQ should feel like a premium, trustworthy, AI-powered credit operating system:

- One app for cards, reward points, bills, offers, travel redemption, statement checks, credit decisions, and CIRA.
- CIRA must be the center of the app experience, including the centered bottom-nav action.
- Use the CreditIQ website color direction: cream/light surfaces, deep navy, copper/gold accents, emerald success, and restrained blue for action states.
- Use the real CreditIQ logo from `public/creditiq_logo_512.png`.

## Current Recommended IA

Use five primary tabs:

1. Home
2. Cards
3. CIRA, centered and elevated
4. Scan
5. Rewards

CIRA should not feel like a normal tab. It is the app intelligence layer. It should appear in the nav center, as an assistant on Home, and contextually inside cards, scan, rewards, alerts, and statement flows.

## MVP Screens To Build First

Start by converting the mockups into real app screens/components:

1. Splash / Trust
2. OTP Login
3. Intent Selection
4. Add First Card
5. Home Command Center
6. Cards Dashboard
7. Card Detail
8. Scan & Save
9. Travel & Rewards
10. CIRA Assistant
11. Action Center
12. Privacy Center

The mockup route already contains static React/Tailwind versions of these screens. Treat it as the design source, then refactor into reusable app components.

## Design Requirements

- CIRA must be centered in bottom navigation.
- CIRA logo should use a subtle animation inspired by the CreditIQ website: floating, shimmer, pulse rings, online dot, and typing dots.
- Avoid SaveSage-style dark-only UI. CreditIQ should feel lighter, more transparent, and more premium.
- Forms and trust-heavy screens should be light.
- Data/value cards may use dark navy panels for contrast.
- Keep copy short and specific.
- No broad permission asks during onboarding. Use progressive trust.
- No visible "how to use this app" tutorial text unless a screen truly needs it.

## Component Priorities

Build reusable components:

- `AppPhoneShell` or app-level mobile shell
- `BottomNav` with centered CIRA
- `CiraOrb`
- `CiraPromptBar`
- `ActionCard`
- `CreditCardVisual`
- `InsightCard`
- `RewardValueCard`
- `PermissionExplainer`
- `EmptyState`
- `LightCard`
- `DarkPanel`

## Suggested Implementation Plan

Phase 1: UI foundation

- Move mockup-only components into reusable component files.
- Define design tokens for colors, spacing, radii, shadows, and typography.
- Build the app shell and bottom nav.
- Build CIRA animated center action.

Phase 2: Static app screens

- Implement the 12 MVP screens as navigable routes or tab states.
- Use mock data first.
- Make sure mobile layout works at 360px, 375px, 390px, and 430px widths.

Phase 3: Data integration

- Wire current repo APIs/Supabase only after the UI flow is stable.
- Start with manual card entry, card dashboard, and CIRA chat.
- Keep email/SMS permissions optional and contextual.

Phase 4: Real product flows

- Add card recommendation flow.
- Add card reward-value calculator.
- Add Statement Truth upload/review flow.
- Add devaluation alerts.
- Add Scan & Save merchant/card recommendation.

## Verification Already Done

The current mockup route passed:

```bash
npx tsc --noEmit --pretty false
```

Screenshots were captured with Playwright and are stored in `qa-notes`.

## Important Existing Build Note

`npm run build` may fail on an existing unrelated `/icon` prerender issue in the repo involving `@vercel/og` and `Invalid URL`. Do not confuse that with the mobile mockup route. The mockup route itself type-checks.

## Prompt To Give Claude

Paste this:

```text
You are building the CreditIQ mobile app UI from the existing Next.js repo.

Repo path: C:\Users\gover\creditIQ\creditIQ

Read these first:
- qa-notes/claude-mobile-app-build-handoff.md
- qa-notes/creditiq-mobile-app-technical-breakup.md
- app/mobile-mockups/page.tsx
- CLAUDE.md

Use public/creditiq_logo_512.png as the brand logo.

Task:
Convert the static mobile mockup route into a production-ready mobile app UI foundation. Create reusable components for the phone/app shell, centered CIRA bottom nav, CIRA animated orb, cards, action cards, reward-value cards, and prompt bar. Preserve the CreditIQ website-inspired visual direction: cream surfaces, deep navy, copper/gold, emerald success, and centered CIRA. Do not copy SaveSage; use it only as competitor reference. Start with mock data and static UI. After implementation, run TypeScript validation and provide the local URL plus changed file summary.
```

