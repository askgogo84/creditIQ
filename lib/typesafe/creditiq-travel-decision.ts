import type { TravelDecisionContract } from '@/lib/travel/decision-contract'

export type CreditIQJevAction =
  | 'USE_POINTS'
  | 'POINTS_PLUS_CASH'
  | 'PAY_CASH'
  | 'VERIFY_AWARD_FIRST'
  | 'VERIFY_REDEMPTION'
  | 'WAIT'
  | 'NO_SAFE_ACTION'

export type CreditIQTransferRisk = 'LOW' | 'MEDIUM' | 'HIGH'

export type CreditIQJevDecision = {
  version: 'creditiq-jev-travel-v1'
  action: CreditIQJevAction
  confidence: number | null
  verificationRequired: boolean
  transferRisk: CreditIQTransferRisk
  source: 'jev' | 'deterministic-fallback'
  reason: string
  model: string
  latencyMs: number
  error?: string | null
}

const MODEL = 'jev-latest'
const VERSION = 'creditiq-jev-travel-v1' as const

const ACTION_CRITERIA: Record<CreditIQJevAction, string> = {
  USE_POINTS: 'Use points now only when the existing CreditIQ contract says a points redemption is executable from sourced live/provider-returned facts.',
  POINTS_PLUS_CASH: 'Use a points plus cash path now only when the existing CreditIQ contract says that exact path is executable.',
  PAY_CASH: 'Pay cash and retain points when cash is the safest executable path or point economics are not compelling enough.',
  VERIFY_AWARD_FIRST: 'Do not transfer points yet. Verify live award inventory and the current award price first because the award is discovery-only, cached, guide-based, stale, or otherwise not live-confirmed.',
  VERIFY_REDEMPTION: 'Do not execute yet. Verify issuer, portal, checkout, taxes, ratio, minimums, caps, or other redemption terms before committing points or cash.',
  WAIT: 'Take no booking or transfer action yet because source quality, provider conflict, timing, or uncertainty is too high.',
  NO_SAFE_ACTION: 'No safe recommendation can be made from the currently sourced facts.',
}

const RISK_CRITERIA: Record<CreditIQTransferRisk, string> = {
  LOW: 'No irreversible transfer is needed, or all material facts needed for the selected action are already live/provider verified.',
  MEDIUM: 'A transfer or redemption may be reasonable after one bounded live verification step; economics are mostly sourced but one material check remains.',
  HIGH: 'An irreversible transfer could be made from discovery-only, cached, incomplete, conflicting, or unverified facts. The user must not transfer yet.',
}

function fallbackAction(decision: TravelDecisionContract): CreditIQJevAction {
  const verdict = decision.searchSummary?.verdict
  if (verdict === 'USE_POINTS') return 'USE_POINTS'
  if (verdict === 'POINTS_PLUS_CASH') return 'POINTS_PLUS_CASH'
  if (verdict === 'PAY_CASH') return 'PAY_CASH'
  if (verdict === 'VERIFY_AWARD') return 'VERIFY_AWARD_FIRST'
  if (verdict === 'VERIFY_REDEMPTION') return 'VERIFY_REDEMPTION'
  return 'NO_SAFE_ACTION'
}

function deterministicRisk(decision: TravelDecisionContract): CreditIQTransferRisk {
  if (decision.awardState.status === 'DISCOVERY_ONLY') return 'HIGH'
  if (decision.conciergeAction.requiresLiveReverification) return 'MEDIUM'
  if (decision.blockedReasons.length > 0) return 'MEDIUM'
  return 'LOW'
}

function verificationRequired(action: CreditIQJevAction, decision: TravelDecisionContract) {
  return action === 'VERIFY_AWARD_FIRST'
    || action === 'VERIFY_REDEMPTION'
    || action === 'WAIT'
    || action === 'NO_SAFE_ACTION'
    || decision.conciergeAction.requiresLiveReverification
}

