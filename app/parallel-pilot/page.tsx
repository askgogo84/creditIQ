'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

type PilotState = 'checking' | 'signed_out' | 'ready'

export default function ParallelPilotPage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ), [])
  const [auth, setAuth] = useState<PilotState>('checking')
  const [from, setFrom] = useState('DEL')
  const [to, setTo] = useState('BOM')
  const [depart, setDepart] = useState('')
  const [product, setProduct] = useState('Sony WH-1000XM5')
  const [flightBusy, setFlightBusy] = useState(false)
  const [shopBusy, setShopBusy] = useState(false)
  const [flightResult, setFlightResult] = useState<Record<string, any> | null>(null)
  const [shopResult, setShopResult] = useState<Record<string, any> | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    sb.auth.getUser().then(({ data }) => setAuth(data.user ? 'ready' : 'signed_out'))
      .catch(() => setAuth('signed_out'))
  }, [sb])

  const call = async (path: string, body: object) => {
    const { data } = await sb.auth.getSession()
    if (!data.session?.access_token) throw new Error('Your session expired. Sign in and retry.')
    const res = await fetch(path, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + data.session.access_token,
        'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error || 'Request failed')
    return json
  }
  const flightSearch = async () => {
    setMessage('');setFlightResult(null)
    if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to) ||
        from === to || !/^20\d{2}-\d{2}-\d{2}$/.test(depart)) {
      setMessage('Enter two valid IATA airport codes and a future date.')
      return
    }
    setFlightBusy(true)
    try {
      const result = await call('/api/flights/fusion', {
        from,to,date_from:depart,date_to:depart,cash_date:depart,
        cabin:'economy',adults:1,
      })
      setFlightResult(result)
    } catch (error: any) { setMessage(error?.message || 'Flight search unavailable') }
    finally { setFlightBusy(false) }
  }
  const shoppingSearch = async () => {
    setMessage('');setShopResult(null);setShopBusy(true)
    try {
      setShopResult(await call('/api/commerce/parallel-shopping',{query:product.trim()}))
    } catch (error: any) { setMessage(error?.message || 'Shopping search unavailable') }
    finally { setShopBusy(false) }
  }
  const box: React.CSSProperties = {
    background:'#fff',border:'1px solid #e5ddd3',borderRadius:16,padding:20,
    boxShadow:'0 6px 22px rgba(51,35,19,.04)',
  }
  const field: React.CSSProperties = {
    width:'100%',minWidth:0,padding:'11px 12px',borderRadius:9,
    border:'1px solid #d9d0c5',background:'#fff',fontSize:15,color:'#292421',
  }
  const primary: React.CSSProperties = {
    border:0,background:'#9a603e',color:'#fff',padding:'12px 20px',
    borderRadius:10,cursor:'pointer',fontWeight:600,fontSize:14,marginTop:12,
  }
  return <main style={{minHeight:'100vh',background:'#faf8f5',color:'#26211d',fontFamily:'Inter,system-ui,sans-serif',padding:'30px 16px 90px'}}>
    <div style={{maxWidth:900,margin:'0 auto'}}>
      <Link href="/dashboard" style={{color:'#915d41',fontSize:14}}>← CreditIQ dashboard</Link>
      <p style={{fontSize:11,letterSpacing:2,color:'#9a603e',fontWeight:700,marginTop:28}}>CREDITIQ LABS · CONTROLLED PILOT</p>
      <h1 style={{fontSize:'clamp(26px,5vw,40px)',fontWeight:500,margin:'8px 0'}}>Parallel Flight & Shopping Lab</h1>
      <p style={{fontSize:14,color:'#685f59',lineHeight:1.6,maxWidth:720}}>
        A restricted test workspace for eligible CreditIQ accounts. Compare real provider-listed
        fares and Indian product listings. No purchases, bookings, card charges or points transfers happen here.
        Provider prices must be checked again at checkout.
      </p>
      {auth === 'checking' && <p>Checking account...</p>}
      {auth === 'signed_out' && <div style={box}>
        <h2 style={{fontSize:19}}>Sign in to CreditIQ</h2>
        <p style={{color:'#766b62'}}>This testing workspace requires your existing CreditIQ account.</p>
        <Link href="/login" style={{color:'#9a603e',fontWeight:700}}>Open CreditIQ sign in →</Link>
      </div>}
      {auth === 'ready' && <>
        {message && <div role="alert" style={{...box,color:'#9b3b2a',marginBottom:16}}>{message}</div>}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,330px),1fr))',gap:16,marginTop:26}}>
          <section style={box}>
            <div style={{fontSize:12,color:'#9a603e',fontWeight:700}}>01 · LIVE FLIGHTS</div>
            <h2 style={{fontSize:20,margin:'10px 0'}}>One-way economy fare</h2>
            <p style={{fontSize:12,color:'#746b64',lineHeight:1.5}}>The authenticated Fusion engine uses Parallel only when your pilot user is authorized. Otherwise it falls back to existing providers.</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <label style={{fontSize:12}}>From airport<input style={field} value={from} maxLength={3} onChange={e=>setFrom(e.target.value.toUpperCase())}/></label>
              <label style={{fontSize:12}}>To airport<input style={field} value={to} maxLength={3} onChange={e=>setTo(e.target.value.toUpperCase())}/></label>
            </div>
            <label style={{display:'block',fontSize:12,marginTop:12}}>Departure date<input type="date" style={field} value={depart} onChange={e=>setDepart(e.target.value)}/></label>
            <button onClick={flightSearch} disabled={flightBusy} style={{...primary,opacity:flightBusy?.6:1}}>
              {flightBusy?'Searching…':'Search flight offers'}
            </button>
            {flightResult && <div role="status" style={{marginTop:18,borderTop:'1px solid #ece5dc',paddingTop:12}}>
              <p style={{fontSize:13,margin:0}}>Provider: <strong>{String(flightResult.cashSource||'unavailable')}</strong></p>
              <p style={{fontSize:12,color:'#776c62'}}>Cash offers: {Number(flightResult.counts?.cashFlights||0)} · Awards: {Number(flightResult.counts?.awards||0)}</p>
              {flightResult.cashSource!=='parallel-flights' && <p style={{fontSize:12,color:'#b26945'}}>Parallel has not returned an eligible offer. Check key, early-access entitlement, pilot user allowlist or available inventory.</p>}
              {(Array.isArray(flightResult.flights)?flightResult.flights:[]).slice(0,4).map((f:any,i:number)=>
                <div key={i} style={{borderTop:'1px solid #ece5dc',padding:'10px 0',fontSize:13}}>
                  <strong>{String(f.airline||'Airline')}</strong> · {String(f.departure||'')}
                  <div style={{color:'#534537'}}>Cash: {Number(f.price)>0?('₹'+Number(f.price).toLocaleString('en-IN')):'Not sourced'}</div>
                </div>)}
            </div>}
          </section>
          <section style={box}>
            <div style={{fontSize:12,color:'#9a603e',fontWeight:700}}>02 · LIVE SHOPPING DISCOVERY</div>
            <h2 style={{fontSize:20,margin:'10px 0'}}>India product search</h2>
            <p style={{fontSize:12,color:'#746b64',lineHeight:1.5}}>Only approved testers with Shopping API access can search. Prices exclude unknown checkout taxes, delivery and credit-card rewards.</p>
            <label style={{display:'block',fontSize:12}}>Public product name<input style={field} value={product} maxLength={200} onChange={e=>setProduct(e.target.value)}/></label>
            <button onClick={shoppingSearch} disabled={shopBusy} style={{...primary,opacity:shopBusy?.6:1}}>
              {shopBusy?'Searching…':'Find store listings'}
            </button>
            {shopResult && <div role="status" style={{marginTop:18,borderTop:'1px solid #ece5dc',paddingTop:12}}>
              <p style={{fontSize:12,color:'#776c62'}}>Listings: {(shopResult.products||[]).length} · India INR · Discovery only</p>
              {(Array.isArray(shopResult.products)?shopResult.products:[]).slice(0,6).map((p:any,i:number)=>
                <div key={i} style={{borderTop:'1px solid #ece5dc',padding:'10px 0',fontSize:13}}>
                  <strong>{String(p.title||'Product')}</strong>
                  <div>{String(p.merchant||'Merchant')} · {Number.isFinite(Number(p.priceMinor)) && p.priceMinor!==null ? '₹'+(Number(p.priceMinor)/100).toLocaleString('en-IN'):'Price unknown'}</div>
                  {typeof p.productUrl==='string' && <a href={p.productUrl} target="_blank" rel="noopener noreferrer" style={{color:'#955c3d'}}>View merchant listing ↗</a>}
                </div>)}
            </div>}
          </section>
        </div>
      </>}
      <p style={{fontSize:12,color:'#897e75',marginTop:26}}>Source-listed prices are not final checkout quotes. Confirm inventory and taxes with the airline or merchant. Pilot features default off until authorized configuration.</p>
    </div>
  </main>
}
