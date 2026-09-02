import { describe, expect, it } from 'vitest'
import { buildDecisionPortfolio } from './decision-portfolio'

describe('buildDecisionPortfolio', () => {
  it('prefers a verified statement identity over a manual duplicate', () => {
    const cards = buildDecisionPortfolio({
      manual: [{ bank: 'HDFC Bank', card_name: 'HDFC Infinia', card_last4: '2184', points_balance: 10_000, points_currency: 'Reward Points', imported_at: '2026-08-01T00:00:00Z' }],
      statements: [{ bank: 'HDFC', card_name: 'HDFC Infinia Metal Edition', card_last4: '2184', points_balance: 11_400, points_currency: 'Reward Points', self_entered: false, imported_at: '2026-08-31T00:00:00Z' }],
      linked: [],
    })
    expect(cards).toHaveLength(1)
    expect(cards[0]).toMatchObject({ source: 'statement', cardName: 'HDFC Infinia Metal Edition', points: 11_400, verified: true, selfEntered: false })
  })

  it('lets a newer AA balance refresh a named statement card without guessing its identity', () => {
    const cards = buildDecisionPortfolio({
      manual: [],
      statements: [{ bank: 'Axis Bank', card_name: 'Axis Magnus', card_last4: '4412', points_balance: 25_000, points_currency: 'EDGE Rewards', self_entered: false, imported_at: '2026-08-20T00:00:00Z' }],
      linked: [{ bank: 'Axis', masked_number: 'XXXX-XXXX-XXXX-4412', reward_points: 31_200, synced_at: '2026-09-01T00:00:00Z' }],
    })
    expect(cards).toHaveLength(1)
    expect(cards[0]).toMatchObject({ source: 'linked', cardName: 'Axis Magnus', points: 31_200, pointsCurrency: 'EDGE Rewards', verified: true, linkedBalanceMerged: true })
  })

  it('keeps an unmatched AA card visible but unnamed so transfer routing cannot guess the product', () => {
    const cards = buildDecisionPortfolio({
      manual: [], statements: [],
      linked: [{ bank: 'ICICI Bank', masked_number: 'XXXX1234', reward_points: 8_000, synced_at: '2026-09-01T00:00:00Z' }],
    })
    expect(cards).toEqual([expect.objectContaining({ source: 'linked', bank: 'ICICI Bank', cardName: null, last4: '1234', points: 8_000, verified: true })])
  })

  it('demotes a hand-edited statement balance to self-entered', () => {
    const cards = buildDecisionPortfolio({
      manual: [], linked: [],
      statements: [{ bank: 'AmEx', card_name: 'American Express Platinum Travel', card_last4: '1009', points_balance: 52_000, points_currency: 'Membership Rewards', self_entered: true, imported_at: '2026-08-31T00:00:00Z' }],
    })
    expect(cards[0]).toMatchObject({ source: 'statement', verified: false, selfEntered: true })
  })

  it('never turns missing/invalid points into a negative or non-finite balance', () => {
    const cards = buildDecisionPortfolio({
      manual: [{ bank: 'SBI', card_name: 'SBI Elite', card_last4: '9999', points_balance: -50, imported_at: '2026-09-01T00:00:00Z' }],
      statements: [], linked: [],
    })
    expect(cards[0].points).toBe(0)
  })
})
