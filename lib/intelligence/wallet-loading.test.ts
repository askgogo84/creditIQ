/** @vitest-environment node */
import { beforeEach, expect, it, vi } from 'vitest'
const portfolio = vi.hoisted(() => vi.fn())
vi.mock('@/lib/wallet/decision-portfolio', () => ({ loadDecisionPortfolio: portfolio }))
import { loadWalletIdentities, rankedWalletIntelligence } from './wallet-intelligence'
beforeEach(() => { portfolio.mockReset().mockResolvedValue([{ bank: 'HDFC', cardName: 'HDFC Infinia', source: 'statement' }]) })
function db(results: Record<string, any>) {
  const scopes: any[] = []
  return { scopes, from: vi.fn((table: string) => {
    const q: any = { then: (resolve: any, reject: any) => Promise.resolve(results[table] || { data: [], error: null }).then(resolve, reject) }
    for (const method of ['select', 'limit', 'in', 'order']) q[method] = () => q
    q.eq = (key: string, value: string) => { scopes.push([table, key, value]); return q }
    return q
  }) }
}
it('includes statement-only cards and passes the authenticated owner to both wallet sources', async () => {
  const sb = db({})
  expect(await loadWalletIdentities(sb, 'owner-A')).toEqual([{ cardId: 'hdfc-infinia', name: 'HDFC Infinia', bank: 'HDFC' }])
  expect(portfolio).toHaveBeenCalledWith('owner-A')
  expect(sb.scopes).toContainEqual(['user_points', 'user_id', 'owner-A'])
})
it('retains legacy added cards without duplicating the same resolved product', async () => {
  const sb = db({ user_points: { data: [{ card_id: 'hdfc-infinia' }, { card_id: 'axis-atlas' }] }, cards: { data: [{ id: 'hdfc-infinia', name: 'HDFC Infinia Metal Edition', bank: 'HDFC' }, { id: 'axis-atlas', name: 'Axis Atlas', bank: 'Axis' }] } })
  expect((await loadWalletIdentities(sb, 'owner-A')).map(c => c.cardId)).toEqual(['hdfc-infinia', 'axis-atlas'])
})
it('does not guess an unnamed linked card product', async () => {
  portfolio.mockResolvedValue([{ bank: 'HDFC', cardName: null, source: 'linked' }])
  expect(await loadWalletIdentities(db({}), 'owner-A')).toEqual([])
})
it.each(['user_points', 'cards', 'intelligence_kb'])('reports %s read errors instead of successful empty intelligence', async table => {
  const results: any = { user_points: { data: [{ card_id: 'hdfc-infinia' }] } }
  results[table] = { data: null, error: new Error('synthetic failure') }
  await expect(rankedWalletIntelligence(db(results), 'owner-A')).rejects.toThrow(/unavailable/)
})
it('preserves canonical wallet failures', async () => {
  portfolio.mockRejectedValue(new Error('Wallet sources unavailable'))
  await expect(loadWalletIdentities(db({}), 'owner-A')).rejects.toThrow('Wallet sources unavailable')
})
