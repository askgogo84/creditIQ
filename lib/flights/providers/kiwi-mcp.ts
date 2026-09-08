type Cabin = 'economy' | 'premium_economy' | 'business' | 'first'

export type KiwiMcpCashFlight = {
  id: string
  price: number
  airline: string
  airlines: string[]
  from: string
  to: string
  departure: string
  arrival: string
  duration: number
  durationSeconds: number
  stops: number
  segments: Array<{
    from: string
    to: string
    airline: string
    flightNo: string
    departure: string
    arrival: string
  }>
  bookingLink: string
  provider: 'kiwi-mcp'
  cashCabin: Cabin
}

const ENDPOINT = 'https://mcp.kiwi.com'
const MODERN_PROTOCOL = '2026-07-28'
const LEGACY_PROTOCOLS = ['2025-11-25', '2025-06-18'] as const
const CLIENT_INFO = { name: 'creditiq-travel', version: '1.0.0' }
const REQUIRED_CURRENCY = 'INR'

function ddmmyyyy(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) throw new Error('Kiwi MCP date must use YYYY-MM-DD')
  return `${match[3]}/${match[2]}/${match[1]}`
}

function cabinCode(cabin: Cabin) {
  if (cabin === 'premium_economy') return 'W'
  if (cabin === 'business') return 'C'
  if (cabin === 'first') return 'F'
  return 'M'
}

function normalizeCabin(value: unknown): Cabin | null {
  const raw = String(value || '').toLowerCase().replace(/[ -]+/g, '_')
  if (raw === 'premium_economy' || raw === 'premiumeconomy' || raw === 'w') return 'premium_economy'
  if (raw === 'business' || raw === 'c') return 'business'
  if (raw === 'first' || raw === 'first_class' || raw === 'f') return 'first'
  if (raw === 'economy' || raw === 'm') return 'economy'
  return null
}

function rpcMeta(protocolVersion: string) {
  return {
    'io.modelcontextprotocol/protocolVersion': protocolVersion,
    'io.modelcontextprotocol/clientInfo': CLIENT_INFO,
    'io.modelcontextprotocol/clientCapabilities': {},
  }
}

async function parseRpcResponse(res: Response) {
  const contentType = res.headers.get('content-type') || ''
  const text = await res.text()
  if (!text) return null

  if (contentType.includes('text/event-stream')) {
    const messages = text
      .split(/\r?\n/)
      .filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).trim())
      .filter(Boolean)
      .flatMap(line => {
        try { return [JSON.parse(line)] } catch { return [] }
      })
    return messages.at(-1) || null
  }

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function postRpc(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/event-stream',
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: controller.signal,
    })
    const rpc = await parseRpcResponse(res)
    return { res, rpc }
  } finally {
    clearTimeout(timeout)
  }
}

function toolArguments(input: { from: string; to: string; date: string; cabin: Cabin; adults?: number }) {
  return {
    flyFrom: input.from,
    flyTo: input.to,
    departureDate: ddmmyyyy(input.date),
    cabinClass: cabinCode(input.cabin),
    curr: REQUIRED_CURRENCY,
    sort: 'price',
    passengers: Math.max(1, input.adults ?? 1),
  }
}

async function modernToolCall(args: Record<string, unknown>) {
  return postRpc({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'search-flight',
      arguments: args,
      _meta: rpcMeta(MODERN_PROTOCOL),
    },
  }, {
    'MCP-Protocol-Version': MODERN_PROTOCOL,
    'Mcp-Method': 'tools/call',
    'Mcp-Name': 'search-flight',
  })
}

async function legacyToolCall(args: Record<string, unknown>) {
  let lastError: unknown = null

  for (const protocolVersion of LEGACY_PROTOCOLS) {
    try {
      const initialized = await postRpc({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion,
          capabilities: {},
          clientInfo: CLIENT_INFO,
        },
      })
      if (!initialized.res.ok || initialized.rpc?.error) {
        lastError = initialized.rpc?.error || new Error(`Kiwi MCP initialize failed (${initialized.res.status})`)
        continue
      }

      const sessionId = initialized.res.headers.get('mcp-session-id') || initialized.res.headers.get('Mcp-Session-Id') || ''
      const negotiated = String(initialized.rpc?.result?.protocolVersion || protocolVersion)
      const sessionHeaders: Record<string, string> = {
        'MCP-Protocol-Version': negotiated,
        'Mcp-Method': 'tools/call',
        'Mcp-Name': 'search-flight',
      }
      if (sessionId) sessionHeaders['Mcp-Session-Id'] = sessionId

      // Older Streamable HTTP revisions expect this notification after initialize.
      await postRpc({ jsonrpc: '2.0', method: 'notifications/initialized' }, sessionId ? { 'Mcp-Session-Id': sessionId } : {})

      return postRpc({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'search-flight', arguments: args },
      }, sessionHeaders)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error('Kiwi MCP legacy handshake failed')
}

