'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { PanelFade } from '@/components/ciq/PanelFade'
import { SECTION_TABS } from '@/components/ciq/appNav'

const tabs = SECTION_TABS.travel
const primary = tabs.slice(0, 2)
const secondary = tabs.slice(2)

function activeFor(pathname: string, href: string): boolean {
  if (href === '/trip-planner') return pathname.startsWith('/trip-planner') || pathname.startsWith('/flights')
  return pathname.startsWith(href)
}

export function TravelWorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/trip-planner'

  return (
    <div style={{ minHeight: '100dvh', paddingTop: 14, paddingBottom: 80 }}>
      <div style={{ maxWidth: 1240, width: '100%', margin: '0 auto', padding: '0 20px' }}>
        <div
          style={{
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            gap: 18, paddingBottom: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 650, color: 'var(--ink-2)', marginBottom: 5 }}>Travel</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.45 }}>
              Find the inventory, compare the path, then book with confidence.
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
            Wallet-aware · source-aware
          </div>
        </div>

        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
            borderBottom: '1px solid var(--line)', marginBottom: 18,
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
                    minHeight: 48, padding: '0 18px', textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    color: active ? 'var(--ink)' : 'var(--ink-3)',
                    fontSize: 14, fontWeight: active ? 700 : 600,
                    borderBottom: active ? '2px solid var(--copper)' : '2px solid transparent',
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
