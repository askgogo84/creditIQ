import { SectionShell } from '@/components/ciq/SectionShell'

// (travelgrp) route group — parentheses folder, so /trip-planner, /travel,
// /sweet-spots, /transfer-partners and /lounge-tracker keep their URLs. This layout
// persists across the five tabs: it owns the "Travel" section name + the SectionTabs
// strip, so the strip's Y never moves between siblings and only the panel below swaps
// (opacity-only PanelFade).
//
// fill: the shell becomes a 100dvh flex column and the panel fills the REMAINING
// height under the header — /travel's full-height chat sets flex:1 on its own root to
// fill that space (100dvh on the page would overflow past the header). The other four
// pages are ordinary block content: they don't set flex-grow, so they keep their
// intrinsic height and simply top-align in the column (no stretch).
export default function TravelLayout({ children }: { children: React.ReactNode }) {
  return (
    <SectionShell sectionName="Travel" fill paddingBottom={80}>
      {children}
    </SectionShell>
  )
}
