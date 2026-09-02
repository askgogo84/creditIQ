import { createClient } from '@supabase/supabase-js'

export type DecisionCardSource = 'statement' | 'linked' | 'manual'

export type DecisionWalletCard = {
  source: DecisionCardSource
  bank: string
  cardName: string | null
  last4: string | null
  points: number
  pointsCurrency: string
  verified: boolean
  selfEntered: boolean
  observedAt: string | null
  // True when an AA-linked balance was combined with a named statement/manual
  // identity for the same bank + last4. The name is never guessed from AA alone.
  linkedBalanceMerged: boolean
}

type StatementRow = {
  bank?: string | null
  card_name?: string | null
  card_last4?: string | null
  points_balance?: number | null
  points_currency?: string | null
  self_entered?: boolean | null
  statement_date?: string | null
  imported_at?: string | null
}

type ManualRow = {
  bank?: string | null
  card_name?: string | null
  card_last4?: string | null
  points_balance?: number | null
  points_currency?: string | null
  imported_at?: string | null
}

type LinkedRow = {
  bank?: string | null
  masked_number?: string | null
  reward_points?: number | null
  synced_at?: string | null
}

export type DecisionPortfolioInput = {
  statements: StatementRow[]
  manual: ManualRow[]
  linked: LinkedRow[]
}

function clean(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function bankKey(bank: string): string {
  return bank.toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/(bank|cards|card|limited|ltd)+$/g, '')
}

function safePoints(v: unknown): number {
  return Number.isSafeInteger(v) && Number(v) >= 0 ? Number(v) : 0
}

function timeValue(v: string | null | undefined): number {
  if (!v) return 0
  const t = Date.parse(v)
  return Number.isFinite(t) ? t : 0
}

function last4FromMasked(masked: string | null | undefined): string | null {
  const digits = clean(masked).replace(/\D/g, '')
  return digits.length >= 4 ? digits.slice(-4) : null
}

function identityKey(bank: string, last4: string | null, cardName: string | null): string {
  const bankPart = bankKey(bank)
  if (last4) return `${bankPart}|${last4}`
  return `${bankPart}|name:${clean(cardName).toLowerCase().replace(/[^a-z0-9]+/g, '')}`
}

function newestBy<T>(rows: T[], getTime: (row: T) => string | null | undefined): T[] {
  return [...rows].sort((a, b) => timeValue(getTime(b)) - timeValue(getTime(a)))
}

/**
 * Build the canonical wallet used for financial decisioning.
 *
 * Rules:
 * - Same physical card is keyed by canonical bank + last4 when available.
 * - Statement identity beats manual identity; an AA-linked balance can refresh the
 *   points on that named identity when it is at least as recent.
 * - AA rows with no matching named card remain visible with cardName=null. They are
 *   not silently mapped to a product or transfer currency.
 * - Manual values are always self-entered/unverified.
 * - A statement remains verified only while it has not been hand-edited.
 */
export function buildDecisionPortfolio(input: DecisionPortfolioInput): DecisionWalletCard[] {
  const map = new Map<string, DecisionWalletCard>()
  const observed = new Map<string, number>()

  // Manual first: lowest-trust fallback identity.
  for (const row of newestBy(input.manual, (r) => r.imported_at)) {
    const bank = clean(row.bank)
    const cardName = clean(row.card_name) || null
    const last4 = clean(row.card_last4) || null
    if (!bank || !cardName) continue
    const key = identityKey(bank, last4, cardName)
    if (map.has(key)) continue
    map.set(key, {
      source: 'manual', bank, cardName, last4,
      points: safePoints(row.points_balance),
      pointsCurrency: clean(row.points_currency) || 'Points',
      verified: false, selfEntered: true,
      observedAt: row.imported_at ?? null,
      linkedBalanceMerged: false,
    })
    observed.set(key, timeValue(row.imported_at))
  }

  // Statement next: named, higher-trust identity replaces manual for same card.
  for (const row of newestBy(input.statements, (r) => r.imported_at ?? r.statement_date)) {
    const bank = clean(row.bank)
    const cardName = clean(row.card_name) || null
    const last4 = clean(row.card_last4) || null
    if (!bank || !cardName) continue
    const key = identityKey(bank, last4, cardName)
    const rowTime = timeValue(row.imported_at ?? row.statement_date)
    const current = map.get(key)
    if (current?.source === 'statement' && (observed.get(key) ?? 0) >= rowTime) continue
    map.set(key, {
      source: 'statement', bank, cardName, last4,
      points: safePoints(row.points_balance),
      pointsCurrency: clean(row.points_currency) || 'Points',
      verified: row.self_entered !== true,
      selfEntered: row.self_entered === true,
      observedAt: row.imported_at ?? row.statement_date ?? null,
      linkedBalanceMerged: false,
    })
    observed.set(key, rowTime)
  }

  // AA-linked balances last. If a named identity exists for bank+last4, preserve
  // that name/currency but allow the linked balance to refresh it. If not, keep an
  // unnamed linked card visible; transfer routing must treat it as unmapped.
  for (const row of newestBy(input.linked, (r) => r.synced_at)) {
    const bank = clean(row.bank)
    const last4 = last4FromMasked(row.masked_number)
    if (!bank) continue
    const key = identityKey(bank, last4, null)
    const rowTime = timeValue(row.synced_at)
    const current = map.get(key)

    if (current) {
      if (rowTime >= (observed.get(key) ?? 0)) {
        map.set(key, {
          ...current,
          source: 'linked',
          points: safePoints(row.reward_points),
          verified: true,
          selfEntered: false,
          observedAt: row.synced_at ?? current.observedAt,
          linkedBalanceMerged: true,
        })
        observed.set(key, rowTime)
      }
      continue
    }

    map.set(key, {
      source: 'linked', bank, cardName: null, last4,
      points: safePoints(row.reward_points),
      pointsCurrency: 'Points',
      verified: true, selfEntered: false,
      observedAt: row.synced_at ?? null,
      linkedBalanceMerged: false,
    })
    observed.set(key, rowTime)
  }

  return [...map.values()]
}

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

/** Owner-scoped server read. Never accepts a user id from an unverified request body. */
export async function loadDecisionPortfolio(userId: string): Promise<DecisionWalletCard[]> {
  const sb = service()
  const [stmt, manual, consents] = await Promise.all([
    sb.from('statement_imports')
      .select('bank, card_name, card_last4, points_balance, points_currency, self_entered, statement_date, imported_at')
      .eq('user_id', userId)
      .order('imported_at', { ascending: false }),
    sb.from('manual_cards')
      .select('bank, card_name, card_last4, points_balance, points_currency, imported_at')
      .eq('user_id', userId)
      .order('imported_at', { ascending: false }),
    sb.from('aa_consents')
      .select('consent_handle')
      .eq('user_id', userId)
      .eq('status', 'DATA_FETCHED'),
  ])

  const handles = (consents.data ?? []).map((r: any) => r.consent_handle).filter(Boolean)
  let linked: LinkedRow[] = []
  if (handles.length) {
    const result = await sb.from('linked_cards')
      .select('bank, masked_number, reward_points, synced_at')
      .in('consent_handle', handles)
    linked = (result.data ?? []) as LinkedRow[]
  }

  return buildDecisionPortfolio({
    statements: (stmt.data ?? []) as StatementRow[],
    manual: (manual.data ?? []) as ManualRow[],
    linked,
  })
}
