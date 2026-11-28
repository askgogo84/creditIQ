
import { z } from 'zod'
import { calculateAnnualValue, DEFAULT_SPEND_MIX } from '@/lib/engine'
import { CARD_ISSUER_COMPARISON } from '@/lib/data/card-issuer-comparison'
import { CARD_POINT_VALUES } from '@/lib/data/point-values'
import { isFieldUnknown, isFieldUnverified } from '@/lib/data/unverified-cards'
import { getApplyUrl } from '@/lib/affiliate'
import { SEED_CARDS } from '@/lib/data/seed-cards'
import { railsForCard } from '@/lib/redemption-rails/registry'
import type { CreditCard, UserSpendProfile } from '@/lib/types'
import type { Catalogue } from './catalogue'

export type Channel = 'mcp' | 'claude' | 'chatgpt'
export type Context = Catalogue & { channel: Channel; today: string }
const origin = 'https://www.creditiq.app'
const freshnessDays = 180
const seedBySlug = new Map(SEED_CARDS.map(card => [card.slug, card]))

function cardPath(slug: string) {
  return seedBySlug.has(slug) ? '/card/' + slug : '/cards'
}
const currency = z.number().nonnegative().max(5_000_000)
const text = z.string().trim().min(1).max(80)
  .regex(/^[\p{L}\p{N} .+&,()'’/-]+$/u)
  .refine(value => !/(?:\d[ -]?){12,}/.test(value), 'Use a card product name or slug, never a card number.')
const limit = z.number().int().min(1).max(8).default(5)
const spend = z.strictObject({
  groceries: currency.optional(),
  dining: currency.optional(),
  travel: currency.optional(),
  online: currency.optional(),
  fuel: currency.optional(),
  utilities: currency.optional(),
  other: currency.optional(),
}).refine(input => Object.values(input).reduce((sum, value) => sum + (value ?? 0), 0) <= 5_000_000)
const monthly = z.strictObject({
  monthlySpendInr: currency.positive(),
  spending: spend.optional().describe('Monthly spending in INR by category. Omit to use the CreditIQ default mix. Any unallocated amount goes to other spending.'),
}).refine(({ monthlySpendInr, spending }) =>
  Object.values(spending ?? {}).reduce((sum, value) => sum + (value ?? 0), 0) <= monthlySpendInr,
  'The category amounts must not exceed monthlySpendInr.')
const scope = z.enum(['domestic', 'international'])
const cardIdentifier = text.describe('Exact CreditIQ card slug or a distinctive product name. Never provide a payment card number.')

type Budget = z.infer<typeof monthly>
type Filters = { maxAnnualFeeInr?: number; limit: number }
type ToolResult = { status: string; creditIqUrl: string; source: string; limitations: string[]; [key: string]: unknown }

function link(path: string, channel: Channel) {
  const url = new URL(path, origin)
  url.searchParams.set('utm_source', channel === 'mcp' ? 'mcp' : channel)
  url.searchParams.set('utm_medium', 'connector')
  url.searchParams.set('utm_campaign', 'creditiq_mcp')
  return url.toString()
}

function result(ctx: Context, path = '/cards', extra: Record<string, unknown> = {}): ToolResult {
  return {
    status: 'ok',
    source: ctx.source,
    checkedOn: ctx.today,
    creditIqUrl: link(path, ctx.channel),
    limitations: [
      'CreditIQ catalogue estimates and dated issuer evidence. Confirm current fees, exclusions, and eligibility with the issuer.',
      'No approval, lounge admission, redemption value, or financial outcome is guaranteed.',
      'CreditIQ may earn compensation on some application links on its website. This connector returns no affiliate links.',
      ...(ctx.source === 'curated_snapshot' ? ['The live catalogue was unavailable. Results use the dated curated snapshot.'] : []),
    ],
    ...extra,
  }
}

function norm(value: string) {
  return value.toLowerCase().replace(/\b(?:credit|card|bank|the)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim()
}

function recordAge(date: string | undefined, today: string) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'unknown'
  const days = (Date.parse(today) - Date.parse(date)) / 86_400_000
  if (!Number.isFinite(days) || days < 0) return 'unknown'
  return days > freshnessDays ? 'stale' : 'dated'
}

function safeLabel(value: unknown, max = 100) {
  if (typeof value !== 'string') return ''
  return value.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069<>]/g, ' ').slice(0, max)
}

