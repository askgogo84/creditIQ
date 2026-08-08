'use client'

import type { ReactNode } from 'react'
import { SectionTabs } from '@/components/ciq/SectionTabs'

// Shared header for signed-in destinations. Identity FIRST — eyebrow + title +
// optional subtitle + optional supporting lines — then the section tabs directly
// beneath, all left-aligned in the content column. Pages adopt this in place of their
// ad-hoc title so the in-page nav is placed and styled consistently
// (docs/00-SIGNED-IN-IA.md §3a).
//
// `tone`: 'light' for the white/copper surfaces, 'gold' for the not-yet-migrated
// [data-ciq] pages (profile / pro) — same structure, tokens that read on gold ground.
// `showTabs={false}` for a signed-in surface that is not one of the six destinations.
//
// EYEBROW has two forms:
//  - plain (default): quiet mono uppercase text (sweet-spots).
//  - pill (`eyebrowPill`): a neutral status chip with a leading accent dot — the
//    dashboard "Live · verified wallet" treatment, now first-class so callers stop
//    hand-rolling it. `pillDotColor` tints the dot (default = the tone accent).
//
// SUPPORTING: an optional node rendered below the subtitle and above the tabs, for
// per-page identity lines the template doesn't model directly — dashboard passes its
// email line + "Take a tour" control here.
//
// HEADLINE SCALE: fixed 30px (was clamp(26,4vw,40)). Picked 30 — dashboard's app value
// — so the two converged pages share one headline height and the only remaining
// difference in tab-strip position is each page's own supporting content, not a
// viewport-dependent headline. No signed-in surface needs a headline that grows to 40.

type Tone = 'light' | 'gold'

type ToneInk = {
  eyebrow: string; title: string; subtitle: string
  pillText: string; pillBg: string; pillBorder: string
}

const INK: Record<Tone, ToneInk> = {
  light: {
    eyebrow: 'var(--copper)', title: 'var(--ink)', subtitle: 'var(--ink-3)',
    pillText: 'var(--ink-2)', pillBg: 'var(--line)', pillBorder: 'var(--line-strong)',
  },
  gold: {
    eyebrow: 'var(--ciq-gold-2)', title: 'var(--ciq-ink)', subtitle: 'var(--ciq-ink-3)',
    pillText: 'var(--ciq-ink-3)', pillBg: 'var(--ciq-panel)', pillBorder: 'var(--ciq-line)',
  },
}

export function PageHeader({
  eyebrow,
  eyebrowPill = false,
  pillDotColor,
  title,
  subtitle,
  supporting,
  tone = 'light',
  maxWidth = 900,
  showTabs = true,
}: {
  eyebrow?: ReactNode
  eyebrowPill?: boolean
  pillDotColor?: string
  title: ReactNode
  subtitle?: ReactNode
  supporting?: ReactNode
  tone?: Tone
  maxWidth?: number
  showTabs?: boolean
}) {
  const c = INK[tone]
  const dot = pillDotColor ?? c.eyebrow
  return (
    <header style={{ maxWidth, margin: '0 auto', width: '100%' }}>
      {eyebrow && (eyebrowPill ? (
        <div style={{ marginBottom: 12 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px',
            borderRadius: 999, fontFamily: 'var(--font-mono, monospace)', fontSize: 10.5,
            fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: c.pillText, background: c.pillBg, border: `1px solid ${c.pillBorder}`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flex: '0 0 auto' }} />
            {eyebrow}
          </span>
        </div>
      ) : (
        <div style={{
          fontFamily: 'var(--font-mono, monospace)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase', color: c.eyebrow, marginBottom: 12,
        }}>
          {eyebrow}
        </div>
      ))}
      <h1 style={{
        fontFamily: 'var(--font-display, inherit)', fontWeight: 600,
        fontSize: 30, letterSpacing: '-0.02em', lineHeight: 1.1,
        color: c.title, margin: 0,
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ marginTop: 10, color: c.subtitle, fontSize: 14.5, lineHeight: 1.55, maxWidth: 560 }}>
          {subtitle}
        </p>
      )}
      {supporting && <div style={{ marginTop: 8 }}>{supporting}</div>}
      {showTabs && <SectionTabs tone={tone} />}
    </header>
  )
}
