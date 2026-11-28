
import { describe, expect, it } from 'vitest'
import { taggedReferral } from './referrals'
import { aggregateInputs, summarizeAcquisition } from './acquisition'

describe('privacy-safe connector acquisition reporting', () => {
  it('calculates per-channel costs only when input aggregates and denominators exist', () => {
    const rows = summarizeAcquisition([
      'log {"event":"creditiq_mcp_call","channel":"claude","tool":"search_credit_cards","outcome":"ok","durationMs":10}',
      '{"event":"creditiq_mcp_call","channel":"claude","tool":"search_credit_cards","outcome":"limited","durationMs":30}',
      '{"event":"creditiq_mcp_call","channel":"chatgpt","tool":"compare_credit_cards","outcome":"ok","durationMs":12}',
      '{"event":"creditiq_mcp_call" broken',
      '{"event":"creditiq_mcp_referral","channel":"chatgpt"}',
    ], aggregateInputs.parse({ claude: { infrastructureCostInr: 10, paidConversions: 2, referrals: 3 } }))
    expect(rows[0]).toMatchObject({ platform: 'claude', calls: 2, successful: 1, meanToolLatencyMs: 20,
      referrals: 3, discovery: null, costPerSuccessfulQueryInr: 10, costPerAcquiredCustomerInr: 5 })
    expect(rows[1]).toMatchObject({ platform: 'chatgpt', calls: 1, successful: 1, costPerSuccessfulQueryInr: null,
      referrals: 1, consentingActiveUsers: null, retained90d: null })
    expect(rows[2]).toMatchObject({ platform: 'mcp', calls: 0, successful: 0 })
  })

  it('counts only tagged referral channels', () => {
    expect(taggedReferral(new URLSearchParams('utm_source=claude&utm_medium=connector&utm_campaign=creditiq_mcp'))).toBe('claude')
    expect(taggedReferral(new URLSearchParams('utm_source=unknown&utm_medium=connector&utm_campaign=creditiq_mcp'))).toBeNull()
    expect(taggedReferral(new URLSearchParams('utm_source=claude'))).toBeNull()
  })

  it('rejects attribution records that include individual identities', () => {
    expect(aggregateInputs.safeParse({ claude: { userId: 'person' } }).success).toBe(false)
  })
})
