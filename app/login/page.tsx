'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Combined Sign in / Sign up screen. Google is the ONLY path because that's the
// only provider the auth actually uses; we do not render email/password fields we
// can't honor. The Sign up / Sign in toggle is copy-only (both run the same Google
// OAuth) — honest, not a fake second flow.
//
// LAYOUT — two forms keyed off 748px:
//   >=748px: full-bleed licensed photo behind one translucent glass card, dark
//            scrim over the whole viewport (unchanged from the prior build).
//   <748px : the loop is NOT a background. It's a 36dvh panel pinned to the top
//            of the viewport (its own 5:4 mobile crop, cover). Below it the
//            wordmark, eyebrow, glass card and toggle sit on the flat #080807
//            base, vertically centred in the remaining space. The panel carries a
//            light top-down scrim plus a bottom fade into the base (no hard seam).
//
// The structural geometry lives in the scoped <style> block below rather than in
// Tailwind `max-[]:` variants: React can hoist a <style> tag anywhere in the head,
// so to stay immune to cascade order the block OWNS these properties outright (no
// Tailwind utility competes for the same one). It also lets the panel height use
// the `height:36vh; height:36dvh;` fallback — mobile browsers resolve vh against
// the LARGEST viewport, so with the address bar showing, 36vh renders taller than
// 36% of the visible area; 36dvh is correct where supported, 36vh covers the rest.

// Text sits over media (mobile panel + desktop full-bleed), not the themed page
// ground, so colour is fixed (this screen ignores the light/dark toggle). The
// near-white inks are the codebase's established "type over media" values, lifted
// from `.cinematic` in globals.css. The base is the design-language true-black.
//
// --copper-4 is pinned here for the same reason .cinematic locally pins --copper-3:
// this is a DARK surface in both themes, so it must not inherit the theme token.
// Left to inherit, --copper-4 flips from the light value #F2C658 (bright gold) to
// #6B4A2A (dark brown) under [data-theme="dark"] — which is what dark-theme users
// were actually getting on the eyebrow / toggle (~2.5:1, an AA fail). Pinned to the
// bright gold, both render #F2C658 always.
const AUTH_VARS = {
  '--auth-ink': '#FDFBF7',   // headline / wordmark
  '--auth-ink-2': '#F1EDE4', // body copy
  '--auth-dim': '#CFC9BC',   // captions / terms
  '--copper-4': '#F2C658',   // dark-ground gold accent — eyebrow + mode toggle
} as React.CSSProperties;

