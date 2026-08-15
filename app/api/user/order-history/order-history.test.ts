/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ORDER-HISTORY IDOR GATE
// ------------------------------------------------------------------------
// The receipts list must be scoped to the caller's VERIFIED bearer identity,
// never a `userId` in the query string. Proves a caller supplying a DIFFERENT
// user's id still only reads their OWN pro_order_events rows.

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';

const captured: { eq: { col: string; val: unknown }[] } = { eq: [] };
const ROWS = [
  { id: 2, plan: 'sixmonth', amount_paise: 49900, months: 6, applied_pro_until: '2027-02-01T00:00:00Z', created_at: '2026-08-01T00:00:00Z' },
  { id: 1, plan: 'monthly', amount_paise: 14900, months: 1, applied_pro_until: '2026-09-01T00:00:00Z', created_at: '2026-07-01T00:00:00Z' },
];

function makeBuilder() {
  const b: any = {};
  b.select = () => b;
  b.eq = (col: string, val: unknown) => { captured.eq.push({ col, val }); return b; };
  b.order = async () => ({ data: ROWS, error: null });
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

beforeEach(() => { captured.eq = []; });

describe('order-history IDOR', () => {
  it('GET reads the token identity and IGNORES a ?userId= for another user', async () => {
    const { GET } = await import('@/app/api/user/order-history/route');
    const req = new Request('http://localhost/api/user/order-history?userId=user-VICTIM', {
      headers: { Authorization: 'Bearer tokenA' },
    }) as any;
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.orders).toHaveLength(2);
    const userIdFilters = captured.eq.filter(e => e.col === 'user_id');
    expect(userIdFilters.length).toBeGreaterThan(0);
    for (const f of userIdFilters) expect(f.val).toBe('user-A');
  });

  it('rejects an unauthenticated caller with 401 and queries nothing', async () => {
    const { GET } = await import('@/app/api/user/order-history/route');
    const req = new Request('http://localhost/api/user/order-history', {}) as any;
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(captured.eq).toHaveLength(0);
  });
});
