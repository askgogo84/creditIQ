import assert from 'node:assert/strict'
import {
  normalizeParallelFlights,
  parallelFlightsConfigured,
  parallelPilotUserAllowed,
  searchParallelFlights,
  type ParallelFlightInput,
} from '../lib/flights/providers/parallel-flights'
import { readFileSync } from 'node:fs'

async function main() {
let checks = 0
const check = (name: string, run: () => void | Promise<void>) => {
  return Promise.resolve(run()).then(() => { checks++; console.log('PASS', name) })
}
const future = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)
const input: ParallelFlightInput = { from:'DEL', to:'BOM', date:future, cabin:'economy', adults:2 }
const fixture = {
  search_id:'fixture-search-1',
  results: [{
    url:'https://www.example-airline.com/book?adults=2',
    price:12345.67,
    outbound: {
      departure_airport:'DEL', arrival_airport:'BOM',
      departure_time:future+' 08:00', arrival_time:future+' 10:15',
      duration_minutes:135, stops:0,
      segments:[{
        airline:'Demo Airline',flight_number:'AI 102',cabin:'Economy',
        departure_airport:'DEL',arrival_airport:'BOM',
        departure_time:future+' 08:00',arrival_time:future+' 10:15',
      }]
    }
  }],
}
const env={PARALLEL_FLIGHTS_ENABLED:'true',PARALLEL_API_KEY:'synthetic-key',
  PARALLEL_FLIGHTS_PILOT_USER_IDS:'user-synthetic-1,user-synthetic-2'}
await check('disabled without feature flag',()=>assert.equal(parallelFlightsConfigured({...env,PARALLEL_FLIGHTS_ENABLED:'false'}),false))
await check('disabled without API key',()=>assert.equal(parallelFlightsConfigured({...env,PARALLEL_API_KEY:''}),false))
await check('enabled with both flag and key',()=>assert.equal(parallelFlightsConfigured(env),true))
await check('pilot allows selected identity',()=>assert.equal(parallelPilotUserAllowed('user-synthetic-1',env),true))
await check('pilot denies unlisted identity',()=>assert.equal(parallelPilotUserAllowed('outsider',env),false))
await check('pilot denies unspecified allowlist',()=>assert.equal(parallelPilotUserAllowed('user-synthetic-1',{...env,PARALLEL_FLIGHTS_PILOT_USER_IDS:''}),false))
await check('normalizes all-party total correctly',()=>{
  const result=normalizeParallelFlights(fixture,input)[0]
  assert.equal(result.price,12345.67)
  assert.equal(result.pricedAdults,2)
  assert.equal(result.priceCurrency,'INR')
  assert.equal(result.fareBasis,'TOTAL_FOR_REQUESTED_ADULTS')
  assert.equal(result.airline,'AI')
  assert.equal(result.provider,'parallel-flights')
  assert.equal(result.requiresRepriceBeforeBooking,true)
})
await check('missing price is never a fare',()=>assert.equal(normalizeParallelFlights({
  results:[{...fixture.results[0],price:null}]},input).length,0))
await check('price cannot be negative',()=>assert.equal(normalizeParallelFlights({
  results:[{...fixture.results[0],price:-4}]},input).length,0))
await check('unsafe booking link rejected',()=>assert.equal(normalizeParallelFlights({
  results:[{...fixture.results[0],url:'http://127.0.0.1/test'}]},input).length,0))
await check('wrong route rejected',()=>assert.equal(normalizeParallelFlights(fixture,{...input,to:'GOI'}).length,0))
await check('wrong date rejected',()=>assert.equal(normalizeParallelFlights(fixture,{...input,date:'2027-11-01'}).length,0))
await check('conflicting cabin rejected',()=>assert.equal(normalizeParallelFlights(fixture,{...input,cabin:'business'}).length,0))
await check('premium cabin must have segment cabin evidence',()=>assert.equal(normalizeParallelFlights({
  results:[{...fixture.results[0],outbound:{...fixture.results[0].outbound,segments:[{
    ...fixture.results[0].outbound.segments[0],cabin:undefined,
  }]}}]}, {...input,cabin:'business'}).length,0))
