/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// PROFILE PARTIAL-UPDATE — IDOR + no-clobber
// ------------------------------------------------------------------------
// PATCH writes under the caller's VERIFIED bearer identity, never a body userId,
// and upserts ONLY the provided columns — it must NEVER include date_of_birth in
// the payload, so editing a profile field can't wipe a user's DOB (the bug this
// endpoint exists to avoid — see /api/onboarding which writes the whole row).

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';

const captured: { upserts: any[] } = { upserts: [] };

function makeBuilder() {
  const b: any = {};
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

beforeEach(() => { captured.upserts = []; });

describe('profile PATCH', () => {
  it('writes under the token identity and IGNORES a body userId', async () => {
    const { PATCH } = await import('@/app/api/profile/route');
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tokenA' },
      body: JSON.stringify({ userId: 'user-VICTIM', displayName: 'Gogo', homeAirport: 'blr' }),
    }) as any;
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(captured.upserts).toHaveLength(1);
    const row = captured.upserts[0];
    expect(row.user_id).toBe('user-A');
    expect(row.user_id).not.toBe('user-VICTIM');
    expect(row.display_name).toBe('Gogo');
    expect(row.home_airport).toBe('BLR'); // upper-cased
  });

  it('NEVER includes date_of_birth in the upsert payload (no-clobber guarantee)', async () => {
    const { PATCH } = await import('@/app/api/profile/route');
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tokenA' },
      body: JSON.stringify({ homeAirport: 'BOM', dateOfBirth: '1990-01-01' }),
    }) as any;
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(captured.upserts).toHaveLength(1);
    const row = captured.upserts[0];
    expect(row).not.toHaveProperty('date_of_birth');
    expect(row.home_airport).toBe('BOM');
    expect(row.display_name).toBeUndefined(); // only provided fields are written
  });

  it('rejects an unauthenticated caller with 401 and writes nothing', async () => {
    const { PATCH } = await import('@/app/api/profile/route');
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'x' }),
    }) as any;
    const res = await PATCH(req);
    expect(res.status).toBe(401);
    expect(captured.upserts).toHaveLength(0);
  });

  it('returns 400 and writes nothing when no updatable fields are provided', async () => {
    const { PATCH } = await import('@/app/api/profile/route');
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tokenA' },
      body: JSON.stringify({ dateOfBirth: '1990-01-01', income: 999 }),
    }) as any;
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    expect(captured.upserts).toHaveLength(0);
  });
});
