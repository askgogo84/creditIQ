'use client'

import { useEffect, useState } from 'react'

interface IntelItem {
  id: string
  creator_handle: string
  source: string
  content: string
  insight_type: string
  trust_score: number
  published_at: string
}

const TYPE_COLORS: Record<string, string> = {
  transfer_hack: '#7c3aed',
  devaluation: '#b91c1c',
  sweet_spot: '#065f46',
  strategy: '#92400e',
  card_review: '#0369a1',
  general: '#374151',
}

const TYPE_ICONS: Record<string, string> = {
  transfer_hack: '⇄',
  devaluation: '↓',
  sweet_spot: '★',
  strategy: '◆',
  card_review: '✓',
  general: '●',
}

export function WhatCreatorsSay({ cardSlug }: { cardSlug: string }) {
  const [items, setItems] = useState<IntelItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/intelligence?card=${cardSlug}&limit=5`)
      .then(r => r.json())
      .then(d => { setItems(d.data || []); setLoading(false); })
      .catch(() => setLoading(false))
  }, [cardSlug])

  if (loading) return (
    <div style={{ padding: '24px 0', color: 'var(--ink-2)' }}>Loading intelligence...</div>
  )

  if (items.length === 0) return null

  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink-1)', margin: 0 }}>
          What creators say
        </h3>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(22,163,74,0.1)', borderRadius: 8,
          padding: '3px 10px'
        }}>
          <div style={{ width: 7, height: 7, borderRadius: 4, background: '#16a34a' }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', letterSpacing: 1 }}>LIVE</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(item => {
          const color = TYPE_COLORS[item.insight_type] || TYPE_COLORS.general
          const icon = TYPE_ICONS[item.insight_type] || '●'
          return (
            <div key={item.id} style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderLeft: `4px solid ${color}`,
              borderRadius: 12,
              padding: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, color }}>{icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-1)' }}>
                    @{item.creator_handle}
                  </span>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 6,
                    background: `${color}18`, color, fontWeight: 700,
                    textTransform: 'capitalize'
                  }}>
                    {item.insight_type?.replace(/_/g, ' ')}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'capitalize' }}>
                  {item.source}
                </span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }}>
                {item.content}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  Trust score: {Math.round((item.trust_score || 0.5) * 100)}%
                </span>
                <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  {new Date(item.published_at).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
