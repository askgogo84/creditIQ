export type DuffelTestBookingInput = {
  from: string
  to: string
  date: string
  cabin?: 'economy' | 'premium_economy' | 'business' | 'first'
  adults?: number
  clientReference: string
}

export type DuffelTestBookingResult = {
  provider: 'duffel'
  testMode: true
  offerRequestId: string
  offerId: string
  orderId: string
  bookingReference: string
  totalAmount: string
  totalCurrency: string
  owner: string | null
  paymentType: 'balance'
}

type Transport = (url: string, init: RequestInit) => Promise<{ status: number; data: any }>

function env(name: string) {
  return (process.env[name] || '').trim()
}

export function duffelTestConfigured() {
  return env('DUFFEL_TEST_TOKEN').startsWith('duffel_test_')
}

async function defaultTransport(url: string, init: RequestInit) {
  const res = await fetch(url, { ...init, cache: 'no-store' })
  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}

function headers() {
  const token = env('DUFFEL_TEST_TOKEN')
  if (!token.startsWith('duffel_test_')) {
    throw new Error('Duffel TEST token is not configured')
  }
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip',
    'Duffel-Version': 'v2',
    Authorization: `Bearer ${token}`,
  }
}

function cleanIata(value: string) {
  const code = value.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(code)) throw new Error('Duffel TEST booking requires valid IATA origin/destination')
  return code
}

function cleanDate(value: string) {
  const date = value.trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Duffel TEST booking requires YYYY-MM-DD departure date')
  return date
}

function errorMessage(prefix: string, status: number, data: any) {
  const first = Array.isArray(data?.errors) ? data.errors[0] : null
  const detail = first?.message || first?.title || data?.message || ''
  return `${prefix} (${status})${detail ? `: ${String(detail).slice(0, 220)}` : ''}`
}

export async function bookDuffelTestFlight(
  input: DuffelTestBookingInput,
  transport: Transport = defaultTransport,
): Promise<DuffelTestBookingResult> {
  if (!duffelTestConfigured() && transport === defaultTransport) {
    throw new Error('Duffel TEST token is not configured')
  }

  const adults = Math.max(1, Math.min(9, Number.isSafeInteger(input.adults) ? input.adults! : 1))
  const offerRequestRes = await transport(
    'https://api.duffel.com/air/offer_requests?return_offers=true&supplier_timeout=10000',
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        data: {
          cabin_class: input.cabin || 'economy',
          slices: [{
            origin: cleanIata(input.from),
            destination: cleanIata(input.to),
            departure_date: cleanDate(input.date),
          }],
          passengers: Array.from({ length: adults }, () => ({ type: 'adult' })),
        },
      }),
    },
  )

  if (offerRequestRes.status < 200 || offerRequestRes.status >= 300) {
    throw new Error(errorMessage('Duffel offer request failed', offerRequestRes.status, offerRequestRes.data))
  }

  const offerRequest = offerRequestRes.data?.data
  const offers = Array.isArray(offerRequest?.offers) ? offerRequest.offers : []
  const validOffers = offers.filter((offer: any) =>
    offer?.id &&
    offer?.total_amount &&
    offer?.total_currency &&
    new Date(offer?.expires_at || Date.now() + 60_000).getTime() > Date.now(),
  )
  const offer = validOffers.find((candidate: any) => candidate?.owner?.iata_code === 'ZZ') || validOffers[0]
  if (!offer) throw new Error('Duffel TEST returned no bookable offer')

  const passengers = Array.isArray(offerRequest?.passengers) ? offerRequest.passengers : []
  if (passengers.length < adults) throw new Error('Duffel TEST did not return passenger identifiers')

  const orderPassengers = passengers.slice(0, adults).map((passenger: any, index: number) => ({
    id: passenger.id,
    type: 'adult',
    title: 'mr',
    gender: 'm',
    given_name: index === 0 ? 'TEST' : `TEST${index + 1}`,
    family_name: 'TRAVELLER',
    born_on: '1990-01-01',
    email: 'creditiq-test@example.com',
    phone_number: '+442080160509',
  }))

  const orderRes = await transport('https://api.duffel.com/air/orders', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      data: {
        type: 'instant',
        selected_offers: [offer.id],
        payments: [{
          type: 'balance',
          currency: offer.total_currency,
          amount: offer.total_amount,
        }],
        passengers: orderPassengers,
        metadata: { creditiq_ref: input.clientReference.slice(0, 40).replace(/[^A-Za-z0-9_-]/g, '-') },
      },
    }),
  })

  if (orderRes.status < 200 || orderRes.status >= 300) {
    throw new Error(errorMessage('Duffel TEST order creation failed', orderRes.status, orderRes.data))
  }

  const order = orderRes.data?.data
  if (!order?.id || !order?.booking_reference) {
    throw new Error('Duffel TEST order response did not include an order id and booking reference')
  }

  return {
    provider: 'duffel',
    testMode: true,
    offerRequestId: String(offerRequest.id || ''),
    offerId: String(offer.id),
    orderId: String(order.id),
    bookingReference: String(order.booking_reference),
    totalAmount: String(order.total_amount || offer.total_amount),
    totalCurrency: String(order.total_currency || offer.total_currency),
    owner: order?.owner?.name ? String(order.owner.name) : offer?.owner?.name ? String(offer.owner.name) : null,
    paymentType: 'balance',
  }
}