function reasonFor(action: CreditIQJevAction, decision: TravelDecisionContract): string {
  if (action === 'VERIFY_AWARD_FIRST') {
    return 'Award evidence is not live-confirmed. Verify the exact seat and current award price before moving points.'
  }
  if (action === 'VERIFY_REDEMPTION') {
    return decision.blockedReasons[0] || 'The projected redemption still needs a live issuer or checkout verification.'
  }
  if (action === 'PAY_CASH') return 'Cash is the safest executable option from the currently sourced facts.'
  if (action === 'USE_POINTS') return 'CreditIQ has an executable points path from the currently sourced facts.'
  if (action === 'POINTS_PLUS_CASH') return 'CreditIQ has an executable points plus cash path from the currently sourced facts.'
  if (action === 'WAIT') return 'The current evidence is too uncertain for a transfer or booking recommendation.'
  return decision.blockedReasons[0] || 'CreditIQ cannot establish a safe action from the current evidence.'
}

function buildState(decision: TravelDecisionContract) {
  const best = decision.searchSummary?.bestPath ?? null
  return {
    travel_kind: decision.travelKind,
    deterministic_verdict: decision.searchSummary?.verdict ?? 'NO_SAFE_ACTION',
    inventory_state: decision.inventory.state,
    award: {
      status: decision.awardState.status,
      programme_id: decision.awardState.programmeId,
      points_required: decision.awardState.pointsRequired,
      taxes_minor: decision.awardState.taxesMinor,
      taxes_currency: decision.awardState.taxesCurrency,
      pricing_authority: decision.sourceAuthority.awardPricingAuthority,
      source: decision.sourceAuthority.award,
    },
    cash: {
      amount_minor: decision.searchSummary?.cash.amountMinor ?? null,
      currency: decision.searchSummary?.cash.currency ?? null,
      source: decision.sourceAuthority.cash,
    },
    best_path: best ? {
      rail_type: best.railType,
      state: best.state,
      affordability: best.affordability,
      bank_points_required: best.bankPointsRequired,
      cash_payable_minor: best.cashPayableMinor,
      savings_vs_cash_minor: best.savingsVsCashMinor,
      value_per_bank_point_inr: best.valuePerBankPointInr,
      is_best_executable: best.isBestExecutable,
      is_best_projected: best.isBestProjected,
    } : null,
    blocked_reasons: decision.blockedReasons.slice(0, 6),
    requires_live_reverification: decision.conciergeAction.requiresLiveReverification,
    irreversible_transfer_allowed: false,
  }
}

function parseChoice(value: any) {
  if (!value || value.type !== 'choice') return null
  const choice = typeof value.choice === 'string' ? value.choice : null
  const confidence = Number.isFinite(Number(value.confidence)) ? Number(value.confidence) : null
  return { choice, confidence }
}

function guardAction(raw: string | null, decision: TravelDecisionContract): CreditIQJevAction {
  const base = fallbackAction(decision)
  const candidate = raw as CreditIQJevAction | null
  const valid = candidate && Object.prototype.hasOwnProperty.call(ACTION_CRITERIA, candidate) ? candidate : base

  // Deterministic safety remains authoritative. Jev can confirm or downgrade,
  // never promote incomplete evidence into an irreversible points instruction.
  if (base === 'VERIFY_AWARD_FIRST') {
    return ['VERIFY_AWARD_FIRST', 'PAY_CASH', 'WAIT', 'NO_SAFE_ACTION'].includes(valid) ? valid : 'VERIFY_AWARD_FIRST'
  }
  if (base === 'VERIFY_REDEMPTION') {
    return ['VERIFY_REDEMPTION', 'PAY_CASH', 'WAIT', 'NO_SAFE_ACTION'].includes(valid) ? valid : 'VERIFY_REDEMPTION'
  }
  if (base === 'NO_SAFE_ACTION') return 'NO_SAFE_ACTION'
  if (base === 'PAY_CASH') {
    return ['PAY_CASH', 'WAIT', 'NO_SAFE_ACTION'].includes(valid) ? valid : 'PAY_CASH'
  }
  if (base === 'USE_POINTS') {
    return ['USE_POINTS', 'PAY_CASH', 'WAIT', 'NO_SAFE_ACTION'].includes(valid) ? valid : 'USE_POINTS'
  }
  if (base === 'POINTS_PLUS_CASH') {
    return ['POINTS_PLUS_CASH', 'PAY_CASH', 'WAIT', 'NO_SAFE_ACTION'].includes(valid) ? valid : 'POINTS_PLUS_CASH'
  }
  return base
}

