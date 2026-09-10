import { createHmac, timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000

function sharedSecret() {
  return String(process.env.GOGO_SERVICE_SECRET || '').trim()
}

function safeEqualHex(expected: string, received: string) {
  try {
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(received, 'hex')
    return a.length > 0 && a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/**
 * Verify a request signed by AskGogo.
 *
 * Contract:
 *   X-Gogo-Timestamp: epoch milliseconds
 *   X-Gogo-Signature: hex(HMAC-SHA256(secret, `${timestamp}.${rawBody}`))
 *
 * The short replay window keeps this suitable for server-to-server travel reads.
 * It intentionally does not identify an end user; user-specific wallet/points reads
 * require a separate account-link record and are not unlocked by this helper alone.
 */
export function verifyGogoServiceRequest(req: NextRequest, rawBody: string) {
  const secret = sharedSecret()
  if (!secret) return false

  const timestamp = String(req.headers.get('x-gogo-timestamp') || '').trim()
  const received = String(req.headers.get('x-gogo-signature') || '').trim().toLowerCase()
  if (!/^\d{13}$/.test(timestamp) || !/^[a-f0-9]{64}$/.test(received)) return false

  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > MAX_CLOCK_SKEW_MS) return false

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  return safeEqualHex(expected, received)
}
