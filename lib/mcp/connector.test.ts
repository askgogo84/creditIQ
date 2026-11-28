
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { SEED_CARDS } from '@/lib/data/seed-cards'
import { allowedOrigin, connectorEnabled, rateGate } from './guard'
import { linkedUser, oauthConfig, walletScope } from './auth'
import { createPublicServer } from './server'
import { catalogueTools, walletComparison, type Context } from './tools'

const ctx: Context = { cards: SEED_CARDS, channel: 'claude', source: 'curated_snapshot', today: '2026-11-28' }
const budget = { monthlySpendInr: 50_000, spending: { groceries: 15000, dining: 5000, travel: 10000 } }

afterEach(() => vi.unstubAllEnvs())

describe('public CreditIQ catalogue', () => {
  it('shortlists for monthly spending without assuming approval', () => {
    const result = catalogueTools.recommend_credit_cards.run({ budget, limit: 5 }, ctx)
    expect(result).toMatchObject({ status: 'ok', cards: expect.arrayContaining([expect.objectContaining({ estimate: expect.any(Object) })]) })
  })

  it('uses official standard Magnus terms without substituting the Burgundy variant', () => {
    const missing = catalogueTools.compare_credit_cards.run({ cards: ['HDFC Infinia', 'Axis Magnus'] }, ctx)
    expect(missing).toMatchObject({ status: 'ok', cards: [{ slug: 'hdfc-infinia' }, { slug: 'axis-magnus', annualFeeInr: 12500, evidenceType: 'issuer_published_snapshot' }] })
    const result = catalogueTools.compare_credit_cards.run({ cards: ['HDFC Infinia', 'axis-magnus-burgundy'] }, ctx)
    expect(result).toMatchObject({ status: 'ok', cards: [
      { slug: 'hdfc-infinia', creditIqUrl: expect.stringContaining('/card/hdfc-infinia?utm_source=claude') },
      { slug: 'axis-magnus-burgundy', creditIqUrl: expect.stringContaining('/card/axis-magnus-burgundy?utm_source=claude') },
    ] })
  })

  it('ignores legacy live records without route slugs', () => {
    const legacy = { ...SEED_CARDS[0], slug: null } as unknown as typeof SEED_CARDS[number]
    const mixed = { ...ctx, source: 'live_catalogue' as const, cards: [legacy, ...ctx.cards] }
    expect(catalogueTools.compare_credit_cards.run({ cards: ['HDFC Infinia', 'Axis Magnus'] }, mixed).status).toBe('ok')
  })

  it('finds international lounges and travel cards without claiming live admission', () => {
    expect(catalogueTools.check_lounge_access.run({ scope: 'international', limit: 3 }, ctx)).toMatchObject({
      cards: [{ lounges: expect.arrayContaining([expect.objectContaining({ scope: 'international', issuerConfirmationRequired: true })]) },
        expect.anything(), expect.anything()],
    })
    expect(catalogueTools.find_travel_card.run({ internationalLoungeRequired: true, limit: 3 }, ctx).status).toBe('ok')
  })

  it('calculates explicitly allocated grocery, dining and travel without default mix double counting', () => {
    const card = { ...SEED_CARDS[0], slug: 'fixture-cashback', name: 'Fixture cashback', reward_currency: 'cashback' as const,
      base_reward_rate: 1, annual_fee_inr: 0, joining_fee_inr: 0, last_verified: '2026-11-15',
      category_rewards: [{ category: 'grocery', unit: 'percent' as const, rate: 4, cap_inr_monthly: 500 },
        { category: 'dining', unit: 'percent' as const, rate: 3 }, { category: 'travel', unit: 'percent' as const, rate: 2 }] }
    const result = catalogueTools.calculate_rewards.run({ card: card.slug, budget }, { ...ctx, cards: [card] })
    expect(result).toMatchObject({ cards: [{ estimate: { monthlyRewardsInr: 1050, grossAnnualRewardsInr: 12600 } }] })
  })

  it('keeps cash, catalogue/vouchers and airline transfer evidence distinct', () => {
    const result = catalogueTools.optimize_redemption.run({ card: 'hdfc-infinia', points: 10000 }, ctx)
    expect(result).toMatchObject({
      values: expect.arrayContaining([expect.objectContaining({ channel: 'cashback' }), expect.objectContaining({ channel: 'catalogue' })]),
      transfers: expect.arrayContaining([expect.objectContaining({ partner: expect.any(String) })]),
    })
  })

  it('surfaces effective dates, stale catalogue, conflicting and missing fields', () => {
    const card = { ...SEED_CARDS[0], slug: 'idfc-first-swyp', name: 'IDFC First Swyp', last_verified: '2026-02-01',
      devaluations: [{ date: '2026-07-01', category: 'lounge' as const, impact: 'high' as const,
        description: '<script>untrusted</script>', source_url: 'javascript:void(0)' }] }
    const result = catalogueTools.check_card_benefits.run({ card: card.slug }, { ...ctx, cards: [card] })
    expect(result).toMatchObject({ cards: [{ annualFeeInr: null, freshness: 'stale', disputedOrUnverifiedFields: expect.arrayContaining(['base_reward_rate']) }],
      changes: [{ effectiveDate: '2026-07-01', state: 'historical_change', sourceUrl: null }] })
    expect(JSON.stringify(result)).not.toContain('<script>')
  })

  it('rejects unknown cards, card numbers, injected markup, identifiers and impossible budgets', () => {
    expect(catalogueTools.calculate_rewards.run({ card: 'Nonexistent Issuer Black', budget }, ctx)).toMatchObject({ status: 'not_found' })
    expect(catalogueTools.search_credit_cards.schema.safeParse({ query: '4111 1111 1111 1111' }).success).toBe(false)
    expect(catalogueTools.search_credit_cards.schema.safeParse({ query: '<script>alert(1)</script>' }).success).toBe(false)
    expect(walletComparison.schema.safeParse({ budget, consentToReadSavedCardProducts: true, userId: 'another-user' }).success).toBe(false)
    expect(catalogueTools.calculate_rewards.schema.safeParse({ card: 'sbi-cashback', budget: { monthlySpendInr: 100, spending: { dining: 101 } } }).success).toBe(false)
  })

  it('never prints stored personal labels that do not map to public products', () => {
    const result = walletComparison.run({ budget, consentToReadSavedCardProducts: true }, ctx, ['SBI Cashback', 'Unknown personal label'])
    expect(result).toMatchObject({ cards: [expect.objectContaining({ slug: 'sbi-cashback' })] })
    expect(JSON.stringify(result)).not.toContain('Unknown personal label')
  })

  it('negotiates with an MCP client and returns a safe degraded result during an outage', async () => {
    const server = createPublicServer('chatgpt', async () => { throw new Error('private details') })
    const client = new Client({ name: 'test', version: '0.1.0' })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    await server.connect(serverTransport)
    await client.connect(clientTransport)
    try {
      const list = await client.listTools()
      expect(list.tools).toHaveLength(8)
      expect(list.tools.every(tool => tool.annotations?.readOnlyHint && !tool.annotations.destructiveHint)).toBe(true)
      const widget = await client.readResource({ uri: 'ui://creditiq/card-results.html' })
      expect(widget.contents[0].mimeType).toBe('text/html;profile=mcp-app')
      const call = await client.callTool({ name: 'search_credit_cards', arguments: { query: 'HDFC' } })
      expect(call.isError).toBe(true)
      expect(JSON.stringify(call)).not.toContain('private details')
    } finally {
      await client.close()
      await server.close()
    }
  })
})

