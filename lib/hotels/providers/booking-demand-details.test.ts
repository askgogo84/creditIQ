import { describe, expect, it } from 'vitest'
import { extractBookingPhotos } from './booking-demand-details'

describe('Booking.com hotel detail media', () => {
  it('returns unique provider images in priority order and never fabricates URLs', () => {
    const urls = extractBookingPhotos({
      photos: [
        { url: { large: 'https://img.example/1-large.jpg', medium: 'https://img.example/1-medium.jpg' } },
        { url: { large: 'https://img.example/1-large.jpg' } },
        'https://img.example/2.jpg',
        { large: 'https://img.example/3.jpg' },
        { url: { large: '/relative/not-allowed.jpg' } },
      ],
    })
    expect(urls).toEqual([
      'https://img.example/1-large.jpg',
      'https://img.example/2.jpg',
      'https://img.example/3.jpg',
    ])
  })

  it('returns an empty gallery when the provider supplies no usable photos', () => {
    expect(extractBookingPhotos({ photos: [] })).toEqual([])
    expect(extractBookingPhotos({})).toEqual([])
  })
})
