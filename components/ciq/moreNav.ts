// components/ciq/moreNav.ts
// DEAD (as of the signed-in IA cut, docs/00-SIGNED-IN-IA.md §2/§3): no signed-in
// surface renders these groups any more. The AppRail "More" section and the
// Header signed-in "More" dropdown were removed; the ~20 destinations here now
// fold into the five primary app-nav matchers in appNav.tsx, and Blog/Glossary
// move to the public footer. Kept in place (not deleted) only because this data
// still mirrors the old marketing Header dropdowns and may be repurposed. Safe to
// delete once nothing references it.
//
// (Historical) Single source of truth for the "More" navigation groups. Both nav
// surfaces imported this data but rendered it with platform-appropriate UI:
//   - MOBILE  -> components/ciq/TabBar.tsx renders a full-screen sheet.
//   - DESKTOP -> components/Header.tsx renders a hover/click dropdown.
// The groups mirror the old marketing Header dropdowns (Header.tsx @ 2cbc6fe8)
// so the 16 feature pages orphaned by the nav-identity fix are reachable again.

import { CARD_COUNT } from '@/lib/catalogue-stats'

export type MoreLink = {
  label: string
  href: string
  icon: string
  desc?: string
  badge?: string
}

export type MoreGroup = {
  title: string
  links: MoreLink[]
}

export const MORE_GROUPS: MoreGroup[] = [
  {
    title: 'Discover',
    links: [
      { label: 'Home', href: '/', icon: '🏠', desc: 'Find your perfect card in 90s' },
      { label: 'Sweet Spots', href: '/sweet-spots', icon: '💎', desc: '8 best redemption strategies' },
      { label: 'Blog', href: '/blog', icon: '📝', desc: 'Honest card reviews & guides' },
      { label: 'Glossary', href: '/glossary', icon: '📖', desc: 'Every credit card term explained' },
      { label: 'Devaluation Tracker', href: '/blog/credit-card-devaluations-india-2026', icon: '⚠️', desc: 'Every 2026 benefit cut tracked' },
    ],
  },
  {
    title: 'Cards',
    links: [
      { label: 'All Cards', href: '/cards', icon: '💳', desc: `${CARD_COUNT} cards ranked honestly` },
      { label: 'Compare', href: '/compare', icon: '⚖️', desc: 'Side by side comparison' },
      { label: 'Best Travel', href: '/best-cards/travel', icon: '✈️', desc: 'Top cards for travel' },
      { label: 'Best Cashback', href: '/best-cards/cashback', icon: '💰', desc: 'Maximum cashback cards' },
      { label: 'UAE Cards', href: '/uae', icon: '🇦🇪', desc: 'Cards for UAE residents' },
    ],
  },
  {
    title: 'AI Tools',
    links: [
      { label: 'Card Roast', href: '/card-roast', icon: '🔥', desc: 'Get a brutal A-F grade on your card', badge: 'NEW' },
      { label: 'Spend Optimizer', href: '/spend-optimizer', icon: '⚡', desc: 'Find the one card for your spend' },
      { label: 'Points Optimizer', href: '/points-optimizer', icon: '💎', desc: 'Find sweet spots worth Rs.3+/pt' },
      { label: 'Statement Truth', href: '/statement-truth', icon: '📋', desc: 'Upload statement, see the real rate' },
      { label: 'Switch Wizard', href: '/card-switch', icon: '↔', desc: 'Should you switch? 4 questions.' },
      { label: 'Travel AI', href: '/travel', icon: '✈', desc: 'Chat about miles + transfers', badge: 'BETA' },
      { label: 'Lounge Tracker', href: '/lounge-tracker', icon: '🛋', desc: 'Never get turned away at the gate' },
    ],
  },
  {
    title: 'Travel',
    links: [
      { label: 'Trip Planner', href: '/trip-planner', icon: '🗺️', desc: 'Plan with your points' },
      { label: 'Travel AI', href: '/travel', icon: '✈️', desc: 'Chat about miles + transfers' },
      { label: 'Lounge Tracker', href: '/lounge-tracker', icon: '🛋️', desc: 'Never get turned away' },
    ],
  },
]
