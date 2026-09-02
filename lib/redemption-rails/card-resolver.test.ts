import { describe, expect, it } from 'vitest'
import { resolveRailCardId, resolveRailCardIds } from './card-resolver'

describe('rail card resolver', () => {
  it('resolves known wallet card names to exact catalogue ids', () => {
    expect(resolveRailCardId({ bank: 'HDFC Bank', cardName: 'HDFC Infinia Metal Edition' })).toBe('hdfc-infinia')
    expect(resolveRailCardId({ bank: 'Axis Bank', cardName: 'Axis Atlas' })).toBe('axis-atlas')
    expect(resolveRailCardId({ bank: 'American Express', cardName: 'American Express Platinum Travel' })).toBe('amex-platinum-travel')
  })

  it('does not upgrade an ambiguous/base HDFC card into a more specific product', () => {
    expect(resolveRailCardId({ bank: 'HDFC', cardName: 'Regalia' })).toBeNull()
  })

  it('never falls back to another card in the same bank', () => {
    expect(resolveRailCardId({ bank: 'HDFC', cardName: 'Unknown HDFC Ultra Travel Card' })).toBeNull()
  })

  it('deduplicates exact card ids across wallet rows', () => {
    expect(resolveRailCardIds([
      { bank: 'HDFC', cardName: 'HDFC Infinia Metal Edition' },
      { bank: 'HDFC Bank', cardName: 'Infinia Credit Card' },
      { bank: 'Axis', cardName: 'Axis Atlas' },
    ])).toEqual(['hdfc-infinia', 'axis-atlas'])
  })
})
