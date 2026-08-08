'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { sectionTabsFor, type SectionTab } from '@/components/ciq/appNav'
import './SectionTabs.css'

// In-page navigation for each signed-in destination. Two distinct presentations,
// switched purely by CSS media query at 768px so there is no hydration/JS-timing
// flash — BOTH render to the DOM and one is display:none'd at a time:
//
//   AT/ABOVE 768px (desktop): the Bilt-style pill row — icon + label per tab in ONE
//   rounded container with a soft ground, active tab a filled --ink pill. There is
//   room for direct access here and it is better when it fits, so this is UNCHANGED
//   from the settled desktop design: a single horizontal-scroll strip with edge-fade
//   cues + scroll-active-into-view (all desktop-only, gated by isDesktop()).
//
//   BELOW 768px (mobile): a CAROUSEL header modelled on realise.club's mobile deck —
//   constant height regardless of section count (the old wrap grew the header on the
//   5-tab Travel / 4-tab Cards groups and varied cross-group). It shows only the
//   ACTIVE section's title, centred, flanked by a chevron each side and dot indicators
//   below. Chevrons move ONE section at a time and navigate to that route (you stay on
//   wherever you land); at the ends the chevron is DISABLED (not hidden) so the control
//   never reflows. A horizontal SWIPE on the header does the same as the chevrons.
//   The TITLE IS TAPPABLE: it opens a sheet listing every section in the group for
//   direct access (Lounges is four chevron-taps from Trip Planner otherwise). Dots
//   show position; the sheet gives the shortcut.
//
// It belongs INSIDE the page content column, beneath the page's identity — <PageHeader>
// places it there. See docs/00-SIGNED-IN-IA.md §3a. Renders nothing on routes that
// belong to no destination.
//
// `tone` lets the gold [data-ciq] pages (profile / pro) render both presentations on
// their gold ground without migrating to white in this pass.
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

// Mobile carousel + sheet palette per tone. Kept separate from TOKENS because the
// carousel has no "pill ground" — it is a chevron/title/dots row on the page's own
// surface — and the sheet needs its own panel/row/accent set.
type MobileTokens = {
  title: string          // active section title
  chevron: string        // enabled chevron glyph + border tint reference
  chevronOff: string     // disabled chevron glyph (muted, still occupies space)
  chevBorder: string     // chevron button hairline
  chevHover: string      // chevron hover wash
  dotOn: string          // active position dot
  dotOff: string         // inactive position dots
  backdrop: string       // sheet scrim
  panel: string          // sheet surface
  panelBorder: string    // sheet hairlines
  rowText: string        // sheet row label
  rowMuted: string       // sheet row secondary text + chevron
  rowActiveBg: string    // current section row fill
  rowActiveBorder: string// current section row border
  accent: string         // current section accent (label + tile)
  iconTile: string       // sheet row icon tile fill
  iconTileBorder: string // sheet row icon tile border
}

const MOBILE: Record<Tone, MobileTokens> = {
  light: {
    title: 'var(--ink)', chevron: 'var(--ink-2)', chevronOff: 'var(--line-strong)',
    chevBorder: 'var(--line)', chevHover: 'var(--line-soft)',
    dotOn: 'var(--copper)', dotOff: 'var(--line-strong)',
    backdrop: 'rgba(20, 41, 80, 0.34)', panel: 'var(--paper)', panelBorder: 'var(--line)',
    rowText: 'var(--ink)', rowMuted: 'var(--ink-3)',
    rowActiveBg: 'var(--surface-2)', rowActiveBorder: 'var(--copper)', accent: 'var(--copper)',
    iconTile: 'var(--surface-2)', iconTileBorder: 'var(--line)',
  },
  gold: {
    title: 'var(--ciq-ink)', chevron: 'var(--ciq-ink-3)', chevronOff: 'var(--ciq-line-2)',
    chevBorder: 'var(--ciq-line)', chevHover: 'var(--ciq-line)',
    dotOn: 'var(--ciq-gold-2)', dotOff: 'var(--ciq-line-2)',
    backdrop: 'rgba(0, 0, 0, 0.55)', panel: 'var(--ciq-bg)', panelBorder: 'var(--ciq-line)',
    rowText: 'var(--ciq-ink)', rowMuted: 'var(--ciq-ink-3)',
    rowActiveBg: 'var(--ciq-panel)', rowActiveBorder: 'var(--ciq-gold-line)', accent: 'var(--ciq-gold-2)',
    iconTile: 'var(--ciq-gold-soft)', iconTileBorder: 'var(--ciq-gold-line)',
  },
}

