import { TRAVEL_COVERAGE_MATRIX, validateTravelCoverageMatrix } from '../lib/travel/coverage-matrix'

const errors = validateTravelCoverageMatrix()
if (errors.length) {
  console.error('validate-travel-matrix failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

const domestic = TRAVEL_COVERAGE_MATRIX.filter(item => item.region === 'domestic').length
const international = TRAVEL_COVERAGE_MATRIX.filter(item => item.region === 'international').length
const economy = TRAVEL_COVERAGE_MATRIX.filter(item => item.cabin === 'economy').length
const business = TRAVEL_COVERAGE_MATRIX.filter(item => item.cabin === 'business').length

console.log(`✓ validate-travel-matrix: ${TRAVEL_COVERAGE_MATRIX.length} cases OK (${domestic} domestic, ${international} international; ${economy} economy, ${business} business).`)
