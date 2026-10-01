import { programmeIdForFlightSource } from '@/lib/redemption-rails/programme-resolver'

export function watchSearchBlocker(watch: { cabin: string; travellers: number; status?: string }) {
  if (watch.status && watch.status !== 'ACTIVE') return 'Resume this watch before checking it.'
  if (!['economy', 'business', 'first'].includes(watch.cabin)) return 'Premium economy watch search is not supported yet. Your saved cabin has not been changed.'
  if (watch.travellers !== 1) return 'Party-size availability is not supported by this watch search yet. Your saved traveller count has not been changed. Ask Concierge to verify the whole party.'
  return null
}

export function filterWatchRows(rows: any[], watch: { nonstop_only?: boolean; preferred_programmes?: string[]; target_points?: number | null; target_cash_minor?: number | null }) {
  const normal = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const programmes = watch.preferred_programmes || []
  return rows.flatMap(row => {
    if (watch.nonstop_only && (row?.award?.trip?.stops ?? row?.stops) !== 0) return []
    const award = row?.award
    const programme = programmeIdForFlightSource(String(award?.source || ''))
    const matchesProgramme = !programmes.length || programmes.some(p => [award?.program, programme, award?.source].some(v => v && normal(p) === normal(String(v))))
    const awardFits = award && matchesProgramme && (!watch.target_points || Number(award.mileageCost) <= watch.target_points)
    const cashFits = Number(row?.price) > 0 && (!watch.target_cash_minor || Math.round(Number(row.price) * 100) <= watch.target_cash_minor)
    if (!awardFits && !cashFits) return []
    // Cash and points budgets are independent. Never reuse an out-of-budget
    // award just because the same row has an affordable cash fare (or vice versa).
    return [{ ...row, award: awardFits ? award : null, price: cashFits ? row.price : null }]
  })
}
