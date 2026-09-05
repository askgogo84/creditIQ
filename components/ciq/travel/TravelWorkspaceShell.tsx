'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { Building2, Compass, Plane, Sparkles, Target } from 'lucide-react'
import { PanelFade } from '@/components/ciq/PanelFade'

const tabs = [
  { label: 'Flights', href: '/trip-planner', Icon: Plane },
  { label: 'Hotels', href: '/hotels', Icon: Building2 },
  { label: 'Dream Trip', href: '/dream-trip', Icon: Target },
  { label: 'Explore', href: '/sweet-spots', Icon: Compass },
]

const tools = [
  { label: 'Ask CIRA', href: '/cira' },
  { label: 'Sweet Spots', href: '/sweet-spots' },
  { label: 'Transfer Partners', href: '/transfer-partners' },
  { label: 'Lounges', href: '/lounge-tracker' },
]

function activeFor(pathname: string, href: string) {
  if (href === '/trip-planner') return pathname.startsWith('/trip-planner') || pathname.startsWith('/flights')
  if (href === '/hotels') return pathname.startsWith('/hotels') || pathname.startsWith('/stay-on-points')
  if (href === '/dream-trip') return pathname.startsWith('/dream-trip')
  return pathname.startsWith('/sweet-spots') || pathname.startsWith('/transfer-partners') || pathname.startsWith('/lounge-tracker')
}

export function TravelWorkspaceShell({ children, previewPath }: { children: ReactNode; previewPath?: string }) {
  const currentPath = usePathname()
  const pathname = previewPath || currentPath || '/trip-planner'

  return (
    <main className="ciq-approved-stage ciq-approved-travel">
      <header className="approved-page-header approved-travel-header">
        <div><span className="approved-eyebrow">Wallet-aware travel</span><h1>Find the smartest way to book.</h1><p>Compare points, cash and transfer paths using the cards you already own.</p></div>
        <Link className="approved-secondary" href="/cira"><Sparkles size={15} /> Ask Concierge</Link>
      </header>
      <div className="approved-travel-navigation">
        <nav className="approved-travel-tabs" aria-label="Travel modes">
          {tabs.map(({ label, href, Icon }) => {
            const active = activeFor(pathname, href)
            return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={active ? 'active' : undefined}><Icon size={16} />{label}</Link>
          })}
        </nav>
        <nav className="approved-travel-tools" aria-label="Travel tools">
          {tools.map(tool => <Link key={tool.href} href={tool.href}>{tool.label}</Link>)}
        </nav>
      </div>
      <PanelFade fill>{children}</PanelFade>
    </main>
  )
}
