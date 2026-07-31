// components/ciq/appNav.tsx
// Single source of truth for the signed-in app navigation. Three surfaces render
// this same data so their labels, routes and active-state logic can never drift:
//   - components/ciq/AppRail.tsx  — desktop left rail (>=900px)
//   - components/ciq/TabBar.tsx   — mobile bottom bar (<900px)
//   - components/Header.tsx       — signed-in top nav on pages not yet migrated
//                                    into the (shell) route group
// Grouped secondary tools stay in components/ciq/moreNav.ts (MORE_GROUPS).
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
    match: p => p.startsWith('/dashboard'),
  },
  {
    key: 'cards', label: 'Cards', href: '/my-cards',
    icon: c => <><rect x="2" y="5" width="20" height="14" rx="2.5" stroke={c} strokeWidth="1.7" /><path d="M2 10h20" stroke={c} strokeWidth="1.7" /></>,
    match: p => p.startsWith('/my-cards') || p.startsWith('/cards') || p.startsWith('/card/') || p.startsWith('/compare'),
  },
  {
    key: 'feed', label: 'Feed', href: '/feed',
    icon: c => <path d="M4 6h16M4 12h16M4 18h10" stroke={c} strokeWidth="1.7" strokeLinecap="round" />,
    match: p => p.startsWith('/feed') || p.startsWith('/intelligence'),
  },
  {
    key: 'travel', label: 'Travel', href: '/trip-planner',
    icon: c => <path d="m3 11 19-9-9 19-2-8-8-2Z" stroke={c} strokeWidth="1.7" strokeLinejoin="round" />,
    match: p => p.startsWith('/trip-planner') || p.startsWith('/flights') || p.startsWith('/travel') || p.startsWith('/lounge-tracker'),
  },
  {
    key: 'optimize', label: 'Optimize', href: '/optimize',
    icon: c => <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke={c} strokeWidth="1.7" strokeLinejoin="round" />,
    match: p => p.startsWith('/optimize') || p.startsWith('/points-optimizer') || p.startsWith('/spend-optimizer') || p.startsWith('/smart-match') || p.startsWith('/statement-truth') || p.startsWith('/card-switch') || p.startsWith('/card-roast'),
  },
  {
    key: 'you', label: 'You', href: '/profile',
    icon: c => <><circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.7" /><path d="M4 21a8 8 0 0 1 16 0" stroke={c} strokeWidth="1.7" strokeLinecap="round" /></>,
    match: p => p.startsWith('/profile'),
  },
]

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