function sourceUrl(value: string | undefined) {
  if (!value) return null
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? parsed.toString() : null
  } catch {
    return null
  }
}

function storedArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || value.length > 30_000) return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function catalogueCards(ctx: Context) {
  return ctx.cards.filter(card => typeof card?.slug === 'string' &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(card.slug) && typeof card.name === 'string')
}

function resolve(ctx: Context, query: string) {
  const cards = catalogueCards(ctx)
  const needle = norm(query)
  if (!needle) return { reason: 'not_found' as const, candidates: [] }
  const exact = cards.filter(card => card.slug === query.toLowerCase() || norm(card.name) === needle ||
    (norm(card.slug) === needle && needle.split(' ').length > 1))
  const matches = exact.length ? exact : cards.filter(card => {
    const words = new Set(norm(card.name + ' ' + card.slug).split(' '))
    return needle.split(' ').every(word => words.has(word))
  })
  if (exact.length === 1) return { card: exact[0] }
  return { reason: exact.length > 1 ? 'ambiguous_card' as const : 'not_found' as const, candidates: matches.slice(0, 6).map(card => card.slug) }
}

function numeric(card: CreditCard, field: keyof CreditCard) {
  const n = card[field]
  return isFieldUnknown(card.slug, field) || typeof n !== 'number' || !Number.isFinite(n) || n < 0 ? null : n
}

function available(card: CreditCard) {
  return card.active && ![card.name, card.best_for, card.welcome_benefit_description, ...storedArray<string>(card.highlights)]
    .some(value => typeof value === 'string' && /\bdiscontinued\b|\bclosed to new applicants\b|\bno longer issued\b/i.test(value))
}

function describe(card: CreditCard, ctx: Context) {
  const apply = getApplyUrl(card)
  const age = recordAge(card.last_verified, ctx.today)
  const fields = ['joining_fee_inr', 'annual_fee_inr', 'fee_waiver_spend_inr', 'base_reward_rate', 'forex_markup_percent', 'reward_currency'] as const
  const snapshot = ctx.source === 'live_catalogue' ? seedBySlug.get(card.slug) : undefined
  const mismatches = fields.filter(field => snapshot?.[field] != null && card[field] != null && snapshot[field] !== card[field])
  const conflicts = fields.filter(field => isFieldUnverified(card.slug, field) || mismatches.includes(field))
  const comparableNumber = (field: typeof fields[number]) => conflicts.includes(field) ? null : numeric(card, field)
  const foreignFee = comparableNumber('forex_markup_percent')
  // Several live rows use 0 as a placeholder. Only show zero when the dated
  // curated catalogue provides a matching product value.
  const forex = foreignFee === 0 && ctx.source === 'live_catalogue' && snapshot?.forex_markup_percent !== 0 ? null : foreignFee
  return {
    slug: card.slug,
    name: safeLabel(card.name),
    issuer: safeLabel(card.bank ?? ''),
    status: !available(card) ? 'legacy_or_inactive' : age === 'stale' ? 'stale_catalogue' : age === 'unknown' ? 'verification_unknown' : 'listed',
    annualFeeInr: comparableNumber('annual_fee_inr'),
    joiningFeeInr: comparableNumber('joining_fee_inr'),
    annualFeeWaiverSpendInr: comparableNumber('fee_waiver_spend_inr'),
    forexMarkupPercent: forex,
    rewardCurrency: conflicts.includes('reward_currency') ? null : safeLabel(card.reward_currency ?? '', 40),
    disputedOrUnverifiedFields: conflicts,
    lastVerified: age === 'unknown' ? null : card.last_verified,
    freshness: age,
    issuerProductUrl: apply.type === 'direct' ? sourceUrl(apply.url ?? undefined) : null,
    evidenceType: 'creditiq_catalogue',
    creditIqUrl: link(cardPath(card.slug), ctx.channel),
  }
}