describe('connector request protection', () => {
  it('checks browser origins and keeps production disabled by default', () => {
    expect(allowedOrigin(new Request('https://www.creditiq.app/mcp'), 'mcp')).toBe(true)
    expect(allowedOrigin(new Request('https://www.creditiq.app/mcp', { headers: { Origin: 'https://example.invalid' } }), 'mcp')).toBe(false)
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('CREDITIQ_MCP_ENABLED', '')
    expect(connectorEnabled()).toBe(false)
  })

  it('bounds local request bursts and fails closed on Vercel if protection is unavailable', async () => {
    vi.stubEnv('VERCEL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
    const request = new Request('https://www.creditiq.app/mcp')
    const check = () => rateGate(request as Parameters<typeof rateGate>[0], 'mcp')
    for (let i = 0; i < 120; i++) expect(await check()).toBe('allowed')
    expect(await check()).toBe('limited')
    vi.stubEnv('VERCEL', '1')
    expect(await check()).toBe('unavailable')
  })

  it('requires issuer, resource, active, non-expired, scope-bound grant before deriving ownership', async () => {
    const endpoint = new URL('https://www.creditiq.app/mcp/claude')
    vi.stubEnv('CREDITIQ_MCP_PERSONAL_TOOLS', 'true')
    vi.stubEnv('CREDITIQ_MCP_OAUTH_BASE_URL', endpoint.origin)
    vi.stubEnv('CREDITIQ_MCP_OAUTH_ISSUER', 'https://auth.example.test')
    vi.stubEnv('CREDITIQ_MCP_OAUTH_INTROSPECTION_URL', 'https://auth.example.test/introspect')
    vi.stubEnv('CREDITIQ_MCP_OAUTH_INTROSPECTION_CLIENT_ID', 'fixture')
    vi.stubEnv('CREDITIQ_MCP_OAUTH_INTROSPECTION_CLIENT_SECRET', 'fixture-secret')
    const config = oauthConfig(endpoint)!
    const sub = '8e3f2334-5850-4eee-85d2-7260aa344f63'
    const valid = { active: true, iss: config.issuer, aud: endpoint.href, sub, client_id: 'registered-client', scope: walletScope, exp: Math.floor(Date.now() / 1000) + 600 }
    const token = 'Bearer opaque-demo-token'
    const pretend = (claims: unknown) => vi.fn(async () => Response.json(claims))
    expect(await linkedUser(token, config, pretend(valid))).toBe(sub)
    for (const override of [{ active: false }, { aud: 'https://example.test' }, { iss: 'https://evil.test' },
      { scope: 'email' }, { exp: 1 }, { sub: 'spoofed' }]) {
      expect(await linkedUser(token, config, pretend({ ...valid, ...override }))).toBeNull()
    }
    const request = pretend(valid)
    expect(await linkedUser(null, config, request)).toBeNull()
    expect(request).not.toHaveBeenCalled()
  })
})
