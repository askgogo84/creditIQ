import { describe, expect, it } from 'vitest'
import { ciraCanonicalTravelContext } from './cira-context'

describe('ciraCanonicalTravelContext', () => {
  it('injects the exact Amex Hilton issuer-captured rail', () => {
    const prompt = ciraCanonicalTravelContext('Can I use my Amex Platinum Travel points for Hilton Honors?')
    expect(prompt).toContain('Hilton Honors')
    expect(prompt).toContain('1000:1500')
    expect(prompt).toContain('up to 48 hours')
    expect(prompt).toContain('irreversible=yes')
  })

  it('does not inject unrelated programme rails', () => {
    const prompt = ciraCanonicalTravelContext('Can I use my Amex Platinum Travel points for Hilton Honors?')
    expect(prompt).not.toContain('Singapore KrisFlyer')
    expect(prompt).not.toContain('Marriott Bonvoy')
  })

  it('does nothing for a non-Amex question', () => {
    expect(ciraCanonicalTravelContext('Can I use HDFC Infinia for Hilton?')).toBe('')
  })
})
