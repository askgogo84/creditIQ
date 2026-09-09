import { describe, expect, it } from 'vitest'
import { resolveBookingDestination } from './booking-demand'

describe('Booking.com hotel destination resolution', () => {
  it('resolves Indian leisure destinations without requiring an airport', async () => {
    for (const destination of ['Coorg', 'Manali', 'Munnar', 'Ooty', 'Wayanad', 'Hampi', 'Rishikesh', 'Udaipur']) {
      const resolved = await resolveBookingDestination(destination)
      expect(resolved.resolver).toBe('creditiq-india-destination')
      expect(resolved.city.length).toBeGreaterThan(2)
      expect(Number.isFinite(resolved.latitude)).toBe(true)
      expect(Number.isFinite(resolved.longitude)).toBe(true)
      expect(resolved.radiusKm).toBeGreaterThan(0)
      expect(resolved.bookingCityId).toBeNull()
    }
  })

  it('keeps airport-backed Indian metros on the global airport resolver', async () => {
    const resolved = await resolveBookingDestination('Mumbai')
    expect(resolved.resolver).toBe('airport-coordinate')
    expect(resolved.iata).toBe('BOM')
    expect(Number.isFinite(resolved.latitude)).toBe(true)
    expect(Number.isFinite(resolved.longitude)).toBe(true)
  })

  it('maps common alternate destination names to the intended leisure location', async () => {
    const pondicherry = await resolveBookingDestination('Pondicherry')
    expect(pondicherry.city).toBe('Puducherry')
    const mysore = await resolveBookingDestination('Mysore')
    expect(mysore.city).toBe('Mysuru')
    const alleppey = await resolveBookingDestination('Alleppey')
    expect(alleppey.city).toBe('Alappuzha')
  })
})
