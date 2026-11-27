import {NextRequest,NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'
import {verifyGogoServiceRequest} from '@/lib/gogo-service-auth'
import {parseMerchantQuoteRequest,issuerVerifiedMerchantBenefits,type IssuerMerchantQuote} from '@/lib/commerce/issuer-merchant-benefits'

export const runtime='nodejs'
export const dynamic='force-dynamic'
export const maxDuration=15
const headers={'Cache-Control':'no-store'}
/**
 * Server-to-server read-only quote endpoint.
 * No issuer evidence feed? Return ZERO verified offers. No product-catalogue
 * or inferred cashback is ever presented as an authorized merchant quote.
 */
export async function POST(req:NextRequest){
 const raw=await req.text()
 if(raw.length>2048)return NextResponse.json({error:'invalid_request'},{status:400,headers})
 if(!verifyGogoServiceRequest(req,raw))
   return NextResponse.json({error:'unauthorized'},{status:401,headers})
 let json:unknown
 try{json=JSON.parse(raw)}catch{return NextResponse.json({error:'invalid_request'},{status:400,headers})}
 const body=parseMerchantQuoteRequest(json)
 if(!body)return NextResponse.json({error:'invalid_request'},{status:400,headers})
 const base={
  contract:'gogo-creditiq-merchant-benefits-v1',userLinkId:body.userLinkId,
  cartSha256:body.cartSha256,provider:body.provider,currency:'INR',
  totalPaise:body.totalPaise,
 }
 if(process.env.CREDITIQ_COMMERCE_ISSUER_EVIDENCE_ENABLED!=='true')
   return NextResponse.json({...base,quotes:[],evidenceState:'issuer_feed_disabled'},{headers})
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!url||!key)return NextResponse.json({...base,quotes:[],evidenceState:'provider_unconfigured'},{headers})
 try{
  const sb=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data,error}=await sb.from('verified_issuer_merchant_quotes').select(
    'user_link_id,cart_sha256,provider,currency,total_paise,card_alias,offer_id,evidence_id,source,verified_at,expires_at,eligible,estimated_benefit_paise,merchant_fee_paise,terms_url'
  ).eq('user_link_id',body.userLinkId)
   .eq('cart_sha256',body.cartSha256).eq('provider',body.provider)
   .eq('currency','INR').eq('total_paise',body.totalPaise)
   .eq('eligible',true).eq('source','issuer_authoritative_api')
   .gt('expires_at',new Date().toISOString())
   .order('verified_at',{ascending:false}).limit(40)
  if(error)return NextResponse.json({...base,quotes:[],evidenceState:'issuer_feed_unavailable'},{headers})
  const quotes=issuerVerifiedMerchantBenefits(body,(data||[]) as IssuerMerchantQuote[])
  return NextResponse.json({...base,quotes,
    evidenceState:quotes.length?'issuer_verified':'no_verified_merchant_offers'},{headers})
 }catch{
  return NextResponse.json({...base,quotes:[],evidenceState:'issuer_feed_unavailable'},{headers})
 }
}
