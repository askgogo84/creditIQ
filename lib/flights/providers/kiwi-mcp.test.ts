import { afterEach, describe, expect, it, vi } from 'vitest'
import { searchKiwiMcpFlights } from './kiwi-mcp'

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
  vi.restoreAllMocks()
})

function rpcResponse(payload: unknown) {
  return new Response(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    result: { structuredContent: payload },
  }), { status: 200, headers: { 'content-type': 'application/json' } })
}

function businessPayload(cabinClass: string = 'Business', currency: string = 'INR') {
  return {
    currency,
    resultsCount: 1,
    searchTimeMs: 42,
    itineraries: [{
      price: 12345,
      bookingUrl: 'https://www.kiwi.com/deep-link',
      totalDurationSeconds: 14400,
      outbound: {
        route: ['BLR', 'SIN'],
        departureTime: '2026-10-08T07:00:00',
        arrivalTime: '2026-10-08T11:00:00',
        durationSeconds: 14400,
        stops: 0,
        cabinClass,
        segments: [{
          from: 'BLR',
          to: 'SIN',
          carrier: 'SQ',
          carrierName: 'Singapore Airlines',
          flightNumber: 'SQ509',
          departureTime: '2026-10-08T07:00:00',
          arrivalTime: '2026-10-08T11:00:00',
        }],
      },
    }],
  }
}

describe('Kiwi MCP cash-flight adapter', () => {
  it('requests and returns an exact-cabin structured live INR result', async () => {
    const mock = vi.fn(async () => rpcResponse(businessPayload()))
    global.fetch = mock as typeof fetch

    const result = await searchKiwiMcpFlights({
      from: 'BLR', to: 'SIN', date: '2026-10-08', cabin: 'business', adults: 1,
    })

    expect(result.protocol).toBe('modern')
    expect(result.currency).toBe('INR')
    expect(result.flights).toHaveLength(1)
    expect(result.flights[0]).toMatchObject({
      price: 12345,
      provider: 'kiwi-mcp',
      cashCabin: 'business',
      from: 'BLR',
      to: 'SIN',
    })

    const request = JSON.parse(String((mock.mock.calls[0]?.[1] as RequestInit)?.body || '{}'))
    expect(request.params.arguments).toMatchObject({
      flyFrom: 'BLR',
      flyTo: 'SIN',
      departureDate: '08/10/2026',
      cabinClass: 'C',
      curr: 'INR',
    })
  })

  it('fails closed when the returned cabin does not match the requested cabin', async () => {
    global.fetch = vi.fn(async () => rpcResponse(businessPayload('Economy'))) as typeof fetch

    const result = await searchKiwiMcpFlights({
      from: 'BLR', to: 'SIN', date: '2026-10-08', cabin: 'business', adults: 1,
    })

    expect(result.flights).toEqual([])
  })

  it('rejects a structured non-INR result rather than relabelling or converting it', async () => {
    global.fetch = vi.fn(async () => rpcResponse(businessPayload('Business', 'EUR'))) as typeof fetch

    await expect(searchKiwiMcpFlights({
      from: 'BLR', to: 'SIN', date: '2026-10-08', cabin: 'business', adults: 1,
    })).rejects.toThrow('EUR currency; INR required')
  })

  it('rejects a structured result with no declared currency', async () => {
    const payload = businessPayload()
    delete (payload as any).currency
    global.fetch = vi.fn(async () => rpcResponse(payload)) as typeof fetch

    await expect(searchKiwiMcpFlights({
      from: 'BLR', to: 'SIN', date: '2026-10-08', cabin: 'business', adults: 1,
    })).rejects.toThrow('unknown currency; INR required')
  })

  it('does not promote human-readable MCP text into a structured price', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({
      jsonrpc: '2.0', id: 1,
      result: { content: [{ type: 'text', text: 'Business class from ₹12,345' }] },
    }), { status: 200, headers: { 'content-type': 'application/json' } })) as typeof fetch

    await expect(searchKiwiMcpFlights({
      from: 'BLR', to: 'SIN', date: '2026-10-08', cabin: 'business', adults: 1,
    })).rejects.toThrow('no structured flight payload')
  })
})
