/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// SMS-PARSE IDOR GATE
// ------------------------------------------------------------------------
// Parsed cards must be saved under the caller's VERIFIED bearer identity, never
// a `userId` in the request body. Proves a caller who supplies a DIFFERENT
// user's id saves under their OWN id, and that an anonymous caller is parsed
// but not saved.

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';

const captured: { upserts: any[] } = { upserts: [] };

vi.mock('@supabase/supabase-js', () => ({
  createClient: (_url: string, key: string) => {
    if (key === 'service-key') {
      return { from: () => ({ upsert: async (row: any) => { captured.upserts.push(row); return { error: null }; } }) };
    }
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

// A single HDFC balance SMS that the parser will turn into one saved card.
const MESSAGES = [{ sender: 'HDFCBK', text: 'Total Reward Points balance: 87,500 on card XX4821', date: '2026-08-10' }];

function post(body: unknown, auth?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) headers.Authorization = auth;
  return new Request('http://localhost/api/sms-parse', { method: 'POST', headers, body: JSON.stringify(body) }) as any;
}

beforeEach(() => { captured.upserts = []; });

describe('sms-parse IDOR', () => {
  it('saves under the token identity and IGNORES a body userId for another user', async () => {
    const { POST } = await import('@/app/api/sms-parse/route');
    const res = await POST(post({ messages: MESSAGES, userId: 'user-VICTIM' }, 'Bearer tokenA'));
    expect(res.status).toBe(200);
    expect(captured.upserts.length).toBeGreaterThan(0);
    for (const row of captured.upserts) {
      expect(row.user_id).toBe('user-A');
      expect(row.user_id).not.toBe('user-VICTIM');
    }
  });

  it('does NOT save for an anonymous caller even with a body userId', async () => {
    const { POST } = await import('@/app/api/sms-parse/route');
    const res = await POST(post({ messages: MESSAGES, userId: 'user-VICTIM' }));
    expect(res.status).toBe(200);
    expect(captured.upserts).toHaveLength(0);
  });
});
