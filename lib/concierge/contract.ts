// CreditIQ Concierge consumer/HNI contract.
//
// This module is deliberately pure. It validates the client REQUEST snapshot and
// defines legal state transitions, but it never treats client-supplied financial
// numbers as verified. The database stores those snapshots as CLIENT_REQUEST until
// a Concierge operator/server-side verifier replaces them with a verified snapshot.

export const CONCIERGE_STATUSES = [
  'REVIEWING',
  'OPTION_CONFIRMED',
  'AWAITING_USER_APPROVAL',
  'TRANSFER_APPROVED',
  'BOOKING_IN_PROGRESS',
  'BOOKED',
  'RECONCILED',
  'NEEDS_INFORMATION',
  'PRICE_CHANGED',
  'AWARD_UNAVAILABLE',
  'CANCELLED',
  'FAILED',
] as const

export type ConciergeStatus = (typeof CONCIERGE_STATUSES)[number]
export type ConciergeContext = 'PERSONAL' | 'HNI'
export type ConciergeSourceType = 'FLIGHT' | 'HOTEL'
export type ConciergeContactChannel = 'APP' | 'WHATSAPP' | 'BOTH'
export type ConciergeUserAction = 'APPROVE' | 'CANCEL'
export type ConciergeOpsAction =
  | 'CONFIRM_OPTION'
  | 'REQUEST_APPROVAL'
  | 'START_BOOKING'
  | 'MARK_BOOKED'
  | 'RECONCILE'
  | 'NEEDS_INFORMATION'
  | 'PRICE_CHANGED'
  | 'AWARD_UNAVAILABLE'
  | 'FAIL'

export interface CreateConciergeCaseInput {
  context: ConciergeContext
  sourceType: ConciergeSourceType
  sourceRef: string
  title: string
  selection: Record<string, unknown>
  redemptionSnapshot: Record<string, unknown>
  sourceSnapshot: Record<string, unknown>
  expectedCashMinor: number | null
  currency: string
  contactChannel: ConciergeContactChannel
  notes: string | null
}

type ParseResult =
  | { ok: true; value: CreateConciergeCaseInput }
  | { ok: false; error: string }

const MAX_TITLE = 180
const MAX_REF = 200
const MAX_NOTES = 2000
const MAX_SNAPSHOT_BYTES = 32_000
const MAX_TOTAL_SNAPSHOT_BYTES = 72_000
const MAX_DEPTH = 8
const MAX_EXPECTED_CASH_MINOR = 1_000_000_000_000 // ₹10bn in paise; well beyond travel use.

// These keys must never be persisted in a Concierge request snapshot. Last-four
// digits are allowed; full card numbers, secrets and authentication factors are not.
const BLOCKED_KEYS = new Set([
  'password', 'passcode', 'otp', 'cvv', 'cvc', 'pin',
  'cardnumber', 'fullcardnumber', 'pannumber',
  'authorization', 'accesstoken', 'refreshtoken', 'apikey', 'secret',
])

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function normKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function hasBlockedKey(value: unknown, depth = 0): boolean {
  if (depth > MAX_DEPTH) return true
  if (Array.isArray(value)) return value.some((v) => hasBlockedKey(v, depth + 1))
  if (!isPlainObject(value)) return false
  for (const [key, child] of Object.entries(value)) {
    if (BLOCKED_KEYS.has(normKey(key))) return true
    if (hasBlockedKey(child, depth + 1)) return true
  }
  return false
}

function jsonSize(value: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).length
  } catch {
    return Number.POSITIVE_INFINITY
  }
}

function boundedString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > max) return null
  return trimmed
}

