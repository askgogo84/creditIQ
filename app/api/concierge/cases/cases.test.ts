/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'

const captured = vi.hoisted(() => ({
  rpcs: [] as Array<{ name: string; args: Record<string, unknown> }>,
  eq: [] as Array<[string, unknown]>,
  fromTables: [] as string[],
}))

const caseRow = {
  id: '11111111-1111-1111-1111-111111111111',
  user_id: 'user-A',
  context: 'HNI',
  source_type: 'FLIGHT',
  source_ref: 'award-sq',
  title: 'BLR → SIN',
  status: 'REVIEWING',
  approval_state: 'NOT_REQUESTED',
  expected_cash_minor: 418000,
  currency: 'INR',
  contact_channel: 'BOTH',
  snapshot_trust: 'CLIENT_REQUEST',
  created_at: '2026-09-02T07:00:00Z',
  updated_at: '2026-09-02T07:00:00Z',
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: (_url: string, key: string) => {
    if (key === 'service-key') {
      return {
        rpc: (name: string, args: Record<string, unknown>) => {
          captured.rpcs.push({ name, args })
          return {
            single: async () => ({ data: caseRow, error: null }),
          }
        },
        from: (table: string) => {
          captured.fromTables.push(table)
          const chain: any = {
            select: () => chain,
            eq: (col: string, value: unknown) => { captured.eq.push([col, value]); return chain },
            order: () => chain,
            limit: () => chain,
            then: (resolve: any) => resolve({ data: [caseRow], error: null }),
          }
          return chain
        },
      }
    }

    return {
      auth: {
        getUser: async (token: string) =>
          token === 'tokenA'
            ? { data: { user: { id: 'user-A' } }, error: null }
            : { data: { user: null }, error: { message: 'bad token' } },
      },
    }
  },
}))

function request(method: 'GET' | 'POST', body?: unknown, auth?: string) {
  const headers: Record<string, string> = {}
  if (auth) headers.Authorization = auth
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  return new Request('http://localhost/api/concierge/cases', {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  }) as any
}

const BODY = {
  context: 'HNI',
  sourceType: 'FLIGHT',
  sourceRef: 'award-sq',
  title: 'BLR → SIN',
  selection: { from: 'BLR', to: 'SIN' },
  redemptionSnapshot: { path: 'TRANSFER', bank: 'Example Bank', card_last4: '2184' },
  sourceSnapshot: { award: { state: 'LIVE' }, transfer_rule: { state: 'NEEDS_VERIFICATION' } },
  expectedCashMinor: 418000,
  currency: 'INR',
  contactChannel: 'BOTH',
}

beforeEach(() => {
  captured.rpcs.length = 0
  captured.eq.length = 0
  captured.fromTables.length = 0
})

describe('concierge cases collection IDOR', () => {
  it('creates the case under the bearer identity and ignores a forged body userId', async () => {
    const { POST } = await import('@/app/api/concierge/cases/route')
    const res = await POST(request('POST', { ...BODY, userId: 'user-VICTIM' }, 'Bearer tokenA'))

    expect(res.status).toBe(201)
    expect(captured.rpcs).toHaveLength(1)
    expect(captured.rpcs[0].name).toBe('concierge_create_case')
    expect(captured.rpcs[0].args.p_user_id).toBe('user-A')
    expect(captured.rpcs[0].args.p_user_id).not.toBe('user-VICTIM')
  })

  it('rejects unauthenticated creation before touching the service-role database', async () => {
    const { POST } = await import('@/app/api/concierge/cases/route')
    const res = await POST(request('POST', BODY))
    expect(res.status).toBe(401)
    expect(captured.rpcs).toHaveLength(0)
  })

  it('rejects sensitive snapshot fields before creating a case', async () => {
    const { POST } = await import('@/app/api/concierge/cases/route')
    const res = await POST(request('POST', {
      ...BODY,
      selection: { from: 'BLR', cvv: '123' },
    }, 'Bearer tokenA'))
    expect(res.status).toBe(400)
    expect(captured.rpcs).toHaveLength(0)
  })

  it('lists only rows scoped to the bearer identity', async () => {
    const { GET } = await import('@/app/api/concierge/cases/route')
    const res = await GET(request('GET', undefined, 'Bearer tokenA'))
    expect(res.status).toBe(200)
    expect(captured.fromTables).toContain('concierge_cases')
    expect(captured.eq).toContainEqual(['user_id', 'user-A'])
    expect(captured.eq).not.toContainEqual(['user_id', 'user-VICTIM'])
  })
})
