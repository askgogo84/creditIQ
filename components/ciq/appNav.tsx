// components/ciq/appNav.tsx
// Single source of truth for the signed-in app navigation. Three surfaces render
// this same data so their labels, routes and active-state logic can never drift.
import {
  Wallet, Receipt, Plane, CreditCard, User, Home,
  FileCheck, Zap, Star, Map, Sparkles, Target, ArrowLeftRight, Sofa,
  LayoutGrid, Scale, Wand2, Flame, Shield, MessageCircle,
  type LucideIcon,
} from 'lucide-react'

export type AppNavItem = {
  key: string
  label: string
  href: string
  Icon: LucideIcon
  match: (p: string) => boolean
  badge?: string
}

export const APP_NAV: AppNavItem[] = [
  {
    key: 'dashboard', label: 'Dashboard', href: '/dashboard',
    Icon: Home,
    match: p => p === '/dashboard' || p.startsWith('/feed') || p.startsWith('/intelligence'),
  },
  {
    key: 'wallet', label: 'Wallet', href: '/wallet',
    Icon: Wallet,
    match: p => p.startsWith('/wallet') || p.startsWith('/statement-truth'),
  },
  {
    key: 'spend', label: 'Spend Smart', href: '/spend-optimizer',
    Icon: Receipt,
    match: p => p.startsWith('/spend-optimizer') || p.startsWith('/points-optimizer') || p.startsWith('/optimize') || p.startsWith('/smart-match'),
  },
  {
    key: 'travel', label: 'Travel', href: '/trip-planner',
    Icon: Plane,
    match: p => p.startsWith('/trip-planner') || p.startsWith('/travel') || p.startsWith('/flights') || p.startsWith('/hotels') || p.startsWith('/dream-trip') || p.startsWith('/lounge-tracker') || p.startsWith('/sweet-spots') || p.startsWith('/transfer-partners') || p.startsWith('/stay-on-points'),
  },
  {
    key: 'cards', label: 'Cards', href: '/cards',
    Icon: CreditCard,
    match: p => p.startsWith('/cards') || p.startsWith('/card/') || p.startsWith('/compare') || p.startsWith('/best-cards') || p.startsWith('/uae') || p.startsWith('/card-switch') || p.startsWith('/card-roast'),
  },
  {
    key: 'concierge', label: 'Concierge AI', href: '/cira',
    Icon: Sparkles,
    badge: 'AI',
    match: p => p.startsWith('/cira') || p.startsWith('/concierge'),
  },
  {
    key: 'you', label: 'Profile', href: '/profile',
    Icon: User,
    match: p => p.startsWith('/profile') || p.startsWith('/pro'),
  },
]

export type SectionTab = { label: string; href: string; Icon: LucideIcon }

export const SECTION_TABS: Record<string, SectionTab[]> = {
  wallet: [
    { label: 'Your cards', href: '/wallet', Icon: CreditCard },
    { label: 'Statement Truth', href: '/statement-truth', Icon: FileCheck },
  ],
  spend: [
    { label: 'Spend Optimizer', href: '/spend-optimizer', Icon: Zap },
    { label: 'Points Optimizer', href: '/points-optimizer', Icon: Star },
  ],
  travel: [
    { label: 'Flights', href: '/trip-planner', Icon: Plane },
    { label: 'Hotels', href: '/hotels', Icon: Map },
    { label: 'Dream Trip', href: '/dream-trip', Icon: Target },
    { label: 'Ask CIRA', href: '/cira', Icon: Sparkles },
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

export function sectionTabsFor(pathname: string | null): SectionTab[] | null {
  if (!pathname) return null
  const item = APP_NAV.find(i => i.match(pathname))
  return item ? SECTION_TABS[item.key] ?? null : null
}

export const APP_ACTIVE: Record<string, (p: string) => boolean> =
  Object.fromEntries(APP_NAV.map(i => [i.href, i.match]))

export function appActive(href: string, pathname: string | null): boolean {
  if (!pathname) return false
  const item = APP_NAV.find(i => i.href === href)
  return item ? item.match(pathname) : pathname.startsWith(href)
}
