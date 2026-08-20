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
import {
  Wallet, Receipt, Plane, CreditCard, User,
  FileCheck, Zap, Star, Map, Sparkles, Target, ArrowLeftRight, Sofa,
  LayoutGrid, Scale, Wand2, Flame, Shield, MessageCircle,
  type LucideIcon,
} from 'lucide-react'

export type AppNavItem = {
  key: string
  label: string
  href: string
  // A self-contained lucide-react icon component — the SINGLE source every nav
  // surface renders (TabBar, AppRail, and the TabBar the Header injects on
  // mobile), so the glyph can never diverge from the label across viewports.
  // Each surface passes its own size / strokeWidth / active `color` token (gold
  // in the ciq TabBar, copper in the rail); the glyph data itself lives here once.
  Icon: LucideIcon
  // Which paths fold into this destination so the tab stays lit — marketing
  // routes like /flights or /compare belong to a primary app tab.
  match: (p: string) => boolean
}

export const APP_NAV: AppNavItem[] = [
  {
    key: 'wallet', label: 'Wallet', href: '/dashboard',
    Icon: Wallet,
    // Holdings ledger — the real, shipped wallet (WalletView / HeroGauge / CardRow /
    // 2-step tour). Folds: /statement-truth (verification happens inside Wallet, IA §3),
    // and /feed + /intelligence (Feed → Home's "what changed" column; Home unbuilt, so
    // these fold onto the /dashboard surface they'll grow from — move to Home when it
    // ships). (/my-cards retired — it was an unreachable legacy dup of /dashboard.)
    match: p => p.startsWith('/dashboard') || p.startsWith('/statement-truth') || p.startsWith('/feed') || p.startsWith('/intelligence'),
  },
  {
    key: 'spend', label: 'Spend', href: '/spend-optimizer',
    Icon: Receipt,
    // Lands on the Spend Optimizer (the "which card for this purchase" surface),
    // which is the default section tab. Points Optimizer is the other tab; /optimize
    // (a redemption tool) and /smart-match still light Spend but are orphaned tools
    // pending the Spend rebuild (IA §3).
    match: p => p.startsWith('/spend-optimizer') || p.startsWith('/points-optimizer') || p.startsWith('/optimize') || p.startsWith('/smart-match'),
  },
  {
    key: 'travel', label: 'Travel', href: '/trip-planner',
    Icon: Plane,
    // Travel AI = the search itself; Sweet Spots / Transfer Partners / Lounges /
    // Trip Planner = tabs & modes within Travel (IA §3).
    match: p => p.startsWith('/trip-planner') || p.startsWith('/travel') || p.startsWith('/flights') || p.startsWith('/lounge-tracker') || p.startsWith('/sweet-spots') || p.startsWith('/transfer-partners'),
  },
  {
    key: 'cards', label: 'Cards', href: '/cards',
    Icon: CreditCard,
    // Public catalogue. Compare / Best-of / UAE = filters; Switch Wizard hangs off a
    // comparison; Card Roast's route is card-focused so it folds here (its Home entry
    // card stays a link, not a route match — IA §3).
    match: p => p.startsWith('/cards') || p.startsWith('/card/') || p.startsWith('/compare') || p.startsWith('/best-cards') || p.startsWith('/uae') || p.startsWith('/card-switch') || p.startsWith('/card-roast'),
  },
  {
    key: 'you', label: 'You', href: '/profile',
    Icon: User,
    // Account, plan, remaining searches & WhatsApp connect. Pro/Billing folds here.
    match: p => p.startsWith('/profile') || p.startsWith('/pro'),
  },
]

// Icon: a lucide-react component — the SAME vocabulary APP_NAV uses, so the section strip
// and the primary nav render one icon set and can never diverge. The strip passes its own
// size / strokeWidth and the active `color` token; the glyph lives here once.
export type SectionTab = { label: string; href: string; Icon: LucideIcon }

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
    { label: 'Your cards', href: '/dashboard', Icon: CreditCard },
    { label: 'Statement Truth', href: '/statement-truth', Icon: FileCheck },
  ],
  spend: [
    { label: 'Spend Optimizer', href: '/spend-optimizer', Icon: Zap },
    { label: 'Points Optimizer', href: '/points-optimizer', Icon: Star },
  ],
  travel: [
    { label: 'Fly on Points', href: '/trip-planner', Icon: Map },
    { label: 'Ask AI', href: '/travel', Icon: Sparkles },
    { label: 'Sweet Spots', href: '/sweet-spots', Icon: Target },
    { label: 'Transfer Partners', href: '/transfer-partners', Icon: ArrowLeftRight },
    { label: 'Lounges', href: '/lounge-tracker', Icon: Sofa },
  ],
  cards: [
    { label: 'All Cards', href: '/cards', Icon: LayoutGrid },
    { label: 'Compare', href: '/compare', Icon: Scale },
    { label: 'Switch Wizard', href: '/card-switch', Icon: Wand2 },
    { label: 'Card Roast', href: '/card-roast', Icon: Flame },
  ],
  you: [
    { label: 'Profile', href: '/profile', Icon: User },
    { label: 'Plan & searches', href: '/pro', Icon: Shield },
    { label: 'WhatsApp', href: '/profile#whatsapp', Icon: MessageCircle },
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
