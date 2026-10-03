/** @vitest-environment node */
import { beforeEach, expect, it, vi } from 'vitest'
import Page from './page'
const fx = vi.hoisted(() => ({ rate: 110.5 as number | null }))
vi.mock('@/lib/hotels/providers/fx', () => ({ LiveFxProvider: class { async rate() { return fx.rate === null ? null : { rate: fx.rate, source: 'synthetic', fetched_at: '2026-09-26' } } } }))
vi.mock('@/components/ciq/travel/InvestorHotelWorkspace', () => ({ default: () => null }))
beforeEach(() => { fx.rate = 110.5 })
it('retains the existing sourced stay integration and withholds issuer transfer instructions', async () => {
  const page = await Page({ searchParams: { city: 'Bangkok', points: '11400' } })
  expect(page.props.cards.length).toBeGreaterThan(0)
  expect(page.props.cards.every((c: any) => c.bank_points_exact === null)).toBe(true)
  expect(page.props.balance).toBe(11400)
  expect(page.props.portalSource).toContain('smartbuy')
})
it('retains an unknown balance when no balance was supplied', async () => {
  const page = await Page({ searchParams: { city: 'Bangkok' } })
  expect(page.props.balance).toBeNull()
  expect(page.props.cards.every((c: any) => c.bank_points_exact === null)).toBe(true)
})
it('suppresses converted programme value when FX is unavailable', async () => {
  fx.rate = null
  const page = await Page({ searchParams: { city: 'Bangkok', points: '11400' } })
  expect(page.props.fx).toBeNull()
  expect(page.props.programmeConversionValueInr).toBeNull()
})
