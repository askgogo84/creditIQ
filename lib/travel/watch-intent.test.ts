import { expect, it } from 'vitest'
import { filterWatchRows, watchSearchBlocker } from './watch-intent'
const row = { price: 12000, stops: 0, award: { source: 'singapore', program: 'KrisFlyer', mileageCost: 25000 } }
it('never substitutes economy or single-traveller results for a different saved intent', () => {
  expect(watchSearchBlocker({ cabin: 'premium_economy', travellers: 1 })).toMatch(/saved cabin/)
  expect(watchSearchBlocker({ cabin: 'business', travellers: 2 })).toMatch(/whole party/)
  expect(watchSearchBlocker({ cabin: 'business', travellers: 1, status: 'PAUSED' })).toMatch(/Resume/)
  expect(watchSearchBlocker({ cabin: 'business', travellers: 1 })).toBeNull()
})
it('keeps points and cash limits independent', () => {
  expect(filterWatchRows([row], { target_points: 20000 })[0].award).toBeNull()
  expect(filterWatchRows([row], { target_cash_minor: 100000 })[0].price).toBeNull()
  expect(filterWatchRows([row], { target_points: 20000, target_cash_minor: 100000 })).toEqual([])
})
it('matches canonical programme preferences and excludes unknown stop counts for non-stop watches', () => {
  expect(filterWatchRows([row], { preferred_programmes: ['krisflyer'] })[0].award).toEqual(row.award)
  expect(filterWatchRows([row], { preferred_programmes: ['aeroplan'] })[0].award).toBeNull()
  expect(filterWatchRows([{ ...row, stops: undefined }], { nonstop_only: true })).toEqual([])
})
