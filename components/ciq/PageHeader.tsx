'use client'

import type { ReactNode } from 'react'
import { SectionTabs } from '@/components/ciq/SectionTabs'

// Shared header for signed-in destinations. Identity FIRST — eyebrow + title +
// optional subtitle — then the section tabs directly beneath, all left-aligned in
// the content column. Pages adopt this in place of their ad-hoc title so the in-page
// nav is placed and styled consistently (docs/00-SIGNED-IN-IA.md §3a).
//
// `tone`: 'light' for the white/copper surfaces, 'gold' for the not-yet-migrated
// [data-ciq] pages (profile / pro) — same structure, tokens that read on gold ground.
// `showTabs={false}` for a signed-in surface that is not one of the six destinations.

type Tone = 'light' | 'gold'

const INK: Record<Tone, { eyebrow: string; title: string; subtitle: string }> = {
  light: { eyebrow: 'var(--copper)', title: 'var(--ink)', subtitle: 'var(--ink-3)' },
  gold: { eyebrow: 'var(--ciq-gold-2)', title: 'var(--ciq-ink)', subtitle: 'var(--ciq-ink-3)' },
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  tone = 'light',
  maxWidth = 900,
  showTabs = true,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  tone?: Tone
  maxWidth?: number
  showTabs?: boolean
}) {
  const c = INK[tone]
  return (
    <header style={{ maxWidth, margin: '0 auto', width: '100%' }}>
      {eyebrow && (
        <div style={{
          fontFamily: 'var(--font-mono, monospace)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase', color: c.eyebrow, marginBottom: 12,
        }}>
          {eyebrow}
        </div>
      )}
      <h1 style={{
        fontFamily: 'var(--font-display, inherit)', fontWeight: 600,
        fontSize: 'clamp(26px, 4vw, 40px)', letterSpacing: '-0.02em', lineHeight: 1.1,
        color: c.title, margin: 0,
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ marginTop: 10, color: c.subtitle, fontSize: 14.5, lineHeight: 1.55, maxWidth: 560 }}>
          {subtitle}
        </p>
      )}
      {showTabs && <SectionTabs tone={tone} />}
    </header>
  )
}
