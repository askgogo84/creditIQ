'use client'

import { useState } from 'react'
import { WalletRailMatrix } from './WalletRailMatrix'
import './hotel-loyalty-programme-deck.css'

const PROGRAMMES = [
  { id: 'marriott-bonvoy', name: 'Marriott Bonvoy', family: 'Marriott', url: 'https://www.marriott.com/search/findHotels.mi' },
  { id: 'hilton-honors', name: 'Hilton Honors', family: 'Hilton', url: 'https://www.hilton.com/en/hotels/' },
  { id: 'ihg-one', name: 'IHG One Rewards', family: 'IHG', url: 'https://www.ihg.com/hotels/us/en/reservation' },
  { id: 'wyndham-rewards', name: 'Wyndham Rewards', family: 'Wyndham', url: 'https://www.wyndhamhotels.com/' },
  { id: 'accor-all', name: 'ALL – Accor Live Limitless', family: 'Accor', url: 'https://all.accor.com/' },
  { id: 'club-itc', name: 'Club ITC', family: 'ITC Hotels · Fortune', url: 'https://www.itchotels.com/in/en' },
  { id: 'shangri-la-circle', name: 'Shangri-La Circle', family: 'Shangri-La', url: 'https://www.shangri-la.com/' },
  { id: 'radisson-rewards', name: 'Radisson Rewards', family: 'Radisson', url: 'https://www.radissonhotels.com/' },
  { id: 'jumeirah-one', name: 'Jumeirah One', family: 'Jumeirah', url: 'https://www.jumeirah.com/en/loyalty' },
  { id: 'orchid-rewards', name: 'Orchid / Regenta Rewards', family: 'Royal Orchid · Regenta', url: 'https://www.royalorchidhotels.com/' },
  { id: 'taj-neupass', name: 'Taj / NeuPass', family: 'Taj · Vivanta · SeleQtions · Ginger', url: 'https://www.tajhotels.com/' },
  { id: 'world-of-hyatt', name: 'World of Hyatt', family: 'Hyatt', url: 'https://www.hyatt.com/' },
  { id: 'postcard-sunshine-club', name: 'The Postcard Sunshine Club', family: 'The Postcard', url: 'https://www.postcardresorts.com/' },
] as const

export function HotelLoyaltyProgrammeDeck({ destination }: { destination: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = PROGRAMMES.find(programme => programme.id === selectedId) ?? null

  return (
    <section className="hlpd-root" aria-label="Hotel loyalty redemption programmes">
      <div className="hlpd-head">
        <div>
          <small>Redeem with hotel points</small>
          <h2>Choose the loyalty programme you want to check.</h2>
          <p>These programme paths are independent of the cash-hotel feed. Pick a chain, then CreditIQ shows which cards in your wallet can reach it, the sourced ratio where we have one, and the direct booking destination.</p>
        </div>
        <span>{PROGRAMMES.length} programmes</span>
      </div>

      <div className="hlpd-grid">
        {PROGRAMMES.map(programme => {
          const active = programme.id === selectedId
          return (
            <button
              key={programme.id}
              type="button"
              className={active ? 'active' : undefined}
              onClick={() => setSelectedId(current => current === programme.id ? null : programme.id)}
            >
              <i>{programme.name.slice(0, 1)}</i>
              <span><b>{programme.name}</b><small>{programme.family}</small></span>
              <em>{active ? 'Selected' : 'Check path'}</em>
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="hlpd-selected">
          <div className="hlpd-selected-head">
            <div><small>Selected programme · {destination}</small><b>{selected.name}</b><span>Check the programme’s live points price first. Then use the wallet paths below to decide whether to transfer, use a bank travel portal, or keep your points.</span></div>
            <a href={selected.url} target="_blank" rel="noopener noreferrer">Check points &amp; book ↗</a>
          </div>
          <WalletRailMatrix travelKind="hotel" programmeId={selected.id} />
        </div>
      )}

      <div className="hlpd-amex-note">
        <b>American Express Membership Rewards stays in the comparison.</b>
        <span>Amex India confirms transfers to participating airline and hotel loyalty programmes; partner-specific conversion levels are verified in the logged-in Amex transfer hub before any irreversible transfer.</span>
      </div>
    </section>
  )
}