function loungeDetails(card: CreditCard, type?: z.infer<typeof scope>) {
  return storedArray<NonNullable<CreditCard['lounges']>[number]>(card.lounges).filter(lounge => lounge && (lounge.type === 'domestic' || lounge.type === 'international') && (!type || lounge.type === type)).slice(0, 6).map(lounge => ({
    scope: lounge.type,
    network: safeLabel(lounge.network, 60),
    visitsPerYear: lounge.visits_per_year ?? null,
    visitsPerQuarter: lounge.visits_per_quarter ?? null,
    spendRequired: lounge.spend_gated ?? null,
    spendThresholdInr: lounge.spend_threshold ?? null,
    recordedUnlimited: /^unlimited\b/i.test(lounge.notes ?? ''),
    issuerConfirmationRequired: true,
  }))
}

function cardError(ctx: Context, resolution: Exclude<ReturnType<typeof resolve>, { card: CreditCard }>) {
  return result(ctx, '/cards', { status: resolution.reason, candidates: resolution.candidates })
}

function eligible(ctx: Context, input: Filters) {
  return catalogueCards(ctx).filter(card => available(card) && (input.maxAnnualFeeInr === undefined ||
    (numeric(card, 'annual_fee_inr') !== null && describe(card, ctx).annualFeeInr !== null &&
      card.annual_fee_inr <= input.maxAnnualFeeInr)))
}

function estimate(card: CreditCard, input: Budget, ctx: Context) {
  const evidence = describe(card, ctx)
  if (!available(card) || evidence.freshness === 'unknown' || evidence.disputedOrUnverifiedFields.length ||
    !['base_reward_rate', 'annual_fee_inr', 'joining_fee_inr'].every(field => numeric(card, field as keyof CreditCard) !== null)) {
    return null
  }
  // Only comparable cash-equivalent rewards with broad, explicitly mapped rates.
  // Do not use merchant, portal, foreign-currency or point conversion assumptions.
  if (card.reward_currency !== 'cashback') return null
  const profile: UserSpendProfile = { monthly_total_inr: input.monthlySpendInr }
  if (input.spending) {
    const categories = { grocery: 'groceries', dining: 'dining', travel: 'travel', online: 'online', fuel: 'fuel', utility: 'utilities' } as const
    for (const bucket of DEFAULT_SPEND_MIX) {
      if (bucket.field) profile[bucket.field] = input.spending[categories[bucket.bucket as keyof typeof categories]] ?? 0
    }
  }
  const broad = new Set(['grocery', 'dining', 'travel', 'online', 'fuel', 'utility'])
  const rules = storedArray<CreditCard['category_rewards'][number]>(card.category_rewards).filter(rule => rule && broad.has(rule.category) && rule.unit === 'percent' &&
    typeof rule.rate === 'number' && Number.isFinite(rule.rate) && rule.rate >= 0)
  const value = calculateAnnualValue({
    ...card,
    welcome_benefit_inr: 0,
    lounges: [],
    fee_waiver_spend_inr: undefined,
    category_rewards: rules,
    redemption_options: [],
  }, profile, { basis: 'cash-only', spendAllocation: input.spending ? 'provided' : 'default' })
  if (![value.gross_rewards_inr, value.recurring_value_inr].every(Number.isFinite)) return null
  return {
    grossAnnualRewardsInr: value.gross_rewards_inr,
    annualRewardsAfterListedFeeInr: value.recurring_value_inr,
    monthlyRewardsInr: Math.round(value.gross_rewards_inr / 12),
    basis: input.spending ? 'provided_spend_mix' : 'creditiq_default_spend_mix',
    freshness: evidence.freshness,
    limitations: [
      'Illustrative catalogue calculation for eligible spend repeated over 12 months.',
      'Excludes joining fees, welcome offers, fee waivers, tax, milestones, lounge value and portal or merchant-specific rates.',
      'Issuer merchant coding, exclusions and cap rules may lower actual rewards.',
    ],
  }
}

