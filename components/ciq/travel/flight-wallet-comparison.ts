import type { RedemptionOption } from '@/lib/fusion-core'

/**
 * Presentation-only ordering for the Travel UI.
 *
 * IMPORTANT: this does not recompute redemption arithmetic and it does not decide
 * the authoritative winner. The fusion API already builds every card candidate and
 * returns bestOption. This helper only puts the returned wallet candidates in a
 * useful disclosure order so every card the user added remains visible.
 */
export function rankWalletOptions(options: RedemptionOption[]): RedemptionOption[] {
  const bucket = (o: RedemptionOption) => {
    if (o.status === 'ok' && o.canAfford) return 0
    if (o.status === 'ok') return 1
    if (o.status === 'not-transferable') return 2
    return 3
  }

  return [...options].sort((a, b) => {
    const byBucket = bucket(a) - bucket(b)
    if (byBucket) return byBucket

    const aNeed = a.cardPointsNeeded ?? Number.POSITIVE_INFINITY
    const bNeed = b.cardPointsNeeded ?? Number.POSITIVE_INFINITY
    if (aNeed !== bNeed) return aNeed - bNeed

    return `${a.bank}|${a.cardName}`.localeCompare(`${b.bank}|${b.cardName}`)
  })
}

export function sameWalletOption(a: RedemptionOption | null | undefined, b: RedemptionOption | null | undefined): boolean {
  if (!a || !b) return false
  return a.bank === b.bank && a.cardName === b.cardName && a.cardPointsNeeded === b.cardPointsNeeded
}

export function walletOptionReason(option: RedemptionOption, programme: string): string {
  if (option.status === 'currency-unknown') return 'Reward currency not mapped yet'
  if (option.status === 'not-transferable') return `No known route to ${programme}`
  if (option.cardPointsNeeded == null) return 'Transfer requirement unavailable'

  const held = option.yourPoints ?? 0
  if (!option.canAfford) {
    const gap = Math.max(0, option.cardPointsNeeded - held)
    return `Short by ${gap.toLocaleString('en-IN')} points`
  }

  return option.selfEntered ? 'Affordable · balance is self-entered' : 'Affordable with wallet balance'
}
