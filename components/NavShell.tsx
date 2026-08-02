'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Header } from '@/components/Header'
import { AppRail } from '@/components/ciq/AppRail'
import { TabBar } from '@/components/ciq/TabBar'
import { SectionTabs } from '@/components/ciq/SectionTabs'

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
    .ciq-shell-main { padding-bottom: 76px; }
  }
`

export function NavShell({ children }: { children: React.ReactNode }) {
  // undefined = auth not resolved yet (matches the server render -> Header).
  const [user, setUser] = useState<any>(undefined)
  // Mirror the wallet's ciq theme so the injected gold TabBar looks identical to
  // what /dashboard shows (same pattern the Header uses for its mobile TabBar).
  const [ciqTheme, setCiqTheme] = useState<'light' | 'dark'>('dark')

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
      <div className="ciq-shell-main">
        <SectionTabs />
        {children}
      </div>
    </>
  )
}

export { Header }
