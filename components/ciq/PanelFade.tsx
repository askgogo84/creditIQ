'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import './PanelFade.css'

// Wraps the swapping panel beneath a persistent SectionShell header. Keyed on the
// pathname so it remounts on a sibling-tab navigation — that is what replays the
// opacity-only fade (see PanelFade.css). The section name + SectionTabs strip live
// ABOVE this in the route-group layout and do NOT remount, so the strip's Y is
// pixel-stable across tabs and only the tool/heading below fades.
//
// `fill` makes the wrapper a flex child that fills the remaining column height
// (SectionShell fill mode) — for /travel's full-height chat, which must fill the
// space under the header rather than the whole viewport (100dvh would overflow).
export function PanelFade({ children, fill = false }: { children: ReactNode; fill?: boolean }) {
  const pathname = usePathname()
  return (
    <div
      key={pathname}
      className="ciq-panel-fade"
      style={fill ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : undefined}
    >
      {children}
    </div>
  )
}
