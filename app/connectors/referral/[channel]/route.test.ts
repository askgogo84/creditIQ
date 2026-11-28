
import { afterEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { rateGate } from '@/lib/mcp/guard'
import { POST } from './route'

vi.mock('@/lib/mcp/guard', () => ({ connectorEnabled: () => true, rateGate: vi.fn(async () => 'allowed') }))
afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

const url = 'https://www.creditiq.app/connectors/referral/claude'
const headers = { host: 'www.creditiq.app', origin: 'https://www.creditiq.app', 'sec-fetch-site': 'same-origin' }

it('counted referrals contain only a channel and support a server body stream with zero bytes', async () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => {})
  const request = new NextRequest(url, {
    method: 'POST', headers: { ...headers, 'content-length': '0' },
    body: '',
  })
  expect((await POST(request, { params: { channel: 'claude' } })).status).toBe(204)
  expect(log).toHaveBeenCalledWith('{"event":"creditiq_mcp_referral","channel":"claude"}')
})

it('honors privacy controls and rejects cross-site or body-bearing requests', async () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => {})
  const params = { params: { channel: 'claude' } }
  expect((await POST(new NextRequest(url, { method: 'POST', headers: { ...headers, 'sec-gpc': '1' } }), params)).status).toBe(204)
  expect((await POST(new NextRequest(url, { method: 'POST', headers: { ...headers, origin: 'https://untrusted.invalid' } }), params)).status).toBe(403)
  expect((await POST(new NextRequest(url, { method: 'POST', headers: { ...headers, 'content-length': '8' } }), params)).status).toBe(403)
  expect(rateGate).not.toHaveBeenCalled()
  expect(log).not.toHaveBeenCalled()
})
