import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  parallelShoppingAllowed, shoppingQueryValid,
  normalizeParallelShopping, searchParallelShopping,
} from '../lib/commerce/providers/parallel-shopping'

async function main() {
let checks = 0
const check = async (name: string, run: () => unknown | Promise<unknown>) => {
  await run(); checks++; console.log('PASS', name)
}
const env = { PARALLEL_API_KEY:'synthetic',
  PARALLEL_SHOPPING_ENABLED:'true',
  PARALLEL_SHOPPING_PILOT_USER_IDS:'test-owner-1,test-owner-2' }
await check('authorized pilot account',()=>assert.equal(parallelShoppingAllowed('test-owner-1',env),true))
await check('no outsider access',()=>assert.equal(parallelShoppingAllowed('outsider',env),false))
await check('empty allowlist denies',()=>assert.equal(parallelShoppingAllowed('test-owner-1',{...env,PARALLEL_SHOPPING_PILOT_USER_IDS:''}),false))
await check('missing key denies',()=>assert.equal(parallelShoppingAllowed('test-owner-1',{...env,PARALLEL_API_KEY:''}),false))
await check('disabled feature denies',()=>assert.equal(parallelShoppingAllowed('test-owner-1',{...env,PARALLEL_SHOPPING_ENABLED:'false'}),false))
await check('public product query accepted',()=>assert.equal(shoppingQueryValid('Sony WH-1000XM5'),true))
await check('empty query rejected',()=>assert.equal(shoppingQueryValid(''),false))
await check('email PII query rejected',()=>assert.equal(shoppingQueryValid('buy x for abc@example.com'),false))
await check('account number query rejected',()=>assert.equal(shoppingQueryValid('credit card 1234 5678 9012 3456'),false))
await check('giant query rejected',()=>assert.equal(shoppingQueryValid('x'.repeat(201)),false))
const product = { url:'https://shop.example.com/headphones', title:'Demo Headphones',
  merchant:'demo-shop',price:9999.50,currency:'INR',
  availability:'in_stock',brand:'Demo Brand' }
await check('normalizes INR listing to minor units',()=>{
  const result=normalizeParallelShopping({results:[product]})[0]
  assert.equal(result.priceMinor,999950)
  assert.equal(result.evidenceState,'DISCOVERY_ONLY')
  assert.equal(result.requiresCheckoutReverification,true)
})
await check('no price is never made up',()=>assert.equal(normalizeParallelShopping({results:[{...product,price:undefined}]})[0].priceMinor,null))
await check('wrong currency is dropped',()=>assert.equal(normalizeParallelShopping({results:[{...product,currency:'USD'}]}).length,0))
await check('negative price is omitted not invented',()=>assert.equal(normalizeParallelShopping({results:[{...product,price:-3}]})[0].priceMinor,null))
await check('unsafe URL is rejected',()=>assert.equal(normalizeParallelShopping({results:[{...product,url:'http://localhost/x'}]}).length,0))
await check('missing merchant is rejected',()=>assert.equal(normalizeParallelShopping({results:[{...product,merchant:''}]}).length,0))
let calls=0, request:any=null
const mock=(status:number, payload:unknown):typeof fetch => (async (_:any,init:any)=>{
  calls++;request=JSON.parse(init.body)
  assert.equal(init.headers['x-api-key'],'synthetic')
  return new Response(JSON.stringify(payload),{status,headers:{'content-type':'application/json'}})
}) as typeof fetch
await check('disabled does not call paid API',async()=>{
  calls=0
  const result=await searchParallelShopping('Sony WH-1000XM5',{enabled:false,apiKey:'synthetic',fetcher:mock(200,{results:[product]})})
  assert.equal(result.status,'DISABLED');assert.equal(calls,0)
})
await check('uses official India shopping API schema',async()=>{
  calls=0
  const result=await searchParallelShopping('Sony WH-1000XM5',{enabled:true,apiKey:'synthetic',fetcher:mock(200,{results:[product]})})
  assert.equal(result.status,'SUCCESS');assert.equal(result.products.length,1)
  assert.deepEqual(request.search_queries,['Sony WH-1000XM5'])
  assert.equal(request.advanced_settings.location,'in')
  assert.equal(request.advanced_settings.max_results,10)
  assert.equal(calls,1)
})
await check('403 is entitlement denied',async()=>assert.equal((await searchParallelShopping('Sony WH-1000XM5',{enabled:true,apiKey:'synthetic',fetcher:mock(403,{})})).status,'ACCESS_DENIED'))
await check('429 is rate limited',async()=>assert.equal((await searchParallelShopping('Sony WH-1000XM5',{enabled:true,apiKey:'synthetic',fetcher:mock(429,{})})).status,'RATE_LIMITED'))
await check('500 fails closed',async()=>assert.equal((await searchParallelShopping('Sony WH-1000XM5',{enabled:true,apiKey:'synthetic',fetcher:mock(500,{})})).status,'PROVIDER_ERROR'))
await check('invalid query makes no request',async()=>{
  calls=0
  const result=await searchParallelShopping('xy',{enabled:true,apiKey:'synthetic',fetcher:mock(200,{results:[product]})})
  assert.equal(result.status,'PROVIDER_ERROR');assert.equal(calls,0)
})
const api=readFileSync(new URL('../app/api/commerce/parallel-shopping/route.ts',import.meta.url),'utf8')
await check('API requires bearer auth',()=>assert.match(api,/requireAuth\(req\)/))
await check('API enforces pilot membership',()=>assert.match(api,/parallelShoppingAllowed\(gate\.userId\)/))
await check('API refuses payment claims',()=>assert.match(api,/paymentsExecuted: false/))
console.log('Parallel Shopping pilot:',checks,'checks passed')
}
main().catch(err=>{console.error(err);process.exitCode=1})
