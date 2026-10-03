import { expect, it } from 'vitest'
import { cardRedemptionCoverage } from './coverage'
it('distinguishes a mapped HDFC transfer from a bookable itinerary', () => {
  const routes = cardRedemptionCoverage({ bank: 'HDFC', cardName: 'HDFC Infinia', points: 10000 })
  const accor = routes.find(r => /accor/i.test(r.name))!
  expect(accor).toBeDefined()
  expect(accor.bookingReady).toBe(false)
  expect(accor.missing).toContain('Issuer transfer minimum')
  expect(accor.missing).toContain('Issuer transfer increment')
  expect(accor.sources.length).toBeGreaterThan(0)
})
it('makes existing routes visible for cards outside the Accor calculator', () => {
  const routes = cardRedemptionCoverage({ bank: 'Axis', cardName: 'Axis Atlas', points: null })
  expect(routes.length).toBeGreaterThan(0)
  expect(routes.every(r => !r.bookingReady && r.missing.includes('Current card balance'))).toBe(true)
})
it('does not fabricate routes for unidentified cards', () => {
  expect(cardRedemptionCoverage({ bank: 'HDFC', cardName: null, points: 500 })).toEqual([])
})