// How far past the viewport edge to land the active tab on mount, so a neighbouring
// pill peeks and the active tab never sits flush against the edge.
const PEEK = 28

// Horizontal-swipe threshold: fingers must travel this far AND more horizontally than
// vertically before a swipe counts, so a vertical page scroll never nudges the section.
const SWIPE = 45

// The desktop strip only exists at/above 768px; below that it is display:none and the
// carousel takes over (see ./SectionTabs.css). The scroll-into-view and edge-fade logic
// is therefore desktop-only — this gate keeps it in lockstep with the CSS breakpoint so
// neither runs while the desktop strip is hidden.
const isDesktop = () =>
  typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches

export function SectionTabs({ tone = 'light' }: { tone?: Tone }) {
  const pathname = usePathname()
  const router = useRouter()
  const tabs = sectionTabsFor(pathname)

  // The desktop <nav> is the scroll viewport. edges = which side hides content.
  const scrollerRef = useRef<HTMLElement | null>(null)
  const [edges, setEdges] = useState<{ left: boolean; right: boolean }>({ left: false, right: false })

  // Mobile: the all-sections sheet the title opens.
  const [sheetOpen, setSheetOpen] = useState(false)
  const titleBtnRef = useRef<HTMLButtonElement | null>(null)

  // Recompute which edges hide content. 1px tolerance absorbs sub-pixel rounding so
  // each cue reliably switches off at its extreme.
  const syncEdges = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    // Below 768px the desktop strip is hidden and never scrolls: force cues off.
    if (!isDesktop()) {
      setEdges({ left: false, right: false })
      return
    }
    const max = el.scrollWidth - el.clientWidth
    setEdges({ left: el.scrollLeft > 1, right: el.scrollLeft < max - 1 })
  }, [])

  // Mount / route change: bring the active tab into view, then sync the cues to the
  // resting position. Guarded so it is a no-op when this route renders no strip.
  useIso(() => {
    const el = scrollerRef.current
    if (!el) return
    const active = isDesktop() ? el.querySelector<HTMLElement>('[data-active="true"]') : null
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

  // Close the sheet whenever the route changes (a section inside it was tapped).
  useEffect(() => { setSheetOpen(false) }, [pathname])

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
  const m = MOBILE[tone]

  // Carousel index. If nothing matched (activeHref null), sit on the first section so
  // the header is never blank and the chevrons still have a sane start point.
  const activeIndex = Math.max(0, tabs.findIndex(t => t.href === activeHref))
  const activeTab = tabs[activeIndex]
  const atStart = activeIndex <= 0
  const atEnd = activeIndex >= tabs.length - 1

  // Navigate one section along. Bounds-checked so end swipes / disabled chevrons no-op.
  const goTo = (i: number) => {
    if (i < 0 || i >= tabs.length) return
    router.push(tabs[i].href)
  }

  // Swipe: measure the touch delta on release. Horizontal intent only (dx dominates and
  // clears the threshold) so a vertical page scroll is never read as a section change.
  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current
    touch.current = null
    if (!s) return
    const t = e.changedTouches[0]
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    if (Math.abs(dx) < SWIPE || Math.abs(dx) <= Math.abs(dy)) return
    if (dx < 0) goTo(activeIndex + 1) // swipe left → next
    else goTo(activeIndex - 1)        // swipe right → previous
  }

  return (
    <div className="ciq-sectiontabs-wrap" style={{ marginTop: 20 }}>
      {/* ───────── DESKTOP (≥768px): pill row, unchanged ───────── */}
      <div className="ciq-st-desktop">
        <nav
          ref={scrollerRef}
          aria-label="Section navigation"
          className="ciq-sectiontabs"
          style={{
            overflowX: 'auto', WebkitOverflowScrolling: 'touch',
            // custom props consumed by ./SectionTabs.css for hover / active tinting
            ['--st-hover' as string]: c.hover,
            ['--st-fill' as string]: c.fillActive,
            ['--st-text-active' as string]: c.textActive,
          }}
        >
          <div
            className="ciq-st-track"
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
                  className="ciq-st-pill"
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

        {/* Edge-fade cues (desktop-only; a wrapped/hidden strip has nothing to cue). */}
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
      </div>

      {/* ───────── MOBILE (<768px): carousel header, constant height ───────── */}
      <div className="ciq-st-mobile">
        <nav
          aria-label="Section navigation"
          className="ciq-st-carousel"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{
            ['--st-chev-hover' as string]: m.chevHover,
          }}
        >
          {/* Previous — disabled (not hidden) at the first section so nothing reflows. */}
          <button
            type="button"
            className="ciq-st-chev"
            onClick={() => goTo(activeIndex - 1)}
            disabled={atStart}
            aria-label="Previous section"
            style={{ borderColor: m.chevBorder, color: atStart ? m.chevronOff : m.chevron }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Title — tappable, opens the all-sections sheet. */}
          <button
            type="button"
            ref={titleBtnRef}
            className="ciq-st-title"
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            aria-label={`${activeTab.label}. Open all sections`}
            style={{ color: m.title }}
          >
            <span className="ciq-st-title-text">{activeTab.label}</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0, opacity: 0.6 }}>
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Next — disabled (not hidden) at the last section. */}
          <button
            type="button"
            className="ciq-st-chev"
            onClick={() => goTo(activeIndex + 1)}
            disabled={atEnd}
            aria-label="Next section"
            style={{ borderColor: m.chevBorder, color: atEnd ? m.chevronOff : m.chevron }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </nav>

        {/* Position dots. The group carries the accessible current state; the active dot
            is also marked aria-current so it is announced as the current position. */}
        <div
          className="ciq-st-dots"
          role="group"
          aria-label={`Section ${activeIndex + 1} of ${tabs.length}: ${activeTab.label}`}
        >
          {tabs.map((t, i) => {
            const on = i === activeIndex
            return (
              <span
                key={t.href}
                className="ciq-st-dot"
                aria-current={on ? 'true' : undefined}
                aria-hidden={on ? undefined : 'true'}
                style={{
                  background: on ? m.dotOn : m.dotOff,
                  width: on ? 18 : 6,
                }}
              />
            )
          })}
        </div>
      </div>

      {sheetOpen && (
        <SectionSheet
          tabs={tabs}
          activeHref={activeHref}
          tokens={m}
          onClose={() => {
            setSheetOpen(false)
            titleBtnRef.current?.focus()
          }}
        />
      )}
    </div>
  )
}

