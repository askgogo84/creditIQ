// Air India Maharaja Club published redemption GUIDE — not live seat availability.
// Source: Air India newsroom, 1 Apr 2026, "Air India announces key enhancements to
// Maharaja Club". The issuer explicitly labels these tables PARTIAL LISTING ONLY
// and the values as revised LOWEST FARE requirements. Never infer an unlisted route
// and never render these rows as live award inventory.

export const AIR_INDIA_MAHARAJA_GUIDE_SOURCE = 'https://www.airindia.com/content/air-india/in/en/newsroom/press-release/Air-India-announces-key-enhancements-to-Maharaja-Club.html'
export const AIR_INDIA_MAHARAJA_GUIDE_AS_OF = '2026-04-01'

export type MaharajaGuideCabin = 'economy' | 'business'
export type MaharajaGuideEntry = {
  from: string
  to: string
  cabin: MaharajaGuideCabin
  points: number
}

// Canonical one-way routes from the official partial listing. Matching is
// bidirectional because the published table names a sector, not a directional fare.
export const AIR_INDIA_MAHARAJA_GUIDE: MaharajaGuideEntry[] = [
  // Economy — domestic
  { from: 'GOX', to: 'HYD', cabin: 'economy', points: 2500 },
  { from: 'DEL', to: 'IXC', cabin: 'economy', points: 3000 },
  { from: 'DEL', to: 'MAA', cabin: 'economy', points: 6000 },
  { from: 'DEL', to: 'AMD', cabin: 'economy', points: 3500 },
  { from: 'BLR', to: 'MAA', cabin: 'economy', points: 1500 },
  { from: 'BOM', to: 'ATQ', cabin: 'economy', points: 5500 },
  { from: 'DEL', to: 'BHO', cabin: 'economy', points: 3000 },
  { from: 'DEL', to: 'GOI', cabin: 'economy', points: 5000 },
  { from: 'DEL', to: 'GAU', cabin: 'economy', points: 6000 },
  { from: 'DEL', to: 'PAT', cabin: 'economy', points: 5000 },
  { from: 'DEL', to: 'BOM', cabin: 'economy', points: 5000 },
  { from: 'DEL', to: 'BLR', cabin: 'economy', points: 7000 },
  { from: 'DEL', to: 'CCU', cabin: 'economy', points: 5000 },
  { from: 'BLR', to: 'BOM', cabin: 'economy', points: 4000 },

  // Economy — international
  { from: 'DEL', to: 'SFO', cabin: 'economy', points: 40000 },
  { from: 'BOM', to: 'EWR', cabin: 'economy', points: 40000 },
  { from: 'DEL', to: 'YVR', cabin: 'economy', points: 50000 },
  { from: 'DEL', to: 'MEL', cabin: 'economy', points: 40000 },
  { from: 'DEL', to: 'ORD', cabin: 'economy', points: 40000 },
  { from: 'DEL', to: 'JFK', cabin: 'economy', points: 40000 },
  { from: 'ATQ', to: 'BHX', cabin: 'economy', points: 35000 },
  { from: 'BOM', to: 'MRU', cabin: 'economy', points: 12000 },
  { from: 'BOM', to: 'DOH', cabin: 'economy', points: 12000 },
  { from: 'DEL', to: 'JED', cabin: 'economy', points: 12000 },
  { from: 'DEL', to: 'NRT', cabin: 'economy', points: 30000 },
  { from: 'DEL', to: 'DXB', cabin: 'economy', points: 12000 },
  { from: 'DEL', to: 'BKK', cabin: 'economy', points: 12000 },
  { from: 'DEL', to: 'LHR', cabin: 'economy', points: 35000 },
  { from: 'DEL', to: 'DPS', cabin: 'economy', points: 12000 },

  // Business — domestic
  { from: 'DEL', to: 'MAA', cabin: 'business', points: 24000 },
  { from: 'DEL', to: 'GOI', cabin: 'business', points: 25000 },
  { from: 'DEL', to: 'PAT', cabin: 'business', points: 17000 },
  { from: 'BOM', to: 'ATQ', cabin: 'business', points: 17000 },
  { from: 'DEL', to: 'UDR', cabin: 'business', points: 15000 },
  { from: 'DEL', to: 'CJB', cabin: 'business', points: 32000 },
  { from: 'DEL', to: 'CCU', cabin: 'business', points: 28000 },
  { from: 'BOM', to: 'HYD', cabin: 'business', points: 16000 },
  { from: 'BLR', to: 'HYD', cabin: 'business', points: 16000 },
  { from: 'DEL', to: 'BOM', cabin: 'business', points: 20000 },
  { from: 'BLR', to: 'BOM', cabin: 'business', points: 19000 },
  { from: 'DEL', to: 'BLR', cabin: 'business', points: 25000 },

  // Business — international
  { from: 'DEL', to: 'ORD', cabin: 'business', points: 130000 },
  { from: 'DEL', to: 'JFK', cabin: 'business', points: 130000 },
  { from: 'DEL', to: 'YVR', cabin: 'business', points: 130000 },
  { from: 'DEL', to: 'SFO', cabin: 'business', points: 130000 },
  { from: 'BOM', to: 'EWR', cabin: 'business', points: 130000 },
  { from: 'BOM', to: 'LHR', cabin: 'business', points: 100000 },
  { from: 'DEL', to: 'LHR', cabin: 'business', points: 100000 },
  { from: 'BOM', to: 'MRU', cabin: 'business', points: 50000 },
  { from: 'DEL', to: 'DXB', cabin: 'business', points: 50000 },
  { from: 'BOM', to: 'DXB', cabin: 'business', points: 50000 },
]

export function findAirIndiaMaharajaGuide(from: string, to: string) {
  const a = from.toUpperCase()
  const b = to.toUpperCase()
  const matches = AIR_INDIA_MAHARAJA_GUIDE.filter(entry =>
    (entry.from === a && entry.to === b) || (entry.from === b && entry.to === a),
  )
  if (!matches.length) return null
  const economy = matches.find(entry => entry.cabin === 'economy')?.points ?? null
  const business = matches.find(entry => entry.cabin === 'business')?.points ?? null
  return {
    programme: 'Air India Maharaja Club',
    source: 'air-india',
    from: a,
    to: b,
    economyPoints: economy,
    businessPoints: business,
    asOf: AIR_INDIA_MAHARAJA_GUIDE_AS_OF,
    sourceUrl: AIR_INDIA_MAHARAJA_GUIDE_SOURCE,
    availability: 'GUIDE_NOT_LIVE' as const,
    note: 'Issuer-published lowest-fare guide from a partial listing. Award seat availability is not confirmed.',
  }
}
