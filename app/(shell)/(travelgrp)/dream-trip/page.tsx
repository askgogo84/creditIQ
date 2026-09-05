'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, CalendarRange, Plane, RefreshCw, Trash2 } from 'lucide-react'
import { AirportSelect } from '@/components/ciq/fly-points/AirportSelect'
import { authedFetch } from '@/lib/authed-fetch'

interface Watch {
  id: string
  label: string
  origin: string
  destination: string
  cabin: 'economy' | 'premium_economy' | 'business' | 'first'
  travellers: number
  target_date: string
  flex_days: 0 | 3 | 7
  nonstop_only: boolean
  alert_channel: 'APP' | 'EMAIL' | 'WHATSAPP' | 'BOTH'
  status: 'ACTIVE' | 'PAUSED' | 'BOOKED' | 'CANCELLED'
  last_checked_at: string | null
  last_state: 'BOOK_NOW' | 'VERIFY_FIRST' | 'WAIT' | 'CASH_BETTER' | 'KEEP_POINTS' | 'NO_RESULT' | null
  best_award_miles: number | null
  best_cash_minor: number | null
  best_programme: string | null
  best_date: string | null
  last_result: any
}

function plusDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function stateCopy(state: Watch['last_state']) {
  if (state === 'VERIFY_FIRST') return ['Verify first', 'Award space found. Reconfirm the seat before any irreversible transfer.']
  if (state === 'WAIT') return ['Wait / build balance', 'Award space exists, but the current wallet path is not yet executable.']
  if (state === 'CASH_BETTER') return ['Cash available', 'No usable award was returned in the watched window; keep points unless direct verification changes that.']
  if (state === 'BOOK_NOW') return ['Book now', 'A verified executable path is available.']
  if (state === 'KEEP_POINTS') return ['Keep your points', 'The cash alternative currently beats the redemption value.']
  return ['No result yet', 'Run the watch to check live/cached award sources and the target-date cash benchmark.']
}

function moneyMinor(value: number | null) {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value / 100)
}

