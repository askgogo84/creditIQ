'use client';

import { Fragment, useEffect, useState } from 'react';

interface DevalTickerProps {
  items?: string[];
}

export function DevalTicker({ items: staticItems }: DevalTickerProps) {
  const [items, setItems] = useState<string[]>(staticItems || [
    'AXIS Magnus devalued — Grab Vouchers capped at 1:0.4',
    'HDFC SmartBuy halved on Cleartrip from May 2026',
    'ICICI Sapphiro removed all spend-based renewal benefits',
    'SBI Aurum to scrap Priority Pass guest visits',
    'New — AU Bank Zenith+ launches with 10x on fuel',
  ])

  useEffect(() => {
    fetch('/api/ticker')
      .then(r => r.json())
      .then(d => { if (d.items?.length) setItems(d.items) })
      .catch(() => {})
  }, [])

  const content = items.map((s, i) => (
    <span key={`a-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor', flexShrink: 0 }} />
      <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s}</span>
    </span>
  ))

  return (
    <div className="deval" style={{ padding: '12px 0', position: 'relative', zIndex: 1 }}>
      <div className="marquee">
        <div className="marquee__track">
          {content}
          {content.map((c, i) => (<Fragment key={`b-${i}`}>{c}</Fragment>))}
        </div>
        <div className="marquee__track" aria-hidden="true">
          {content}
          {content.map((c, i) => (<Fragment key={`c-${i}`}>{c}</Fragment>))}
        </div>
      </div>
    </div>
  )
}
