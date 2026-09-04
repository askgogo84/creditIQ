import { AIR_INDIA_MAHARAJA_GUIDE } from '../lib/data/air-india-maharaja-guide'
import { getAirport } from '../lib/data/airports'

const errors: string[] = []
const seen = new Set<string>()
for (const entry of AIR_INDIA_MAHARAJA_GUIDE) {
  const key = `${entry.from}-${entry.to}-${entry.cabin}`
  const reverse = `${entry.to}-${entry.from}-${entry.cabin}`
  if (seen.has(key) || seen.has(reverse)) errors.push(`duplicate/reversed duplicate ${key}`)
  seen.add(key)
  if (!getAirport(entry.from)) errors.push(`unknown origin ${entry.from}`)
  if (!getAirport(entry.to)) errors.push(`unknown destination ${entry.to}`)
  if (!Number.isSafeInteger(entry.points) || entry.points <= 0) errors.push(`invalid points for ${key}`)
}

if (errors.length) {
  console.error('validate-air-india-maharaja-guide failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

const economy = AIR_INDIA_MAHARAJA_GUIDE.filter(entry => entry.cabin === 'economy').length
const business = AIR_INDIA_MAHARAJA_GUIDE.filter(entry => entry.cabin === 'business').length
console.log(`✓ validate-air-india-maharaja-guide: ${AIR_INDIA_MAHARAJA_GUIDE.length} official partial-guide entries OK (${economy} economy, ${business} business).`)
