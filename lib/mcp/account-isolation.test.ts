
import { afterEach, expect, it, vi } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { SEED_CARDS } from '@/lib/data/seed-cards'
import { walletScope } from './auth'
import { createPublicServer } from './server'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

it('requires consent, isolates linked account product reads and rejects a revoked grant', async () => {
  const endpoint = 'https://www.creditiq.app/mcp/claude'
  const issuer = 'https://auth.example.test'
  const introspectionUrl = issuer + '/introspect'
  const memberA = '8e3f2334-5850-4eee-85d2-7260aa344f63'
  const memberB = 'a467bd68-c632-4a45-b989-4e823ddb3d54'
  vi.stubEnv('CREDITIQ_MCP_PERSONAL_TOOLS', 'true')
  vi.stubEnv('CREDITIQ_MCP_OAUTH_BASE_URL', new URL(endpoint).origin)
  vi.stubEnv('CREDITIQ_MCP_OAUTH_ISSUER', issuer)
  vi.stubEnv('CREDITIQ_MCP_OAUTH_INTROSPECTION_URL', introspectionUrl)
  vi.stubEnv('CREDITIQ_MCP_OAUTH_INTROSPECTION_CLIENT_ID', 'fixture')
  vi.stubEnv('CREDITIQ_MCP_OAUTH_INTROSPECTION_CLIENT_SECRET', 'fixture-secret')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test-fixture.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'synthetic-admin-key')

  const databaseOwners: string[] = []
  let revoked = false
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
    if (url.href === introspectionUrl) {
      const token = new URLSearchParams(String(init?.body)).get('token')
      return Response.json({
        active: !revoked, iss: issuer, sub: token === 'test-token-member-a' ? memberA : memberB,
        aud: endpoint, client_id: 'approved-fixture-client', scope: walletScope,
        exp: Math.floor(Date.now() / 1000) + 600,
      })
    }
    expect(url.origin).toBe('https://test-fixture.supabase.co')
    expect(url.searchParams.get('select')).toBe('bank,card_name')
    const owner = url.searchParams.get('user_id')
    if (owner) databaseOwners.push(owner)
    const product = owner === 'eq.' + memberA ? { bank: 'SBI', card_name: 'Cashback' } : { bank: 'Axis', card_name: 'Magnus for Burgundy' }
    return Response.json([product])
  }))

  async function invoke(token: string, consent: boolean) {
    const request = new Request(endpoint, { headers: { Authorization: 'Bearer ' + token } })
    const server = createPublicServer('claude', async () => ({ source: 'curated_snapshot', cards: SEED_CARDS }), request)
    const client = new Client({ name: 'isolated-fixture', version: '1.0.0' })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    await server.connect(serverTransport)
    await client.connect(clientTransport)
    try {
      return await client.callTool({ name: 'optimize_card_portfolio', arguments: {
        budget: { monthlySpendInr: 50000 },
        consentToReadSavedCardProducts: consent,
      } })
    } finally {
      await client.close()
      await server.close()
    }
  }

  expect((await invoke('test-token-member-a', false)).isError).toBe(true)
  expect(databaseOwners).toEqual([])
  expect(await invoke('test-token-member-a', true)).toMatchObject({ structuredContent: { cards: [{ slug: 'sbi-cashback' }] } })
  expect(databaseOwners).toEqual(['eq.' + memberA, 'eq.' + memberA])
  expect(await invoke('test-token-member-b', true)).toMatchObject({ structuredContent: { cards: [{ slug: 'axis-magnus-burgundy' }] } })
  expect(databaseOwners).toEqual(['eq.' + memberA, 'eq.' + memberA, 'eq.' + memberB, 'eq.' + memberB])
  revoked = true
  const denied = await invoke('test-token-member-a', true)
  expect(denied).toMatchObject({ isError: true, _meta: { 'mcp/www_authenticate': [expect.stringContaining('oauth-protected-resource')] } })
  expect(databaseOwners).toHaveLength(4)
})
