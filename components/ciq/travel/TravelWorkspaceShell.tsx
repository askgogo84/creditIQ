'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { Plane, Map, Sparkles, Target, ArrowLeftRight, Sofa, type LucideIcon } from 'lucide-react'
import { PanelFade } from '@/components/ciq/PanelFade'

type TravelTab = { label: string; href: string; Icon: LucideIcon }

const primary: TravelTab[] = [
  { label: 'Flights', href: '/trip-planner', Icon: Plane },
  { label: 'Hotels', href: '/hotels', Icon: Map },
]

const secondary: TravelTab[] = [
  { label: 'Ask AI', href: '/travel', Icon: Sparkles },
  { label: 'Sweet Spots', href: '/sweet-spots', Icon: Target },
  { label: 'Transfer Partners', href: '/transfer-partners', Icon: ArrowLeftRight },
  { label: 'Lounges', href: '/lounge-tracker', Icon: Sofa },
]

function activeFor(pathname: string, href: string): boolean {
  if (href === '/trip-planner') return pathname.startsWith('/trip-planner') || pathname.startsWith('/flights')
  if (href === '/hotels') return pathname.startsWith('/hotels') || pathname.startsWith('/stay-on-points')
  return pathname.startsWith(href)
}

export function TravelWorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/trip-planner'

  return (
    <div style={{ minHeight: '100dvh', paddingTop: 16, paddingBottom: 80 }}>
      <div style={{ width: '100%', padding: '0 clamp(20px, 2.6vw, 48px)' }}>
        <div
          style={{
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            gap: 18, paddingBottom: 14,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 5 }}>Travel intelligence</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.45 }}>
              Search live supply, compare every route, then act with confidence.
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
            Wallet-aware · provider-transparent
          </div>
        </div>

        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
            border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)',
            boxShadow: 'var(--shadow-sm)', marginBottom: 26, padding: '0 6px',
          }}
        >
          <nav aria-label="Travel modes" style={{ display: 'flex', alignItems: 'stretch', minWidth: 0 }}>
            {primary.map(({ label, href, Icon }) => {
              const active = activeFor(pathname, href)
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch
                  aria-current={active ? 'page' : undefined}
                  style={{
                    minHeight: 50, padding: '0 18px', textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    fontSize: 14, fontWeight: active ? 700 : 600,
                    borderRadius: 10,
                    background: active ? 'var(--ink)' : 'transparent',
                    color: active ? 'var(--surface)' : 'var(--ink-3)',
                  }}
                >
                  <Icon size={17} strokeWidth={1.8} />
                  {label}
                </Link>
              )
            })}
          </nav>

          <nav
            aria-label="Travel tools"
            style={{ display: 'flex', alignItems: 'center', gap: 2, overflowX: 'auto', paddingBottom: 1 }}
          >
            {secondary.map(({ label, href }) => {
              const active = activeFor(pathname, href)
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch
                  aria-current={active ? 'page' : undefined}
                  style={{
                    minHeight: 40, padding: '0 9px', textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap',
                    color: active ? 'var(--copper)' : 'var(--ink-3)',
                    fontSize: 12, fontWeight: active ? 700 : 550,
                  }}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        <PanelFade fill>{children}</PanelFade>
      </div>
    </div>
  )
}
