import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {parseMerchantQuoteRequest,issuerVerifiedMerchantBenefits} from '../lib/commerce/issuer-merchant-benefits'
const now=Date.parse('2026-11-16T09:00:00Z')
const q={userLinkId:'d3233314-2ce5-4c0b-82fd-b4e51f5c05ad',cartSha256:'a'.repeat(64),
 provider:'swiggy' as const,currency:'INR' as const,totalPaise:34567}
assert.deepEqual(parseMerchantQuoteRequest(q),q)
for(const patch of [{userLinkId:'other'},{cartSha256:'nope'},{currency:'USD'},
 {provider:'unknown'},{totalPaise:0},{totalPaise:5000001},{unknown:'x'}]){
 assert.equal(parseMerchantQuoteRequest({...q,...patch}),null)
}
const row={user_link_id:q.userLinkId,cart_sha256:q.cartSha256,provider:q.provider,
 currency:'INR',total_paise:q.totalPaise,card_alias:'HDFC card',offer_id:'offer-1',
 evidence_id:'issuer-proof',source:'issuer_authoritative_api',
 verified_at:new Date(now-1000).toISOString(),expires_at:new Date(now+60000).toISOString(),
 eligible:true,estimated_benefit_paise:1500,merchant_fee_paise:50,terms_url:'https://issuer.example/terms'}
assert.equal(issuerVerifiedMerchantBenefits(q,[row],now).length,1)
assert.equal(issuerVerifiedMerchantBenefits(q,[],now).length,0)
assert.equal(issuerVerifiedMerchantBenefits(q,[row],now)[0].owner,q.userLinkId)
for(const patch of [{user_link_id:'another'},{cart_sha256:'b'.repeat(64)},
 {source:'consumer_guess'},{eligible:false},{provider:'zepto'},
 {verified_at:new Date(now-600000).toISOString()},
 {expires_at:new Date(now-1).toISOString()},
 {estimated_benefit_paise:q.totalPaise+1},
 {merchant_fee_paise:1500},{terms_url:'javascript:alert(1)'}]){
 assert.equal(issuerVerifiedMerchantBenefits(q,[{...row,...patch}],now).length,0)
}
const code=readFileSync('app/api/internal/gogo/commerce/merchant-benefits/route.ts','utf8')
assert.match(code,/verifyGogoServiceRequest\(req,raw\)/)
assert.match(code,/CREDITIQ_COMMERCE_ISSUER_EVIDENCE_ENABLED/)
assert.match(code,/user_link_id/)
assert.match(code,/cart_sha256/)
assert.match(code,/issuerVerifiedMerchantBenefits/)
assert.doesNotMatch(code,/calcRewards\(|base_reward_rate|category_rewards/)
assert.doesNotMatch(code,/export async function GET/)
const sql=readFileSync('supabase/migrations/20261116090000_verified_issuer_merchant_quotes.sql','utf8')
assert.match(sql,/enable row level security/)
assert.match(sql,/before update or delete/)
assert.match(sql,/revoke all .*anon,authenticated/)
console.log('✅ CreditIQ signed exact-cart issuer benefits endpoint contract passed')
