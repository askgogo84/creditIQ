'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { SectionShell } from '@/components/ciq/SectionShell'

export function WalletRouteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/dashboard') return <div className="ciq-dashboard-stage">{children}</div>
  return <SectionShell sectionName="Wallet" paddingBottom={112}>{children}</SectionShell>
}
