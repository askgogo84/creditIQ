import { describe, expect, it } from 'vitest'
import { supplementalRailsForCard } from './supplemental-rails'

describe('Amex Membership Rewards transfer destination', () => {
  it('opens the MR transfer page rather than the paused India Travel site', () => {
    const rail = supplementalRailsForCard('amex-platinum-travel', 'hotel', null)
      .find(item => item.id === 'amex-membership-rewards-transfer-hub')
    expect(rail?.bookingUrl).toBe('https://global.americanexpress.com/rewards/transfer')
    expect(rail?.bookingUrl).not.toContain('/en-in/travel')
  })
})
