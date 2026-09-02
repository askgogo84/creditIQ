/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'

const state = vi.hoisted(() => ({
  status: 'AWAITING_USER_APPROVAL' as string,
  eq: [] as Array<[string, unknown]>,
  rpcs: [] as Array<{ name: string; args: Record<string, unknown> }>,
}))

function ownCase(status = state.status) {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    user_id: 'user-A',
    context: 'HNI',
    source_type: 'FLIGHT',
    source_ref: 'award-sq',
    title: 'BLR → SIN',
    status,
    approval_state: status === 'AWAITING_USER_APPROVAL' ? 'REQUESTED' : 'NOT_REQUESTED',
    selection: {}, redemption_snapshot: {}, source_snapshot: {},
    expected_cash_minor: 418000, currency: 'INR', contact_channel: 'BOTH',
    snapshot_trust: 'CLIENT_REQUEST',
    created_at: '2026-09-02T07:00:00Z', updated_at: '2026-09-02T07:00:00Z',
  }
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: (_url: string, key: string) => {
    if (key === 'service-key') {
      return {
        from: (_table: string) => {
          const filters: Record<string, unknown> = {}
          const chain: any = {
            select: () => chain,
            eq: (col: string, value: unknown) => {
              filters[col] = value
              state.eq.push([col, value])
              return chain
            },
            maybeSingle: async () => {
              const isOwner = filters.user_id === 'user-A'
              const isOwnId = filters.id === '11111111-1111-1111-1111-111111111111'
              return { data: isOwner && isOwnId ? ownCase() : null, error: null }
            },
          }
          return chain
        },
        rpc: (name: string, args: Record<string, unknown>) => {
          state.rpcs.push({ name, args })
          const next = args.p_action === 'APPROVE' ? 'TRANSFER_APPROVED' : 'CANCELLED'
          return {
            single: async () => ({ data: ownCase(next), error: null }),
          }
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

function req(method: 'GET' | 'PATCH', body?: unknown, auth?: string) {
  const headers: Record<string, string> = {}
  if (auth) headers.Authorization = auth
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  return new Request('http://localhost/api/concierge/cases/11111111-1111-1111-1111-111111111111', {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  }) as any
}

const ownParams = { params: { id: '11111111-1111-1111-1111-111111111111' } }
const victimParams = { params: { id: '22222222-2222-2222-2222-222222222222' } }

beforeEach(() => {
  state.status = 'AWAITING_USER_APPROVAL'
  state.eq.length = 0
  state.rpcs.length = 0
})

describe('concierge case IDOR and approval boundary', () => {
  it('GET scopes the lookup to both case id and verified bearer user id', async () => {
    const { GET } = await import('@/app/api/concierge/cases/[id]/route')
    const res = await GET(req('GET', undefined, 'Bearer tokenA'), ownParams as any)
    expect(res.status).toBe(200)
    expect(state.eq).toContainEqual(['id', ownParams.params.id])
    expect(state.eq).toContainEqual(['user_id', 'user-A'])
  })

  it('returns 404 for another user case rather than exposing whether it exists', async () => {
    const { GET } = await import('@/app/api/concierge/cases/[id]/route')
    const res = await GET(req('GET', undefined, 'Bearer tokenA'), victimParams as any)
    expect(res.status).toBe(404)
    expect(state.eq).toContainEqual(['user_id', 'user-A'])
  })

  it('APPROVE uses the bearer identity and ignores a forged body userId', async () => {
    const { PATCH } = await import('@/app/api/concierge/cases/[id]/route')
    const res = await PATCH(
      req('PATCH', { action: 'APPROVE', userId: 'user-VICTIM' }, 'Bearer tokenA'),
      ownParams as any,
    )
    expect(res.status).toBe(200)
    expect(state.rpcs).toHaveLength(1)
    expect(state.rpcs[0].name).toBe('concierge_apply_user_action')
    expect(state.rpcs[0].args.p_user_id).toBe('user-A')
    expect(state.rpcs[0].args.p_user_id).not.toBe('user-VICTIM')
    expect(state.rpcs[0].args.p_case_id).toBe(ownParams.params.id)
  })

  it('does not allow user approval while the case is still REVIEWING', async () => {
    state.status = 'REVIEWING'
    const { PATCH } = await import('@/app/api/concierge/cases/[id]/route')
    const res = await PATCH(req('PATCH', { action: 'APPROVE' }, 'Bearer tokenA'), ownParams as any)
    expect(res.status).toBe(409)
    expect(state.rpcs).toHaveLength(0)
  })

  it('rejects unauthenticated mutations before any case lookup or RPC', async () => {
    const { PATCH } = await import('@/app/api/concierge/cases/[id]/route')
    const res = await PATCH(req('PATCH', { action: 'APPROVE' }), ownParams as any)
    expect(res.status).toBe(401)
    expect(state.eq).toHaveLength(0)
    expect(state.rpcs).toHaveLength(0)
  })
})
