import { expect, it } from 'vitest'
import { ACCOR_RULES, HDFC_ACCOR_ROUTE, withEligibilityBounds } from './accor'
import { planRedemption } from './plan'
import { INFINIA_PORTAL } from './portal'

it('enforces the sourced online cap even with a large balance and expensive booking', () => {
  const booking = { grossMinor: 400_000_000, roomOnlyMinor: 390_000_000 }
  const plan = planRedemption({
    booking, bank: { card_id: 'hdfc-infinia', points: 3_000_000, provenance: 'SELF_ENTERED' },
    programmeBalance: null, rules: withEligibilityBounds(ACCOR_RULES, booking),
    route: HDFC_ACCOR_ROUTE, portal: INFINIA_PORTAL, fxRate: 100,
  })
  const amounts = [...plan.candidates.map(c => c.programmePointsSpent), ...plan.eliminated.map(c => c.wouldHaveSpent)]
  expect(Math.max(...amounts)).toBe(1_000_000)
  expect(amounts.every(n => n <= 1_000_000 && n % 2000 === 0)).toBe(true)
  expect(plan.candidates.every(c => c.bankPointsToTransferExact === null)).toBe(true)
  expect(plan.transferState).toBe('RATIO_ONLY')
  expect(plan.conflicts.some(c => c.fact === 'PERMITTED_AMOUNTS')).toBe(true)
})
