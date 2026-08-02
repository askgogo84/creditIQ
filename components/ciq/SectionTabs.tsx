'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { sectionTabsFor } from '@/components/ciq/appNav'

// In-page navigation for each signed-in destination. Quiet, integrated tab strip:
// left-aligned text tabs on a hairline, active = ink text + a 2px underline (no
// filled pill). It belongs INSIDE the page content column, beneath the page's
// identity — <PageHeader> places it there. See docs/00-SIGNED-IN-IA.md §3a.
// Presentational only: each tab is a Link to an existing shell-native page.
// Renders nothing on routes that belong to no destination.
//
// `tone` lets the gold [data-ciq] pages (profile / pro) render the same strip on
// their gold ground without migrating to white in this pass.
//
// NOT sticky on purpose: html/body set overflow-x:hidden here, which silently
// breaks position:sticky (it scrolls away).

type Tone = 'light' | 'gold'

const TOKENS: Record<Tone, { text: string; textActive: string; underline: string; border: string }> = {
  light: { text: 'var(--ink-3)', textActive: 'var(--ink)', underline: 'var(--ink)', border: 'var(--line)' },
  gold: { text: 'var(--ciq-ink-3)', textActive: 'var(--ciq-ink)', underline: 'var(--ciq-gold-2)', border: 'var(--ciq-line)' },
}

export function SectionTabs({ tone = 'light' }: { tone?: Tone }) {
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

  const c = TOKENS[tone]

  return (
    <nav
      aria-label="Section navigation"
      style={{
        display: 'flex', gap: 22, overflowX: 'auto', marginTop: 20,
        borderBottom: `1px solid ${c.border}`, WebkitOverflowScrolling: 'touch',
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
              flexShrink: 0, padding: '9px 1px', marginBottom: -1, fontSize: 14,
              fontWeight: active ? 700 : 500, textDecoration: 'none', whiteSpace: 'nowrap',
              fontFamily: 'inherit', color: active ? c.textActive : c.text,
              borderBottom: `2px solid ${active ? c.underline : 'transparent'}`,
              transition: 'color 0.12s, border-color 0.12s',
            }}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
