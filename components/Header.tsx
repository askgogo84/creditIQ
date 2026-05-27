'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

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

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

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

  useEffect(() => { setMobileOpen(false); setAiOpen(false) }, [pathname])

  const signOut = async () => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.auth.signOut()
    router.push('/')
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/smart-match') return AI_TOOLS.some(t => pathname.startsWith(t.href))
    return pathname.startsWith(href)
  }

  return (
    <>
      <style>{`
        .ciq-header { position: fixed; top: 0; left: 0; right: 0; z-index: 200; transition: box-shadow 0.2s; }
        .ciq-header.scrolled { box-shadow: 0 2px 20px rgba(20,41,80,0.08); }
        .ciq-inner { max-width: 1200px; margin: 0 auto; padding: 0 20px; height: 60px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .ciq-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; flex-shrink: 0; }
        .ciq-logo-icon { width: 36px; height: 36px; background: var(--navy, #142950); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .ciq-logo-text { font-size: 18px; font-weight: 800; color: var(--ink,#142950); letter-spacing: -0.5px; }
        .ciq-logo-sub { font-size: 9px; font-weight: 600; color: var(--ink-3,#8b949e); letter-spacing: 2px; text-transform: uppercase; margin-top: -2px; }
        .ciq-nav { display: flex; align-items: center; gap: 2px; background: var(--bg-2,#EFE7D8); border-radius: 100px; padding: 4px; }
        .ciq-nav-item { padding: 7px 18px; border-radius: 100px; font-size: 14px; font-weight: 600; color: var(--ink-3,#5A6A8A); text-decoration: none; cursor: pointer; background: none; border: none; transition: all 0.15s; white-space: nowrap; }
        .ciq-nav-item:hover { color: var(--ink,#142950); background: rgba(255,255,255,0.6); }
        .ciq-nav-item.active { background: var(--surface,#fff); color: var(--ink,#142950); box-shadow: 0 1px 4px rgba(20,41,80,0.12); }
        .ciq-right { display: flex; align-items: center; gap: 10px; }
        .ciq-theme-btn { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--line,rgba(20,41,80,0.1)); background: var(--surface,#fff); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .ciq-cta { padding: 9px 20px; background: var(--navy,#142950); color: #fff; border: none; border-radius: 100px; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; white-space: nowrap; display: flex; align-items: center; gap: 6px; transition: opacity 0.15s; }
        .ciq-cta:hover { opacity: 0.88; }
        .ciq-hamburger { display: none; flex-direction: column; gap: 5px; padding: 8px; background: none; border: none; cursor: pointer; }
        .ciq-bar { width: 22px; height: 2px; background: var(--ink,#142950); border-radius: 2px; display: block; transition: all 0.2s; }

        /* AI Tools mega dropdown */
        .ciq-ai-dropdown { position: absolute; top: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: var(--surface,#fff); border: 1px solid var(--line,rgba(20,41,80,0.08)); border-radius: 20px; box-shadow: 0 12px 40px rgba(0,0,0,0.12); padding: 8px; width: 280px; display: flex; flex-direction: column; gap: 2px; z-index: 300; }
        .ciq-ai-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; text-decoration: none; transition: background 0.1s; }
        .ciq-ai-item:hover { background: var(--bg-2,#EFE7D8); }
        .ciq-ai-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--bg-2,#EFE7D8); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .ciq-ai-label { font-size: 13px; font-weight: 600; color: var(--ink,#142950); }
        .ciq-badge { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 100px; background: #C9972E; color: #fff; margin-left: 4px; vertical-align: middle; }
        .ciq-badge.new { background: #2E7D32; }
        .ciq-badge.beta { background: #1565C0; }
        .ciq-badge.popular { background: #C9972E; }

        /* Mobile menu */
        .ciq-mobile-menu { position: absolute; top: 100%; left: 0; right: 0; background: var(--surface,#fff); border-bottom: 1px solid var(--line,rgba(20,41,80,0.08)); box-shadow: 0 8px 32px rgba(0,0,0,0.1); padding: 12px 20px 20px; max-height: 80vh; overflow-y: auto; }
        .ciq-mobile-section { font-size: 10px; font-weight: 700; color: #C9972E; letter-spacing: 1.5px; text-transform: uppercase; padding: 12px 0 6px; }
        .ciq-mobile-link { display: flex; align-items: center; gap: 10px; padding: 11px 0; font-size: 15px; font-weight: 600; color: var(--ink,#142950); text-decoration: none; border-bottom: 1px solid var(--line-soft,rgba(20,41,80,0.04)); }

        /* Bottom tab bar */
        .ciq-tab-bar { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: var(--surface,#fff); border-top: 1px solid var(--line,rgba(20,41,80,0.08)); z-index: 200; padding-bottom: env(safe-area-inset-bottom,0px); }
        .ciq-tab { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 7px 0 4px; flex: 1; text-decoration: none; color: #94a3b8; transition: color 0.15s; }
        .ciq-tab.active { color: #C9972E; }
        .ciq-tab-label { font-size: 9px; font-weight: 500; letter-spacing: 0.2px; }
        .ciq-tab.active .ciq-tab-label { font-weight: 700; }
        .ciq-tab-dot { width: 3px; height: 3px; border-radius: 50%; background: #C9972E; }

        @media (max-width: 768px) {
          .ciq-nav { display: none !important; }
          .ciq-cta { display: none !important; }
          .ciq-theme-desktop { display: none !important; }
          .ciq-hamburger { display: flex !important; }
          .ciq-tab-bar { display: flex !important; }
          main, .main-content, body > div { padding-bottom: 72px !important; }
        }
        @media (min-width: 769px) {
          .ciq-hamburger { display: none !important; }
          .ciq-tab-bar { display: none !important; }
          .ciq-mobile-menu { display: none !important; }
        }
        .header-spacer { height: 60px; }
      `}</style>

      <header className={`ciq-header${scrolled ? ' scrolled' : ''}`} style={{ background: 'var(--surface,#fff)' }}>
        <div className="ciq-inner">

          {/* Logo */}
          <Link href="/" className="ciq-logo">
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

          {/* Desktop pill nav */}
          <nav className="ciq-nav" style={{ position: 'relative' }}>
            <Link href="/" className={`ciq-nav-item${isActive('/') ? ' active' : ''}`}>Discover</Link>

            <div style={{ position: 'relative' }} onMouseEnter={() => setCardsOpen(true)} onMouseLeave={() => setCardsOpen(false)}>
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
                    { label: 'Compare', href: '/compare', icon: '⚖', desc: 'Side by side comparison' },
                    { label: 'Best Travel Cards', href: '/best-cards/travel', icon: '✈', desc: 'Top cards for travel' },
                    { label: 'Best Cashback', href: '/best-cards/cashback', icon: '💰', desc: 'Maximum cashback cards' },
                    { label: 'UAE Cards', href: '/uae', icon: '🇦🇪', desc: 'Cards for UAE residents' },
                  ].map(item => (
                    <Link key={item.href} href={item.href} className="ciq-ai-item">
                      <div className="ciq-ai-icon">{item.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div className="ciq-ai-label">{item.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)', marginTop: 1 }}>{item.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }} onMouseEnter={() => setAiOpen(true)} onMouseLeave={() => setAiOpen(false)}>
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
                        <div style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)', marginTop: 1 }}>{tool.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }} onMouseEnter={() => setTravelOpen(true)} onMouseLeave={() => setTravelOpen(false)}>
              <button className={`ciq-nav-item${isActive('/travel') ? ' active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                Travel
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5, transform: travelOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              {travelOpen && (
                <div className="ciq-ai-dropdown" style={{ width: 220 }}>
                  {[
                    { label: 'Trip Planner', href: '/trip-planner', icon: '🗺', desc: 'Plan with your points' },
                    { label: 'Travel AI', href: '/travel', icon: '✈', desc: 'Chat about miles + transfers' },
                    { label: 'Lounge Tracker', href: '/lounge-tracker', icon: '🛋', desc: 'Never get turned away' },
                  ].map(item => (
                    <Link key={item.href} href={item.href} className="ciq-ai-item">
                      <div className="ciq-ai-icon">{item.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div className="ciq-ai-label">{item.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)', marginTop: 1 }}>{item.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href={user ? '/dashboard' : '/login'} className={`ciq-nav-item${isActive('/dashboard') ? ' active' : ''}`}>My Wallet</Link>

          {/* Right side */}
          <div className="ciq-right">
            {/* Theme toggle desktop */}
            <button className="ciq-theme-btn ciq-theme-desktop" onClick={() => {
              const html = document.documentElement
              html.classList.toggle('dark')
              localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light')
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            </button>

            {user ? (
              <>
                <button onClick={signOut} className="ciq-theme-desktop" style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#C9972E', border: 'none', borderRadius: 100, cursor: 'pointer' }}>Sign Out</button>
              </>
            ) : (
              <Link href="/login" className="ciq-theme-desktop" style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#C9972E', textDecoration: 'none', borderRadius: 100 }}>Sign In</Link>
            )}

            <Link href="/smart-match" className="ciq-cta">
              Find my card
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>

            {/* Hamburger mobile */}
            <button className="ciq-hamburger" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
              <span className="ciq-bar" style={{ transform: mobileOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }}/>
              <span className="ciq-bar" style={{ opacity: mobileOpen ? 0 : 1 }}/>
              <span className="ciq-bar" style={{ transform: mobileOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }}/>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="ciq-mobile-menu">
            <div className="ciq-mobile-section">Browse</div>
            {[{label:'All Cards',href:'/cards',icon:'ðŸ’³'},{label:'Compare',href:'/compare',icon:'='},{label:'UAE Cards',href:'/uae',icon:'ðŸ‡¦ðŸ‡ª'}].map(i=>(
              <Link key={i.href} href={i.href} className="ciq-mobile-link"><span style={{fontSize:20,width:28,textAlign:'center'}}>{i.icon}</span>{i.label}</Link>
            ))}
            <div className="ciq-mobile-section">AI Tools</div>
            {AI_TOOLS.map(i=>(
              <Link key={i.href} href={i.href} className="ciq-mobile-link"><span style={{fontSize:18,width:28,textAlign:'center'}}>{i.icon}</span>{i.label}{i.badge&&<span className={`ciq-badge ${i.badge.toLowerCase()}`} style={{marginLeft:8}}>{i.badge}</span>}</Link>
            ))}
            <div style={{marginTop:16,paddingTop:16,borderTop:'1px solid var(--line,rgba(20,41,80,0.08))'}}>
              {user
                ? <button onClick={signOut} style={{width:'100%',padding:'13px',background:'#C9972E',color:'#0a0a0a',border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer'}}>Sign Out</button>
                : <Link href="/login" style={{display:'block',textAlign:'center',padding:'13px',background:'#142950',color:'#fff',borderRadius:12,fontSize:15,fontWeight:700,textDecoration:'none'}}>Sign In</Link>
              }
            </div>
          </div>
        )}
      </header>

      {/* Bottom tab bar */}
      <nav className="ciq-tab-bar">
        {([
          { label: 'Home', href: '/', d: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10' },
          { label: 'Cards', href: '/cards', d: 'M1 4h22v16a2 2 0 01-2 2H3a2 2 0 01-2-2V4z M1 10h22' },
          { label: 'Trip', href: '/trip-planner', d: 'M22 2L11 13 M22 2L15 22 11 13 2 9l20-7z' },
          { label: 'AI', href: '/smart-match', d: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
          { label: 'My Cards', href: user ? '/dashboard' : '/login', d: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 3a4 4 0 100 8 4 4 0 000-8z' },
        ] as {label:string;href:string;d:string}[]).map(tab => {
          const active = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))
          const paths = tab.d.split(' M').map((p,i) => i===0 ? p : 'M'+p)
          return (
            <Link key={tab.href} href={tab.href} className={`ciq-tab${active?' active':''}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {paths.map((p,i) => <path key={i} d={p}/>)}
              </svg>
              <span className="ciq-tab-label">{tab.label}</span>
              {active && <span className="ciq-tab-dot"/>}
            </Link>
          )
        })}
      </nav>

      {/* Chat widget above tab bar */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="position: fixed"][style*="bottom: 24"] { bottom: 80px !important; }
          div[style*="position: fixed"][style*="bottom: 92"] { bottom: 148px !important; }
        }
      `}</style>

      <div className="header-spacer"/>
    </>
  )
}



