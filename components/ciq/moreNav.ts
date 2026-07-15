// components/ciq/moreNav.ts
// Single source of truth for the "More" navigation groups. Both nav surfaces
// import this data but render it with platform-appropriate UI:
//   - MOBILE  -> components/ciq/TabBar.tsx renders a full-screen sheet.
//   - DESKTOP -> components/Header.tsx renders a hover/click dropdown.
// The groups mirror the old marketing Header dropdowns (Header.tsx @ 2cbc6fe8)
// so the 16 feature pages orphaned by the nav-identity fix are reachable again.

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
      { label: 'All Cards', href: '/cards', icon: '💳', desc: '100+ cards ranked honestly' },
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
