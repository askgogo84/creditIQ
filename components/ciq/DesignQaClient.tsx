'use client'

import { useState } from 'react'
import { AppRail } from './AppRail'
import { AppTopbar } from './AppTopbar'
import { DashboardHome } from './DashboardHome'
import { WalletView } from './WalletView'
import SpendOptimizerPage from '@/app/(shell)/(spend)/spend-optimizer/page'
import { GlobalFlightWorkspace } from './travel/GlobalFlightWorkspace'
import { CardsClient } from '@/app/(shell)/(cards)/cards/CardsClient'
import CiraPage from '@/app/(shell)/cira/page'
import { SEED_CARDS } from '@/lib/data/seed-cards'

const sampleCards = [
  { id: '1', bank: 'HDFC', card_name: 'Infinia Credit Card', card_last4: '4416', points_balance: 112000, points_currency: 'Reward Points', source: 'manual' as const, self_entered: true },
  { id: '2', bank: 'HDFC', card_name: 'Regalia Gold Credit Card', card_last4: '9687', points_balance: 61783, points_currency: 'Reward Points', source: 'statement' as const },
  { id: '3', bank: 'Axis', card_name: 'Axis Atlas', card_last4: '1234', points_balance: 50000, points_currency: 'Miles', source: 'manual' as const, self_entered: true },
  { id: '4', bank: 'American Express', card_name: 'Platinum Travel', points_balance: 5000, points_currency: 'Membership Rewards', source: 'manual' as const, self_entered: true },
]

const pages = ['Dashboard', 'Wallet', 'Spend', 'Travel', 'Cards', 'Concierge', 'Profile'] as const
type Page = typeof pages[number]

export function DesignQaClient() {
  const [page, setPage] = useState<Page>('Dashboard')
  const total = sampleCards.reduce((sum, card) => sum + card.points_balance, 0)
  return (
    <>
      <AppRail />
      <AppTopbar />
      <div className="ciq-design-qa-switcher" role="navigation" aria-label="Visual QA pages">
        {pages.map(item => <button key={item} aria-pressed={page === item} onClick={() => setPage(item)}>{item}</button>)}
      </div>
      <div className="ciq-design-qa-main">
        {page === 'Dashboard' && <DashboardHome displayName="Goverdhan MD" cards={sampleCards} totalPoints={total} primaryBank="HDFC" />}
        {page === 'Wallet' && <WalletView displayName="Goverdhan MD" cards={sampleCards} totalPoints={total} primaryBank="HDFC" onAddCard={() => {}} onRefresh={() => {}} />}
        {page === 'Spend' && <SpendOptimizerPage />}
        {page === 'Travel' && <GlobalFlightWorkspace />}
        {page === 'Cards' && <div className="ciq-product-page"><header className="ciq-qa-page-head"><span>Find your next card</span><h1>Card Explorer</h1><p>Compare real rewards, fees and benefits for how you actually spend.</p></header><CardsClient initialCards={SEED_CARDS.slice(0, 12)} /></div>}
        {page === 'Concierge' && <CiraPage />}
        {page === 'Profile' && <ProfilePreview />}
      </div>
    </>
  )
}

function ProfilePreview() {
  return <main className="ciq-profile-preview"><header className="ciq-qa-page-head"><span>Your CreditIQ</span><h1>Built around <em>you.</em></h1><p>Identity, home airport, membership and connected services in one private workspace.</p></header><div><section><div className="ciq-profile-avatar">GM</div><h2>Goverdhan MD</h2><p>Premium member · Bengaluru (BLR)</p><button>Edit profile</button></section><section><small>Membership</small><h2>CreditIQ Pro</h2><p>Your plan, billing and benefits stay together.</p><button>Manage membership</button></section><section><small>Connected services</small><h2>WhatsApp concierge</h2><p>Ask CIRA while you are on the move.</p><button>Connect WhatsApp</button></section></div></main>
}
