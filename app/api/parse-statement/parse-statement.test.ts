/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// PARSE-STATEMENT IDOR GATE
// ------------------------------------------------------------------------
// The saved card must be keyed to the caller's VERIFIED bearer identity, never
// a `userId` in the multipart body. This proves that a caller who supplies a
// DIFFERENT user's id has the card saved under THEIR OWN id — and that an
// anonymous upload (no token) is parsed but not saved at all.

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
process.env.ANTHROPIC_API_KEY = 'sk-test';

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

// The PDF opens un-encrypted (document mode); no text extraction needed.
vi.mock('unpdf', () => ({
  getDocumentProxy: async () => ({}),
  extractText: async () => ({ text: '' }),
}));

// Claude returns a clean points payload so the save path is reached.
vi.mock('@/lib/ai', () => ({
  MODELS: { sonnet: 'claude-sonnet' },
  callClaude: async () => ({ ok: true, text: JSON.stringify({ bank: 'HDFC', card_name: 'Regalia', points_balance: 5000 }) }),
}));

function upload(userIdField: string | null, auth?: string) {
  const fd = new FormData();
  fd.append('file', new Blob([new Uint8Array([1, 2, 3])], { type: 'application/pdf' }), 'stmt.pdf');
  fd.append('bank', 'HDFC');
  if (userIdField) fd.append('userId', userIdField);
  const headers: Record<string, string> = {};
  if (auth) headers.Authorization = auth;
  return new Request('http://localhost/api/parse-statement', { method: 'POST', headers, body: fd }) as any;
}

beforeEach(() => { captured.upserts = []; });

describe('parse-statement IDOR', () => {
  it('saves under the token identity and IGNORES a body userId for another user', async () => {
    const { POST } = await import('@/app/api/parse-statement/route');
    const res = await POST(upload('user-VICTIM', 'Bearer tokenA'));
    expect(res.status).toBe(200);
    expect(captured.upserts).toHaveLength(1);
    expect(captured.upserts[0].user_id).toBe('user-A');
    expect(captured.upserts[0].user_id).not.toBe('user-VICTIM');
  });

  it('does NOT save for an anonymous upload even if a body userId is supplied', async () => {
    const { POST } = await import('@/app/api/parse-statement/route');
    const res = await POST(upload('user-VICTIM'));
    expect(res.status).toBe(200);            // still parses
    expect(captured.upserts).toHaveLength(0); // but never persists
  });
});
