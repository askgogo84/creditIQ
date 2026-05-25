'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { createBrowserClient } from '@supabase/ssr'
import { ThemeToggle } from '@/components/design/ThemeToggle'

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
      style={{
        background: 'var(--surface, #fff)',
        border: '1px solid var(--line, rgba(20,41,80,0.1))',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}
    >
      {items.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className="block px-4 py-2.5 text-sm transition-colors"
          style={{ color: 'var(--ink, #142950)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2, #EFE7D8)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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
  const [user, setUser] = useState<any>(null)
  const aiRef = useRef<HTMLDivElement>(null)
  const travelRef = useRef<HTMLDivElement>(null)
  const aiTimer = useRef<ReturnType<typeof setTimeout>>()
  const travelTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await sb.auth.signOut()
    window.location.href = '/'
  }

  const navLinkStyle = {
    color: 'var(--ink-3, #5A6A8A)',
    fontSize: 14,
    fontWeight: 500,
  }

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 h-16"
        style={{
          background: 'var(--surface, #fff)',
          borderBottom: '1px solid var(--line, rgba(20,41,80,0.08))',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Logo size="sm" showWordmark={true} />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/cards" className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-black/5" style={navLinkStyle}>
              Cards
            </Link>
            <Link href="/compare" className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-black/5" style={navLinkStyle}>
              Compare
            </Link>

            {/* AI Tools dropdown */}
            <div
              ref={aiRef}
              className="relative"
              onMouseEnter={() => { clearTimeout(aiTimer.current); setAiOpen(true); }}
              onMouseLeave={() => { aiTimer.current = setTimeout(() => setAiOpen(false), 150); }}
            >
              <button className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-black/5 flex items-center gap-1" style={navLinkStyle}>
                AI Tools
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"
                  style={{ transition: 'transform 0.2s', transform: aiOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
              </button>
              <DropdownMenu items={aiTools} open={aiOpen} />
            </div>

            {/* Travel dropdown */}
            <div
              ref={travelRef}
              className="relative"
              onMouseEnter={() => { clearTimeout(travelTimer.current); setTravelOpen(true); }}
              onMouseLeave={() => { travelTimer.current = setTimeout(() => setTravelOpen(false), 150); }}
            >
              <button className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-black/5 flex items-center gap-1" style={navLinkStyle}>
                Travel
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"
                  style={{ transition: 'transform 0.2s', transform: travelOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
              </button>
              <DropdownMenu items={travelLinks} open={travelOpen} />
            </div>

            <Link href="/uae" className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-black/5" style={navLinkStyle}>
              UAE
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/dashboard" className="hidden md:flex px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-black/5" style={navLinkStyle}>
              Dashboard
            </Link>
            {user ? (
              <button
                onClick={signOut}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{ background: 'rgba(201,151,46,0.1)', color: '#C9972E', border: '1px solid rgba(201,151,46,0.3)', cursor: 'pointer' }}
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{ background: '#C9972E', color: '#fff' }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>
      <div className="h-16" />
    </>
  )
}