await check('missing carrier code rejected',()=>assert.equal(normalizeParallelFlights({
  results:[{...fixture.results[0],outbound:{...fixture.results[0].outbound,segments:[{
    ...fixture.results[0].outbound.segments[0],flight_number:'Unknown',
  }]}}]},input).length,0))
let calls=0
let lastBody:any=null
const stub=(status:number,payload:any):typeof fetch => (async (_:any,init:any)=>{
  calls++; lastBody=JSON.parse(init?.body)
  assert.equal(init.headers['x-api-key'],'synthetic-key')
  assert.equal(init.method,'POST')
  return new Response(JSON.stringify(payload),{status,headers:{'Content-Type':'application/json'}})
}) as typeof fetch
await check('disabled does not make paid network call',async()=>{
  calls=0;const response=await searchParallelFlights(input,{apiKey:'synthetic-key',enabled:false,fetcher:stub(200,fixture)})
  assert.equal(response.status,'DISABLED');assert.equal(calls,0)
})
await check('uses official request contract and INR',async()=>{
  calls=0;const response=await searchParallelFlights(input,{apiKey:'synthetic-key',enabled:true,fetcher:stub(200,fixture)})
  assert.equal(response.status,'SUCCESS');assert.equal(response.flights.length,1)
  assert.deepEqual(lastBody.origins,['DEL']);assert.deepEqual(lastBody.destinations,['BOM'])
  assert.equal(lastBody.departure_date,future)
  assert.equal(lastBody.adults,2);assert.equal(lastBody.currency,'INR')
  assert.equal(lastBody.advanced_settings.max_results,12)
  assert.equal(calls,1)
})
await check('403 fails closed',async()=>assert.equal((await searchParallelFlights(input,{apiKey:'synthetic-key',enabled:true,fetcher:stub(403,{})})).status,'ACCESS_DENIED'))
await check('401 fails closed',async()=>assert.equal((await searchParallelFlights(input,{apiKey:'synthetic-key',enabled:true,fetcher:stub(401,{})})).status,'ACCESS_DENIED'))
await check('429 fails closed',async()=>assert.equal((await searchParallelFlights(input,{apiKey:'synthetic-key',enabled:true,fetcher:stub(429,{})})).status,'RATE_LIMITED'))
await check('500 fails closed',async()=>assert.equal((await searchParallelFlights(input,{apiKey:'synthetic-key',enabled:true,fetcher:stub(500,{})})).status,'PROVIDER_ERROR'))
await check('empty provider results do not claim fare',async()=>assert.equal((await searchParallelFlights(input,{apiKey:'synthetic-key',enabled:true,fetcher:stub(200,{results:[]})})).status,'EMPTY'))
await check('invalid input never calls paid provider',async()=>{
  calls=0;const result=await searchParallelFlights({...input,adults:0},{apiKey:'synthetic-key',enabled:true,fetcher:stub(200,fixture)})
  assert.equal(result.status,'PROVIDER_ERROR'); assert.equal(calls,0)
})
const fusion=readFileSync(new URL('../app/api/flights/fusion/route.ts',import.meta.url),'utf8')
await check('Parallel invoked only behind pilot identity gate',()=>assert.match(fusion,/parallelPilotUserAllowed\(userId\)/))
await check('Parallel error falls back to existing cash sources',()=>assert.match(fusion,/const fallback = await fetchCashFlights/))
await check('Parallel does not run on public flight GET endpoint',()=>{
  const route=readFileSync(new URL('../app/api/flights/search/route.ts',import.meta.url),'utf8')
  assert.doesNotMatch(route,/searchParallelFlights/)
})
console.log('Parallel Flights pilot:',checks,'checks passed')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
