import crypto from 'node:crypto'
import type { ConciergeSourceType } from './contract'

export type SandboxSimulation = 'SUCCESS' | 'PAYMENT_DECLINED' | 'SUPPLIER_TIMEOUT'

export type SandboxHolder = {
  firstName: string
  lastName: string
}

export type SandboxBookingInput = {
  caseId: string
  sourceType: ConciergeSourceType
  selection: Record<string, unknown>
  verifiedRedemptionSnapshot: Record<string, unknown> | null
  expectedCashMinor: number | null
  currency: string
  holder: SandboxHolder
  participantCount?: number
  simulation?: SandboxSimulation
}

export type SandboxBookingOutcome = {
  mode: 'SANDBOX'
  provider: 'creditiq-transaction-sandbox'
  sourceType: ConciergeSourceType
  bookingReference: string
  finalCashMinor: number
  currency: string
  participantCount: number
  simulation: SandboxSimulation
  reconciliation: Record<string, unknown>
}

function clean(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function finiteMinor(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null
}

function participantCount(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= 9 ? value : 1
}

function referenceFor(input: SandboxBookingInput): string {
  const digest = crypto
    .createHash('sha256')
    .update([
      input.caseId,
      input.sourceType,
      clean(input.selection.from) || '',
      clean(input.selection.to) || '',
      clean(input.selection.hotel_name) || '',
      clean(input.selection.departs_at) || clean(input.selection.award_date) || '',
      clean(input.selection.city) || '',
    ].join('|'))
    .digest('hex')
    .slice(0, 10)
    .toUpperCase()
  return `CIQ-${input.sourceType === 'FLIGHT' ? 'FLT' : 'HTL'}-${digest}`
}

function validateSelection(sourceType: ConciergeSourceType, selection: Record<string, unknown>) {
  if (sourceType === 'FLIGHT') {
    if (!clean(selection.from) || !clean(selection.to)) throw new Error('sandbox flight requires origin and destination')
    if (!clean(selection.departs_at) && !clean(selection.award_date)) throw new Error('sandbox flight requires a departure date/time')
    return
  }

  if (!clean(selection.hotel_name)) throw new Error('sandbox hotel requires a hotel name')
  if (!clean(selection.city)) throw new Error('sandbox hotel requires a city')
  const nights = typeof selection.nights === 'number' ? selection.nights : Number(selection.nights)
  if (!Number.isSafeInteger(nights) || nights <= 0) throw new Error('sandbox hotel requires a positive night count')
}

export function bookingSandboxEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV === 'test') return true
  if (env.CREDITIQ_BOOKING_SANDBOX === '1' || env.CREDITIQ_BOOKING_SANDBOX === 'true') return true
  return env.VERCEL_ENV === 'preview' || env.VERCEL_ENV === 'development'
}

export function buildSandboxBooking(input: SandboxBookingInput): SandboxBookingOutcome {
  if (!clean(input.holder.firstName) || !clean(input.holder.lastName)) {
    throw new Error('sandbox booking requires holder first and last name')
  }
  if (!input.verifiedRedemptionSnapshot || typeof input.verifiedRedemptionSnapshot !== 'object') {
    throw new Error('sandbox booking requires a server-verified snapshot')
  }
  validateSelection(input.sourceType, input.selection)

  const amount = finiteMinor(input.expectedCashMinor)
  if (amount === null) throw new Error('sandbox booking requires a verified final cash amount')

  const currency = clean(input.currency)?.toUpperCase()
  if (!currency || !/^[A-Z]{3}$/.test(currency)) throw new Error('sandbox booking requires a valid currency')

  const count = participantCount(input.participantCount)
  const simulation: SandboxSimulation = input.simulation || 'SUCCESS'
  const bookingReference = referenceFor(input)

  return {
    mode: 'SANDBOX',
    provider: 'creditiq-transaction-sandbox',
    sourceType: input.sourceType,
    bookingReference,
    finalCashMinor: amount,
    currency,
    participantCount: count,
    simulation,
    reconciliation: {
      mode: 'SANDBOX',
      provider: 'creditiq-transaction-sandbox',
      source_type: input.sourceType,
      booking_reference: bookingReference,
      final_cash_minor: amount,
      currency,
      participant_count: count,
      payment_state: simulation === 'SUCCESS' ? 'SANDBOX_APPROVED' : simulation,
      supplier_state: simulation === 'SUCCESS' ? 'SANDBOX_CONFIRMED' : simulation,
      personal_data_persisted: false,
    },
  }
}
