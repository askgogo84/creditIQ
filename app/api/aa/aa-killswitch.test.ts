/** @vitest-environment node */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// AA KILL-SWITCH GATE
// ------------------------------------------------------------------------
// The Account Aggregator flow ran on the service role with an
// attacker-controllable user_id (the client posted a fabricated
// `user-<timestamp>` id). Every /api/aa/* route is gated OFF unless
// AA_ENABLED is explicitly "true"/"1". This test is the guard that the
// default (unset) state is DISABLED, so the surface can never silently
// re-open. See lib/aa-flag.ts.

const OLD = process.env.AA_ENABLED;
beforeEach(() => { delete process.env.AA_ENABLED; });
afterEach(() => { if (OLD === undefined) delete process.env.AA_ENABLED; else process.env.AA_ENABLED = OLD; });

function post(url: string, body: unknown) {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

describe('AA kill-switch (unset = disabled)', () => {
  it('consent POST returns 404 when AA_ENABLED is unset', async () => {
    const { POST } = await import('@/app/api/aa/consent/route');
    const res = await POST(post('http://localhost/api/aa/consent', { userId: 'x', mobile: '9999999999' }));
    expect(res.status).toBe(404);
  });

  it('fetch-data POST returns 404 when AA_ENABLED is unset', async () => {
    const { POST } = await import('@/app/api/aa/fetch-data/route');
    const res = await POST(post('http://localhost/api/aa/fetch-data', { consentHandle: 'x' }));
    expect(res.status).toBe(404);
  });

  it('status GET returns 404 when AA_ENABLED is unset', async () => {
    const { GET } = await import('@/app/api/aa/status/route');
    const res = await GET(new Request('http://localhost/api/aa/status?userId=x') as any);
    expect(res.status).toBe(404);
  });

  it('callback GET redirects (not 200) when AA_ENABLED is unset', async () => {
    const { GET } = await import('@/app/api/aa/callback/route');
    const res = await GET(new Request('http://localhost/api/aa/callback?consentHandle=x&status=ACTIVE') as any);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/link-card?error=unavailable');
  });
});
