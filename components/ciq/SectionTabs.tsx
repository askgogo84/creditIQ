'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { sectionTabsFor } from '@/components/ciq/appNav'

// In-page navigation for each signed-in destination — the Bilt-style segmented
// control: icon + label per tab, laid out inside ONE rounded container with a soft
// ground so the strip reads as a single control, not loose links. Active tab is a
// filled dark (--ink) pill with light text; inactive tabs are quiet --ink-3 text on
// no fill. It belongs INSIDE the page content column, beneath the page's identity —
// <PageHeader> places it there. See docs/00-SIGNED-IN-IA.md §3a.
// Presentational only: each tab is a Link to an existing shell-native page.
// Renders nothing on routes that belong to no destination.
//
// `tone` lets the gold [data-ciq] pages (profile / pro) render the same control on
// their gold ground without migrating to white in this pass.
//
// 375px: the container scrolls horizontally (no wrap, no page overflow) and each tab
// holds a 44px tap target. The nav is the scroll viewport; the rounded ground is the
// inner inline-flex track so its fill/radius travel with the scrolled content.
//
// NOT sticky on purpose: html/body set overflow-x:hidden here, which silently
// breaks position:sticky (it scrolls away).

type Tone = 'light' | 'gold'

type ToneTokens = {
  ground: string       // container fill (the soft "one control" ground)
  border: string       // hairline around the container
  text: string         // inactive tab text + icon
  fillActive: string   // active pill fill
  textActive: string   // active tab text + icon (reads on fillActive)
  hover: string        // inactive tab hover wash
}

const TOKENS: Record<Tone, ToneTokens> = {
  light: {
    ground: 'var(--surface-2)', border: 'var(--line)',
    text: 'var(--ink-3)', fillActive: 'var(--ink)', textActive: 'var(--paper)',
    hover: 'var(--line-soft)',
  },
  gold: {
    ground: 'var(--ciq-panel)', border: 'var(--ciq-line)',
    text: 'var(--ciq-ink-3)', fillActive: 'var(--ciq-gold-2)', textActive: '#1A1710',
    hover: 'var(--ciq-line)',
  },
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
      className="ciq-sectiontabs"
      style={{
        marginTop: 20, overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        // custom props consumed by the injected <style> for hover / active tinting
        ['--st-hover' as string]: c.hover,
        ['--st-fill' as string]: c.fillActive,
        ['--st-text-active' as string]: c.textActive,
      }}
    >
      <div
        style={{
          display: 'inline-flex', gap: 4, padding: 4, borderRadius: 16,
          background: c.ground, border: `1px solid ${c.border}`,
        }}
      >
        {tabs.map(t => {
          const active = t.href === activeHref
          const color = active ? c.textActive : c.text
          return (
            <Link
              key={t.href}
              href={t.href}
              data-active={active ? 'true' : 'false'}
              aria-current={active ? 'page' : undefined}
              style={{
                flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 8,
                minHeight: 44, padding: '0 15px', borderRadius: 12,
                fontSize: 14, fontWeight: active ? 650 : 500, whiteSpace: 'nowrap',
                textDecoration: 'none', fontFamily: 'inherit',
                color, background: active ? c.fillActive : 'transparent',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
            >
              <svg
                width="17" height="17" viewBox="0 0 24 24" fill="none"
                aria-hidden="true" style={{ flexShrink: 0 }}
              >
                {t.icon(color)}
              </svg>
              {t.label}
            </Link>
          )
        })}
      </div>

      {/* Hover wash, scrollbar hide, and reduced-motion override live here because
          inline styles can't express pseudo-classes or media queries. The
          !important on the reduced-motion rule beats the inline transition. */}
      <style>{`
        .ciq-sectiontabs { scrollbar-width: none; -ms-overflow-style: none; }
        .ciq-sectiontabs::-webkit-scrollbar { display: none; }
        .ciq-sectiontabs a[data-active="false"]:hover {
          background: var(--st-hover);
          color: var(--st-text-active);
        }
        @media (prefers-reduced-motion: reduce) {
          .ciq-sectiontabs a { transition: none !important; }
        }
      `}</style>
    </nav>
  )
}
