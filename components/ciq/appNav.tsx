// components/ciq/appNav.tsx
// Single source of truth for the signed-in app navigation. Three surfaces render
// this same data so their labels, routes and active-state logic can never drift:
//   - components/ciq/AppRail.tsx  — desktop left rail (>=900px)
//   - components/ciq/TabBar.tsx   — mobile bottom bar (<900px)
//   - components/Header.tsx       — signed-in top nav on pages not yet migrated
//                                    into the (shell) route group
//
// IA: docs/00-SIGNED-IN-IA.md §2/§3 cuts the signed-in nav from ~26 destinations
// to a handful of primary ones. Every former destination that lost its nav entry
// folds into one of the matchers below, so it still lights a tab and stays
// reachable — no orphaned pages, no 404s. The grouped secondary directory
// (moreNav.ts / MORE_GROUPS) is no longer rendered on any signed-in surface;
// Blog + Glossary move to the public footer.
//
// HOME IS DEFERRED. The IA's sixth destination, "Home" ("what should I do next?"),
// has no surface yet — it will grow out of the current /dashboard wallet and split
// off it. We deliberately do NOT add a Home entry pointing at /dashboard now:
// Wallet already owns /dashboard, and a second entry on the same href would
// collide on the React list key (all consumers key on item.href) AND double-light,
// since appActive() is href-based. Add Home here when the Home build ships. Until
// then its bound routes (/feed, /intelligence) fold under Wallet — the /dashboard
// surface they live on today.
import type { ReactNode } from 'react'

export type AppNavItem = {
  key: string
  label: string
  href: string
  // Icon drawn in a 24x24 viewBox. `color` is applied to the stroke so each
  // surface can tint its own active state with its own token (gold in the ciq
  // TabBar, copper in the app rail) without forking the path data.
  icon: (color: string) => ReactNode
  // Which paths fold into this destination so the tab stays lit — marketing
  // routes like /flights or /compare belong to a primary app tab.
  match: (p: string) => boolean
}

export const APP_NAV: AppNavItem[] = [
  {
    key: 'wallet', label: 'Wallet', href: '/dashboard',
    icon: c => <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2v-9Z" stroke={c} strokeWidth="1.7" strokeLinejoin="round" />,
    // Holdings ledger — the real, shipped wallet (WalletView / HeroGauge / CardRow /
    // 2-step tour). Folds: /my-cards (legacy gold card-list, not yet migrated),
    // /statement-truth (verification happens inside Wallet, IA §3), and /feed +
    // /intelligence (Feed → Home's "what changed" column; Home unbuilt, so these
    // fold onto the /dashboard surface they'll grow from — move to Home when it ships).
    match: p => p.startsWith('/dashboard') || p.startsWith('/my-cards') || p.startsWith('/statement-truth') || p.startsWith('/feed') || p.startsWith('/intelligence'),
  },
  {
    key: 'spend', label: 'Spend', href: '/spend-optimizer',
    icon: c => <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" stroke={c} strokeWidth="1.7" strokeLinejoin="round" />,
    // Lands on the Spend Optimizer (the "which card for this purchase" surface),
    // which is the default section tab. Points Optimizer is the other tab; /optimize
    // (a redemption tool) and /smart-match still light Spend but are orphaned tools
    // pending the Spend rebuild (IA §3).
    match: p => p.startsWith('/spend-optimizer') || p.startsWith('/points-optimizer') || p.startsWith('/optimize') || p.startsWith('/smart-match'),
  },
  {
    key: 'travel', label: 'Travel', href: '/trip-planner',
    icon: c => <path d="m3 11 19-9-9 19-2-8-8-2Z" stroke={c} strokeWidth="1.7" strokeLinejoin="round" />,
    // Travel AI = the search itself; Sweet Spots / Transfer Partners / Lounges /
    // Trip Planner = tabs & modes within Travel (IA §3).
    match: p => p.startsWith('/trip-planner') || p.startsWith('/travel') || p.startsWith('/flights') || p.startsWith('/lounge-tracker') || p.startsWith('/sweet-spots') || p.startsWith('/transfer-partners'),
  },
  {
    key: 'cards', label: 'Cards', href: '/cards',
    icon: c => <><rect x="2" y="5" width="20" height="14" rx="2.5" stroke={c} strokeWidth="1.7" /><path d="M2 10h20" stroke={c} strokeWidth="1.7" /></>,
    // Public catalogue. Compare / Best-of / UAE = filters; Switch Wizard hangs off a
    // comparison; Card Roast's route is card-focused so it folds here (its Home entry
    // card stays a link, not a route match — IA §3).
    match: p => p.startsWith('/cards') || p.startsWith('/card/') || p.startsWith('/compare') || p.startsWith('/best-cards') || p.startsWith('/uae') || p.startsWith('/card-switch') || p.startsWith('/card-roast'),
  },
  {
    key: 'you', label: 'You', href: '/profile',
    icon: c => <><circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.7" /><path d="M4 21a8 8 0 0 1 16 0" stroke={c} strokeWidth="1.7" strokeLinecap="round" /></>,
    // Account, plan, remaining searches & WhatsApp connect. Pro/Billing folds here.
    match: p => p.startsWith('/profile') || p.startsWith('/pro'),
  },
]

