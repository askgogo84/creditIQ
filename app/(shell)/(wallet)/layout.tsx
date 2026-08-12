import { SectionShell } from '@/components/ciq/SectionShell'

// (wallet) route group — parentheses folder, so /dashboard and /statement-truth keep
// their URLs. This layout persists across the two Wallet tabs: it owns the "Wallet"
// section name + the SectionTabs strip (so the strip's Y never moves between siblings),
// and each page renders panel-only content with its own PageHeader tabs OFF
// (showTabs={false}). Same shape as (spend)/(travelgrp); SectionShell carries no
// headline, so /dashboard's WalletView gauge and /statement-truth's header sit as panel
// content below the strip with no double header. paddingBottom carries the bottom-tab
// clearance the pages used to set on their own wrappers.
export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return (
    <SectionShell sectionName="Wallet" paddingBottom={112}>
      {children}
    </SectionShell>
  )
}
