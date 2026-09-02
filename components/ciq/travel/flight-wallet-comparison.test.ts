import { describe, expect, it } from 'vitest'
import type { RedemptionOption } from '@/lib/fusion-core'
import { rankWalletOptions, sameWalletOption, walletOptionReason } from './flight-wallet-comparison'

function option(overrides: Partial<RedemptionOption>): RedemptionOption {
  return {
    cardName: 'Example Card',
    bank: 'Example Bank',
    status: 'ok',
    cardPointsNeeded: 20_000,
    yourPoints: 30_000,
    canAfford: true,
    verified: false,
    ...overrides,
  }
}

describe('flight wallet comparison — any Indian card', () => {
  it('lets a non-HDFC/Axis/Amex card rank first when it is the strongest returned route', () => {
    const ranked = rankWalletOptions([
      option({ bank: 'HDFC', cardName: 'Infinia', cardPointsNeeded: 40_000 }),
      option({ bank: 'SBI', cardName: 'SBI Aurum', cardPointsNeeded: 18_000 }),
      option({ bank: 'ICICI', cardName: 'Emeralde Private Metal', cardPointsNeeded: 24_000 }),
    ])

    expect(ranked[0].bank).toBe('SBI')
    expect(ranked[0].cardName).toBe('SBI Aurum')
  })

  it('keeps unsupported cards visible after supported cards instead of dropping them', () => {
    const ranked = rankWalletOptions([
      option({ bank: 'AU', cardName: 'AU Zenith+', status: 'currency-unknown', cardPointsNeeded: undefined, canAfford: undefined }),
      option({ bank: 'IndusInd', cardName: 'IndusInd Pioneer', status: 'not-transferable', cardPointsNeeded: undefined, canAfford: undefined }),
      option({ bank: 'HSBC', cardName: 'HSBC Premier', cardPointsNeeded: 25_000 }),
    ])

    expect(ranked.map((o) => o.bank)).toEqual(['HSBC', 'IndusInd', 'AU'])
    expect(ranked).toHaveLength(3)
  })

  it('ranks affordable routes ahead of a cheaper route the user cannot fund', () => {
    const ranked = rankWalletOptions([
      option({ bank: 'Kotak', cardName: 'Kotak White', cardPointsNeeded: 10_000, yourPoints: 5_000, canAfford: false }),
      option({ bank: 'Yes Bank', cardName: 'Marquee', cardPointsNeeded: 22_000, yourPoints: 30_000, canAfford: true }),
    ])

    expect(ranked[0].bank).toBe('Yes Bank')
  })

  it('preserves self-entered provenance in the user-facing reason', () => {
    const o = option({ bank: 'Amex', cardName: 'Platinum Travel', selfEntered: true })
    expect(walletOptionReason(o, 'KrisFlyer')).toContain('self-entered')
  })

  it('matches the server-selected winner by bank, card and requirement', () => {
    const a = option({ bank: 'SBI', cardName: 'Aurum', cardPointsNeeded: 18_000 })
    const b = option({ bank: 'SBI', cardName: 'Aurum', cardPointsNeeded: 18_000 })
    const c = option({ bank: 'SBI', cardName: 'Aurum', cardPointsNeeded: 19_000 })

    expect(sameWalletOption(a, b)).toBe(true)
    expect(sameWalletOption(a, c)).toBe(false)
  })
})
