'use client'

import type { ReactNode } from 'react'
import './SectionCard.css'

// Wraps a signed-in section's identity (PageHeader — eyebrow · title · the carousel
// deck) AND its content inside ONE enclosed card, the realise.club pattern: on mobile
// a bordered, rounded card whose HEAD sits on a slightly tinted ground and whose BODY
// holds the section content, so the deck reads as one contained unit instead of a
// header floating above loose content.
//
// DESKTOP IS UNCHANGED. SectionCard owns the app column (maxWidth + 20px gutters) that
// each page used to set inline per container, and simply stacks head then body with the
// same 24px gap — no border, no tint. The visual is identical to the previous
// two-separate-containers layout; only the ownership moved here.
//
// The page passes <PageHeader contained /> as `header` so the deck renders BARE (no card
// of its own) — the card's tinted head is the single ground. DesignFooter and any
// full-bleed CTA stay OUTSIDE the card (they are not part of the deck).

type Tone = 'light' | 'gold'

export function SectionCard({
  header,
  children,
  tone = 'light',
  maxWidth = 1100,
}: {
  header: ReactNode
  children: ReactNode
  tone?: Tone
  maxWidth?: number
}) {
  return (
    <div
      className={`ciq-seccard ciq-seccard--${tone}`}
      style={{ ['--seccard-max' as string]: `${maxWidth}px` }}
    >
      <div className="ciq-seccard-head">{header}</div>
      <div className="ciq-seccard-body">{children}</div>
    </div>
  )
}
