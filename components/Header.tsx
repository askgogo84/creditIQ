'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { TabBar } from '@/components/ciq/TabBar'
import { APP_NAV, appActive as isAppActive } from '@/components/ciq/appNav'
import { useTheme, reassertTheme } from '@/lib/store'

const NAV_LINKS = [
  { label: 'Discover', href: '/' },
  { label: 'Cards', href: '/cards' },
  { label: 'AI Tools', href: '/smart-match' },
  { label: 'Dashboard', href: '/dashboard' },
]

const AI_TOOLS = [
  { label: 'Card Roast', href: '/card-roast', icon: '🔥', desc: 'Get a brutal A-F grade on your card', badge: 'NEW' },
  { label: 'Spend Optimizer', href: '/spend-optimizer', icon: '⚡', desc: 'Find the one card for your spend', badge: '' },
  { label: 'Points Optimizer', href: '/points-optimizer', icon: '💎', desc: 'Find sweet spots worth Rs.3+/pt', badge: '' },
  { label: 'Statement Truth', href: '/statement-truth', icon: '📋', desc: 'Upload statement, see the real rate', badge: '' },
  { label: 'Switch Wizard', href: '/card-switch', icon: '↔', desc: 'Should you switch? 4 questions.', badge: '' },
  { label: 'Travel AI', href: '/travel', icon: '✈', desc: 'Chat about miles + transfers', badge: 'BETA' },
  { label: 'Lounge Tracker', href: '/lounge-tracker', icon: '🛋', desc: 'Never get turned away at the gate', badge: '' },
]

const AI_PATHS = AI_TOOLS.map(t => t.href).concat(['/smart-match', '/rewards-calculator', '/rewards-calculator', '/card-roast', '/spend-optimizer', '/points-optimizer', '/statement-truth', '/card-switch', '/lounge-tracker'])

const BROWSE_LINKS = [
  { label: 'All Cards', href: '/cards', icon: '💳' },
  { label: 'Compare', href: '/compare', icon: '⚖️' },
  { label: 'UAE Cards', href: '/uae', icon: '🇦🇪' },
]

// App nav (APP_NAV) + its active-state matchers now live in
// components/ciq/appNav.tsx so the rail, TabBar and this Header can't drift.