export function deterministicTravelDecision(decision: TravelDecisionContract, error?: string | null): CreditIQJevDecision {
  const action = fallbackAction(decision)
  return {
    version: VERSION,
    action,
    confidence: null,
    verificationRequired: verificationRequired(action, decision),
    transferRisk: deterministicRisk(decision),
    source: 'deterministic-fallback',
    reason: reasonFor(action, decision),
    model: MODEL,
    latencyMs: 0,
    error: error || null,
  }
}

export async function runJevTravelDecision(
  decision: TravelDecisionContract,
  options: { timeoutMs?: number } = {},
): Promise<CreditIQJevDecision> {
  const apiKey = String(process.env.TYPESAFE_API_KEY || process.env.JEV_API_KEY || '').trim()
  if (!apiKey) return deterministicTravelDecision(decision, 'typesafe_key_missing')

  const timeoutMs = Math.max(250, Math.min(Number(options.timeoutMs || 900), 1500))
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const started = Date.now()

  try {
    const response = await fetch('https://api.typesafe.ai/v1/systemone', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        state: buildState(decision),
        questions: {
          action: {
            type: 'choice',
            instructions: 'Choose the safest next CreditIQ action. Use only the supplied state. Never assume missing inventory, taxes, ratios, fees, availability, or issuer terms. Never recommend an irreversible transfer from discovery-only or unverified award evidence.',
            criteria: ACTION_CRITERIA,
          },
          transfer_risk: {
            type: 'choice',
            instructions: 'Classify the risk of acting on the currently available points-transfer/redemption evidence. High means the user must not transfer yet.',
            criteria: RISK_CRITERIA,
          },
        },
      }),
      cache: 'no-store',
      signal: controller.signal,
    })

    const body = await response.json().catch(() => ({}))
    if (!response.ok) return deterministicTravelDecision(decision, `typesafe_http_${response.status}`)

    const actionAnswer = parseChoice(body?.answers?.action)
    const riskAnswer = parseChoice(body?.answers?.transfer_risk)
    if (!actionAnswer?.choice || !riskAnswer?.choice) {
      return deterministicTravelDecision(decision, 'typesafe_malformed_response')
    }

    const action = guardAction(actionAnswer.choice, decision)
    const baseRisk = deterministicRisk(decision)
    const rawRisk = riskAnswer.choice as CreditIQTransferRisk
    const risk = Object.prototype.hasOwnProperty.call(RISK_CRITERIA, rawRisk) ? rawRisk : baseRisk
    const protectedRisk: CreditIQTransferRisk =
      decision.awardState.status === 'DISCOVERY_ONLY' ? 'HIGH'
      : decision.conciergeAction.requiresLiveReverification && risk === 'LOW' ? 'MEDIUM'
      : risk

    return {
      version: VERSION,
      action,
      confidence: actionAnswer.confidence,
      verificationRequired: verificationRequired(action, decision),
      transferRisk: protectedRisk,
      source: 'jev',
      reason: reasonFor(action, decision),
      model: String(body?.model || MODEL),
      latencyMs: Date.now() - started,
      error: null,
    }
  } catch (error: any) {
    const code = error?.name === 'AbortError' ? 'typesafe_timeout' : 'typesafe_error'
    return deterministicTravelDecision(decision, code)
  } finally {
    clearTimeout(timer)
  }
}
