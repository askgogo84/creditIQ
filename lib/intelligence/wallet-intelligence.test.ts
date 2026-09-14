import { describe, expect, it } from 'vitest'
import { matchInsightToWallet, type WalletIdentity } from './wallet-intelligence'

const wallet: WalletIdentity[] = [
  { cardId: 'hdfc-infinia', name: 'HDFC Infinia Metal Edition', bank: 'HDFC' },
  { cardId: 'amex-platinum-travel', name: 'American Express Platinum Travel', bank: 'American Express' },
]

describe('wallet intelligence matcher', () => {
  it('makes a direct HDFC devaluation important and notification eligible', () => {
    const match = matchInsightToWallet({
      title: 'HDFC Infinia SmartBuy devaluation', content: 'New SmartBuy cap applies',
      insight_type: 'devaluation', card_mentions: ['HDFC Infinia'], bank_mentions: ['HDFC'],
      trust_score: 0.8, engagement: 1000, published_at: new Date().toISOString(),
    }, wallet)
    expect(match.section).toBe('IMPORTANT_NOW')
    expect(match.shouldNotify).toBe(true)
    expect(match.matchedCards).toContain('HDFC Infinia Metal Edition')
  })

  it('matches Hilton intelligence through the actual Amex transfer graph', () => {
    const match = matchInsightToWallet({
      title: 'Hilton Honors sweet spot in Bangkok', content: '45,000 Hilton Honors points',
      insight_type: 'sweet_spot', card_mentions: [], bank_mentions: [], trust_score: 0.8,
      engagement: 500, published_at: new Date().toISOString(),
    }, wallet)
    expect(match.section).toBe('FOR_YOU')
    expect(match.matchedProgrammes.some(programme => /hilton/i.test(programme))).toBe(true)
    expect(match.shouldNotify).toBe(true)
  })

  it('does not promote an unrelated card review into the wallet feed', () => {
    const match = matchInsightToWallet({
      title: 'IndusInd Tiger review', content: 'Review of IndusInd Tiger', insight_type: 'card_review',
      card_mentions: ['IndusInd Tiger'], bank_mentions: ['IndusInd'], trust_score: 0.9,
      engagement: 200, published_at: new Date().toISOString(),
    }, wallet)
    expect(match.section).toBe('DISCOVER')
    expect(match.shouldNotify).toBe(false)
  })
})
