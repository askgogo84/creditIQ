'use client'

import { useMemo, useState } from 'react'
import { authedFetch } from '@/lib/authed-fetch'
import { TRAVEL_COVERAGE_MATRIX, type TravelCoverageCase } from '@/lib/travel/coverage-matrix'

type Result = {
  status: 'idle' | 'running' | 'pass' | 'partial' | 'guide' | 'fail'
  cashRows: number
  awardRows: number
  guideRows: number
  walletRoutes: number
  programmes: string[]
  message: string
  elapsedMs?: number
}

function futureDate(days = 21) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function emptyResult(): Result {
  return { status: 'idle', cashRows: 0, awardRows: 0, guideRows: 0, walletRoutes: 0, programmes: [], message: 'Not run' }
}

export default function TravelQaPage() {
  const [results, setResults] = useState<Record<string, Result>>({})
  const [runningGroup, setRunningGroup] = useState<string | null>(null)
  const [date, setDate] = useState(futureDate())

  const summary = useMemo(() => {
    const values = Object.values(results)
    return {
      run: values.filter(result => result.status !== 'idle').length,
      pass: values.filter(result => result.status === 'pass').length,
      partial: values.filter(result => result.status === 'partial').length,
      guide: values.filter(result => result.status === 'guide').length,
      fail: values.filter(result => result.status === 'fail').length,
    }
  }, [results])

  async function runCase(test: TravelCoverageCase) {
    setResults(previous => ({ ...previous, [test.id]: { ...emptyResult(), status: 'running', message: 'Searching…' } }))
    const started = performance.now()
    try {
      const [response, guideResponse] = await Promise.all([
        authedFetch('/api/flights/fusion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: test.from, to: test.to, date_from: date, date_to: date, cabin: test.cabin }),
        }),
        authedFetch(`/api/flights/award-guide?from=${encodeURIComponent(test.from)}&to=${encodeURIComponent(test.to)}`),
      ])

      const data = await response.json().catch(() => ({}))
      const guideData = await guideResponse.json().catch(() => ({}))
      if (!response.ok || data.error) throw new Error(data.error || `HTTP ${response.status}`)

      const rows = Array.isArray(data.flights) ? data.flights : []
      const guides = guideResponse.ok && Array.isArray(guideData.guides) ? guideData.guides : []
      const cashRows = rows.filter((row: any) => Number(row.price) > 0).length
      const awardRows = rows.filter((row: any) => row.award).length
      const guideRows = guides.length
      const walletRoutes = rows.filter((row: any) => Array.isArray(row.redemption) && row.redemption.some((option: any) => option.status === 'ok' && option.canAfford)).length
      const programmes = [...new Set([
        ...rows.map((row: any) => row.award?.program).filter(Boolean),
        ...guides.map((guide: any) => `${guide.programme} · GUIDE`),
      ])] as string[]

      let status: Result['status'] = 'fail'
      let message = 'No cash, live award or published guide returned'
      if (cashRows > 0 && awardRows > 0) {
        status = 'pass'
        message = 'Cash + LIVE award inventory returned'
      } else if (awardRows > 0 || cashRows > 0) {
        status = 'partial'
        message = awardRows > 0 ? 'LIVE award only — cash coverage missing' : 'Cash only — LIVE award coverage missing'
      } else if (guideRows > 0) {
        status = 'guide'
        message = 'Issuer-published guide exists, but no live inventory returned'
      }

      setResults(previous => ({
        ...previous,
        [test.id]: {
          status,
          cashRows,
          awardRows,
          guideRows,
          walletRoutes,
          programmes,
          message,
          elapsedMs: Math.round(performance.now() - started),
        },
      }))
    } catch (error) {
      setResults(previous => ({
        ...previous,
        [test.id]: {
          ...emptyResult(),
          status: 'fail',
          message: error instanceof Error ? error.message : 'Search failed',
          elapsedMs: Math.round(performance.now() - started),
        },
      }))
    }
  }

  async function runGroup(region: 'domestic' | 'international') {
    if (runningGroup) return
    setRunningGroup(region)
    const tests = TRAVEL_COVERAGE_MATRIX.filter(item => item.region === region)
    for (const test of tests) await runCase(test)
    setRunningGroup(null)
  }

  return (
    <main style={{ width: 'min(calc(100% - 48px), 1240px)', margin: '0 auto', padding: '32px 0 80px', color: 'var(--ink)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20, marginBottom: 18 }}>
        <div>
          <div className="ciq-editorial-kicker">Internal travel QA</div>
          <h1 style={{ margin: '6px 0 4px', fontSize: 34, letterSpacing: '-.04em' }}>Flight coverage matrix</h1>
          <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 13 }}>Live cash + live award + wallet fusion, with published programme guides tracked separately.</p>
        </div>
        <label style={{ display: 'grid', gap: 4, color: 'var(--ink-3)', fontSize: 10 }}>
          Test date
          <input type="date" value={date} onChange={event => setDate(event.target.value)} style={{ minHeight: 38, border: '1px solid var(--line)', borderRadius: 9, padding: '0 10px', background: 'var(--surface)' }} />
        </label>
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 14 }}>
        <Metric label="Run" value={summary.run} />
        <Metric label="Pass · live" value={summary.pass} />
        <Metric label="Partial" value={summary.partial} />
        <Metric label="Guide only" value={summary.guide} />
        <Metric label="Fail" value={summary.fail} />
      </section>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button disabled={!!runningGroup} onClick={() => void runGroup('domestic')} style={buttonStyle}>{runningGroup === 'domestic' ? 'Running domestic…' : 'Run all domestic'}</button>
        <button disabled={!!runningGroup} onClick={() => void runGroup('international')} style={buttonStyle}>{runningGroup === 'international' ? 'Running international…' : 'Run all international'}</button>
      </div>

      {(['domestic', 'international'] as const).map(region => (
        <section key={region} style={{ marginTop: 24 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 17, textTransform: 'capitalize' }}>{region}</h2>
          <div style={{ overflow: 'hidden', border: '1px solid var(--line)', borderRadius: 12, background: 'var(--surface)' }}>
            <div style={headerGridStyle}><span>Route</span><span>Cabin</span><span>Cash</span><span>Live awards</span><span>Guide</span><span>Wallet</span><span>Programmes</span><span>Status</span><span /></div>
            {TRAVEL_COVERAGE_MATRIX.filter(item => item.region === region).map(test => {
              const result = results[test.id] ?? emptyResult()
              return (
                <div key={test.id} style={rowGridStyle}>
                  <span><b style={{ display: 'block', fontSize: 11 }}>{test.from} → {test.to}</b><small style={{ color: 'var(--ink-3)' }}>{test.label}</small></span>
                  <span>{test.cabin}</span>
                  <span>{result.cashRows}</span>
                  <span>{result.awardRows}</span>
                  <span>{result.guideRows}</span>
                  <span>{result.walletRoutes}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.programmes.join(', ') || '—'}</span>
                  <span><Status result={result} /></span>
                  <span><button disabled={!!runningGroup || result.status === 'running'} onClick={() => void runCase(test)} style={smallButtonStyle}>{result.status === 'running' ? 'Running…' : 'Run'}</button></span>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      <p style={{ marginTop: 14, color: 'var(--ink-3)', fontSize: 10, lineHeight: 1.55 }}><b>PASS</b> requires both cash and LIVE award inventory. <b>GUIDE</b> means an issuer has published a points benchmark but CreditIQ has not confirmed a seat; it never counts as availability. PARTIAL means only one live side returned. Wallet routes are counted only from actual fusion results.</p>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 10, background: 'var(--surface)' }}><small style={{ color: 'var(--ink-3)' }}>{label}</small><b style={{ display: 'block', marginTop: 3, fontSize: 20 }}>{value}</b></div>
}

function Status({ result }: { result: Result }) {
  const color = result.status === 'pass' ? 'var(--green)' : result.status === 'fail' ? 'var(--red)' : result.status === 'partial' ? 'var(--amber)' : result.status === 'guide' ? 'var(--copper)' : 'var(--ink-3)'
  return <span title={result.message} style={{ color, fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase' }}>{result.status}{result.elapsedMs ? ` · ${(result.elapsedMs / 1000).toFixed(1)}s` : ''}</span>
}

const buttonStyle = { minHeight: 40, border: 0, borderRadius: 10, padding: '0 15px', background: 'var(--ink)', color: 'var(--paper)', fontWeight: 750, cursor: 'pointer' } as const
const smallButtonStyle = { minHeight: 30, border: '1px solid var(--line)', borderRadius: 8, padding: '0 10px', background: 'var(--surface)', color: 'var(--ink)', fontSize: 10, fontWeight: 700, cursor: 'pointer' } as const
const headerGridStyle = { display: 'grid', gridTemplateColumns: '1.2fr .55fr .4fr .55fr .4fr .45fr 1.25fr .75fr .4fr', gap: 9, alignItems: 'center', minHeight: 38, padding: '0 12px', background: 'var(--surface-2)', color: 'var(--ink-3)', fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em' } as const
const rowGridStyle = { display: 'grid', gridTemplateColumns: '1.2fr .55fr .4fr .55fr .4fr .45fr 1.25fr .75fr .4fr', gap: 9, alignItems: 'center', minHeight: 54, padding: '7px 12px', borderTop: '1px solid var(--line)', fontSize: 10 } as const
