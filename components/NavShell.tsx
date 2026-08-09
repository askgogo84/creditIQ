'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Header } from '@/components/Header'
import { AppRail } from '@/components/ciq/AppRail'
import { TabBar } from '@/components/ciq/TabBar'
import { reassertTheme } from '@/lib/store'

// NavShell — the nav chrome for the (shell) route group, gated on AUTH STATE
// (never on route):
//   - Signed out / loading -> today's <Header /> untouched. The (shell) group
//     holds public crawlable pages, so a visitor (and every crawler / SSR pass)
//     always gets the marketing Header, never a rail with a sign-out button.
//   - Signed in -> the app shell: a fixed left rail at >=900px, the existing ciq
//     TabBar below 900px (no drawer). Page content is offset to clear whichever
//     is showing.
// Pages inside (shell) render NO chrome of their own; this is the single source.
const SHELL_CSS = `
  .ciq-shell-tabbar { display: none; }
  .ciq-shell-main { min-height: 100vh; }
  @media (min-width: 900px) {
    .ciq-shell-main { margin-left: 248px; }
  }
  @media (max-width: 899px) {
    .ciq-shell-rail { display: none !important; }
    .ciq-shell-tabbar { display: block; }
    /* Header.css is loaded on every (shell) page (NavShell imports Header for the
       signed-out branch), and its marketing bottom-tab clearance —
       \`body > div, #__next > div { padding-bottom: 72px !important }\` — matches the
       shell's own body-level wrappers. On the fixed-TabBar wrapper (whose only child is
       position:fixed, so it should be 0-height) that !important padding becomes 72px of
       IN-FLOW height at the TOP of the column, pushing every signed-in page down 72px
       (the eyebrow sat at 96px instead of ~16px). Neutralise it on the wrapper; the app
       TabBar's real clearance is .ciq-shell-main's own padding-bottom below, made
       !important so it no longer loses to that leaked 72px. */
    .ciq-shell-tabbar { padding-bottom: 0 !important; }
    /* TabBar clearance for EVERY shell page, whatever its root element. Kept at
       the wrapper (not the page root) so div-root pages (/trip-planner, /profile)
       clear too — they get no element-level padding from globals.css:1417, which
       only targets body/main/.page-fade. NOTE: on main/.page-fade pages this
       STACKS with that globals 80px (~156px bottom whitespace, cosmetic). An
       attempt to scope this to the 769-899 band and lean on globals for <=768px
       was reverted: it left div-root pages depending on the body rule, whose
       computed value did not match its source and could not be verified on-device.
       Optimise only with real-session phone testing. */
    .ciq-shell-main { padding-bottom: 76px !important; }
  }
`

export function NavShell({ children }: { children: React.ReactNode }) {
  // undefined = auth not resolved yet (matches the server render -> Header).
  const [user, setUser] = useState<any>(undefined)
  // Mirror the wallet's ciq theme so the injected gold TabBar looks identical to
  // what /dashboard shows (same pattern the Header uses for its mobile TabBar).
  const [ciqTheme, setCiqTheme] = useState<'light' | 'dark'>('dark')

  // Re-assert the saved theme after hydration for every (shell) route. Signed-in
  // /card/[slug] no longer renders <Header>, so this — not the Header — is what
  // restores data-theme when React strips it on server-rendered routes. Routes
  // through lib/store's single writer (applyTheme); no-op if the attr survived.
  useEffect(() => { reassertTheme() }, [])

  useEffect(() => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    sb.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const sync = () => {
      try {
        const saved = window.localStorage.getItem('ciq-theme')
        if (saved === 'light' || saved === 'dark') setCiqTheme(saved)
      } catch {}
    }
    sync()
    window.addEventListener('ciq-theme-change', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('ciq-theme-change', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  // Loading or signed out -> today's Header, byte-for-byte unchanged.
  if (!user) {
    return (
      <>
        <Header />
        {children}
      </>
    )
  }

  // Signed in -> app shell.
  return (
    <>
      <style>{SHELL_CSS}</style>
      <AppRail />
      <div data-ciq data-theme={ciqTheme} className="ciq-shell-tabbar">
        <TabBar />
      </div>
      <div className="ciq-shell-main">{children}</div>
    </>
  )
}

export { Header }
