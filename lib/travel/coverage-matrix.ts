import { getAirport } from '@/lib/data/airports'

export type TravelCoverageCase = {
  id: string
  region: 'domestic' | 'international'
  from: string
  to: string
  cabin: 'economy' | 'business'
  label: string
}

// Representative production coverage matrix for the routes we need working before
// the final UI polish pass. Keep the list intentionally explicit so a regression is
// visible in code review and in the hidden /travel-qa harness.
export const TRAVEL_COVERAGE_MATRIX: TravelCoverageCase[] = [
  // India domestic — major trunk + tier-2 routes, both cabins on the main trunks.
  { id: 'dom-blr-del-y', region: 'domestic', from: 'BLR', to: 'DEL', cabin: 'economy', label: 'Bengaluru → Delhi · Economy' },
  { id: 'dom-blr-del-j', region: 'domestic', from: 'BLR', to: 'DEL', cabin: 'business', label: 'Bengaluru → Delhi · Business' },
  { id: 'dom-blr-bom-y', region: 'domestic', from: 'BLR', to: 'BOM', cabin: 'economy', label: 'Bengaluru → Mumbai · Economy' },
  { id: 'dom-blr-bom-j', region: 'domestic', from: 'BLR', to: 'BOM', cabin: 'business', label: 'Bengaluru → Mumbai · Business' },
  { id: 'dom-blr-maa-y', region: 'domestic', from: 'BLR', to: 'MAA', cabin: 'economy', label: 'Bengaluru → Chennai' },
  { id: 'dom-blr-hyd-y', region: 'domestic', from: 'BLR', to: 'HYD', cabin: 'economy', label: 'Bengaluru → Hyderabad' },
  { id: 'dom-blr-ccu-y', region: 'domestic', from: 'BLR', to: 'CCU', cabin: 'economy', label: 'Bengaluru → Kolkata' },
  { id: 'dom-blr-cok-y', region: 'domestic', from: 'BLR', to: 'COK', cabin: 'economy', label: 'Bengaluru → Kochi' },
  { id: 'dom-blr-goi-y', region: 'domestic', from: 'BLR', to: 'GOI', cabin: 'economy', label: 'Bengaluru → Goa' },
  { id: 'dom-del-bom-y', region: 'domestic', from: 'DEL', to: 'BOM', cabin: 'economy', label: 'Delhi → Mumbai · Economy' },
  { id: 'dom-del-bom-j', region: 'domestic', from: 'DEL', to: 'BOM', cabin: 'business', label: 'Delhi → Mumbai · Business' },
  { id: 'dom-del-maa-y', region: 'domestic', from: 'DEL', to: 'MAA', cabin: 'economy', label: 'Delhi → Chennai' },
  { id: 'dom-del-hyd-y', region: 'domestic', from: 'DEL', to: 'HYD', cabin: 'economy', label: 'Delhi → Hyderabad' },
  { id: 'dom-del-jai-y', region: 'domestic', from: 'DEL', to: 'JAI', cabin: 'economy', label: 'Delhi → Jaipur' },
  { id: 'dom-del-lko-y', region: 'domestic', from: 'DEL', to: 'LKO', cabin: 'economy', label: 'Delhi → Lucknow' },
  { id: 'dom-del-amd-y', region: 'domestic', from: 'DEL', to: 'AMD', cabin: 'economy', label: 'Delhi → Ahmedabad' },
  { id: 'dom-del-pnq-y', region: 'domestic', from: 'DEL', to: 'PNQ', cabin: 'economy', label: 'Delhi → Pune' },
  { id: 'dom-ccu-gau-y', region: 'domestic', from: 'CCU', to: 'GAU', cabin: 'economy', label: 'Kolkata → Guwahati' },

  // International from Indian hubs — short-haul Asia/Middle East + long-haul EU/US/APAC.
  { id: 'int-blr-sin-y', region: 'international', from: 'BLR', to: 'SIN', cabin: 'economy', label: 'Bengaluru → Singapore · Economy' },
  { id: 'int-blr-sin-j', region: 'international', from: 'BLR', to: 'SIN', cabin: 'business', label: 'Bengaluru → Singapore · Business' },
  { id: 'int-blr-dxb-y', region: 'international', from: 'BLR', to: 'DXB', cabin: 'economy', label: 'Bengaluru → Dubai' },
  { id: 'int-blr-bkk-y', region: 'international', from: 'BLR', to: 'BKK', cabin: 'economy', label: 'Bengaluru → Bangkok' },
  { id: 'int-del-sin-y', region: 'international', from: 'DEL', to: 'SIN', cabin: 'economy', label: 'Delhi → Singapore' },
  { id: 'int-del-dxb-j', region: 'international', from: 'DEL', to: 'DXB', cabin: 'business', label: 'Delhi → Dubai · Business' },
  { id: 'int-bom-dxb-y', region: 'international', from: 'BOM', to: 'DXB', cabin: 'economy', label: 'Mumbai → Dubai' },
  { id: 'int-bom-auh-y', region: 'international', from: 'BOM', to: 'AUH', cabin: 'economy', label: 'Mumbai → Abu Dhabi' },
  { id: 'int-del-doh-y', region: 'international', from: 'DEL', to: 'DOH', cabin: 'economy', label: 'Delhi → Doha' },
  { id: 'int-del-lhr-y', region: 'international', from: 'DEL', to: 'LHR', cabin: 'economy', label: 'Delhi → London · Economy' },
  { id: 'int-del-lhr-j', region: 'international', from: 'DEL', to: 'LHR', cabin: 'business', label: 'Delhi → London · Business' },
  { id: 'int-blr-lhr-j', region: 'international', from: 'BLR', to: 'LHR', cabin: 'business', label: 'Bengaluru → London · Business' },
  { id: 'int-del-cdg-y', region: 'international', from: 'DEL', to: 'CDG', cabin: 'economy', label: 'Delhi → Paris' },
  { id: 'int-del-fra-y', region: 'international', from: 'DEL', to: 'FRA', cabin: 'economy', label: 'Delhi → Frankfurt' },
  { id: 'int-del-nrt-y', region: 'international', from: 'DEL', to: 'NRT', cabin: 'economy', label: 'Delhi → Tokyo' },
  { id: 'int-del-sfo-j', region: 'international', from: 'DEL', to: 'SFO', cabin: 'business', label: 'Delhi → San Francisco · Business' },
  { id: 'int-del-jfk-j', region: 'international', from: 'DEL', to: 'JFK', cabin: 'business', label: 'Delhi → New York · Business' },
  { id: 'int-del-syd-y', region: 'international', from: 'DEL', to: 'SYD', cabin: 'economy', label: 'Delhi → Sydney' },
]

export function validateTravelCoverageMatrix(): string[] {
  const errors: string[] = []
  const seen = new Set<string>()
  for (const item of TRAVEL_COVERAGE_MATRIX) {
    if (seen.has(item.id)) errors.push(`duplicate test id: ${item.id}`)
    seen.add(item.id)
    if (!getAirport(item.from)) errors.push(`unknown origin ${item.from} in ${item.id}`)
    if (!getAirport(item.to)) errors.push(`unknown destination ${item.to} in ${item.id}`)
    if (item.from === item.to) errors.push(`same origin/destination in ${item.id}`)
  }
  return errors
}
