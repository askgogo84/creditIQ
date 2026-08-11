/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// UPDATE-POINTS IDOR GATE
// ------------------------------------------------------------------------
// The route must scope every write to the caller's VERIFIED bearer identity,
// never to a `userId` in the request body. This test proves that a caller who
// supplies a DIFFERENT user's id still only touches their OWN rows — not merely
// that auth is present.

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';

const captured: { table?: string; eq: Record<string, unknown> } = { eq: {} };

vi.mock('@supabase/supabase-js', () => ({
  createClient: (_url: string, key: string) => {
    if (key === 'service-key') {
      return {
        from: (table: string) => ({
          update: () => {
            captured.table = table;
            const chain: any = {
              eq: (col: string, val: unknown) => { captured.eq[col] = val; return chain; },
              then: (resolve: any) => resolve({ error: null }),
            };
            return chain;
          },
        }),
      };
    }
    // anon client used by requireAuth: token 'tokenA' -> user 'user-A'
    return {
      auth: {
        getUser: async (token: string) =>
          token === 'tokenA'
            ? { data: { user: { id: 'user-A' } }, error: null }
            : { data: { user: null }, error: { message: 'bad token' } },
      },
    };
  },
}));

function post(body: unknown, auth?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) headers.Authorization = auth;
  return new Request('http://localhost/api/update-points', {
    method: 'POST', headers, body: JSON.stringify(body),
  }) as any;
}

beforeEach(() => { captured.table = undefined; captured.eq = {}; });

describe('update-points IDOR', () => {
  it('scopes the write to the token identity and IGNORES a body userId for another user', async () => {
    const { POST } = await import('@/app/api/update-points/route');
    const res = await POST(post(
      { cardId: 'card1', source: 'manual', points: 999, userId: 'user-VICTIM' },
      'Bearer tokenA',
    ));
    expect(res.status).toBe(200);
    expect(captured.eq.user_id).toBe('user-A');       // verified caller
    expect(captured.eq.user_id).not.toBe('user-VICTIM');
  });

  it('rejects an unauthenticated caller with 401', async () => {
    const { POST } = await import('@/app/api/update-points/route');
    const res = await POST(post({ cardId: 'card1', source: 'manual', points: 999, userId: 'user-VICTIM' }));
    expect(res.status).toBe(401);
    expect(captured.table).toBeUndefined();           // no write attempted
  });

  // A negative/zero/NaN balance would corrupt the dashboard total — reject it,
  // and write nothing, even for an authenticated caller on their own card.
  it.each([-1, -5000, NaN, 'abc', null])('rejects a non-finite/negative points value (%s) with 400', async (bad) => {
    const { POST } = await import('@/app/api/update-points/route');
    const res = await POST(post({ cardId: 'card1', source: 'manual', points: bad }, 'Bearer tokenA'));
    expect(res.status).toBe(400);
    expect(captured.table).toBeUndefined();
  });

  it('accepts 0 as a valid balance (a real zeroed-out card)', async () => {
    const { POST } = await import('@/app/api/update-points/route');
    const res = await POST(post({ cardId: 'card1', source: 'manual', points: 0 }, 'Bearer tokenA'));
    expect(res.status).toBe(200);
    expect(captured.eq.user_id).toBe('user-A');
  });
});
