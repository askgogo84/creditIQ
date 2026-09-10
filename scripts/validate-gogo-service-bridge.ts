import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { NextRequest } from 'next/server'
import { verifyGogoServiceRequest } from '../lib/gogo-service-auth'

const previous = process.env.GOGO_SERVICE_SECRET
process.env.GOGO_SERVICE_SECRET = 'gogo-service-bridge-test-secret'

function signed(rawBody: string, timestamp = String(Date.now())) {
  const signature = createHmac('sha256', process.env.GOGO_SERVICE_SECRET!)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')
  return new NextRequest('https://creditiq.app/api/internal/gogo/travel/flights', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-gogo-timestamp': timestamp,
      'x-gogo-signature': signature,
    },
    body: rawBody,
  })
}

const body = JSON.stringify({
  type: 'flight', origin: 'BLR', destination: 'BOM', departDate: '2026-09-15', cabin: 'economy',
})
assert.equal(verifyGogoServiceRequest(signed(body), body), true, 'valid service signature must pass')

const tampered = signed(body)
assert.equal(verifyGogoServiceRequest(tampered, body.replace('BOM', 'DEL')), false, 'body tampering must fail')

const staleTs = String(Date.now() - 6 * 60 * 1000)
assert.equal(verifyGogoServiceRequest(signed(body, staleTs), body), false, 'request outside replay window must fail')

const unsigned = new NextRequest('https://creditiq.app/api/internal/gogo/travel/flights', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body,
})
assert.equal(verifyGogoServiceRequest(unsigned, body), false, 'unsigned service request must fail')

const route = readFileSync(new URL('../app/api/internal/gogo/travel/flights/route.ts', import.meta.url), 'utf8')
assert.match(route, /verifyGogoServiceRequest/, 'flight bridge must verify service auth before parsing intent')
assert.match(route, /loadDecisionPortfolio\(userLinkId\)/, 'linked CreditIQ identity must be used only for owner-scoped wallet reads')
assert.match(route, /buildTravelDecisionContract/, 'flight bridge must use CreditIQ canonical decision contract')
assert.match(route, /requiresRepriceBeforeBooking:\s*true/, 'booking handoff must require repricing')
assert.match(route, /irreversiblePointsTransferAllowed:\s*false/, 'bridge must never authorize irreversible points transfer')
assert.match(route, /PARTIAL_FALLBACK/, 'cached/discovery fares must be distinguishable from live provider inventory')
assert.match(route, /pointsAware/, 'response must explicitly disclose whether linked rewards intelligence was available')

if (previous === undefined) delete process.env.GOGO_SERVICE_SECRET
else process.env.GOGO_SERVICE_SECRET = previous

console.log('✅ signed Gogo ↔ CreditIQ flight bridge checks passed')
