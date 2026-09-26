/** @vitest-environment node */
import { beforeEach, expect, it, vi } from 'vitest'
import { POST } from './route'
import { GET as summary } from '@/app/api/cockpit/summary/route'
import { usableHotels } from '@/lib/data/hotel-seed'

const state = vi.hoisted(() => ({ auth: true, failed: [] as string[], rows: {} as Record<string, unknown[]>, reads: [] as Array<[string, string, unknown]>, fx: 110.5 as number | null }))
vi.mock('@/lib/api-auth', () => ({ requireAuth: async () => state.auth ? { ok: true, userId: 'owner-A' } : { ok: false, res: new Response('{}', { status: 401 }) } }))
vi.mock('@/lib/ai', () => ({ callClaude: () => { throw new Error('AI must not run') } }))
vi.mock('@/lib/hotels/providers/fx', () => ({ LiveFxProvider: class { async rate() { return state.fx === null ? null : { rate: state.fx, source: 'synthetic FX', as_of: '2026-09-25', fetched_at: '2026-09-26' } } } }))
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ from: (table: string) => {
  const result = () => ({ data: state.rows[table] ?? [], error: state.failed.includes(table) ? { message: 'synthetic outage' } : null })
  const q: any = { then: (yes: any, no: any) => Promise.resolve(result()).then(yes, no) }
  for (const method of ['select', 'eq', 'order', 'in']) q[method] = (key: string, value: unknown) => { if (method === 'eq') state.reads.push([table, key, value]); return q }
  return q
} }) }))

beforeEach(() => {
  state.auth = true; state.failed = []; state.reads = []; state.fx = 110.5
  state.rows = { statement_imports: [{ bank: 'HDFC', card_name: 'HDFC Infinia Metal Edition', card_last4: '1234', points_balance: 11400, points_currency: 'Reward Points', imported_at: '2026-09-20', self_entered: false }] }
})
const request = (body: unknown) => new Request('https://synthetic.invalid/api/claude/redemption', { method: 'POST', body: JSON.stringify(body) }) as any
const bookingId = usableHotels().find(h => h.programme_id === 'accor-all')!.id

it('authenticates before reading any wallet', async () => {
  state.auth = false
  expect((await POST(request({ cardId: 'hdfc-infinia' }))).status).toBe(401)
  expect(state.reads).toHaveLength(0)
})
it.each(['recommendations', 'points', 'fxRate', 'rules', 'userId'])('rejects client %s overrides before reading', async field => {
  expect((await POST(request({ cardId: 'hdfc-infinia', [field]: 123 }))).status).toBe(400)
  expect(state.reads).toHaveLength(0)
})
it('returns sourced readiness without manufacturing a booking or wallet value', async () => {
  const res = await POST(request({ cardId: 'hdfc-infinia' })); expect(res.status).toBe(200)
  const body = await res.json()
  expect(body).toMatchObject({ plan: null, walletValueInr: null, readiness: { state: 'BOOKING_REQUIRED' }, balance: { points: 11400, source: 'statement', verified: true } })
  expect(body.readiness.ratio.source_url).toMatch(/^https:/)
  for (const table of ['statement_imports', 'manual_cards', 'aa_consents']) expect(state.reads).toContainEqual([table, 'user_id', 'owner-A'])
})
it('calculates selected captured stays on the server and retains all data gates', async () => {
  const body = await (await POST(request({ cardId: 'hdfc-infinia', bookingId }))).json()
  expect(body.plan.balances.bank).toMatchObject({ points: 11400, provenance: 'STATEMENT' })
  expect(body.plan.transferState).toBe('RATIO_ONLY')
  expect(body.plan.candidates.every((c: any) => c.bankPointsToTransferExact === null)).toBe(true)
  expect(body.booking).toMatchObject({ isLive: false, hotelId: bookingId })
  expect(body.plan.provenance.length).toBeGreaterThan(0)
  expect(body.readiness.blockers).toHaveLength(3)
})
it('keeps missing FX unavailable and preserves independent cash/portal paths', async () => {
  state.fx = null
  const body = await (await POST(request({ cardId: 'hdfc-infinia', bookingId }))).json()
  expect(body.fx).toBeNull()
  expect(body.plan.candidates.every((c: any) => c.kind !== 'PROGRAMME')).toBe(true)
  expect(body.advice).toContain('FX unavailable')
})
it('preserves missing balance without a verified zero or personal plan', async () => {
  state.rows.statement_imports = [{ bank: 'HDFC', card_name: 'Infinia', points_balance: null }]
  const body = await (await POST(request({ cardId: 'hdfc-infinia', bookingId }))).json()
  expect(body).toMatchObject({ plan: null, balance: { points: null, verified: false }, readiness: { state: 'BALANCE_UNKNOWN' } })
})
it.each(['statement_imports', 'manual_cards', 'aa_consents', 'linked_cards'])('fails closed on partial %s storage failure', async table => {
  state.failed = [table]; state.rows.aa_consents = [{ consent_handle: 'owned-consent' }]
  expect((await summary(new Request('https://synthetic.invalid') as any)).status).toBe(500)
  expect((await POST(request({ cardId: 'hdfc-infinia' }))).status).toBe(503)
})
it('uses distinct stable identities for cards sharing last4 across issuers', async () => {
  state.rows.manual_cards = [{ bank: 'Axis', card_name: 'Atlas', card_last4: '1234', points_balance: 1200 }]
  const body = await (await summary(new Request('https://synthetic.invalid') as any)).json()
  expect(new Set(body.cards.map((c: any) => c.id)).size).toBe(2)
  const selected = await (await POST(request({ walletCardId: body.cards.find((c: any) => c.bank === 'HDFC').id }))).json()
  expect(selected.balance.points).toBe(11400)
})
it('rejects unowned and ambiguous catalogue identities', async () => {
  expect((await POST(request({ cardId: 'axis-atlas' }))).status).toBe(422)
  state.rows.manual_cards = [{ bank: 'HDFC', card_name: 'Infinia', card_last4: '9876', points_balance: 100 }]
  expect((await POST(request({ cardId: 'hdfc-infinia' }))).status).toBe(422)
})
