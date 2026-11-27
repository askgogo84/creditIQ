import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validateFlightParty } from '../lib/flights/search-party'
import { evaluateFareWatch, type FareWatch, type FareObservation } from '../lib/flights/fare-watch'
import { assessMerchantQuote, type MerchantQuote } from '../lib/commerce/offer-truth'

let checked = 0
function check(name: string, fn: () => void) {
  fn()
  checked++
  console.log('PASS', name)
}
const party = (data: Record<string,string> = {}) => validateFlightParty(new URLSearchParams(data))
check('default one adult', () => assert.deepEqual(party(), { ok: true, adults: 1, fareBasis: 'TOTAL_FOR_REQUESTED_ADULTS' }))
check('two adults', () => assert.equal(party({ adults: '2' }).ok, true))
check('nine adults', () => assert.equal(party({ adults: '9' }).ok, true))
for (const adults of ['0', '-1', '1.5', '10', '01', 'abc']) {
  check('invalid adult count ' + adults, () => assert.equal(party({ adults }).ok, false))
}
const unsupportedParties: Array<Record<string, string>> = [{ children:'1' }, { infants:'1' }, { child_ages:'6' }, { children_ages:'6,9' }, { return_date:'2027-01-01' }, { round_trip:'true' }]
for (const input of unsupportedParties) {
  check('unsupported passenger/leg ' + JSON.stringify(input), () => assert.equal(party(input).ok, false))
}
check('explicit zero children fine', () => assert.equal(party({ children: '0' }).ok, true))

const now = Date.parse('2026-11-27T09:00:00Z')
const watch: FareWatch = {
  id: 'synthetic', from: 'BLR', to: 'SIN', departDate: '2027-02-05',
  cabin: 'economy', adults: 2, currency: 'INR', targetMinor: 5000000,
}
const offer: FareObservation = {
  provider: 'skyscanner-live', sourceAuthority: 'LIVE_PROVIDER',
  from: 'BLR', to: 'SIN', departDate: '2027-02-05',
  cabin: 'economy', adults: 2, currency: 'INR',
  totalMinor: 4500000, fetchedAt: new Date(now - 60_000).toISOString(),
  bookingUrl: 'https://book.example.com/offer', quoteId: 'synthetic-1',
}
const evaluation = (w: FareWatch = watch, o: FareObservation = offer) => evaluateFareWatch(w, o, now)
check('genuine matching live quote can notify', () => assert.equal(evaluation().notify, true))
check('cached fare is not an alert', () => assert.equal(evaluation(watch,{...offer,sourceAuthority:'CACHED_DISCOVERY'}).reason,'NOT_LIVE_PROVIDER'))
check('web snippet is not an alert', () => assert.equal(evaluation(watch,{...offer,sourceAuthority:'WEB_SEARCH'}).notify,false))
check('single adult quote rejected for family', () => assert.equal(evaluation(watch,{...offer,adults:1}).reason,'NOT_COMPARABLE'))
check('wrong cabin rejected', () => assert.equal(evaluation(watch,{...offer,cabin:'business'}).reason,'NOT_COMPARABLE'))
check('wrong currency rejected', () => assert.equal(evaluation(watch,{...offer,currency:'USD'}).reason,'NOT_COMPARABLE'))
check('wrong route rejected', () => assert.equal(evaluation(watch,{...offer,to:'BKK'}).reason,'NOT_COMPARABLE'))
check('wrong travel date rejected', () => assert.equal(evaluation(watch,{...offer,departDate:'2027-02-06'}).reason,'NOT_COMPARABLE'))
check('stale fare rejected', () => assert.equal(evaluation(watch,{...offer,fetchedAt:new Date(now-20*60_000).toISOString()}).reason,'STALE_QUOTE'))
check('future fare rejected', () => assert.equal(evaluation(watch,{...offer,fetchedAt:new Date(now+4*60_000).toISOString()}).reason,'STALE_QUOTE'))
check('HTTP booking link rejected', () => assert.equal(evaluation(watch,{...offer,bookingUrl:'http://book.example.com'}).reason,'UNVERIFIED_BOOKING_LINK'))
check('localhost booking link rejected', () => assert.equal(evaluation(watch,{...offer,bookingUrl:'https://localhost/offer'}).reason,'UNVERIFIED_BOOKING_LINK'))
check('above target does not notify', () => assert.equal(evaluation(watch,{...offer,totalMinor:6000000}).reason,'ABOVE_TARGET'))
check('same quote not notified twice', () => assert.equal(evaluation({...watch,lastAlertKey:evaluation().alertKey},offer).reason,'DUPLICATE_ALERT'))
check('same-or-higher price not re-alerted', () => assert.equal(evaluation({...watch,lastNotifiedMinor:4500000},{...offer,quoteId:'different'}).reason,'NO_FURTHER_PRICE_DROP'))
check('alert cooldown', () => assert.equal(evaluation({...watch,lastAlertAt:new Date(now-1000).toISOString()}).reason,'ALERT_COOLDOWN'))
check('watch expiration', () => assert.equal(evaluation({...watch,expiresAt:new Date(now-1000).toISOString()}).reason,'EXPIRED'))
check('drop required but not met', () => assert.equal(evaluation({...watch,baselineMinor:4700000,minDropMinor:300000}).reason,'INSUFFICIENT_DROP'))
check('drop threshold met', () => assert.equal(evaluation({...watch,baselineMinor:4900000,minDropMinor:300000}).notify,true))
check('no purchase authority', () => assert.equal(evaluation().requireRepriceBeforePurchase,true))

