/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ALERTS/SUBSCRIBE NON-DESTRUCTIVE GATE
// ------------------------------------------------------------------------
// This endpoint is intentionally anonymous (email capture on public pages), so
// anyone can POST any email. The bug was a DESTRUCTIVE upsert keyed on email:
// re-submitting an email silently overwrote that subscriber's card_ids. This
// test locks in the non-destructive write — insert-if-new, never overwrite —
// via onConflict:'email' + ignoreDuplicates:true (ON CONFLICT DO NOTHING).

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';

const captured: { row?: any; opts?: any } = {};

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      upsert: async (row: any, opts: any) => { captured.row = row; captured.opts = opts; return { error: null }; },
    }),
  }),
}));

function post(body: unknown) {
  return new Request('http://localhost/api/alerts/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

beforeEach(() => { captured.row = undefined; captured.opts = undefined; });

describe('alerts/subscribe non-destructive write', () => {
  it('uses ON CONFLICT DO NOTHING so an existing subscriber is never overwritten', async () => {
    const { POST } = await import('@/app/api/alerts/subscribe/route');
    const res = await POST(post({ email: 'a@b.com', cards: ['hdfc-regalia'] }));
    expect(res.status).toBe(200);
    expect(captured.opts?.onConflict).toBe('email');
    expect(captured.opts?.ignoreDuplicates).toBe(true);
  });

  it('rejects a payload with no cards', async () => {
    const { POST } = await import('@/app/api/alerts/subscribe/route');
    const res = await POST(post({ email: 'a@b.com', cards: [] }));
    expect(res.status).toBe(400);
    expect(captured.opts).toBeUndefined();
  });
});
