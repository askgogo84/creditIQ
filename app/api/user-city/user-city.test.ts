/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// USER-CITY IDOR GATE
// ------------------------------------------------------------------------
// Both handlers must act on the caller's VERIFIED bearer identity, never a
// `userId` in the query string or body. Proves that a caller supplying a
// DIFFERENT user's id still only reads/writes their OWN home city.

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';

const captured: { eq: { col: string; val: unknown }[]; upserts: any[] } = { eq: [], upserts: [] };

function makeBuilder() {
  const b: any = {};
  b.select = () => b;
  b.eq = (col: string, val: unknown) => { captured.eq.push({ col, val }); return b; };
  b.single = async () => ({ data: null, error: null });
  b.limit = async () => ({ data: [], error: null });
  b.upsert = async (row: any) => { captured.upserts.push(row); return { error: null }; };
  return b;
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: (_url: string, key: string) => {
    if (key === 'service-key') return { from: () => makeBuilder() };
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

beforeEach(() => { captured.eq = []; captured.upserts = []; });

describe('user-city IDOR', () => {
  it('GET reads the token identity and IGNORES a ?userId= for another user', async () => {
    const { GET } = await import('@/app/api/user-city/route');
    const req = new Request('http://localhost/api/user-city?userId=user-VICTIM', {
      headers: { Authorization: 'Bearer tokenA' },
    }) as any;
    const res = await GET(req);
    expect(res.status).toBe(200);
    const userIdFilters = captured.eq.filter(e => e.col === 'user_id');
    expect(userIdFilters.length).toBeGreaterThan(0);
    for (const f of userIdFilters) expect(f.val).toBe('user-A');
  });

  it('POST writes under the token identity and IGNORES a body userId', async () => {
    const { POST } = await import('@/app/api/user-city/route');
    const req = new Request('http://localhost/api/user-city', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tokenA' },
      body: JSON.stringify({ userId: 'user-VICTIM', city: 'Mumbai' }),
    }) as any;
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(captured.upserts).toHaveLength(1);
    expect(captured.upserts[0].user_id).toBe('user-A');
    expect(captured.upserts[0].user_id).not.toBe('user-VICTIM');
  });

  it('POST rejects an unauthenticated caller with 401 and writes nothing', async () => {
    const { POST } = await import('@/app/api/user-city/route');
    const req = new Request('http://localhost/api/user-city', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user-VICTIM', city: 'Mumbai' }),
    }) as any;
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(captured.upserts).toHaveLength(0);
  });
});
