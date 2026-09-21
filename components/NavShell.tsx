'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Header } from '@/components/Header'
import { AppRail } from '@/components/ciq/AppRail'
import { AppTopbar } from '@/components/ciq/AppTopbar'
import { TabBar } from '@/components/ciq/TabBar'
import { reassertTheme, useTheme } from '@/lib/store'
import { usePathname } from 'next/navigation'

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
  .ciq-approved-shell,
  .ciq-app-topbar,
  .ciq-shell-rail {
    --bg: #f7f6f1;
    --bg-2: #f3f2ed;
    --surface: #ffffff;
    --surface-2: #f3f2ed;
    --paper: #ffffff;
    --paper-raised: #ffffff;
    --paper-soft: #f3f2ed;
    --ink: #1b1c18;
    --ink-1: #1b1c18;
    --ink-2: #494a43;
    --ink-3: #68675f;
    --ink-4: #8b887e;
    --ink-5: #b7b3a9;
    --muted: #68675f;
    --subtle: #8b887e;
    --line: #e4e1d9;
    --line-strong: #d2cec3;
    --line-soft: #efede7;
    --copper: #98702b;
    --copper-700: #76551f;
    --copper-600: #98702b;
    --copper-500: #bd913d;
    --copper-3: #d7b76f;
    --copper-200: #e3d1a8;
    --copper-100: #f3ead4;
    --amber-soft: #f4edd9;
    --green: #346b50;
    --green-soft: #e9f0e9;
    --blue-soft: #e9eeef;
    --navy: #1b1c18;
    --navy-900: #1b1c18;
    --navy-950: #151613;
    --font-display: "Iowan Old Style", Baskerville, "Times New Roman", Times, serif;
    --font-editorial: "Iowan Old Style", Baskerville, "Times New Roman", Times, serif;
    --font-serif: "Iowan Old Style", Baskerville, "Times New Roman", Times, serif;
    --font-interface: "Avenir Next", Avenir, "Helvetica Neue", var(--font-geist-sans), sans-serif;
    --font-body: "Avenir Next", Avenir, "Helvetica Neue", var(--font-geist-sans), sans-serif;
    --shadow-sm: 0 8px 22px rgba(37, 31, 19, .04);
    --shadow-md: 0 18px 46px rgba(37, 31, 19, .065);
  }
  .ciq-shell-main {
    min-width: 0;
    min-height: 100vh;
    background: var(--bg);
    color: var(--ink);
    font-family: var(--font-body);
  }
  @media (min-width: 900px) {
    .ciq-shell-main { margin-left: 238px; padding-top: 68px; }
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
       Optimise only with real-session phone testing.
       env(safe-area-inset-bottom): the fixed TabBar grows by the home-indicator inset
       on notched devices (its own padding uses the same env), so this floor must grow
       with it or ~34px of content hides behind the bar on-device. Desktop Chrome reports
       env()=0, so this is a no-op there and only takes effect on real hardware. NB the
       "112" is SectionShell's paddingBottom on the (wallet) layout — a real BOTTOM reserve
       specific to those pages — NOT this global floor, and unrelated to the .pt-28 (7rem)
       TOP padding that public marketing pages use. */
    .ciq-shell-main { padding-top: 0; padding-bottom: calc(82px + env(safe-area-inset-bottom)) !important; }

    /* Newer Claude subscription mockup owns its header inside each screen. */
    .ciq-app-topbar { display: none !important; }

    /* Legacy mobile topbar rules retained below only for desktop-resize safety. */
    .ciq-app-topbar.ciq-app-topbar-disabled {
      left: 0 !important;
      right: 0 !important;
      min-width: 0 !important;
      min-height: 58px !important;
      padding: 8px 12px !important;
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto !important;
      align-items: center !important;
      gap: 8px !important;
      background: rgba(247,246,241,.96) !important;
      border-bottom: 1px solid var(--line) !important;
      backdrop-filter: blur(18px) saturate(130%);
    }
    .ciq-app-crumb { display: none !important; }
    .ciq-app-search {
      min-width: 0 !important;
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
    }
    .ciq-app-search input { min-width: 0 !important; font-size: 14px !important; }
    .ciq-app-search kbd { display: none !important; }
    .ciq-app-actions { margin: 0 !important; gap: 6px !important; flex-shrink: 0 !important; }
    .ciq-app-theme-toggle { display: none !important; }
    .ciq-ask-cira {
      width: 40px !important;
      height: 40px !important;
      min-width: 40px !important;
      padding: 0 !important;
      border-radius: 12px !important;
      display: grid !important;
      place-items: center !important;
    }
    .ciq-ask-cira span { display: none !important; }
    .ciq-app-icon { width: 40px !important; height: 40px !important; border-radius: 12px !important; }

    .ciq-mobile-tabbar {
      position: fixed !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      z-index: 500 !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 8px 8px calc(8px + env(safe-area-inset-bottom)) !important;
      display: grid !important;
      grid-template-columns: repeat(5,minmax(0,1fr)) !important;
      background: rgba(250,248,242,.98) !important;
      border-top: 1px solid #ded8ce !important;
      box-shadow: 0 -10px 28px rgba(37,31,19,.05) !important;
      backdrop-filter: blur(18px);
    }
    .ciq-mobile-tabbar a {
      min-height: 52px;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 4px !important;
      border-radius: 12px;
      text-decoration: none !important;
      color: #9aa2af !important;
      font-size: 9px !important;
      font-weight: 650 !important;
    }
    .ciq-mobile-tabbar a.active { color: #142335 !important; }
    .ciq-mobile-tabbar a.active svg { color: #142335 !important; }
    .ciq-mobile-tabbar a:nth-child(3) svg {
      padding: 6px;
      width: 32px;
      height: 32px;
      border: 1.5px dashed #9aa2af;
      border-radius: 10px;
    }
  }

  @media (max-width: 420px) {
    .ciq-app-topbar { padding-left: 10px !important; padding-right: 10px !important; }
    .ciq-app-actions { gap: 4px !important; }
    .ciq-mobile-tab-label { font-size: 9px !important; }
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
  const pathname = usePathname()
  const setTheme = useTheme((state) => state.setTheme)
  // undefined = auth not resolved yet (matches the server render -> Header).
  const [user, setUser] = useState<any>(undefined)

  // Re-assert the saved theme after hydration for every (shell) route. Signed-in
  // /card/[slug] no longer renders <Header>, so this — not the Header — is what
  // restores data-theme when React strips it on server-rendered routes. Routes
  // through lib/store's single writer (applyTheme); no-op if the attr survived.
  useEffect(() => { reassertTheme() }, [])
  // The signed-in product now has one approved visual system: the Claude light
  // cockpit. Persisted dark-mode state from older builds must not leak into some
  // pages while newer pages stay light.
  useEffect(() => {
    if (user) setTheme('light')
  }, [user, setTheme])

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

  // Loading or signed out -> today's Header, byte-for-byte unchanged.
  if (!user) {
    return (
      <>
        <Header />
        <div className="ciq-shell-public">{children}</div>
      </>
    )
  }

  // Claude Cockpit owns its rail, command surface and responsive mobile navigation.
  // Keep the global app shell off /dashboard so the approved artifact is not restyled.
  if (pathname === '/dashboard') {
    return <div className="ciq-cockpit-route">{children}</div>
  }

  // Signed in -> shared app shell for the remaining app routes.
  return (
    <>
      <style>{SHELL_CSS}</style>
      <AppRail />
      <AppTopbar />
      <div className="ciq-shell-tabbar">
        <TabBar />
      </div>
      <div className="ciq-approved-shell ciq-v3-shell ciq-shell-main">{children}</div>
    </>
  )
}

export { Header }
