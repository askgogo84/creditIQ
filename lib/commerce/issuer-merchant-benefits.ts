export type MerchantQuoteRequest={
 userLinkId:string;cartSha256:string;provider:'swiggy'|'zepto'
 currency:'INR';totalPaise:number
}
export type IssuerMerchantQuote={
 user_link_id:string;cart_sha256:string;provider:string;currency:string
 total_paise:number;card_alias:string;offer_id:string;evidence_id:string
 source:string;verified_at:string;expires_at:string;eligible:boolean
 estimated_benefit_paise:number;merchant_fee_paise:number;terms_url:string|null
}
const goodId=(x:unknown,max=150):x is string=>
 typeof x==='string'&&x.length>0&&x.length<=max&&/^[\w. :/-]+$/.test(x)
const money=(n:unknown):n is number=>
 typeof n==='number'&&Number.isSafeInteger(n)&&n>=0&&n<=5000000
export function parseMerchantQuoteRequest(raw:unknown):MerchantQuoteRequest|null{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null
 const x=raw as Record<string,unknown>
 if(Object.keys(x).some(k=>!['userLinkId','cartSha256','provider','currency','totalPaise'].includes(k))||
    typeof x.userLinkId!=='string'|| !/^[a-f0-9-]{8,80}$/i.test(x.userLinkId)||
    typeof x.cartSha256!=='string'||!/^[a-f0-9]{64}$/.test(x.cartSha256)||
    !['swiggy','zepto'].includes(String(x.provider))||x.currency!=='INR'||
    !money(x.totalPaise)||x.totalPaise<=0)return null
 return x as MerchantQuoteRequest
}
function safeHttps(url:string|null){
 if(url===null)return null
 try{const parsed=new URL(url)
  if(parsed.protocol!=='https:'||parsed.username||parsed.password||
    url.length>1200)return null
  return parsed.href
 }catch{return null}
}
export function issuerVerifiedMerchantBenefits(
 request:MerchantQuoteRequest,rows:readonly IssuerMerchantQuote[],now=Date.now()){
 if(!Array.isArray(rows)||rows.length>100||!Number.isFinite(now))return []
 const accepted=new Map<string,{
  owner:string;cartSha256:string;provider:string;currency:'INR'
  cardAlias:string;offerId:string;evidenceId:string
  evidenceSource:'creditiq_issuer_verified';checkedAt:number;expiresAt:number
  eligible:true;estimatedBenefitPaise:number;merchantFeePaise:number;termsUrl:string|null
 }>()
 for(const row of rows){
  if(!row||row.user_link_id!==request.userLinkId||
    row.cart_sha256!==request.cartSha256||row.provider!==request.provider||
    row.currency!=='INR'||row.total_paise!==request.totalPaise||
    row.source!=='issuer_authoritative_api'||row.eligible!==true||
    !goodId(row.card_alias)||!goodId(row.offer_id)||!goodId(row.evidence_id)||
    !money(row.estimated_benefit_paise)||!money(row.merchant_fee_paise)||
    row.estimated_benefit_paise>request.totalPaise||
    row.estimated_benefit_paise<=row.merchant_fee_paise||
    (row.terms_url!==null&&safeHttps(row.terms_url)===null))continue
  const checkedAt=Date.parse(row.verified_at),expiresAt=Date.parse(row.expires_at)
  if(!Number.isFinite(checkedAt)||!Number.isFinite(expiresAt)||
    checkedAt>now||now-checkedAt>300000||
    expiresAt<=now||expiresAt>checkedAt+31*86400000)continue
  accepted.set(row.card_alias+':'+row.offer_id,{
    owner:request.userLinkId,cartSha256:request.cartSha256,
    provider:request.provider,currency:'INR',cardAlias:row.card_alias,
    offerId:row.offer_id,evidenceId:row.evidence_id,
    evidenceSource:'creditiq_issuer_verified',checkedAt,expiresAt,
    eligible:true,estimatedBenefitPaise:row.estimated_benefit_paise,
    merchantFeePaise:row.merchant_fee_paise,termsUrl:safeHttps(row.terms_url),
  })
 }
 return [...accepted.values()].sort((a,b)=>((b.estimatedBenefitPaise-b.merchantFeePaise)-
   (a.estimatedBenefitPaise-a.merchantFeePaise))).slice(0,10)
}