export function parseCreateConciergeCaseInput(raw: unknown): ParseResult {
  if (!isPlainObject(raw)) return { ok: false, error: 'invalid body' }

  const context = raw.context
  if (context !== 'PERSONAL' && context !== 'HNI') {
    return { ok: false, error: 'invalid context' }
  }

  const sourceType = raw.sourceType
  if (sourceType !== 'FLIGHT' && sourceType !== 'HOTEL') {
    return { ok: false, error: 'invalid source type' }
  }

  const sourceRef = boundedString(raw.sourceRef, MAX_REF)
  if (!sourceRef) return { ok: false, error: 'invalid source ref' }

  const title = boundedString(raw.title, MAX_TITLE)
  if (!title) return { ok: false, error: 'invalid title' }

  if (!isPlainObject(raw.selection)) return { ok: false, error: 'invalid selection' }
  if (!isPlainObject(raw.redemptionSnapshot)) return { ok: false, error: 'invalid redemption snapshot' }
  if (!isPlainObject(raw.sourceSnapshot)) return { ok: false, error: 'invalid source snapshot' }

  const snapshots = [raw.selection, raw.redemptionSnapshot, raw.sourceSnapshot]
  if (snapshots.some(hasBlockedKey)) return { ok: false, error: 'sensitive data is not allowed' }
  const sizes = snapshots.map(jsonSize)
  if (sizes.some((n) => n > MAX_SNAPSHOT_BYTES) || sizes.reduce((a, b) => a + b, 0) > MAX_TOTAL_SNAPSHOT_BYTES) {
    return { ok: false, error: 'snapshot too large' }
  }

  const expectedCashMinor = raw.expectedCashMinor
  if (
    expectedCashMinor !== null &&
    (!Number.isSafeInteger(expectedCashMinor) || expectedCashMinor < 0 || expectedCashMinor > MAX_EXPECTED_CASH_MINOR)
  ) {
    return { ok: false, error: 'invalid expected cash' }
  }

  const currencyRaw = typeof raw.currency === 'string' ? raw.currency.trim().toUpperCase() : ''
  if (!/^[A-Z]{3}$/.test(currencyRaw)) return { ok: false, error: 'invalid currency' }

  const contactChannel = raw.contactChannel
  if (contactChannel !== 'APP' && contactChannel !== 'WHATSAPP' && contactChannel !== 'BOTH') {
    return { ok: false, error: 'invalid contact channel' }
  }

  let notes: string | null = null
  if (raw.notes !== undefined && raw.notes !== null && raw.notes !== '') {
    if (typeof raw.notes !== 'string' || raw.notes.trim().length > MAX_NOTES) {
      return { ok: false, error: 'invalid notes' }
    }
    notes = raw.notes.trim() || null
  }

  return {
    ok: true,
    value: {
      context,
      sourceType,
      sourceRef,
      title,
      selection: raw.selection,
      redemptionSnapshot: raw.redemptionSnapshot,
      sourceSnapshot: raw.sourceSnapshot,
      expectedCashMinor,
      currency: currencyRaw,
      contactChannel,
      notes,
    },
  }
}

export function userTransition(status: ConciergeStatus, action: ConciergeUserAction): ConciergeStatus | null {
  if (action === 'APPROVE') {
    return status === 'AWAITING_USER_APPROVAL' ? 'TRANSFER_APPROVED' : null
  }

  if (action === 'CANCEL') {
    return [
      'REVIEWING', 'OPTION_CONFIRMED', 'AWAITING_USER_APPROVAL',
      'NEEDS_INFORMATION', 'PRICE_CHANGED', 'AWARD_UNAVAILABLE',
    ].includes(status)
      ? 'CANCELLED'
      : null
  }

  return null
}

export function opsTransition(status: ConciergeStatus, action: ConciergeOpsAction): ConciergeStatus | null {
  switch (action) {
    case 'CONFIRM_OPTION':
      return status === 'REVIEWING' || status === 'PRICE_CHANGED' || status === 'NEEDS_INFORMATION'
        ? 'OPTION_CONFIRMED'
        : null
    case 'REQUEST_APPROVAL':
      return status === 'OPTION_CONFIRMED' ? 'AWAITING_USER_APPROVAL' : null
    case 'START_BOOKING':
      return status === 'TRANSFER_APPROVED' ? 'BOOKING_IN_PROGRESS' : null
    case 'MARK_BOOKED':
      return status === 'BOOKING_IN_PROGRESS' ? 'BOOKED' : null
    case 'RECONCILE':
      return status === 'BOOKED' ? 'RECONCILED' : null
    case 'NEEDS_INFORMATION':
      return ['REVIEWING', 'OPTION_CONFIRMED'].includes(status) ? 'NEEDS_INFORMATION' : null
    case 'PRICE_CHANGED':
      return ['REVIEWING', 'OPTION_CONFIRMED', 'AWAITING_USER_APPROVAL'].includes(status) ? 'PRICE_CHANGED' : null
    case 'AWARD_UNAVAILABLE':
      return ['REVIEWING', 'OPTION_CONFIRMED', 'AWAITING_USER_APPROVAL'].includes(status) ? 'AWARD_UNAVAILABLE' : null
    case 'FAIL':
      return ['TRANSFER_APPROVED', 'BOOKING_IN_PROGRESS'].includes(status) ? 'FAILED' : null
    default:
      return null
  }
}
