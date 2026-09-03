import { SectionShell } from '@/components/ciq/SectionShell'

// (cards) route group — parentheses folder, so /cards, /compare, /card-switch and
// /card-roast keep their URLs. This layout persists across the four Cards tabs: it owns
// the "Cards" section name + the SectionTabs strip (so the strip's Y never moves between
// siblings and only the panel below swaps, opacity-only PanelFade), and each page renders
// panel-only content — no per-page SectionTabs, no .page-fade. Same shape as
// (wallet)/(spend)/(travelgrp). paddingBottom carries the bottom-tab clearance the pages
// used to set on their own hero wrappers.
export default function CardsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SectionShell sectionName="Cards" paddingBottom={112} fluid>
      {children}
    </SectionShell>
  )
}
