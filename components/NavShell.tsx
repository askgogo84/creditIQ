'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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

// useLayoutEffect on the client (runs before the browser paints), useEffect on the
// server (React skips layout effects during SSR and would warn). Only ever used for
// the client-only cookie hint below.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

// Presence-only check for the Supabase auth cookie (@supabase/ssr names it
// sb-<ref>-auth-token, sometimes chunked .0/.1). We only need "is a session cookie
// present" as a fast signed-in hint; getSession() below stays the source of truth.
function hasSupabaseAuthCookie(): boolean {
  if (typeof document === 'undefined') return false
  return /(?:^|;\s*)sb-[^=;]*-auth-token(?:\.\d+)?=/.test(document.cookie)
}

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

  // Flash-mitigation timestamp; set at hydration by the layout effect below so both
  // the cookie-hint flip and the getSession flip can be measured from the same t0.
  const flashT0 = useRef<number>(0)

  // MITIGATION, NOT A FIX. On statically-cached (shell) pages (e.g. /transfer-partners)
  // the server cannot know the visitor, so SSR + the first client render are the
  // signed-out Header — a signed-in user sees it flash. Removing the flash entirely
  // would need dynamic rendering for the whole group (regressing the static/ISR public
  // catalogue), so instead we SHORTEN it: read the Supabase auth cookie synchronously in
  // a LAYOUT effect (post-hydration, before paint where the platform allows) and flip to
  // the shell immediately, instead of waiting for the async getSession() round-trip below.
  // The read is NOT in the render body: the first client render MUST equal SSR
  // (user===undefined -> Header) or we trip the documented React #425 -> #423 path that
  // strips data-theme from <html>. A stale cookie self-corrects when getSession resolves.
  useIsoLayoutEffect(() => {
    flashT0.current = performance.now()
    if (hasSupabaseAuthCookie()) {
      setUser((prev: any) => (prev === undefined ? { __authHint: true } : prev))
      if (typeof window !== 'undefined' && window.location.search.includes('flashdebug')) {
        // eslint-disable-next-line no-console
        console.log('[navshell-flash] cookie-hint flip @', Math.round(performance.now() - flashT0.current), 'ms')
      }
    }
  }, [])

  useEffect(() => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (typeof window !== 'undefined' && window.location.search.includes('flashdebug')) {
        // eslint-disable-next-line no-console
        console.log('[navshell-flash] getSession resolved @', Math.round(performance.now() - flashT0.current), 'ms ->', session?.user ? 'signed-in' : 'signed-out')
      }
    })
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
