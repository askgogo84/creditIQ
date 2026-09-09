'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Home, MoreHorizontal, Plane, Sparkles, WalletCards } from 'lucide-react'

type Active = 'home' | 'wallet' | 'cira' | 'travel' | 'cards' | 'menu'

function originalButtons(): HTMLButtonElement[] {
  const nav = document.querySelector('#creditiq-app-preview nav[aria-label="Prototype primary navigation"] > div')
  return nav ? Array.from(nav.querySelectorAll(':scope > button')) as HTMLButtonElement[] : []
}

function syncFromHeader(setActive: (value: Active) => void) {
  const eyebrow = document.querySelector('#creditiq-app-preview header p')?.textContent?.trim().toLowerCase() || ''
  if (eyebrow === 'wallet') setActive('wallet')
  else if (eyebrow === 'travel') setActive('travel')
  else if (eyebrow === 'cards') setActive('cards')
  else if (eyebrow.includes('concierge')) setActive('cira')
  else if (eyebrow === 'today') setActive('home')
}

export function PreviewBottomNav() {
  const [active, setActive] = useState<Active>('home')

  useEffect(() => {
    const handler = () => window.setTimeout(() => syncFromHeader(setActive), 20)
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [])

  function go(target: Active) {
    const buttons = originalButtons()
    if (buttons.length < 5) return

    if (target === 'home') buttons[0]?.click()
    else if (target === 'wallet') buttons[1]?.click()
    else if (target === 'travel') buttons[2]?.click()
    else if (target === 'cira') buttons[3]?.click()
    else if (target === 'menu') buttons[4]?.click()
    else if (target === 'cards') {
      buttons[4]?.click()
      window.setTimeout(() => {
        const candidates = Array.from(document.querySelectorAll('#creditiq-app-preview button')) as HTMLButtonElement[]
        const cardsButton = candidates.find(button => button.textContent?.trim().startsWith('Cards'))
        cardsButton?.click()
      }, 40)
    }
    setActive(target)
  }

  const itemClass = (id: Active) => `preview-nav-item ${active === id ? 'is-active' : ''}`

  return (
    <nav className="preview-six-nav" aria-label="CreditIQ preview navigation">
      <button className={itemClass('home')} onClick={() => go('home')} aria-label="Home">
        <Home size={21} /><span>Home</span>
      </button>
      <button className={itemClass('wallet')} onClick={() => go('wallet')} aria-label="Wallet">
        <WalletCards size={21} /><span>Wallet</span>
      </button>
      <button className={`${itemClass('cira')} preview-cira`} onClick={() => go('cira')} aria-label="CIRA">
        <span className="preview-cira-orb"><Sparkles size={22} /></span><span>CIRA</span>
      </button>
      <button className={itemClass('travel')} onClick={() => go('travel')} aria-label="Travel">
        <Plane size={21} /><span>Travel</span>
      </button>
      <button className={itemClass('cards')} onClick={() => go('cards')} aria-label="Cards">
        <CreditCard size={21} /><span>Cards</span>
      </button>
      <button className={itemClass('menu')} onClick={() => go('menu')} aria-label="Menu">
        <MoreHorizontal size={21} /><span>Menu</span>
      </button>
    </nav>
  )
}