export default function LoginPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  // Under prefers-reduced-motion we render the poster still alone and never mount
  // the <video>. Defaults to false so SSR and first client paint agree (matchMedia
  // is client-only); the effect corrects it after mount.
  const [reduceMotion, setReduceMotion] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Mobile (<748px) vs desktop is resolved in JS, same pattern as reduceMotion, so
  // we render only ONE set of <source> tags and the browser fetches only that clip
  // (no `media` attribute on <source>, which fetches unpredictably). `ready` gates
  // the <source> children: on first paint the <video> has NO sources, so a phone
  // never starts downloading the ~503KB desktop mp4 before the effect swaps it —
  // the poster covers the gap. Once `ready` flips, the video is re-keyed so it
  // remounts with the correct sources present and autoplays. Boundary is 747.98px:
  // CSS max-width is inclusive, so this keeps exactly 748px on the desktop form and
  // keeps the JS and the <style> media query in agreement.
  const [isMobile, setIsMobile] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 747.98px)')
    setIsMobile(mq.matches)
    setReady(true)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Where to land after login. Read ?next=/flights (etc) at runtime and only ever
  // honor same-origin relative paths, so this can't become an open redirect.
  const nextPath = () => {
    const raw = new URLSearchParams(window.location.search).get('next')
    return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard'
  }

  // Bounce already-signed-in users to their destination; otherwise show the
  // sign-in UI. `checking` gates the WHOLE page (return null below), so it must
  // always resolve — getSession() can reject or hang (e.g. Supabase Web Locks
  // contention) and has no built-in timeout. If we only cleared `checking` in
  // the success branch, a stalled promise would leave the page blank forever.
  // So we also clear on error and on a short timeout: worst case the user sees
  // the sign-in form, never a blank screen.
  useEffect(() => {
    let settled = false
    supabase.auth.getSession().then(({ data: { session } }) => {
      settled = true
      if (session) router.replace(nextPath())
      else setChecking(false)
    }).catch(() => { settled = true; setChecking(false) })
    const t = setTimeout(() => { if (!settled) setChecking(false) }, 2000)
    return () => clearTimeout(t)
  }, [])

  const handleGoogleLogin = async () => {
    setLoading(true)
    // Build redirectTo from window.location.origin at runtime: localhost stays
    // on localhost, prod stays on prod. Carry `next` so we return to the page
    // the user signed in from (e.g. /flights), not the homepage.
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath())}`,
      },
    })
  }

  if (checking) return null

  const isSignup = mode === 'signup'
  const posterSrc = isMobile ? '/images/auth-bg-mobile-poster.jpg' : '/images/auth-bg-poster.jpg'

  return (
    <main style={AUTH_VARS} className="auth-root">
      {/* Scoped structural CSS — see the header comment for why geometry lives here
          and not in Tailwind variants. Desktop values are encoded identically to
          the prior build; the @media block is the only place the mobile form
          diverges, so >=748px is unchanged. */}
      <style>{`
        .auth-root {
          position: relative;
          min-height: 100dvh;
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 1.25rem;
        }
        .auth-media { position: absolute; inset: 0; z-index: 0; }
        .auth-scrim-desktop { position: absolute; inset: 0; z-index: 0; }
        .auth-panel-scrim, .auth-panel-fade { display: none; }
        .auth-content {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        @media (max-width: 747.98px) {
          .auth-root {
            flex-direction: column;
            justify-content: flex-start;
            padding: 0;
            overflow: visible; /* content taller than the viewport scrolls, never clips */
            /* The base is the design-language true-black, set EXPLICITLY: this page
               defaults to the light theme and its body is warm ivory. On desktop the
               full-bleed media hides the body, but the mobile form exposes it below
               the panel, so the base must be pinned here or the near-white type lands
               on ivory (and the panel fade would hit a hard seam). */
            background: #080807;
          }
          .auth-media {
            position: relative;
            inset: auto;
            width: 100%;
            height: 36vh;
            height: 36dvh;
            flex-shrink: 0;
          }
          .auth-scrim-desktop { display: none; }
          .auth-panel-scrim {
            display: block;
            position: absolute;
            inset: 0;
          }
          .auth-panel-fade {
            display: block;
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            height: 15%;
          }
          .auth-content {
            flex: 1 1 auto;
            justify-content: center;
            padding: 2rem 1.25rem;
            box-sizing: border-box;
          }
        }
      `}</style>

      {/* Media — desktop: full-bleed background. Mobile: the 36dvh top panel.
          Under prefers-reduced-motion we never mount the <video> and show the
          poster alone (mobile poster below 748px, desktop poster above). */}
      <div className="auth-media">
        {reduceMotion ? (
          <img
            aria-hidden
            alt=""
            src={posterSrc}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <video
            key={`${ready}-${isMobile}`}
            aria-hidden
            autoPlay
            muted
            loop
            playsInline
            poster={posterSrc}
            className="absolute inset-0 h-full w-full object-cover"
          >
            {ready &&
              (isMobile ? (
                <>
                  <source src="/videos/auth-bg-mobile.webm" type="video/webm" />
                  <source src="/videos/auth-bg-mobile.mp4" type="video/mp4" />
                </>
              ) : (
                <>
                  <source src="/videos/auth-bg.webm" type="video/webm" />
                  <source src="/videos/auth-bg.mp4" type="video/mp4" />
                </>
              ))}
          </video>
        )}

        {/* Mobile-only: light top-down scrim over the panel (its own values, NOT
            the desktop scrim) keeps the wordmark region and the fade clean. */}
        <div
          aria-hidden
          className="auth-panel-scrim"
          style={{
            background:
              'linear-gradient(180deg, rgba(8,8,7,0.30) 0%, rgba(8,8,7,0.75) 100%)',
          }}
        />
        {/* Mobile-only: dissolve the bottom ~15% of the panel into #080807 so
            there's no hard horizontal seam between panel and base. */}
        <div
          aria-hidden
          className="auth-panel-fade"
          style={{
            background: 'linear-gradient(180deg, rgba(8,8,7,0) 0%, #080807 100%)',
          }}
        />
      </div>

      {/* Desktop-only full-bleed scrim — carries white type over the photo's
          brightest patch; hidden below 748px where type sits on the flat base.
          Base colour is the design-language true-black #080807. */}
      <div
        aria-hidden
        className="auth-scrim-desktop"
        style={{
          background:
            'linear-gradient(180deg, rgba(8,8,7,0.82) 0%, rgba(8,8,7,0.72) 34%, rgba(8,8,7,0.76) 66%, rgba(8,8,7,0.88) 100%)',
        }}
      />

      {/* Content column — 375px-first. */}
      <div className="auth-content">
        {/* Wordmark */}
        <Link
          href="/"
          className="text-2xl font-semibold tracking-tight"
          style={{ color: 'var(--auth-ink)' }}
        >
          CreditIQ
        </Link>

        {/* Eyebrow — switches between the two modes. */}
        <p
          className="mt-5 text-[11px] font-medium uppercase"
          style={{ color: 'var(--copper-4)', letterSpacing: '0.22em' }}
        >
          {isSignup ? 'Create your account' : 'Welcome back'}
        </p>

        {/* Glass card */}
        <div
          className="mt-5 w-full rounded-[22px] p-6 sm:p-7 text-left"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.16)',
            backdropFilter: 'blur(18px) saturate(140%)',
            WebkitBackdropFilter: 'blur(18px) saturate(140%)',
            boxShadow: '0 30px 70px -30px rgba(0,0,0,0.75)',
          }}
        >
          <h1
            className="text-[22px] font-semibold leading-tight"
            style={{ color: 'var(--auth-ink)' }}
          >
            {isSignup ? 'Start reading your real rewards' : 'Sign back in'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--auth-ink-2)' }}>
            {isSignup
              ? 'One tap with Google and your card portfolio, verified from statements, is ready.'
              : 'Continue with Google to pick up where you left off.'}
          </p>

          {/* Primary (and only) path — Google OAuth. Copper CTA. */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn btn-copper mt-6 w-full disabled:opacity-60"
            style={{ width: '100%' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Connecting…' : 'Continue with Google'}
          </button>

          <p className="mt-5 text-xs leading-relaxed" style={{ color: 'var(--auth-dim)' }}>
            By continuing you agree to our{' '}
            <a href="/terms" className="underline underline-offset-2" style={{ color: 'var(--auth-ink-2)' }}>Terms</a>
            {' '}and{' '}
            <a href="/privacy" className="underline underline-offset-2" style={{ color: 'var(--auth-ink-2)' }}>Privacy Policy</a>.
          </p>
        </div>

        {/* Mode toggle */}
        <p className="mt-6 text-sm" style={{ color: 'var(--auth-dim)' }}>
          {isSignup ? 'Already have an account?' : 'New to CreditIQ?'}{' '}
          <button
            type="button"
            onClick={() => setMode(isSignup ? 'signin' : 'signup')}
            className="font-medium underline underline-offset-4"
            style={{ color: 'var(--copper-4)' }}
          >
            {isSignup ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </div>
    </main>
  )
}
