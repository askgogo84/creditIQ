/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// AUTHED-FETCH CONTENT-TYPE GATE
// ------------------------------------------------------------------------
// authedFetch defaults a JSON Content-Type for bodies that don't carry one —
// but it must NOT do that for FormData, or it clobbers the multipart boundary
// the browser sets and the upload (parse-statement) breaks server-side.

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: () => ({
    auth: { getSession: async () => ({ data: { session: { access_token: 'tok' } } }) },
  }),
}));

import { authedFetch } from './authed-fetch';

describe('authedFetch content-type', () => {
  let lastInit: RequestInit | undefined;
  beforeEach(() => {
    lastInit = undefined;
    global.fetch = vi.fn(async (_input: any, init: any) => { lastInit = init; return { ok: true } as any; }) as any;
  });

  it('does NOT set application/json for a FormData body (preserves multipart boundary)', async () => {
    const fd = new FormData();
    fd.append('bank', 'HDFC');
    await authedFetch('/api/parse-statement', { method: 'POST', body: fd });
    const headers = new Headers(lastInit!.headers);
    expect(headers.get('content-type')).toBeNull();
    expect(headers.get('authorization')).toBe('Bearer tok');
  });

  it('sets application/json for a string body with no explicit content-type', async () => {
    await authedFetch('/api/x', { method: 'POST', body: JSON.stringify({ a: 1 }) });
    const headers = new Headers(lastInit!.headers);
    expect(headers.get('content-type')).toBe('application/json');
  });
});
