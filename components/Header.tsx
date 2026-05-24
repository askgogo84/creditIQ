'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const aiTools = [
  { label: 'Spend Optimizer', href: '/spend-optimizer' },
  { label: 'Card Roast', href: '/card-roast' },
  { label: 'Smart Match', href: '/smart-match' },
  { label: 'Statement Truth', href: '/statement-truth' },
  { label: 'Card Switch', href: '/card-switch' },
  { label: 'Approval Odds', href: '/approval-odds' },
  { label: 'Credit Simulator', href: '/credit-simulator' },
]

const travelLinks = [
  { label: 'Trip Planner', href: '/trip-planner' },
  { label: 'Travel AI', href: '/travel' },
  { label: 'Lounge Tracker', href: '/lounge-tracker' },
]

function DropdownMenu({ items, open }: { items: { label: string; href: string }[]; open: boolean }) {
  if (!open) return null
  return (
    <div
      className="absolute top-full left-0 mt-1 w-52 rounded-xl overflow-hidden z-50"
      style={{ background: 'var(--card, #111118)', border: '1px solid var(--border, rgba(255,255,255,0.08))', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
    >
      {items.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className="block px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
          style={{ color: 'var(--text-muted, rgba(255,255,255,0.7))' }}
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}

export function Header() {
  const pathname = usePathname()
  const [aiOpen, setAiOpen] = useState(false)
  const [travelOpen, setTravelOpen] = useState(false)
  const aiRef = useRef<HTMLDivElement>(null)
  const travelRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 h-16"
        style={{ background: 'var(--bg, #08080E)', borderBottom: '1px solid var(--border, rgba(255,255,255,0.06))' }}
      >
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#1B3A5C] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="2" fill="#C9972E" opacity="0.9"/>
                <rect x="2" y="9" width="20" height="3" fill="#1B3A5C"/>
                <rect x="5" y="14" width="5" height="2" rx="1" fill="white" opacity="0.6"/>
              </svg>
            </div>
            <span className="font-bold text-base" style={{ color: 'var(--text, #fff)', fontFamily: 'Syne, sans-serif' }}>CreditIQ</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/cards" className="px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5" style={{ color: 'var(--text-muted, rgba(255,255,255,0.6))' }}>
              Cards
            </Link>
            <Link href="/compare" className="px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5" style={{ color: 'var(--text-muted, rgba(255,255,255,0.6))' }}>
              Compare
            </Link>

            {/* AI Tools dropdown — hover */}
            <div
              ref={aiRef}
              className="relative"
              onMouseEnter={() => setAiOpen(true)}
              onMouseLeave={() => setAiOpen(false)}
            >
              <button
                className="px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5 flex items-center gap-1"
                style={{ color: 'var(--text-muted, rgba(255,255,255,0.6))' }}
              >
                AI Tools
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className={	ransition-transform }>
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
              </button>
              <DropdownMenu items={aiTools} open={aiOpen} />
            </div>

            {/* Travel dropdown — hover */}
            <div
              ref={travelRef}
              className="relative"
              onMouseEnter={() => setTravelOpen(true)}
              onMouseLeave={() => setTravelOpen(false)}
            >
              <button
                className="px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5 flex items-center gap-1"
                style={{ color: 'var(--text-muted, rgba(255,255,255,0.6))' }}
              >
                Travel
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className={	ransition-transform }>
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
              </button>
              <DropdownMenu items={travelLinks} open={travelOpen} />
            </div>

            <Link href="/uae" className="px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5" style={{ color: 'var(--text-muted, rgba(255,255,255,0.6))' }}>
              UAE
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden md:flex px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-muted, rgba(255,255,255,0.6))' }}
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{ background: '#C9972E', color: '#fff' }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>
      <div className="h-16" />
    </>
  )
}