function define<S extends z.ZodType>(title: string, description: string, schema: S, run: (input: z.output<S>, ctx: Context) => ToolResult, widget = false) {
  return { title, description, schema, run, widget }
}

export const catalogueTools = {
  search_credit_cards: define('Search Indian credit cards', 'Find Indian credit card products by name, issuer or a catalogue category. Returns dated catalogue evidence and public card links.', z.strictObject({
    query: text.optional(), category: z.enum(['cashback', 'travel', 'rewards', 'premium', 'shopping', 'dining', 'fuel', 'business', 'zero-fee', 'forex']).optional(),
    maxAnnualFeeInr: currency.optional(), limit,
  }), (input, ctx) => {
    const words = input.query ? norm(input.query).split(' ').filter(Boolean) : []
    const cards = eligible(ctx, input).filter(card => {
      const haystack = new Set(norm([card.name, card.slug, card.bank, ...storedArray<string>(card.category)].join(' ')).split(' '))
      return (!input.query || (words.length > 0 && words.every(word => haystack.has(word)))) &&
        (!input.category || storedArray<string>(card.category).includes(input.category))
    }).slice(0, input.limit).map(card => describe(card, ctx))
    return result(ctx, '/cards', { status: cards.length ? 'ok' : 'not_found', cards })
  }),
  compare_credit_cards: define('Compare Indian credit cards', 'Compare two to four named Indian credit cards by fees, rewards currency, forex and documented lounges.', z.strictObject({
    cards: z.array(cardIdentifier).min(2).max(4),
  }), (input, ctx) => {
    const matches = input.cards.map(name => {
      const key = norm(name)
      const match = resolve(ctx, name)
      const terms = CARD_ISSUER_COMPARISON.find(entry =>
        entry.slug === match.card?.slug || entry.slug === name.toLowerCase() ||
        (!match.card && entry.names.some(alias => norm(alias) === key)))
      if (terms && recordAge(terms.lastVerified, ctx.today) === 'dated') {
        const { names, ...evidence } = terms
        return { data: {
          ...evidence, evidenceType: 'issuer_published_snapshot', freshness: 'dated',
          creditIqUrl: link(cardPath(terms.slug), ctx.channel),
        } }
      }
      if (match.card) return { data: { ...describe(match.card, ctx), lounges: loungeDetails(match.card) } }
      return { error: { reason: match.reason, candidates: match.candidates } }
    })
    const cards = matches.flatMap(match => match.data ? [match.data] : [])
    const unresolved = matches.flatMap((match, index) => match.error ? [{ index, ...match.error }] : [])
    return result(ctx, '/compare', { status: unresolved.length ? cards.length ? 'partial' : 'not_found' : 'ok', cards, unresolved })
  }, true),
  recommend_credit_cards: define('Shortlist cards by monthly spending', 'Compare illustrative cashback rewards for eligible Indian card products using a monthly INR budget. Does not assess credit eligibility.', z.strictObject({
    budget: monthly, maxAnnualFeeInr: currency.optional(), limit,
  }), (input, ctx) => {
    const cards = eligible(ctx, input).flatMap(card => {
      const value = estimate(card, input.budget, ctx)
      return value ? [{ ...describe(card, ctx), estimate: value }] : []
    }).sort((a, b) => Number(a.freshness === 'stale') - Number(b.freshness === 'stale') ||
      b.estimate.annualRewardsAfterListedFeeInr - a.estimate.annualRewardsAfterListedFeeInr ||
      a.slug.localeCompare(b.slug)).slice(0, input.limit)
    return result(ctx, '/cards', { status: cards.length ? 'ok' : 'insufficient_evidence', ranking: 'Dated cashback estimates, with stale entries ranked after more recent records.', cards })
  }),
  check_lounge_access: define('Check airport lounge benefits', 'Find recorded domestic or international credit card lounge benefits. Does not verify an airport, terminal, remaining visits or admission.', z.strictObject({
    card: cardIdentifier.optional(), scope, maxAnnualFeeInr: currency.optional(), limit,
  }), (input, ctx) => {
    const match = input.card ? resolve(ctx, input.card) : null
    if (match && !match.card) return cardError(ctx, match)
    const cards = (match?.card ? [match.card] : eligible(ctx, input))
      .filter(card => loungeDetails(card, input.scope).length > 0)
      .sort((a, b) => (b.last_verified ?? '').localeCompare(a.last_verified ?? ''))
      .slice(0, input.limit).map(card => ({ ...describe(card, ctx), lounges: loungeDetails(card, input.scope) }))
    return result(ctx, '/cards', {
      status: cards.length ? 'ok' : 'insufficient_evidence', cards,
      conditions: 'Issuer, network, airport, terminal, spend windows, guest limits and remaining visits can affect admission.',
    })
  }),
  calculate_rewards: define('Estimate monthly credit card rewards', 'Calculate illustrative rewards for eligible spending by category in INR using supported cashback cards and dated CreditIQ rules. Never supply transactions or card credentials.', z.strictObject({
    card: cardIdentifier, budget: monthly,
  }), (input, ctx) => {
    const match = resolve(ctx, input.card)
    if (!match.card) return cardError(ctx, match)
    const value = estimate(match.card, input.budget, ctx)
    return result(ctx, cardPath(match.card.slug), {
      status: value ? 'ok' : 'insufficient_evidence', cards: [{ ...describe(match.card, ctx), estimate: value }],
      conditions: value ? 'Confirm exclusions and actual merchant coding.' : 'Comparable cashback rules or numeric inputs are unavailable for this card. Point-based cards require issuer earn and redemption evidence.',
    })
  }, true),
  check_card_benefits: define('Look up card benefits and changes', 'Look up dated benefits, fees, lounges and recorded benefit changes for a credit card. Historical changes do not establish today’s terms.', z.strictObject({ card: cardIdentifier }), (input, ctx) => {
    const match = resolve(ctx, input.card)
    if (!match.card) return cardError(ctx, match)
    const card = match.card
    const changes = storedArray<NonNullable<CreditCard['devaluations']>[number]>(card.devaluations).filter(change => change && /^\d{4}-\d{2}-\d{2}$/.test(change.date))
      .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map(change => ({
        effectiveDate: change.date, category: change.category, sourceUrl: sourceUrl(change.source_url),
        state: change.date > ctx.today ? 'scheduled_change' : 'historical_change',
      }))
    return result(ctx, cardPath(card.slug), { cards: [{ ...describe(card, ctx), lounges: loungeDetails(card) }], changes,
      conditions: 'An empty change list does not establish that benefits are unchanged.' })
  }),
  optimize_redemption: define('Compare credit card redemption options', 'Compare statement credit, catalogue or voucher options and airline transfer ratios where evidence is available. No redemptions or transfers are executed.', z.strictObject({
    card: cardIdentifier, points: z.number().int().positive().max(10_000_000).optional(),
  }), (input, ctx) => {
    const match = resolve(ctx, input.card)
    if (!match.card) return cardError(ctx, match)
    const card = match.card
    const pointValues = CARD_POINT_VALUES.find(row => row.card === card.slug)
    const values = (pointValues?.channels ?? []).filter(channel => channel.kind !== 'transfer-partner').map(channel => {
      const money = channel.state === 'issuer-published' && recordAge(channel.as_of, ctx.today) === 'dated' ? channel.value_paise : null
      return { channel: channel.kind, status: channel.state, freshness: recordAge(channel.as_of, ctx.today), lastVerified: channel.as_of,
        sourceUrl: sourceUrl(channel.source), valuePerPointPaise: money,
        illustrativeValueInr: input.points && money !== null ? input.points * money / 100 : null }
    })
    const rails = [...railsForCard(card.slug, 'flight'), ...railsForCard(card.slug, 'hotel')]
      .filter((rail, index, all) => all.findIndex(other => other.id === rail.id) === index)
    const transfers = rails.filter(rail => rail.type === 'LOYALTY_TRANSFER' && rail.transfer).slice(0, 12).map(rail => ({
      partner: rail.transfer!.programmeName,
      status: rail.executionState,
      ratio: rail.evidence.some(item => item.kind !== 'INTERNAL_FIXTURE' && recordAge(item.capturedAt, ctx.today) === 'dated') ? rail.transfer!.ratio : null,
      minimumBankPoints: rail.transfer!.minimumBankPoints,
      incrementBankPoints: rail.transfer!.incrementBankPoints,
      evidence: rail.evidence.filter(item => item.kind !== 'INTERNAL_FIXTURE').map(item => ({
        kind: item.kind, sourceUrl: sourceUrl(item.sourceUrl), lastVerified: item.capturedAt ?? null,
      })),
    }))
    const vouchers = rails.filter(rail => rail.type === 'TRAVEL_VOUCHER').slice(0, 5).map(rail => ({
      status: rail.executionState,
      evidence: rail.evidence.filter(item => item.kind !== 'INTERNAL_FIXTURE').map(item => ({
        sourceUrl: sourceUrl(item.sourceUrl), lastVerified: item.capturedAt ?? null,
      })),
    }))
    return result(ctx, cardPath(card.slug), {
      status: values.length || transfers.length || vouchers.length ? 'ok' : 'insufficient_evidence',
      cards: [describe(card, ctx)], values, vouchers, transfers,
      conditions: 'Compare issuer checkout fees, minimums, expiry, taxes and award availability. A transfer ratio is not a cash valuation.',
    })
  }),
  find_travel_card: define('Find cards for international travel', 'Find Indian credit cards with recorded forex markups or international lounge benefits. Returns fee and terms evidence for comparison.', z.strictObject({
    maxAnnualFeeInr: currency.optional(), maxForexMarkupPercent: z.number().min(0).max(10).optional(),
    internationalLoungeRequired: z.boolean().default(false), limit,
  }), (input, ctx) => {
    const cards = eligible(ctx, input).map(card => ({ ...describe(card, ctx), lounges: loungeDetails(card, 'international') }))
      .filter(card => (card.forexMarkupPercent !== null || card.lounges.length > 0) &&
        (!input.internationalLoungeRequired || card.lounges.length > 0) &&
        (input.maxForexMarkupPercent === undefined ||
          (card.forexMarkupPercent !== null && card.forexMarkupPercent <= input.maxForexMarkupPercent)))
      .sort((a, b) => Number(a.freshness !== 'dated') - Number(b.freshness !== 'dated') ||
        (a.forexMarkupPercent ?? Infinity) - (b.forexMarkupPercent ?? Infinity) ||
        (a.annualFeeInr ?? Infinity) - (b.annualFeeInr ?? Infinity))
      .slice(0, input.limit)
    return result(ctx, '/cards', { status: cards.length ? 'ok' : 'insufficient_evidence', cards,
      conditions: 'Forex markups exclude dynamic currency conversion, network rates and applicable taxes.' })
  }),
}

export const walletComparison = {
  schema: z.strictObject({ budget: monthly, consentToReadSavedCardProducts: z.boolean() }),
  run(input: { budget: Budget; consentToReadSavedCardProducts: boolean }, ctx: Context, productNames: string[]) {
    const found = new Map<string, CreditCard>()
    for (const name of productNames) {
      const match = resolve(ctx, name)
      if (match.card) found.set(match.card.slug, match.card)
    }
    const cards = [...found.values()].map(card => ({ ...describe(card, ctx), estimate: estimate(card, input.budget, ctx) }))
      .sort((a, b) => (b.estimate?.annualRewardsAfterListedFeeInr ?? -Infinity) - (a.estimate?.annualRewardsAfterListedFeeInr ?? -Infinity))
      .slice(0, 8)
    return result(ctx, '/profile', {
      status: cards.length ? 'ok' : 'insufficient_evidence', cards,
      conditions: 'Estimates cover recognized saved card products only. Statement details, payment card identifiers and balances are omitted.',
    })
  },
}
