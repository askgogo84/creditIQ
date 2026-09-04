'use client'

import { useState } from 'react'
import { AppRail } from './AppRail'
import { AppTopbar } from './AppTopbar'
import { DashboardHome } from './DashboardHome'
import { WalletView } from './WalletView'
import SpendOptimizerPage from '@/app/(shell)/(spend)/spend-optimizer/page'
import { GlobalFlightWorkspace } from './travel/GlobalFlightWorkspace'
import { TravelWorkspaceShell } from './travel/TravelWorkspaceShell'
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
    <div className="ciq-approved-shell ciq-v3-shell">
      <AppRail />
      <AppTopbar />
      <div className="ciq-design-qa-switcher" role="navigation" aria-label="Visual QA pages">
        {pages.map(item => <button key={item} aria-pressed={page === item} onClick={() => setPage(item)}>{item}</button>)}
      </div>
      <div className="ciq-design-qa-main">
        {page === 'Dashboard' && <div className="ciq-approved-stage"><DashboardHome displayName="Goverdhan MD" cards={sampleCards} totalPoints={total} primaryBank="HDFC" /></div>}
        {page === 'Wallet' && <div className="ciq-approved-stage"><WalletView displayName="Goverdhan MD" cards={sampleCards} totalPoints={total} primaryBank="HDFC" onAddCard={() => {}} onRefresh={() => {}} /></div>}
        {page === 'Spend' && <div className="ciq-approved-stage"><SpendOptimizerPage /></div>}
        {page === 'Travel' && <TravelWorkspaceShell previewPath="/trip-planner"><GlobalFlightWorkspace /></TravelWorkspaceShell>}
        {page === 'Cards' && <div className="ciq-approved-stage"><div className="ciq-approved-cards"><header className="approved-page-header"><div><span className="approved-eyebrow">Find your next card</span><h1>Card Explorer</h1><p>Compare real rewards, fees and benefits for how you actually spend.</p></div></header><section className="approved-card-finder"><div><span className="approved-section-kicker">AI card finder</span><h2>What matters most to you?</h2></div><div className="approved-finder-chips"><span className="active">Travel rewards</span><span>Cashback</span><span>Lounge access</span><span>Low fees</span></div><button className="approved-primary">Find my matches</button></section><CardsClient initialCards={SEED_CARDS.slice(0, 12)} /></div></div>}
        {page === 'Concierge' && <CiraPage />}
        {page === 'Profile' && <ProfilePreview />}
      </div>
    </div>
  )
}

function ProfilePreview() {
  return <main className="ciq-approved-stage ciq-approved-profile"><header className="approved-page-header"><div><span className="approved-eyebrow">Your CreditIQ</span><h1>Profile &amp; preferences</h1><p>Control how CreditIQ personalises recommendations and protects your data.</p></div><button className="approved-primary">Save changes</button></header><div className="approved-profile-layout"><aside className="approved-profile-nav"><button className="active">Personal details</button><button>Rewards preferences</button><button>Notifications</button><button>Privacy &amp; security</button></aside><section className="approved-profile-panel"><div className="approved-profile-panel-head"><div><h2>Personal details</h2><p>Used to personalise your CreditIQ experience.</p></div><span>GM</span></div><div className="approved-profile-details"><div><small>Full name</small><b>Goverdhan MD</b></div><div><small>Email address</small><b>member@example.com</b></div><div><small>Home city</small><b>Bengaluru</b></div><div><small>Home airport</small><b>BLR</b></div><button className="approved-secondary">Edit details</button></div></section></div></main>
}
