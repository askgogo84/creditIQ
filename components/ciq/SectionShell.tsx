'use client'

import type { ReactNode } from 'react'
import { SectionTabs } from '@/components/ciq/SectionTabs'
import { PanelFade } from '@/components/ciq/PanelFade'

// The persistent header for a section-group route-group layout. Renders, in order,
// inside ONE container that also wraps {children}:
//
//   [ section name — modest ]   ← this component (persists across sibling tabs)
//   [ SectionTabs strip ]       ← this component (persists — so its Y never moves)
//   ────────────────────────────
//   [ page headline + subtitle + tool ]  ← {children}, wrapped in PanelFade (swaps)
//
// The section name is deliberately SMALLER than the page's own display headline
// (which lives in the panel below the strip): the name is wayfinding, the page
// headline is the content title. There is NO eyebrow here — the rail's active item
// plus the section name already establish location, so an eyebrow would be a third
// redundant "you are here" above the fold at 375px.
//
// `fill` (travel): the outer wrapper becomes a 100dvh flex column and the panel
// fills the REMAINING height under this header (not the viewport), so /travel's
// full-height chat doesn't overflow. Default (spend) is normal document flow.
//
// One shared left edge, not one shared width: the container is 1100 and each tool
// keeps its own max-width, left-aligned (no margin:0 auto) — so a 720 tool sits
// flush under the 1100 headline instead of centring further right.
export function SectionShell({
  sectionName,
  tone = 'light',
  fill = false,
  fluid = false,
  paddingBottom = 0,
  children,
}: {
  sectionName: string
  tone?: 'light' | 'gold'
  fill?: boolean
  /** Let a section use all available space beside the app rail. */
  fluid?: boolean
  paddingBottom?: number
  children: ReactNode
}) {
  const nameColor = tone === 'gold' ? 'var(--ciq-ink-2)' : 'var(--ink-2)'
  return (
    <div
      style={{
        paddingTop: 16,
        paddingBottom,
        ...(fill ? { minHeight: '100dvh', display: 'flex', flexDirection: 'column' } : {}),
      }}
    >
      <div
        style={{
          maxWidth: fluid ? 1504 : 1100,
          width: '100%',
          margin: '0 auto',
          padding: '0 20px',
          ...(fill ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } : {}),
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font, inherit)', fontSize: 14, fontWeight: 600,
            letterSpacing: '-0.01em', color: nameColor,
          }}
        >
          {sectionName}
        </div>
        <SectionTabs tone={tone} />
        <PanelFade fill={fill}>{children}</PanelFade>
      </div>
    </div>
  )
}