const quote: MerchantQuote = {
  merchant:'Synthetic Demo Store', productId:'demo-1', currency:'INR',
  amountMinor:100000,shippingMinor:10000,taxMinor:18000,
  source:'MERCHANT_CHECKOUT',observedAt:new Date(now-30000).toISOString(),
  productUrl:'https://store.example.com/demo',
}
const shopping=(q: MerchantQuote=quote)=>assessMerchantQuote(q,now)
check('complete verified shopping total',()=>assert.equal(shopping().totalMinor,128000))
check('search snippets are not verified checkout',()=>assert.equal(shopping({...quote,source:'WEB_SEARCH_SNIPPET'}).state,'DISCOVERY_ONLY'))
check('missing shipping not comparable',()=>assert.equal(shopping({...quote,shippingMinor:null}).state,'DISCOVERY_ONLY'))
check('stale shopping quote not comparable',()=>assert.equal(shopping({...quote,observedAt:new Date(now-30*60_000).toISOString()}).state,'DISCOVERY_ONLY'))
check('unsafe shopping URL rejected',()=>assert.equal(shopping({...quote,productUrl:'http://localhost/demo'}).state,'INVALID'))
check('negative fees rejected',()=>assert.equal(shopping({...quote,taxMinor:-1}).state,'DISCOVERY_ONLY'))
check('no product purchase action',()=>assert.equal(shopping().requiresCheckoutReverification,true))
const searchRoute = readFileSync(new URL('../app/api/flights/search/route.ts', import.meta.url), 'utf8')
check('flight endpoint rejects unsupported party', () => assert.match(searchRoute, /validateFlightParty\(searchParams\)/))
check('skyscanner receives adult count', () => assert.match(searchRoute, /searchSkyscannerFlights\(\{ from, to, date: dateFrom, cabin, adults \}\)/))
check('kiwi MCP receives adult count', () => assert.match(searchRoute, /searchKiwiMcpFlights\(\{ from, to, date: dateFrom, cabin, adults \}\)/))
check('cached fare disabled for groups', () => assert.match(searchRoute, /tpToken && adults === 1/))
const fusionRoute = readFileSync(new URL('../app/api/flights/fusion/route.ts', import.meta.url), 'utf8')
check('fusion requires group award verification', () => assert.match(fusionRoute, /group_award_comparison_not_yet_verified/))
const bridgeRoute = readFileSync(new URL('../app/api/internal/gogo/travel/flights/route.ts', import.meta.url), 'utf8')
check('AskGogo bridge cannot silently drop party', () => assert.match(bridgeRoute, /group_or_round_trip_award_comparison_not_supported/))
console.log('CreditIQ Travel/Shopping Truth:', checked, 'checks passed')