// The all-sections sheet the mobile title opens: a bottom sheet listing every section
// in the group for direct access. Modal (role=dialog + aria-modal), body-scroll locked,
// Escape/backdrop to close, focus moved in on open and trapped, restored to the title
// on close (handled by the caller's onClose). Rendered only while open.
function SectionSheet({
  tabs, activeHref, tokens, onClose,
}: {
  tabs: SectionTab[]
  activeHref: string | null
  tokens: MobileTokens
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement | null>(null)

  // Lock body scroll for the sheet's lifetime.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Move focus into the sheet on open.
  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    el.querySelector<HTMLElement>('a, button')?.focus()
  }, [])

  // Escape closes; Tab is trapped inside the sheet.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key !== 'Tab') return
      const el = panelRef.current
      if (!el) return
      const f = el.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      if (f.length === 0) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const t = tokens
  return (
    <div
      className="ciq-st-sheet-scrim"
      onClick={onClose}
      style={{ background: t.backdrop }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="All sections"
        className="ciq-st-sheet"
        onClick={e => e.stopPropagation()}
        style={{ background: t.panel, borderColor: t.panelBorder }}
      >
        <div className="ciq-st-sheet-grip" style={{ background: t.panelBorder }} />
        <div className="ciq-st-sheet-head" style={{ borderColor: t.panelBorder }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: t.rowText, letterSpacing: '-0.2px' }}>Sections</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ciq-st-sheet-close"
            style={{ borderColor: t.panelBorder, color: t.rowText }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="ciq-st-sheet-list">
          {tabs.map(tab => {
            const active = tab.href === activeHref
            const color = active ? t.accent : t.rowMuted
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className="ciq-st-sheet-row"
                style={{
                  background: active ? t.rowActiveBg : 'transparent',
                  borderColor: active ? t.rowActiveBorder : t.panelBorder,
                }}
              >
                <span
                  className="ciq-st-sheet-tile"
                  style={{
                    background: active ? t.rowActiveBg : t.iconTile,
                    borderColor: active ? t.rowActiveBorder : t.iconTileBorder,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    {tab.icon(color)}
                  </svg>
                </span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: active ? 650 : 500, color: active ? t.accent : t.rowText }}>
                  {tab.label}
                </span>
                {active && (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <path d="M5 12l5 5 9-11" />
                  </svg>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