// Header CSS — a single static, module-level constant. It is byte-identical on
// every server and client render (nothing is interpolated from state, props or
// theme), so it can never produce a "Text content does not match" hydration
// mismatch. Anything that must vary by theme is expressed with design tokens
// (var(--…)) that the browser resolves per [data-theme] — the varying part lives
// in globals.css, never in this string.
const HEADER_CSS = `
        .ciq-header { position: fixed; top: 0; left: 0; right: 0; z-index: 200; transition: box-shadow 0.2s; }
        .ciq-header.scrolled { box-shadow: var(--shadow-md); }
        .ciq-inner { max-width: 1200px; margin: 0 auto; padding: 0 20px; height: 60px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .ciq-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; flex-shrink: 0; }
        .ciq-logo-icon { width: 36px; height: 36px; background: var(--navy); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .ciq-logo-text { font-size: 18px; font-weight: 800; color: var(--ink); letter-spacing: -0.5px; }
        .ciq-logo-sub { font-size: 9px; font-weight: 600; color: var(--ink-3); letter-spacing: 2px; text-transform: uppercase; margin-top: -2px; }
        .ciq-nav { display: flex; align-items: center; gap: 2px; background: var(--bg-2); border-radius: 100px; padding: 4px; }
        .ciq-nav-item { padding: 7px 18px; border-radius: 100px; font-size: 14px; font-weight: 600; color: var(--ink-3); text-decoration: none; cursor: pointer; background: none; border: none; transition: all 0.15s; white-space: nowrap; }
        .ciq-nav-item:hover { color: var(--ink); background: var(--surface-2); }
        .ciq-nav-item.active { background: var(--surface); color: var(--ink); box-shadow: var(--shadow-sm); }
        .ciq-right { display: flex; align-items: center; gap: 10px; }
        .ciq-theme-btn { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--line); background: var(--surface); color: var(--ink); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .ciq-ico-moon { display: none; }
        :root[data-theme="dark"] .ciq-ico-sun { display: none; }
        :root[data-theme="dark"] .ciq-ico-moon { display: block; }
        .ciq-cta { padding: 9px 20px; background: var(--navy); color: #fff; border: none; border-radius: 100px; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; white-space: nowrap; display: flex; align-items: center; gap: 6px; transition: opacity 0.15s; }
        .ciq-cta:hover { opacity: 0.88; }
        .ciq-hamburger { display: none; flex-direction: column; gap: 5px; padding: 8px; background: none; border: none; cursor: pointer; }
        .ciq-bar { width: 22px; height: 2px; background: var(--ink); border-radius: 2px; display: block; transition: all 0.2s; }
        .ciq-ai-dropdown { position: absolute; top: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: var(--surface); border: 1px solid var(--line); border-radius: 20px; box-shadow: var(--shadow-lg); padding: 8px; width: 280px; display: flex; flex-direction: column; gap: 2px; z-index: 300; }
        .ciq-ai-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; text-decoration: none; transition: background 0.1s; }
        .ciq-ai-item:hover { background: var(--bg-2); }
        .ciq-ai-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--bg-2); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .ciq-ai-label { font-size: 13px; font-weight: 600; color: var(--ink); }
        .ciq-badge { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 100px; background: var(--badge-gold); color: #fff; margin-left: 4px; vertical-align: middle; }
        .ciq-badge.new { background: var(--badge-new); }
        .ciq-badge.beta { background: var(--badge-beta); }
        .ciq-badge.popular { background: var(--badge-gold); }
        .ciq-more-mega { position: absolute; top: calc(100% + 8px); right: 0; background: var(--surface); border: 1px solid var(--line); border-radius: 20px; box-shadow: var(--shadow-lg); padding: 16px; display: grid; grid-template-columns: repeat(2, minmax(212px, 1fr)); gap: 4px 14px; z-index: 300; }
        .ciq-more-title { font-size: 10px; font-weight: 700; color: var(--copper); letter-spacing: 1.5px; text-transform: uppercase; padding: 6px 12px 4px; }
        .ciq-mobile-menu { position: absolute; top: 100%; left: 0; right: 0; background: var(--surface); border-bottom: 1px solid var(--line); box-shadow: var(--shadow-lg); padding: 12px 20px 20px; max-height: 80vh; overflow-y: auto; }
        .ciq-mobile-section { font-size: 10px; font-weight: 700; color: var(--copper); letter-spacing: 1.5px; text-transform: uppercase; padding: 12px 0 6px; }
        .ciq-mobile-link { display: flex; align-items: center; gap: 10px; padding: 11px 0; font-size: 15px; font-weight: 600; color: var(--ink); text-decoration: none; border-bottom: 1px solid var(--line-soft); }
        .ciq-tab-bar { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: var(--surface); border-top: 1px solid var(--line); z-index: 200; padding-bottom: env(safe-area-inset-bottom,0px); }
        .ciq-tab { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 7px 0 4px; flex: 1; text-decoration: none; color: var(--ink-4); transition: color 0.15s; }
        .ciq-tab.active { color: var(--copper); }
        .ciq-tab-label { font-size: 9px; font-weight: 500; letter-spacing: 0.2px; }
        .ciq-tab.active .ciq-tab-label { font-weight: 700; }
        .ciq-tab-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--copper); }
        @media (max-width: 768px) {
          .ciq-nav { display: none !important; }
          .ciq-cta { display: none !important; }
          .ciq-theme-desktop { display: none !important; }
          .ciq-hamburger { display: flex !important; }
          .ciq-tab-bar { display: flex !important; }
          main, .main-content, .page-fade, body > div, #__next > div { padding-bottom: 72px !important; } body { padding-bottom: 72px !important; }
        }
        @media (min-width: 769px) {
          .ciq-hamburger { display: none !important; }
          .ciq-tab-bar { display: none !important; }
          .ciq-mobile-menu { display: none !important; }
        }
        .header-spacer { height: 60px; }
        @media (max-width: 768px) {
          div[style*="position: fixed"][style*="bottom: 24"] { bottom: 80px !important; }
          div[style*="position: fixed"][style*="bottom: 92"] { bottom: 148px !important; }
        }
`

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [cardsOpen, setCardsOpen] = useState(false)
  const [travelOpen, setTravelOpen] = useState(false)
  const [discoverOpen, setDiscoverOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  // Mirror the wallet's theme choice so the injected gold ciq TabBar looks
  // identical here to what /dashboard shows (CiqTheme persists 'ciq-theme',
  // defaults dark).
  const [ciqTheme, setCiqTheme] = useState<'light' | 'dark'>('dark')
  // Theme flips route through the single writer in lib/store.ts (applyTheme),
  // never inline here — see lib/theme-single-writer.test.ts.
  const toggleTheme = useTheme((s) => s.toggle)

  const closeTimers = {
    discover: { ref: null as any },
    cards:    { ref: null as any },
    ai:       { ref: null as any },
    travel:   { ref: null as any },
  }

  const delayClose = (setter: (v: boolean) => void, timerRef: { ref: any }) => {
    timerRef.ref = setTimeout(() => setter(false), 200)
  }
  const cancelClose = (timerRef: { ref: any }) => {
    if (timerRef.ref) clearTimeout(timerRef.ref)
  }

  useEffect(() => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    sb.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Re-assert the persisted theme on mount for the routes the Header still owns
  // (marketing, non-(shell) app pages). React drops the pre-paint data-theme while
  // hydrating server-rendered routes; this restores it. Single implementation lives
  // in lib/store (reassertTheme -> applyTheme), so there is no second copy and the
  // theme single-writer gate stays green. Guarded: no-op if the attr survived.
  useEffect(() => { reassertTheme() }, [])

  useEffect(() => { setMobileOpen(false); setAiOpen(false); setDiscoverOpen(false); setCardsOpen(false); setTravelOpen(false) }, [pathname])

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('ciq-theme')
      if (saved === 'light' || saved === 'dark') setCiqTheme(saved)
    } catch {}
  }, [])

  // Keep the injected ciq TabBar wrapper in sync when the theme is flipped from
  // the TabBar "More" sheet (or another tab) — it broadcasts 'ciq-theme-change'.
  useEffect(() => {
    const sync = () => {
      try {
        const saved = window.localStorage.getItem('ciq-theme')
        if (saved === 'light' || saved === 'dark') setCiqTheme(saved)
      } catch {}
    }
    window.addEventListener('ciq-theme-change', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('ciq-theme-change', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const signOut = async () => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.auth.signOut()
    router.push('/')
  }

  // Carry the page the user is on into the login link so they return here after
  // signing in (e.g. /flights -> /login?next=/flights -> back to /flights).
  const loginHref = pathname && pathname !== '/' && pathname !== '/login'
    ? `/login?next=${encodeURIComponent(pathname)}`
    : '/login'

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/smart-match') return AI_PATHS.some(p => pathname.startsWith(p))
    return pathname.startsWith(href)
  }

  // App-nav active state (logged-in). Folds marketing routes into their app tab.
  const appActive = (href: string) => isAppActive(href, pathname)

  const isTabActive = (tab: { href: string; label: string }) => {
    if (user) return appActive(tab.href)
    if (tab.href === '/') return pathname === '/'
    if (tab.label === 'AI') return AI_PATHS.some(p => pathname.startsWith(p))
    if (tab.label === 'Travel') return pathname.startsWith('/trip-planner') || pathname.startsWith('/travel') || pathname.startsWith('/flights')
    return pathname.startsWith(tab.href)
  }

  return (
    <>
      <style>{HEADER_CSS}</style>

      <header className={`ciq-header${scrolled ? ' scrolled' : ''}`} style={{ background: 'var(--surface)' }}>
        <div className="ciq-inner">

          {/* Logo — Home. Logged-in Home is the wallet, logged-out Home is the landing page. */}
          <Link href={user ? '/dashboard' : '/'} className="ciq-logo">
            <div className="ciq-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="1" y="4" width="22" height="16" rx="3" fill="white" fillOpacity="0.9"/>
                <line x1="1" y1="10" x2="23" y2="10" stroke="#142950" strokeWidth="2"/>
                <circle cx="5" cy="14.5" r="1.5" fill="#C9972E"/>
              </svg>
            </div>
            <div>
              <div className="ciq-logo-text">CreditIQ</div>
              <div className="ciq-logo-sub">Intelligence</div>
            </div>
          </Link>

          {/* Desktop pill nav — app nav when signed in, marketing dropdowns when signed out */}
          <nav className="ciq-nav" style={{ position: 'relative' }}>
            {user ? (
              <>
                {APP_NAV.map(n => (
                  <Link key={n.href} href={n.href} className={`ciq-nav-item${appActive(n.href) ? ' active' : ''}`}>{n.label}</Link>
                ))}
              </>
            ) : (
            <>
            <div style={{ position: 'relative' }} onMouseEnter={() => { cancelClose(closeTimers.discover); setDiscoverOpen(true) }} onMouseLeave={() => delayClose(setDiscoverOpen, closeTimers.discover)}>
              <button className={`ciq-nav-item${isActive('/') ? ' active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                Discover
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5, transform: discoverOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              {discoverOpen && (
                <div className="ciq-ai-dropdown" style={{ width: 240 }}>
                  {[
                    { label: 'Home', href: '/', icon: '🏠', desc: 'Find your perfect card in 90s' },
                    { label: 'Sweet Spots', href: '/sweet-spots', icon: '💎', desc: '8 best redemption strategies' },
                    { label: 'Blog', href: '/blog', icon: '📝', desc: 'Honest card reviews & guides' },
                    { label: 'Glossary', href: '/glossary', icon: '📖', desc: 'Every credit card term explained' },
                    { label: 'Devaluation Tracker', href: '/blog/credit-card-devaluations-india-2026', icon: '⚠️', desc: 'Every 2026 benefit cut tracked' },
                  ].map(item => (
                    <Link key={item.href} href={item.href} className="ciq-ai-item">
                      <div className="ciq-ai-icon">{item.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div className="ciq-ai-label">{item.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{item.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }} onMouseEnter={() => { cancelClose(closeTimers.cards); setCardsOpen(true) }} onMouseLeave={() => delayClose(setCardsOpen, closeTimers.cards)}>
              <button className={`ciq-nav-item${isActive('/cards') ? ' active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                Cards
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5, transform: cardsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              {cardsOpen && (
                <div className="ciq-ai-dropdown" style={{ width: 220 }}>
                  {[
                    { label: 'All Cards', href: '/cards', icon: '💳', desc: '100+ cards ranked honestly' },
                    { label: 'Compare', href: '/compare', icon: '⚖️', desc: 'Side by side comparison' },
                    { label: 'Best Travel Cards', href: '/best-cards/travel', icon: '✈️', desc: 'Top cards for travel' },
                    { label: 'Best Cashback', href: '/best-cards/cashback', icon: '💰', desc: 'Maximum cashback cards' },
                    { label: 'UAE Cards', href: '/uae', icon: '🇦🇪', desc: 'Cards for UAE residents' },
                  ].map(item => (
                    <Link key={item.href} href={item.href} className="ciq-ai-item">
                      <div className="ciq-ai-icon">{item.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div className="ciq-ai-label">{item.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{item.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }} onMouseEnter={() => { cancelClose(closeTimers.ai); setAiOpen(true) }} onMouseLeave={() => delayClose(setAiOpen, closeTimers.ai)}>
              <button className={`ciq-nav-item${isActive('/smart-match') ? ' active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                AI Tools
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5, transform: aiOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              {aiOpen && (
                <div className="ciq-ai-dropdown">
                  {AI_TOOLS.map(tool => (
                    <Link key={tool.href} href={tool.href} className="ciq-ai-item">
                      <div className="ciq-ai-icon">{tool.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div className="ciq-ai-label">
                          {tool.label}
                          {tool.badge && <span className={`ciq-badge ${tool.badge.toLowerCase()}`}>{tool.badge}</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{tool.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }} onMouseEnter={() => { cancelClose(closeTimers.travel); setTravelOpen(true) }} onMouseLeave={() => delayClose(setTravelOpen, closeTimers.travel)}>
              <button className={`ciq-nav-item${isActive('/travel') ? ' active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                Travel
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5, transform: travelOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              {travelOpen && (
                <div className="ciq-ai-dropdown" style={{ width: 220 }}>
                  {[
                    { label: 'Trip Planner', href: '/trip-planner', icon: '🗺️', desc: 'Plan with your points' },
                    { label: 'Travel AI', href: '/travel', icon: '✈️', desc: 'Chat about miles + transfers' },
                    { label: 'Lounge Tracker', href: '/lounge-tracker', icon: '🛋️', desc: 'Never get turned away' },
                  ].map(item => (
                    <Link key={item.href} href={item.href} className="ciq-ai-item">
                      <div className="ciq-ai-icon">{item.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div className="ciq-ai-label">{item.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{item.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href={user ? '/dashboard' : '/login'} className={`ciq-nav-item${isActive('/dashboard') ? ' active' : ''}`}>My Wallet</Link>
            </>
            )}
          </nav>

          {/* Right side */}
          <div className="ciq-right">
            <button className="ciq-theme-btn ciq-theme-desktop" aria-label="Toggle light or dark theme" onClick={toggleTheme}>
              {/* Both icons are rendered on server AND client; CSS shows one based on
                  [data-theme] (set pre-paint in layout), so there is no hydration mismatch. */}
              <svg className="ciq-ico-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              <svg className="ciq-ico-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </button>

            {user ? (
              <button onClick={signOut} className="ciq-theme-desktop" style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#fff', background: 'var(--badge-gold)', border: 'none', borderRadius: 100, cursor: 'pointer' }}>Sign Out</button>
            ) : (
              <Link href={loginHref} className="ciq-theme-desktop" style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#fff', background: 'var(--badge-gold)', textDecoration: 'none', borderRadius: 100 }}>Sign In</Link>
            )}

            {!user && (
              <Link href="/smart-match" className="ciq-cta">
                Find my card
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            )}

            <button className="ciq-hamburger" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
              <span className="ciq-bar" style={{ transform: mobileOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }}/>
              <span className="ciq-bar" style={{ opacity: mobileOpen ? 0 : 1 }}/>
              <span className="ciq-bar" style={{ transform: mobileOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }}/>
            </button>
          </div>
        </div>

        {/* Mobile menu — all emoji as proper Unicode, no hardcoded garbled strings */}
        {mobileOpen && (
          <div className="ciq-mobile-menu">
            {user ? (
              <>
                <div className="ciq-mobile-section">Menu</div>
                {APP_NAV.map(i => (
                  <Link key={i.href} href={i.href} className={`ciq-mobile-link${appActive(i.href) ? ' active' : ''}`}>
                    {i.label}
                  </Link>
                ))}
              </>
            ) : (
              <>
                <div className="ciq-mobile-section">Browse</div>
                {BROWSE_LINKS.map(i => (
                  <Link key={i.href} href={i.href} className="ciq-mobile-link">
                    <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{i.icon}</span>
                    {i.label}
                  </Link>
                ))}
                <div className="ciq-mobile-section">AI Tools</div>
                {AI_TOOLS.map(i => (
                  <Link key={i.href} href={i.href} className="ciq-mobile-link">
                    <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{i.icon}</span>
                    {i.label}
                    {i.badge && <span className={`ciq-badge ${i.badge.toLowerCase()}`} style={{ marginLeft: 8 }}>{i.badge}</span>}
                  </Link>
                ))}
              </>
            )}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
              {user
                ? <button onClick={signOut} style={{ width: '100%', padding: '13px', background: 'var(--badge-gold)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Sign Out</button>
                : <Link href={loginHref} style={{ display: 'block', textAlign: 'center', padding: '13px', background: 'var(--navy)', color: '#fff', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
              }
            </div>
          </div>
        )}
      </header>

      {/* Bottom bar (mobile). Signed in -> the exact gold ciq TabBar the wallet
          uses, wrapped in [data-ciq] so its --ciq tokens resolve on marketing
          pages too (the fixed bar inherits them; the wrapper is zero-height).
          Signed out -> the marketing tabs. */}
      {user ? (
        <div data-ciq data-theme={ciqTheme} className="md:hidden">
          <TabBar />
        </div>
      ) : (
        <nav className="ciq-tab-bar">
          {/* Home · Cards · Travel · AI — icons aligned with the logged-in TabBar
              equivalents. "More" (below) opens the existing hamburger menu. */}
          {([
            { label: 'Home', href: '/', d: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10' },
            { label: 'Cards', href: '/cards', d: 'M1 4h22v16a2 2 0 01-2 2H3a2 2 0 01-2-2V4z M1 10h22' },
            { label: 'Travel', href: '/trip-planner', d: 'M22 2L11 13 M22 2L15 22 11 13 2 9l20-7z' },
            { label: 'AI', href: '/smart-match', d: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
          ] as { label: string; href: string; d: string }[]).map(tab => {
            const active = isTabActive(tab)
            const paths = tab.d.split(' M').map((p, i) => i === 0 ? p : 'M' + p)
            return (
              <Link key={tab.href} href={tab.href} className={`ciq-tab${active ? ' active' : ''}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {paths.map((p, i) => <path key={i} d={p}/>)}
                </svg>
                <span className="ciq-tab-label">{tab.label}</span>
                {active && <span className="ciq-tab-dot"/>}
              </Link>
            )
          })}
          {/* "More" — opens the existing hamburger sheet (single mobileOpen state,
              so it can never be open twice). Three-dot icon matches logged-in. */}
          <button type="button" onClick={() => setMobileOpen(v => !v)} className={`ciq-tab${mobileOpen ? ' active' : ''}`} aria-label="More" aria-expanded={mobileOpen} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="5" cy="12" r="1.7" fill="currentColor"/>
              <circle cx="12" cy="12" r="1.7" fill="currentColor"/>
              <circle cx="19" cy="12" r="1.7" fill="currentColor"/>
            </svg>
            <span className="ciq-tab-label">More</span>
            {mobileOpen && <span className="ciq-tab-dot"/>}
          </button>
        </nav>
      )}

      <div className="header-spacer"/>
    </>
  )
}
