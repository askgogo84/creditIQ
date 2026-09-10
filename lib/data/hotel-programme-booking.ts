export type HotelProgrammeBooking = {
  programmeId: string
  programmeName: string
  bookingUrl: string
  region: 'global' | 'india'
}

const HOTEL_PROGRAMME_BOOKINGS: Record<string, HotelProgrammeBooking> = {
  'marriott-bonvoy': {
    programmeId: 'marriott-bonvoy',
    programmeName: 'Marriott Bonvoy',
    bookingUrl: 'https://www.marriott.com/search/findHotels.mi',
    region: 'global',
  },
  'accor-all': {
    programmeId: 'accor-all',
    programmeName: 'ALL – Accor Live Limitless',
    bookingUrl: 'https://all.accor.com/',
    region: 'global',
  },
  'ihg-one': {
    programmeId: 'ihg-one',
    programmeName: 'IHG One Rewards',
    bookingUrl: 'https://www.ihg.com/hotels/us/en/reservation',
    region: 'global',
  },
  'hilton-honors': {
    programmeId: 'hilton-honors',
    programmeName: 'Hilton Honors',
    bookingUrl: 'https://www.hilton.com/en/hotels/',
    region: 'global',
  },
  'world-of-hyatt': {
    programmeId: 'world-of-hyatt',
    programmeName: 'World of Hyatt',
    bookingUrl: 'https://www.hyatt.com/',
    region: 'global',
  },
  'wyndham-rewards': {
    programmeId: 'wyndham-rewards',
    programmeName: 'Wyndham Rewards',
    bookingUrl: 'https://www.wyndhamhotels.com/',
    region: 'global',
  },
  'radisson-rewards': {
    programmeId: 'radisson-rewards',
    programmeName: 'Radisson Rewards',
    bookingUrl: 'https://www.radissonhotels.com/',
    region: 'global',
  },
  'shangri-la-circle': {
    programmeId: 'shangri-la-circle',
    programmeName: 'Shangri-La Circle',
    bookingUrl: 'https://www.shangri-la.com/',
    region: 'global',
  },
  'taj-neupass': {
    programmeId: 'taj-neupass',
    programmeName: 'Taj / NeuPass',
    bookingUrl: 'https://www.tajhotels.com/',
    region: 'india',
  },
  'club-itc': {
    programmeId: 'club-itc',
    programmeName: 'Club ITC',
    bookingUrl: 'https://www.itchotels.com/in/en',
    region: 'india',
  },
}

export function hotelProgrammeBooking(programmeId: string | null | undefined): HotelProgrammeBooking | null {
  if (!programmeId) return null
  return HOTEL_PROGRAMME_BOOKINGS[programmeId.trim().toLowerCase()] ?? null
}

export function hotelProgrammeBookingUrl(programmeId: string | null | undefined): string | null {
  return hotelProgrammeBooking(programmeId)?.bookingUrl ?? null
}

export function hotelProgrammeDisplayName(programmeId: string | null | undefined): string | null {
  return hotelProgrammeBooking(programmeId)?.programmeName ?? null
}
