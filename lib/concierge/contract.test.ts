import { describe, expect, it } from 'vitest'
import {
  parseCreateConciergeCaseInput,
  userTransition,
  opsTransition,
} from './contract'

const BASE = {
  context: 'HNI',
  sourceType: 'FLIGHT',
  sourceRef: 'award-sq-15oct',
  title: 'BLR → SIN · Singapore Airlines Business',
  selection: {
    from: 'BLR', to: 'SIN', cabin: 'business', programme: 'KrisFlyer',
  },
  redemptionSnapshot: {
    path: 'TRANSFER', bank: 'Example Bank', card_name: 'Premium Card', exact_transfer_points: null,
  },
  sourceSnapshot: {
    award: { state: 'LIVE', fetched_at: '2026-09-02T07:00:00Z' },
    transfer_rule: { state: 'NEEDS_VERIFICATION' },
  },
  expectedCashMinor: 418000,
  currency: 'INR',
  contactChannel: 'BOTH',
}

describe('concierge create contract', () => {
  it('accepts a bounded Personal/HNI case request and ignores any supplied userId', () => {
    const parsed = parseCreateConciergeCaseInput({ ...BASE, userId: 'user-VICTIM' })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.value).not.toHaveProperty('userId')
    expect(parsed.value.context).toBe('HNI')
    expect(parsed.value.sourceType).toBe('FLIGHT')
    expect(parsed.value.expectedCashMinor).toBe(418000)
  })

  it('rejects Corporate context in the consumer datastore', () => {
    const parsed = parseCreateConciergeCaseInput({ ...BASE, context: 'CORPORATE' })
    expect(parsed).toEqual({ ok: false, error: 'invalid context' })
  })

  it('rejects negative, non-integer and unsafe cash amounts', () => {
    for (const bad of [-1, 10.25, Number.MAX_SAFE_INTEGER + 1]) {
      const parsed = parseCreateConciergeCaseInput({ ...BASE, expectedCashMinor: bad })
      expect(parsed.ok).toBe(false)
    }
  })

  it('allows unknown cash by using null rather than inventing zero', () => {
    const parsed = parseCreateConciergeCaseInput({ ...BASE, expectedCashMinor: null })
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.value.expectedCashMinor).toBeNull()
  })

  it('rejects secrets, OTPs, CVV/PIN and full-card-number-like keys anywhere in snapshots', () => {
    const forbidden = [
      ['selection', { otp: '123456' }],
      ['selection', { cvv: '123' }],
      ['selection', { card_number: '4111111111111111' }],
      ['redemptionSnapshot', { nested: { access_token: 'secret' } }],
      ['sourceSnapshot', { api_key: 'secret' }],
      ['sourceSnapshot', { pin: '9999' }],
    ] as const

    for (const [field, value] of forbidden) {
      const parsed = parseCreateConciergeCaseInput({ ...BASE, [field]: value })
      expect(parsed.ok).toBe(false)
    }
  })

  it('permits masked card hints such as last4 because they are matching metadata, not auth', () => {
    const parsed = parseCreateConciergeCaseInput({
      ...BASE,
      redemptionSnapshot: { path: 'TRANSFER', bank: 'Example Bank', card_last4: '2184' },
    })
    expect(parsed.ok).toBe(true)
  })

  it('caps note and snapshot size instead of accepting arbitrary payloads', () => {
    expect(parseCreateConciergeCaseInput({ ...BASE, notes: 'x'.repeat(2001) }).ok).toBe(false)
    expect(parseCreateConciergeCaseInput({
      ...BASE,
      selection: { text: 'x'.repeat(33000) },
    }).ok).toBe(false)
  })
})

describe('concierge state machine', () => {
  it('does not let a user approve before Concierge requests approval', () => {
    expect(userTransition('REVIEWING', 'APPROVE')).toBeNull()
    expect(userTransition('OPTION_CONFIRMED', 'APPROVE')).toBeNull()
  })

  it('allows user approval only from AWAITING_USER_APPROVAL', () => {
    expect(userTransition('AWAITING_USER_APPROVAL', 'APPROVE')).toBe('TRANSFER_APPROVED')
  })

  it('lets a user cancel before execution, but not after booking begins', () => {
    expect(userTransition('REVIEWING', 'CANCEL')).toBe('CANCELLED')
    expect(userTransition('AWAITING_USER_APPROVAL', 'CANCEL')).toBe('CANCELLED')
    expect(userTransition('BOOKING_IN_PROGRESS', 'CANCEL')).toBeNull()
    expect(userTransition('BOOKED', 'CANCEL')).toBeNull()
  })

  it('requires operations to advance through confirmation and approval boundaries', () => {
    expect(opsTransition('REVIEWING', 'CONFIRM_OPTION')).toBe('OPTION_CONFIRMED')
    expect(opsTransition('OPTION_CONFIRMED', 'REQUEST_APPROVAL')).toBe('AWAITING_USER_APPROVAL')
    expect(opsTransition('AWAITING_USER_APPROVAL', 'START_BOOKING')).toBeNull()
    expect(opsTransition('TRANSFER_APPROVED', 'START_BOOKING')).toBe('BOOKING_IN_PROGRESS')
    expect(opsTransition('BOOKING_IN_PROGRESS', 'MARK_BOOKED')).toBe('BOOKED')
    expect(opsTransition('BOOKED', 'RECONCILE')).toBe('RECONCILED')
  })
})
