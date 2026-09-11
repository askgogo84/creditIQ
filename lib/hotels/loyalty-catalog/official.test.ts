import { describe, expect, it } from 'vitest'
import { parseOfficialHotelHtml } from './official'

const marriottAdapter = {
  programmeId: 'marriott-bonvoy',
  sourceName: 'Marriott Bonvoy',
  buildUrl: () => 'https://www.marriott.com/',
  hotelNameTokens: ['marriott', 'sheraton', 'westin', 'courtyard'],
}

describe('first-party loyalty hotel parser', () => {
  it('extracts SSR hotel headings without turning navigation into properties', () => {
    const html = `
      <html><body>
        <h2>Find Hotels</h2>
        <h2>Royal Orchid Sheraton Riverside Hotel Bangkok</h2>
        <h2>Bangkok Marriott Hotel The Surawongse</h2>
        <h3>View Rates</h3>
      </body></html>
    `
    const hotels = parseOfficialHotelHtml(html, marriottAdapter, 'https://www.marriott.com/en-us/destinations/thailand/bangkok.mi')
    expect(hotels.map(hotel => hotel.name)).toEqual([
      'Royal Orchid Sheraton Riverside Hotel Bangkok',
      'Bangkok Marriott Hotel The Surawongse',
    ])
    expect(hotels.every(hotel => hotel.source === 'FIRST_PARTY')).toBe(true)
  })

  it('prefers structured hotel identity and address from JSON-LD', () => {
    const html = `
      <script type="application/ld+json">
        {"@type":"Hotel","name":"Courtyard by Marriott Bangkok","url":"https://example.test/courtyard","address":{"@type":"PostalAddress","streetAddress":"155/1 Soi Mahadlekluang 1","addressLocality":"Bangkok","addressCountry":"TH"}}
      </script>
    `
    const hotels = parseOfficialHotelHtml(html, marriottAdapter, 'https://www.marriott.com/')
    expect(hotels).toHaveLength(1)
    expect(hotels[0]).toMatchObject({
      programmeId: 'marriott-bonvoy',
      name: 'Courtyard by Marriott Bangkok',
      formattedAddress: '155/1 Soi Mahadlekluang 1, Bangkok, TH',
      sourceUrl: 'https://example.test/courtyard',
    })
  })
})
