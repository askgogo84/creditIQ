'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { createBrowserClient } from '@supabase/ssr'
import { ThemeToggle } from '@/components/design/ThemeToggle'

const aiTools = [
  { label: 'Spend Optimizer', href: '/spend-optimizer', icon: '' },
  { label: 'Card Roast', href: '/card-roast', icon: '🔥' },
  { label: 'Smart Match', href: '/smart-match', icon: '' },
  { label: 'Statement Truth', href: '/statement-truth', icon: '📊' },
  { label: 'Card Switch', href: '/card-switch', icon: '🔄' },
  { label: 'Approval Odds', href: '/approval-odds', icon: '🎯' },
]

const travelLinks = [
  { label: 'Trip Planner', href: '/trip-planner', icon: '' },
  { label: 'Travel AI', href: '/travel', icon: '🌏' },
  { label: 'Lounge Tracker', href: '/lounge-tracker', icon: '🛋' },
]

const allNavItems = [
  { label: 'Cards', href: '/cards', icon: '💳' },
  { label: 'Compare', href: '/compare', icon: '=' },
  ...aiTools,
  ...travelLinks,
  { label: 'UAE', href: '/uae', icon: '🇦🇪' },
]

function DropdownMenu({ items, open }: { items: { label: string; href: string; icon?: string }[]; open: boolean }) {
  if (!open) return null
  return (
    <div className="absolute top-full left-0 mt-1 w-52 rounded-xl overflow-hidden z-50"
      style={{ background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.1))', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
      {items.map(item => (
        <Link key={item.href} href={item.href} className="block px-4 py-2.5 text-sm transition-colors"
          style={{ color: 'var(--ink,#142950)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2,#EFE7D8)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          {item.icon && <span style={{ marginRight: 8 }}>{item.icon}</span>}{item.label}
        </Link>
      ))}
    </div>
  )
}

export function Header() {
  const pathname = usePathname()
  const [aiOpen, setAiOpen] = useState(false)
  const [travelOpen, setTravelOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const aiRef = useRef<HTMLDivElement>(null)
  const travelRef = useRef<HTMLDivElement>(null)
  const aiTimer = useRef<ReturnType<typeof setTimeout>>()
  const travelTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    sb.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => { setMobileMenuOpen(false) }, [pathname])

  const signOut = async () => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.auth.signOut()
    window.location.href = '/'
  }

  const hoverOpen = (setter: (v: boolean) => void, timer: React.MutableRefObject<ReturnType<typeof setTimeout> | undefined>) => {
    clearTimeout(timer.current); setter(true)
  }
  const hoverClose = (setter: (v: boolean) => void, timer: React.MutableRefObject<ReturnType<typeof setTimeout> | undefined>) => {
    timer.current = setTimeout(() => setter(false), 180)
  }

  return (
    <>
      {/*  HEADER  */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--surface,#fff)',
        borderBottom: '1px solid var(--line,rgba(20,41,80,0.08))',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Logo />
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="hidden-mobile">
            <Link href="/cards" style={{ padding: '6px 12px', fontSize: 14, fontWeight: 600, color: 'var(--ink,#142950)', textDecoration: 'none', borderRadius: 8 }}>Cards</Link>
            <Link href="/compare" style={{ padding: '6px 12px', fontSize: 14, fontWeight: 600, color: 'var(--ink,#142950)', textDecoration: 'none', borderRadius: 8 }}>Compare</Link>

            <div ref={aiRef} style={{ position: 'relative' }}
              onMouseEnter={() => hoverOpen(setAiOpen, aiTimer)}
              onMouseLeave={() => hoverClose(setAiOpen, aiTimer)}>
              <button style={{ padding: '6px 12px', fontSize: 14, fontWeight: 600, color: 'var(--ink,#142950)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                AI Tools <span style={{ fontSize: 10, opacity: 0.6 }}></span>
              </button>
              <DropdownMenu items={aiTools} open={aiOpen} />
            </div>

            <div ref={travelRef} style={{ position: 'relative' }}
              onMouseEnter={() => hoverOpen(setTravelOpen, travelTimer)}
              onMouseLeave={() => hoverClose(setTravelOpen, travelTimer)}>
              <button style={{ padding: '6px 12px', fontSize: 14, fontWeight: 600, color: 'var(--ink,#142950)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                Travel <span style={{ fontSize: 10, opacity: 0.6 }}></span>
              </button>
              <DropdownMenu items={travelLinks} open={travelOpen} />
            </div>

            <Link href="/uae" style={{ padding: '6px 12px', fontSize: 14, fontWeight: 600, color: 'var(--ink,#142950)', textDecoration: 'none', borderRadius: 8 }}>UAE</Link>
          </nav>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThemeToggle />
            {user ? (
              <>
                <Link href="/dashboard" style={{ padding: '6px 14px', fontSize: 13, fontWeight: 700, color: 'var(--ink,#142950)', textDecoration: 'none', borderRadius: 8, border: '1px solid var(--line,rgba(20,41,80,0.15))' }} className="hidden-mobile">
                  Dashboard
                </Link>
                <button onClick={signOut} style={{ padding: '6px 14px', fontSize: 13, fontWeight: 700, color: '#fff', background: '#C9972E', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/login" style={{ padding: '6px 14px', fontSize: 13, fontWeight: 700, color: '#fff', background: '#C9972E', textDecoration: 'none', borderRadius: 8 }}>
                Sign In
              </Link>
            )}

            {/* Hamburger - mobile only */}
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              style={{ display: 'none', flexDirection: 'column', gap: 5, padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}
              className="show-mobile"
              aria-label="Menu"
            >
              <span style={{ width: 22, height: 2, background: 'var(--ink,#142950)', borderRadius: 2, display: 'block', transition: 'all 0.2s', transform: mobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
              <span style={{ width: 22, height: 2, background: 'var(--ink,#142950)', borderRadius: 2, display: 'block', transition: 'all 0.2s', opacity: mobileMenuOpen ? 0 : 1 }} />
              <span style={{ width: 22, height: 2, background: 'var(--ink,#142950)', borderRadius: 2, display: 'block', transition: 'all 0.2s', transform: mobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        {mobileMenuOpen && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: 'var(--surface,#fff)',
            borderBottom: '1px solid var(--line,rgba(20,41,80,0.08))',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            maxHeight: '80vh', overflowY: 'auto',
            zIndex: 99,
          }}>
            {/* User section */}
            {user && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line,rgba(20,41,80,0.06))' }}>
                <div style={{ fontSize: 12, color: 'var(--ink-2,#64748b)', marginBottom: 8 }}>{user.email}</div>
                <Link href="/dashboard" style={{ display: 'block', padding: '10px 14px', background: 'var(--bg-2,#f8f9fc)', borderRadius: 10, fontSize: 14, fontWeight: 700, color: 'var(--ink,#142950)', textDecoration: 'none', marginBottom: 6 }}>
                  Dashboard
                </Link>
              </div>
            )}

            {/* Nav sections */}
            <div style={{ padding: '8px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#C9972E', letterSpacing: 1.5, textTransform: 'uppercase', padding: '8px 0 4px' }}>Browse</div>
              {[
                { label: 'All Cards', href: '/cards', icon: '💳' },
                { label: 'Compare Cards', href: '/compare', icon: '=' },
                { label: 'UAE Cards', href: '/uae', icon: '🇦🇪' },
              ].map(item => (
                <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', fontSize: 15, fontWeight: 600, color: 'var(--ink,#142950)', textDecoration: 'none', borderBottom: '1px solid var(--line,rgba(20,41,80,0.04))' }}>
                  <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{item.icon}</span>{item.label}
                </Link>
              ))}

              <div style={{ fontSize: 10, fontWeight: 700, color: '#C9972E', letterSpacing: 1.5, textTransform: 'uppercase', padding: '12px 0 4px' }}>AI Tools</div>
              {aiTools.map(item => (
                <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', fontSize: 15, fontWeight: 600, color: 'var(--ink,#142950)', textDecoration: 'none', borderBottom: '1px solid var(--line,rgba(20,41,80,0.04))' }}>
                  <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{item.icon}</span>{item.label}
                </Link>
              ))}

              <div style={{ fontSize: 10, fontWeight: 700, color: '#C9972E', letterSpacing: 1.5, textTransform: 'uppercase', padding: '12px 0 4px' }}>Travel</div>
              {travelLinks.map(item => (
                <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', fontSize: 15, fontWeight: 600, color: 'var(--ink,#142950)', textDecoration: 'none', borderBottom: '1px solid var(--line,rgba(20,41,80,0.04))' }}>
                  <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{item.icon}</span>{item.label}
                </Link>
              ))}
            </div>

            {user && (
              <div style={{ padding: '12px 16px 20px' }}>
                <button onClick={signOut} style={{ width: '100%', padding: '12px', background: '#C9972E', color: '#0a0a0a', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/*  BOTTOM TAB BAR (mobile only)  */}
      <nav style={{ display: 'none' }} className="bottom-tab-bar">
        {[
          { label: 'Home', href: '/', icon: '' },
          { label: 'Cards', href: '/cards', icon: '💳' },
          { label: 'Trip', href: '/trip-planner', icon: '' },
          { label: 'AI Tools', href: '/smart-match', icon: '' },
          { label: 'Account', href: user ? '/dashboard' : '/login', icon: user ? '👤' : '->' },
        ].map(tab => {
          const active = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))
          return (
            <Link key={tab.href} href={tab.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '8px 0', flex: 1,
              textDecoration: 'none',
              color: active ? '#C9972E' : 'var(--ink-2,#64748b)',
              transition: 'color 0.15s',
            }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: 0.3 }}>{tab.label}</span>
              {active && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#C9972E' }} />}
            </Link>
          )
        })}
      </nav>

      {/*  GLOBAL MOBILE CSS  */}
      <style>{`
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          .bottom-tab-bar {
            display: flex !important;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            background: var(--surface, #fff);
            border-top: 1px solid var(--line, rgba(20,41,80,0.08));
            z-index: 100;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
          /* Push page content above bottom tab bar */
          main, .main-content {
            padding-bottom: 72px !important;
          }
        }
        @media (min-width: 641px) {
          .show-mobile { display: none !important; }
          .bottom-tab-bar { display: none !important; }
        }
        /* Spacer for fixed header */
        .header-spacer { height: 56px; }
      `}</style>

      <div className="header-spacer" />
    </>
  )
}