function extractStructuredResult(rpc: any) {
  if (!rpc || rpc.error) throw new Error(rpc?.error?.message || 'Kiwi MCP returned an RPC error')
  const result = rpc.result
  if (!result || result.isError) throw new Error('Kiwi MCP tool call returned an error')

  const structured = result.structuredContent || result.structured_content
  if (structured && typeof structured === 'object') return structured

  const content = Array.isArray(result.content) ? result.content : []
  for (const item of content) {
    if (item?.type === 'json' && item?.json && typeof item.json === 'object') return item.json
    if (item?.type !== 'text' || typeof item.text !== 'string') continue
    const candidates = [
      item.text.trim(),
      item.text.match(/```json\s*([\s\S]*?)```/i)?.[1]?.trim(),
    ].filter(Boolean) as string[]
    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate)
        if (parsed && typeof parsed === 'object') return parsed
      } catch {
        // Keep looking. Human-readable MCP text is not promoted into structured pricing.
      }
    }
  }

  throw new Error('Kiwi MCP returned no structured flight payload')
}

function normalize(payload: any, input: { from: string; to: string; cabin: Cabin }): KiwiMcpCashFlight[] {
  const itineraries = Array.isArray(payload?.itineraries) ? payload.itineraries : []

  return itineraries.flatMap((itinerary: any, index: number) => {
    const outbound = itinerary?.outbound
    const returnedCabin = normalizeCabin(outbound?.cabinClass)
    if (!outbound || returnedCabin !== input.cabin) return []

    const price = Number(itinerary?.price)
    if (!Number.isFinite(price) || price <= 0) return []
    const rawSegments = Array.isArray(outbound?.segments) ? outbound.segments : []
    const segments = rawSegments.map((segment: any) => ({
      from: String(segment?.from || ''),
      to: String(segment?.to || ''),
      airline: String(segment?.carrier || ''),
      flightNo: String(segment?.flightNumber || ''),
      departure: String(segment?.departureTime || segment?.departure || ''),
      arrival: String(segment?.arrivalTime || segment?.arrival || ''),
    }))
    const airlines = [...new Set(rawSegments.map((segment: any) => String(segment?.carrier || '')).filter(Boolean))]
    const durationSeconds = Number(outbound?.durationSeconds || itinerary?.totalDurationSeconds || 0)
    const departure = String(outbound?.departureTime || segments[0]?.departure || '')
    const arrival = String(outbound?.arrivalTime || segments.at(-1)?.arrival || '')
    const bookingLink = String(itinerary?.bookingUrl || '')
    if (!departure || !arrival || !bookingLink) return []

    return [{
      id: `kiwi-mcp-${index}-${departure}`,
      price,
      airline: airlines[0] || String(rawSegments[0]?.carrierName || 'Multiple'),
      airlines,
      from: String(outbound?.route?.[0] || segments[0]?.from || input.from),
      to: String(outbound?.route?.at?.(-1) || segments.at(-1)?.to || input.to),
      departure,
      arrival,
      duration: durationSeconds > 0 ? Math.max(1, Math.round(durationSeconds / 3600)) : 0,
      durationSeconds,
      stops: Math.max(0, Number(outbound?.stops) || Math.max(0, segments.length - 1)),
      segments,
      bookingLink,
      provider: 'kiwi-mcp' as const,
      cashCabin: input.cabin,
    }]
  }).sort((a: KiwiMcpCashFlight, b: KiwiMcpCashFlight) => a.price - b.price)
}

export async function searchKiwiMcpFlights(input: {
  from: string
  to: string
  date: string
  cabin: Cabin
  adults?: number
}): Promise<{ flights: KiwiMcpCashFlight[]; resultsCount: number | null; currency: string | null; searchTimeMs: number | null; protocol: 'modern' | 'legacy' }> {
  const args = toolArguments(input)
  let call = await modernToolCall(args)
  let protocol: 'modern' | 'legacy' = 'modern'

  if (!call.res.ok || call.rpc?.error) {
    call = await legacyToolCall(args)
    protocol = 'legacy'
  }
  if (!call.res.ok) throw new Error(`Kiwi MCP search failed (${call.res.status})`)

  const payload = extractStructuredResult(call.rpc)
  const currency = payload?.currency ? String(payload.currency).trim().toUpperCase() : null

  // CreditIQ's cash-flight surface is INR-denominated. Kiwi's legacy MCP
  // currently may ignore `curr: INR` and return EUR. Never relabel or convert
  // that amount without a verified FX source: reject it and let the provider
  // chain continue to the next safe INR source.
  if (currency !== REQUIRED_CURRENCY) {
    throw new Error(`Kiwi MCP returned ${currency || 'unknown'} currency; ${REQUIRED_CURRENCY} required`)
  }

  return {
    flights: normalize(payload, input),
    resultsCount: Number.isFinite(Number(payload?.resultsCount)) ? Number(payload.resultsCount) : null,
    currency,
    searchTimeMs: Number.isFinite(Number(payload?.searchTimeMs)) ? Number(payload.searchTimeMs) : null,
    protocol,
  }
}
