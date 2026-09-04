import type { ReactNode } from 'react'

export function WalletRouteLayout({ children }: { children: ReactNode }) {
  return <div className="ciq-approved-stage">{children}</div>
}