export type SectionTab = { label: string; href: string }

// In-page ("section") navigation — the tabs rendered INSIDE each destination so the
// features folded into it (IA §3) stay one click away. This is the entry point that
// replaces the deleted MORE_GROUPS directory; a nav cut is not done until these exist.
//
// HARD RULE: every href here is a SHELL-NATIVE route (under app/(shell)/). A tab must
// never point at a page that renders its own marketing <Header> — that drops the user
// out of the app shell (no rail, no tab bar, no way back), which is worse than no tab.
// Deliberately excluded for this reason (still reachable by URL, tracked as orphans
// until the per-surface rebuilds migrate them into (shell)):
//   /flights, /best-cards/*, /uae, /smart-match  — render the marketing Header.
//   /optimize                                     — superseded redemption tool.
// Best Travel / Best Cashback are already reachable in-shell via the category chips
// on /cards, so they need no tab. Keyed by APP_NAV.key.
export const SECTION_TABS: Record<string, SectionTab[]> = {
  wallet: [
    { label: 'Your cards', href: '/dashboard' },
    { label: 'Statement Truth', href: '/statement-truth' },
  ],
  spend: [
    { label: 'Spend Optimizer', href: '/spend-optimizer' },
    { label: 'Points Optimizer', href: '/points-optimizer' },
  ],
  travel: [
    { label: 'Trip Planner', href: '/trip-planner' },
    { label: 'Ask AI', href: '/travel' },
    { label: 'Sweet Spots', href: '/sweet-spots' },
    { label: 'Transfer Partners', href: '/transfer-partners' },
    { label: 'Lounges', href: '/lounge-tracker' },
  ],
  cards: [
    { label: 'All Cards', href: '/cards' },
    { label: 'Compare', href: '/compare' },
    { label: 'Switch Wizard', href: '/card-switch' },
    { label: 'Card Roast', href: '/card-roast' },
  ],
  you: [
    { label: 'Profile', href: '/profile' },
    { label: 'Plan & searches', href: '/pro' },
    { label: 'WhatsApp', href: '/profile#whatsapp' },
  ],
}

// Section tabs for a pathname, or null if the route belongs to no destination.
export function sectionTabsFor(pathname: string | null): SectionTab[] | null {
  if (!pathname) return null
  const item = APP_NAV.find(i => i.match(pathname))
  return item ? SECTION_TABS[item.key] ?? null : null
}

// Legacy shape kept for Header: href -> matcher. Same keys the Header used before
// the lift, so its call sites are unchanged.
export const APP_ACTIVE: Record<string, (p: string) => boolean> =
  Object.fromEntries(APP_NAV.map(i => [i.href, i.match]))

// Is the given app-nav href the active destination for this pathname?
export function appActive(href: string, pathname: string | null): boolean {
  if (!pathname) return false
  const item = APP_NAV.find(i => i.href === href)
  return item ? item.match(pathname) : pathname.startsWith(href)
}
