import type { RedemptionOption } from '@/lib/fusion-core'
import { describeDuration } from '@/lib/transfer-ladder'

const PROGRAMME_URLS: Record<string, string> = {
  singapore: 'https://www.singaporeair.com/',
  'air-india': 'https://www.airindia.com/',
  united: 'https://www.united.com/',
  aeroplan: 'https://www.aircanada.com/aeroplan/redeem/',
  alaska: 'https://www.alaskaair.com/',
  ba: 'https://www.britishairways.com/',
  emirates: 'https://www.emirates.com/',
  etihad: 'https://www.etihad.com/',
  qatar: 'https://www.qatarairways.com/',
  flyingblue: 'https://www.flyingblue.com/',
  virginatlantic: 'https://www.virginatlantic.com/',
  delta: 'https://www.delta.com/',
  aadvantage: 'https://www.aa.com/',
  turkish: 'https://www.turkishairlines.com/',
  qantas: 'https://www.qantas.com/',
  velocity: 'https://www.velocityfrequentflyer.com/',
  lifemiles: 'https://www.lifemiles.com/',
}

export type FlightSelfServePlan = {
  executable: boolean
  reason: string | null
  cardLabel: string | null
  pointsNeeded: number | null
  walletPoints: number | null
  shortfall: number
  ratioLabel: string | null
  durationLabel: string | null
  transferState: string | null
  transferAsOf: string | null
  programmeUrl: string | null
  steps: Array<{ title: string; detail: string }>
  warning: string
}

export function programmeUrlForSource(source: string | null | undefined): string | null {
  if (!source) return null
  return PROGRAMME_URLS[source.toLowerCase()] ?? null
}

export function buildFlightSelfServePlan(params: {
  award: { source: string; program: string; mileageCost: number } | null
  option: RedemptionOption | null
  taxesLabel?: string | null
}): FlightSelfServePlan {
  const { award, option, taxesLabel } = params
  const warning = 'Transfers can be irreversible. Confirm the award seat and current mileage price before moving any points.'

  if (!award) {
    return {
      executable: false,
      reason: 'No award programme is attached to this itinerary. Use the cash booking path or send it to Concierge.',
      cardLabel: null,
      pointsNeeded: null,
      walletPoints: null,
      shortfall: 0,
      ratioLabel: null,
      durationLabel: null,
      transferState: null,
      transferAsOf: null,
      programmeUrl: null,
      steps: [],
      warning,
    }
  }

  if (!option || option.status !== 'ok' || option.cardPointsNeeded == null) {
    return {
      executable: false,
      reason: `No mapped card-to-${award.program} transfer path is currently available for this wallet. Concierge can verify alternatives without inventing a ratio.`,
      cardLabel: null,
      pointsNeeded: null,
      walletPoints: null,
      shortfall: 0,
      ratioLabel: null,
      durationLabel: null,
      transferState: null,
      transferAsOf: null,
      programmeUrl: programmeUrlForSource(award.source),
      steps: [],
      warning,
    }
  }

  const route = option.routes?.[0] ?? null
  const held = option.yourPoints ?? 0
  const shortfall = Math.max(0, option.cardPointsNeeded - held)
  const ratio = route?.nominalRatio ?? option.ratio ?? null
  const ratioLabel = ratio ? `${ratio[0]}:${ratio[1]}` : null
  const durationLabel = route ? describeDuration(route) : 'transfer time unknown — confirm before you transfer'
  const cardLabel = `${option.bank} ${option.cardName}`.trim()
  const programmeUrl = programmeUrlForSource(award.source)

  const steps = [
    {
      title: `1. Confirm ${award.program} award space`,
      detail: `Re-check the exact flight and confirm the current price is ${award.mileageCost.toLocaleString('en-IN')} miles before transferring anything.`,
    },
    {
      title: `2. Transfer ${option.cardPointsNeeded.toLocaleString('en-IN')} card points`,
      detail: `From ${cardLabel} to ${award.program}${ratioLabel ? ` at the mapped ${ratioLabel} ratio` : ''}. ${durationLabel}.`,
    },
    {
      title: '3. Wait for the miles to arrive',
      detail: 'Do not assume an instant transfer. Re-check the loyalty account balance and award space after the transfer posts.',
    },
    {
      title: `4. Book with ${award.program}`,
      detail: `Complete the award booking directly with the programme${taxesLabel ? ` and pay ${taxesLabel} in taxes/fees if still current` : '; taxes and fees are confirmed at checkout'}.`,
    },
  ]

  return {
    executable: shortfall === 0,
    reason: shortfall > 0 ? `Your wallet is short by ${shortfall.toLocaleString('en-IN')} points for this mapped route.` : null,
    cardLabel,
    pointsNeeded: option.cardPointsNeeded,
    walletPoints: held,
    shortfall,
    ratioLabel,
    durationLabel,
    transferState: route?.state ?? 'unverified',
    transferAsOf: route?.asOf ?? null,
    programmeUrl,
    steps,
    warning,
  }
}