export default function DreamTripPage() {
  const [watches, setWatches] = useState<Watch[]>([])
  const [from, setFrom] = useState('BLR')
  const [to, setTo] = useState('')
  const [targetDate, setTargetDate] = useState(plusDays(45))
  const [cabin, setCabin] = useState<Watch['cabin']>('business')
  const [flexDays, setFlexDays] = useState<0 | 3 | 7>(7)
  const [travellers, setTravellers] = useState(2)
  const [nonstop, setNonstop] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [checkingId, setCheckingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await authedFetch('/api/travel/watches')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'could not load watches')
      setWatches(data.watches || [])
    } catch (e: any) {
      setError(e?.message || 'Could not load Dream Trips.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function createWatch() {
    if (!from || !to || from === to) return
    setSaving(true)
    setError('')
    try {
      const res = await authedFetch('/api/travel/watches', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: `${from} → ${to} · ${cabin.replace('_', ' ')}`,
          origin: from, destination: to, target_date: targetDate,
          cabin, flex_days: flexDays, travellers, nonstop_only: nonstop, alert_channel: 'APP',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'could not save watch')
      setWatches(current => [data.watch, ...current])
    } catch (e: any) {
      setError(e?.message || 'Could not save Dream Trip.')
    } finally {
      setSaving(false)
    }
  }

  async function checkWatch(id: string) {
    setCheckingId(id)
    setError('')
    try {
      const res = await authedFetch('/api/travel/watches', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'watch check failed')
      setWatches(current => current.map(watch => watch.id === id ? data.watch : watch))
    } catch (e: any) {
      setError(e?.message || 'Could not check this Dream Trip.')
    } finally {
      setCheckingId(null)
    }
  }

  async function removeWatch(id: string) {
    const res = await authedFetch(`/api/travel/watches?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (res.ok) setWatches(current => current.filter(watch => watch.id !== id))
  }

  async function toggleWatch(watch: Watch) {
    const next = watch.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    const res = await authedFetch('/api/travel/watches', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: watch.id, status: next }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.watch) setWatches(current => current.map(item => item.id === watch.id ? data.watch : item))
  }

  const activeCount = useMemo(() => watches.filter(watch => watch.status === 'ACTIVE').length, [watches])

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section className="surface" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
          <div><span className="approved-section-kicker">Dream Trip 2.0</span><h2 style={{ margin: '4px 0 3px', fontSize: 24 }}>Tell CreditIQ where you want to go.</h2><p style={{ margin: 0, color: 'var(--muted)', fontSize: 12 }}>Watch a flexible award window, compare it with your wallet and keep the decision state honest: verify, wait, pay cash or keep points.</p></div>
          <div style={{ textAlign: 'right' }}><b style={{ fontSize: 22 }}>{activeCount}</b><small style={{ display: 'block', color: 'var(--muted)' }}>active watches</small></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr .8fr .75fr .65fr .65fr auto', gap: 8, alignItems: 'end' }}>
          <AirportSelect label="From" value={from} exclude={to} onChange={setFrom} />
          <AirportSelect label="To" value={to} exclude={from} onChange={setTo} />
          <label style={fieldStyle}><span>Target date</span><input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} style={inputStyle} /></label>
          <label style={fieldStyle}><span>Cabin</span><select value={cabin} onChange={e => setCabin(e.target.value as Watch['cabin'])} style={inputStyle}><option value="economy">Economy</option><option value="premium_economy">Premium economy</option><option value="business">Business</option><option value="first">First</option></select></label>
          <label style={fieldStyle}><span>Flex</span><select value={flexDays} onChange={e => setFlexDays(Number(e.target.value) as 0 | 3 | 7)} style={inputStyle}><option value={0}>Exact</option><option value={3}>±3 days</option><option value={7}>±7 days</option></select></label>
          <label style={fieldStyle}><span>Travellers</span><input type="number" min={1} max={9} value={travellers} onChange={e => setTravellers(Math.max(1, Math.min(9, Number(e.target.value) || 1)))} style={inputStyle} /></label>
          <button className="approved-primary" onClick={createWatch} disabled={saving || !to || to === from}>{saving ? 'Saving…' : 'Watch trip'}</button>
        </div>
        <label style={{ display: 'inline-flex', gap: 7, alignItems: 'center', marginTop: 10, color: 'var(--muted)', fontSize: 11 }}><input type="checkbox" checked={nonstop} onChange={e => setNonstop(e.target.checked)} /> Non-stop only</label>
      </section>

      {error && <div style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 10, color: 'var(--red)' }}>{error}</div>}

      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}><div><span className="approved-section-kicker">Award Watch</span><h2 style={{ margin: '3px 0 0', fontSize: 18 }}>Your watched trips</h2></div><button className="approved-secondary" onClick={() => void load()}><RefreshCw size={14} /> Refresh</button></div>
        {loading ? <div className="surface" style={{ padding: 24 }}>Loading watches…</div> : watches.length === 0 ? <div className="surface" style={{ padding: 28, textAlign: 'center', color: 'var(--muted)' }}><Plane size={22} /><p>Create your first Dream Trip above. CreditIQ will keep the target, flexible dates and wallet context together.</p></div> : (
          <div style={{ display: 'grid', gap: 9 }}>
            {watches.map(watch => {
              const copy = stateCopy(watch.last_state)
              const snapshot = watch.last_result || {}
              const award = snapshot.award || null
              return (
                <article className="surface" key={watch.id} style={{ padding: 15, display: 'grid', gridTemplateColumns: '1.25fr .8fr .8fr 1fr auto', gap: 14, alignItems: 'center' }}>
                  <div><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><b style={{ fontSize: 15 }}>{watch.origin} → {watch.destination}</b><span style={pillStyle}>{watch.cabin.replace('_', ' ')}</span></div><small style={{ color: 'var(--muted)' }}>{watch.target_date} · {watch.flex_days ? `±${watch.flex_days} days` : 'exact date'} · {watch.travellers} traveller{watch.travellers === 1 ? '' : 's'}{watch.nonstop_only ? ' · non-stop' : ''}</small><p style={{ margin: '7px 0 0', fontSize: 11, color: 'var(--muted)' }}>{copy[1]}</p></div>
                  <div><small style={labelStyle}>Decision</small><b style={{ display: 'block', marginTop: 3 }}>{copy[0]}</b><small style={{ color: 'var(--muted)' }}>{watch.last_checked_at ? `checked ${new Date(watch.last_checked_at).toLocaleString()}` : 'not checked yet'}</small></div>
                  <div><small style={labelStyle}>Best award</small><b style={{ display: 'block', marginTop: 3 }}>{watch.best_award_miles ? `${Number(watch.best_award_miles).toLocaleString('en-IN')} miles` : '—'}</b><small style={{ color: 'var(--muted)' }}>{watch.best_programme || 'programme pending'}{watch.best_date ? ` · ${watch.best_date}` : ''}</small></div>
                  <div><small style={labelStyle}>Cash benchmark</small><b style={{ display: 'block', marginTop: 3 }}>{moneyMinor(watch.best_cash_minor)}</b><small style={{ color: 'var(--muted)' }}>{award?.seats ? `${award.seats} award seat${award.seats === 1 ? '' : 's'} observed` : 'target-date reference'}</small></div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'end' }}><button className="approved-primary" onClick={() => void checkWatch(watch.id)} disabled={checkingId === watch.id}>{checkingId === watch.id ? 'Checking…' : 'Check now'}</button><button className="approved-secondary" onClick={() => void toggleWatch(watch)} title={watch.status === 'ACTIVE' ? 'Pause alerts' : 'Resume alerts'}><Bell size={14} /> {watch.status === 'ACTIVE' ? 'Pause' : 'Resume'}</button><button className="approved-secondary" onClick={() => void removeWatch(watch.id)} title="Delete watch"><Trash2 size={14} /></button></div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="surface" style={{ padding: 14, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 10, alignItems: 'start' }}><CalendarRange size={18} /><div><b style={{ fontSize: 12 }}>How flexible search works today</b><p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 10.5, lineHeight: 1.55 }}>Award discovery spans the full ±3/±7-day window in one provider search. Cash is deliberately benchmarked only on the selected target date. When AwardTool Panorama access is activated, the same watch contract can use broader route/date discovery without changing this UI.</p></div></section>
    </div>
  )
}

const fieldStyle = { display: 'grid', gap: 4, color: 'var(--muted)', fontSize: 9.5, textTransform: 'uppercase' as const, letterSpacing: '.05em', fontWeight: 750 }
const inputStyle = { minHeight: 42, border: '1px solid var(--line)', borderRadius: 9, padding: '0 10px', background: 'var(--paper)', color: 'var(--ink)', fontSize: 11 }
const pillStyle = { padding: '3px 7px', borderRadius: 999, background: 'var(--paper-soft)', color: 'var(--muted)', fontSize: 9, textTransform: 'capitalize' as const }
const labelStyle = { color: 'var(--muted)', fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '.05em' }
