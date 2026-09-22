export type HotelVerdictAction =
  | 'BOOK_CASH'
  | 'USE_HOTEL_POINTS'
  | 'VERIFY_LOYALTY_AVAILABILITY'
  | 'COMPARE_LIVE_OPTIONS'
  | 'WAIT'

export type HotelVerdictInput = {
  destination: string
  cash: {
    amountMinor: number | null
    currency: string | null
    source: string | null
    live: boolean
  }
  loyalty: {
    programmeId: string | null
    propertyName: string | null
    pointsRequired: number | null
    cashComponentMinor: number | null
    cashCurrency: string | null
    status: string | null
    pricingAuthority: 'DATE_SPECIFIC_LIVE' | 'DISCOVERY_ONLY' | 'DIRECT_ONLY' | 'NONE'
  }
}

export type HotelJevVerdict = {
  version: 'creditiq-jev-hotel-v1'
  action: HotelVerdictAction
  confidence: number | null
  source: 'jev' | 'deterministic-fallback'
  verificationRequired: boolean
  reason: string
  latencyMs: number
  model: string
  error?: string | null
}

const MODEL = 'jev-latest'
const ACTIONS: Record<HotelVerdictAction, string> = {
  BOOK_CASH: 'Book the live cash offer because no safer or sufficiently supported points redemption is available.',
  USE_HOTEL_POINTS: 'Use the live date-specific hotel loyalty redemption when the points rate is provider-returned and the evidence is strong enough to prefer it to cash.',
  VERIFY_LOYALTY_AVAILABILITY: 'Do not transfer or commit points yet. Verify the exact hotel and dates directly with the loyalty programme because current points data is cached, discovery-only, or direct-check-only.',
  COMPARE_LIVE_OPTIONS: 'Both live cash and live points facts exist, but neither is clearly dominant from the supplied state; show both and let the user choose after reviewing value.',
  WAIT: 'Take no booking action because the current provider evidence is incomplete or conflicting.',
}

function fallback(input: HotelVerdictInput): HotelVerdictAction {
  const authority = input.loyalty.pricingAuthority
  if (authority === 'DISCOVERY_ONLY' || authority === 'DIRECT_ONLY') return 'VERIFY_LOYALTY_AVAILABILITY'
  if (authority === 'DATE_SPECIFIC_LIVE' && input.loyalty.pointsRequired) {
    if (input.cash.amountMinor != null && input.cash.live) return 'COMPARE_LIVE_OPTIONS'
    return 'USE_HOTEL_POINTS'
  }
  if (input.cash.amountMinor != null && input.cash.live) return 'BOOK_CASH'
  return 'WAIT'
}

function reason(action: HotelVerdictAction, input: HotelVerdictInput) {
  if (action === 'VERIFY_LOYALTY_AVAILABILITY') return 'The loyalty price is not live date-specific yet. Verify the exact hotel and dates before moving points.'
  if (action === 'USE_HOTEL_POINTS') return 'A live date-specific loyalty rate is available for this stay.'
  if (action === 'BOOK_CASH') return 'A live cash offer is available and no safer live points path is currently established.'
  if (action === 'COMPARE_LIVE_OPTIONS') return 'Live cash and live points facts both exist; compare the value before booking.'
  return 'Provider evidence is incomplete, so CreditIQ is not recommending a booking yet.'
}

function parseChoice(value: any) {
  if (!value || value.type !== 'choice') return null
  return {
    choice: typeof value.choice === 'string' ? value.choice : null,
    confidence: Number.isFinite(Number(value.confidence)) ? Number(value.confidence) : null,
  }
}

function guard(raw: string | null, input: HotelVerdictInput): HotelVerdictAction {
  const base = fallback(input)
  const candidate = raw as HotelVerdictAction | null
  const valid = candidate && candidate in ACTIONS ? candidate : base

  if (input.loyalty.pricingAuthority === 'DISCOVERY_ONLY' || input.loyalty.pricingAuthority === 'DIRECT_ONLY') {
    return ['VERIFY_LOYALTY_AVAILABILITY', 'BOOK_CASH', 'WAIT'].includes(valid) ? valid : 'VERIFY_LOYALTY_AVAILABILITY'
  }
  if (input.loyalty.pricingAuthority !== 'DATE_SPECIFIC_LIVE' && valid === 'USE_HOTEL_POINTS') {
    return base
  }
  if (!input.cash.live && valid === 'BOOK_CASH') return base
  return valid
}

export function deterministicHotelVerdict(input: HotelVerdictInput, error?: string | null): HotelJevVerdict {
  const action = fallback(input)
  return {
    version: 'creditiq-jev-hotel-v1',
    action,
    confidence: null,
    source: 'deterministic-fallback',
    verificationRequired: action === 'VERIFY_LOYALTY_AVAILABILITY' || action === 'WAIT',
    reason: reason(action, input),
    latencyMs: 0,
    model: MODEL,
    error: error || null,
  }
}

export async function runJevHotelVerdict(input: HotelVerdictInput, timeoutMs = 900): Promise<HotelJevVerdict> {
  const apiKey = String(process.env.TYPESAFE_API_KEY || process.env.JEV_API_KEY || '').trim()
  if (!apiKey) return deterministicHotelVerdict(input, 'typesafe_key_missing')

  const controller = new AbortController()
  const bounded = Math.max(250, Math.min(timeoutMs, 1500))
  const timer = setTimeout(() => controller.abort(), bounded)
  const started = Date.now()
  try {
    const response = await fetch('https://api.typesafe.ai/v1/systemone', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        state: input,
        questions: {
          action: {
            type: 'choice',
            instructions: 'Choose the safest hotel booking/redemption action using only the supplied provider facts. Never treat discovery-only or direct-only loyalty data as a bookable live points rate. Never invent points, cash prices, availability, transfer ratios, or programme terms.',
            criteria: ACTIONS,
          },
        },
      }),
      cache: 'no-store',
      signal: controller.signal,
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return deterministicHotelVerdict(input, `typesafe_http_${response.status}`)
    const answer = parseChoice(body?.answers?.action)
    if (!answer?.choice) return deterministicHotelVerdict(input, 'typesafe_malformed_response')
    const action = guard(answer.choice, input)
    return {
      version: 'creditiq-jev-hotel-v1',
      action,
      confidence: answer.confidence,
      source: 'jev',
      verificationRequired: action === 'VERIFY_LOYALTY_AVAILABILITY' || action === 'WAIT',
      reason: reason(action, input),
      latencyMs: Date.now() - started,
      model: String(body?.model || MODEL),
      error: null,
    }
  } catch (error: any) {
    return deterministicHotelVerdict(input, error?.name === 'AbortError' ? 'typesafe_timeout' : 'typesafe_error')
  } finally {
    clearTimeout(timer)
  }
}
