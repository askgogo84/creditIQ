'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { sectionTabsFor } from '@/components/ciq/appNav'
import './SectionTabs.css'

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
// 375px: the strip stays a SINGLE ROW that scrolls horizontally (never wraps — a
// second line would change page height between sections and reintroduce jumping).
// The 5-tab Travel group is 676px wide inside a ~335px column, so most of it is
// off-screen. Three things make that discoverable instead of silent:
//   1. Edge-fade cues (below) that appear only when there is hidden content on that
//      side and disappear at the extremes — driven by scroll position, so they work
//      on mouse/trackpad, not only touch. They also feather the boundary pill so it
//      never reads as a clean cut: there is always a partial, clickable pill to grab.
//   2. On mount / route change we scroll the ACTIVE tab into view, so arriving on a
//      late tab (e.g. Lounges) never shows a strip that appears to start at Trip
//      Planner.
// Each tab still holds a 44px tap target.
//
// NOT sticky on purpose: html/body set overflow-x:hidden here, which silently
// breaks position:sticky (it scrolls away).

// useLayoutEffect on the client (scroll the active tab in BEFORE first paint, no
// visible jump), useEffect during SSR to avoid the layout-effect warning.
const useIso = typeof window !== 'undefined' ? useLayoutEffect : useEffect

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

// How far past the viewport edge to land the active tab on mount, so a neighbouring
// pill peeks and the active tab never sits flush against the edge.
const PEEK = 28

export function SectionTabs({ tone = 'light' }: { tone?: Tone }) {
  const pathname = usePathname()
  const tabs = sectionTabsFor(pathname)

  // The <nav> is the scroll viewport. edges = which side currently has hidden content.
  const scrollerRef = useRef<HTMLElement | null>(null)
  const [edges, setEdges] = useState<{ left: boolean; right: boolean }>({ left: false, right: false })

  // Recompute which edges hide content. 1px tolerance absorbs sub-pixel rounding so
  // each cue reliably switches off at its extreme.
  const syncEdges = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setEdges({ left: el.scrollLeft > 1, right: el.scrollLeft < max - 1 })
  }, [])

  // Mount / route change: bring the active tab into view, then sync the cues to the
  // resting position. Guarded so it is a no-op when this route renders no strip.
  useIso(() => {
    const el = scrollerRef.current
    if (!el) return
    const active = el.querySelector<HTMLElement>('[data-active="true"]')
    if (active) {
      const aL = active.offsetLeft
      const aR = aL + active.offsetWidth
      const viewL = el.scrollLeft
      const viewR = viewL + el.clientWidth
      if (aR > viewR) el.scrollLeft = aR - el.clientWidth + PEEK
      else if (aL < viewL) el.scrollLeft = aL - PEEK
    }
    syncEdges()
  }, [pathname, syncEdges])

  // Keep the cues correct as the user scrolls (wheel / trackpad / drag / touch) and
  // when the viewport or tab set changes width.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    el.addEventListener('scroll', syncEdges, { passive: true })
    const ro = new ResizeObserver(syncEdges)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', syncEdges)
      ro.disconnect()
    }
  }, [pathname, syncEdges])

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
    <div className="ciq-sectiontabs-wrap" style={{ marginTop: 20 }}>
      <nav
        ref={scrollerRef}
        aria-label="Section navigation"
        className="ciq-sectiontabs"
        style={{
          overflowX: 'auto', WebkitOverflowScrolling: 'touch',
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
      </nav>

      {/* Edge-fade cues. Each appears only when there is hidden content on its side
          (opacity toggled from scroll state) and fades to the strip's own ground so
          the boundary pill feathers away instead of ending in a clean cut — always a
          partial, clickable pill to grab. pointer-events:none keeps that pill live.
          The --st-ground custom prop carries the tone's ground into the gradient. */}
      <div
        aria-hidden="true"
        className="ciq-st-fade ciq-st-fade--l"
        style={{ ['--st-ground' as string]: c.ground, opacity: edges.left ? 1 : 0 }}
      />
      <div
        aria-hidden="true"
        className="ciq-st-fade ciq-st-fade--r"
        style={{ ['--st-ground' as string]: c.ground, opacity: edges.right ? 1 : 0 }}
      />

      {/* Hover wash, scrollbar hide, fade geometry, and reduced-motion overrides live
          in ./SectionTabs.css (imported above) — moved out of a <style> text child
          whose a[data-active="false"] quotes React SSR-escaped, stripping data-theme.
          The --st-* custom props are still set inline. */}
    </div>
  )
}
