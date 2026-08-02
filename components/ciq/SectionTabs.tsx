'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { sectionTabsFor } from '@/components/ciq/appNav'

// In-page navigation for each signed-in destination. NavShell renders this once at
// the top of the shell content, so every destination — and every shell sub-page
// folded into it — surfaces its sibling features as tabs (see the "In-page
// navigation map" in docs/00-SIGNED-IN-IA.md). Presentational only: each tab is a
// Link to an existing page, no surface is merged or rewritten. Renders nothing on
// routes that belong to no destination.
//
// NOT sticky on purpose: html/body set overflow-x:hidden here, which silently
// breaks position:sticky (it scrolls away). A plain in-flow bar at the top of the
// content is the reliable choice — the user lands at the top, where the tabs are.
export function SectionTabs() {
  const pathname = usePathname()
  const tabs = sectionTabsFor(pathname)
  if (!tabs || tabs.length === 0) return null

  // Single active tab = the one whose base path (ignoring #hash) is the longest
  // prefix of the current pathname. Anchor-only tabs (e.g. /profile#whatsapp) share
  // their base with another tab and never win, so they behave as jump links.
  const path = pathname || ''
  let activeHref: string | null = null
  let bestLen = -1
  for (const t of tabs) {
    const base = t.href.split('#')[0]
    if ((path === base || path.startsWith(base + '/')) && base.length > bestLen) {
      bestLen = base.length
      activeHref = t.href
    }
  }

  return (
    <nav
      aria-label="Section navigation"
      style={{
        display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 16px',
        borderBottom: '1px solid var(--line)', background: 'var(--surface)',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {tabs.map(t => {
        const active = t.href === activeHref
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 100, fontSize: 13.5,
              fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: 'inherit',
              transition: 'background 0.12s, color 0.12s, border-color 0.12s',
              color: active ? 'var(--surface)' : 'var(--ink-2)',
              background: active ? 'var(--copper)' : 'var(--bg-2)',
              border: '1px solid ' + (active ? 'var(--copper)' : 'var(--line)'),
            }}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
