export type TravelKind = 'flight' | 'hotel'

export type RedemptionRailType =
  | 'BANK_TRAVEL_PORTAL'
  | 'MERCHANT_PAY_WITH_POINTS'
  | 'LOYALTY_TRANSFER'
  | 'TRAVEL_VOUCHER'
  | 'COBRAND_NATIVE'
  | 'STATEMENT_OFFSET'
  | 'CASH_RETAIN'

/**
 * How far CreditIQ may go with this rail.
 *
 * EXECUTABLE: every fact required for the instruction is sourced.
 * RATIO_ONLY: partner + rational transfer ratio are sourced, but an issuer
 *   minimum/increment or another execution fact is still missing.
 * CHECKOUT_REQUIRED: the rail exists, but value/cap/fee/availability must be
 *   read from the issuer/merchant checkout before arithmetic is authoritative.
 * DISCOVERY_ONLY: useful to surface as a possible rail, but not enough sourced
 *   mechanics exist to rank it economically yet.
 */
export type RailExecutionState =
  | 'EXECUTABLE'
  | 'RATIO_ONLY'
  | 'CHECKOUT_REQUIRED'
  | 'DISCOVERY_ONLY'

export type RailEvidenceKind =
  | 'ISSUER_CAPTURE'
  | 'ISSUER_PUBLIC'
  | 'PROGRAMME_PUBLIC'
  | 'MERCHANT_PUBLIC'
  | 'INTERNAL_FIXTURE'

export interface RailEvidence {
  kind: RailEvidenceKind
  sourceId: string
  sourceUrl?: string
  capturedAt?: string
  note?: string
}

export interface RationalRatio {
  fromUnits: number
  toUnits: number
}

export interface TransferMechanics {
  programmeId: string
  programmeName: string
  destinationCurrency: string
  ratio: RationalRatio
  durationText: string | null
  durationHoursMax: number | null
  irreversible: boolean
  /** null means not yet sourced; never interpret as zero. */
  minimumBankPoints: number | null
  /** null means not yet sourced; never interpret as one. */
  incrementBankPoints: number | null
}

export interface PortalMechanics {
  portalName: string
  supportsPointsPlusCash: boolean
  /** null when card/checkout-specific and not yet captured. */
  valuePerPointPaise: number | null
  /** basis-points cap of booking value payable with points; null if unknown. */
  maxPointsShareBps: number | null
  feeMinor: number | null
}

export interface VoucherMechanics {
  merchant: string
  denominationsInr: number[] | null
  pointsCostPerVoucher: number | null
  expiryDays: number | null
  canCombine: boolean | null
}

export interface RedemptionRailDefinition {
  id: string
  /** Exact CreditIQ card slug(s). Never a bank-wide matcher. */
  cardIds: string[]
  issuer: string
  type: RedemptionRailType
  travelKinds: TravelKind[]
  executionState: RailExecutionState
  evidence: RailEvidence[]
  transfer?: TransferMechanics
  portal?: PortalMechanics
  voucher?: VoucherMechanics
  bookingDestination?: string
  notes?: string[]
}

export interface RailQuery {
  cardId: string
  travelKind: TravelKind
  /** Award/programme being evaluated. Omit for generic inventory/portal discovery. */
  programmeId?: string | null
}
