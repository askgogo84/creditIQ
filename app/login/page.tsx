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
// BACKGROUND — /video/signin-bg.{mp4,webm} + signin-bg-poster.jpg (1024×576, 8.5s
// crossfade loop, no watermark). Assets live in /video/ SINGULAR (see the "video
// folder singular vs plural" project memory). The clip is BRIGHT and busy (dense
// foliage), unlike the dark pagoda it replaces, so the card carries a STRONGER scrim
// than before — tuned so the card text and the Google button clear WCAG AA over the
// brightest lit foliage.
//   ⚠ MP4 SOURCE FIRST here (reverses our usual webm-first order): dense foliage
//     compresses badly in VP9, so the webm (1.6MB) is heavier than the mp4 (993KB).
//
// MEDIA GATE — poster-first, always. The poster renders on the server + first client
// paint. The clip is fetched ONLY on desktop (≥768px) with motion allowed: the <video>
// is not mounted at all otherwise, so a phone or a reduced-motion user never downloads
// it (mobile is poster-only — the separate auth-bg-mobile clip is dropped; at 573KB it
// broke our mobile-first rule on the critical path into the app). The poster/OAuth
// button render immediately; the background clip can never delay the form.
//
// LAYOUT — two forms keyed off 748px:
//   >=748px: full-bleed background behind one translucent glass card, dark scrim over
//            the whole viewport.
//   <748px : SAME full-bleed background behind the whole page (realise.club pattern) —
//            no separate panel. The wordmark, eyebrow and glass card sit centred over
//            the media; the foliage reads around and through the translucent card. The
//            toggle ("Already have an account? Sign in") lives INSIDE the card as its
//            last element so it can never fall below the fold. A localised mobile scrim
//            darkens only the central vertical band behind the near-full-width card
//            (top + bottom stay vivid) so all five inks clear WCAG AA against the
//            poster's brightest lit foliage. The stack (~450px) fits every target
//            height centred with no scroll (375x650 → ~121px spare).
//
// The structural geometry lives in the scoped <style> block below rather than in
// Tailwind `max-[]:` variants: React can hoist a <style> tag anywhere in the head,
// so to stay immune to cascade order the block OWNS these properties outright (no
// Tailwind utility competes for the same one).

// Text sits over the full-bleed media at both breakpoints, not the themed page
// ground, so colour is fixed (this screen ignores the light/dark toggle). The
// near-white inks are the codebase's established "type over media" values, lifted
// from `.cinematic` in globals.css. The base is the design-language true-black.
//
// --copper-4 is pinned here for the same reason .cinematic locally pins --copper-3:
// this is a DARK surface in both themes (the scrim keeps it dark even over the bright
// clip), so it must not inherit the theme token. Left to inherit, --copper-4 flips
// from the light value #F2C658 (bright gold) to #6B4A2A (dark brown) under
// [data-theme="dark"] — which is what dark-theme users were actually getting on the
// eyebrow / toggle (~2.5:1, an AA fail). Pinned to the bright gold, both render
// #F2C658 always.
const AUTH_VARS = {
  '--auth-ink': '#FDFBF7',   // headline / wordmark
  '--auth-ink-2': '#F1EDE4', // body copy
  '--auth-dim': '#CFC9BC',   // captions / terms
  '--copper-4': '#F2C658',   // dark-ground gold accent — eyebrow + mode toggle
} as React.CSSProperties;

// Single poster + clip for every breakpoint (no mobile-specific variant now). In
// /video/ SINGULAR.
const POSTER = '/video/signin-bg-poster.jpg';

export default function LoginPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')

  // Poster-first media gate: mount the <video> ONLY on desktop (≥768px) with motion
  // allowed. Defaults to false so SSR and first client paint agree (matchMedia is
  // client-only) and the poster is what everyone sees first — a phone or a
  // reduced-motion user never mounts the <video>, so the clip is never fetched there.
  // The effect flips it true after mount on qualifying desktops; the poster covers the
  // swap-in gap. This background can never delay the form or the OAuth button.
  const [showVideo, setShowVideo] = useState(false)
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)')
    const motionOk = window.matchMedia('(prefers-reduced-motion: no-preference)')
    const update = () => setShowVideo(desktop.matches && motionOk.matches)
    update()
    desktop.addEventListener('change', update)
    motionOk.addEventListener('change', update)
    return () => {
      desktop.removeEventListener('change', update)
      motionOk.removeEventListener('change', update)
    }
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
        .auth-scrim-mobile { display: none; position: absolute; inset: 0; z-index: 0; }
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
          /* Full-bleed media behind the WHOLE page (realise.club pattern) — no
             separate panel. .auth-media keeps the default position:absolute /
             inset:0 so it fills the viewport; the translucent card floats over
             it centred, and the foliage reads around and through it. The panel,
             its top-down scrim and its bottom fade are all gone. The whole
             wordmark→sign-in stack is ~450px, so it fits every target height
             (375x650 → 121px spare) centred with no scroll. The desktop scrim
             is swapped out for .auth-scrim-mobile, which darkens only a central
             vertical band behind the near-full-width card (top + bottom stay
             unscrimmed and vivid) so the five inks clear AA against the poster's
             brightest lit foliage. Card padding and the >=748px rules are
             untouched. */
          .auth-scrim-desktop { display: none; }
          .auth-scrim-mobile { display: block; }
          /* /login has no bottom tab bar, but a global (<=768px) rule forces
             padding-bottom:80px !important on body & main for tab-bar clearance.
             On this full-height, no-scroll screen that only injects ~80px of
             phantom scroll (body wraps the 100dvh main + its own 80px) and skews
             the vertical centring. Neutralise it for this route only — the rule
             lives in a <style> that mounts solely on /login, so nothing else is
             affected. Symmetric padding keeps the stack optically centred. */
          .auth-root { padding: 2.5rem 1.25rem !important; }
          body { padding-bottom: 0 !important; }
        }
      `}</style>

      {/* Media — full-bleed background at every breakpoint. The poster renders
          always (server + first paint) and IS the media on mobile (<768px) and
          under reduced motion. The <video> mounts only on desktop with motion
          allowed (showVideo), layered over the poster; MP4 source is FIRST here
          because the foliage webm is heavier than the mp4. */}
      <div className="auth-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          alt=""
          src={POSTER}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {showVideo && (
          <video
            aria-hidden
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={POSTER}
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/video/signin-bg.mp4" type="video/mp4" />
            <source src="/video/signin-bg.webm" type="video/webm" />
          </video>
        )}
      </div>

      {/* Desktop-only full-bleed scrim — carries white type over the clip's
          brightest patch; hidden below 748px where the mobile band scrim takes
          over. STRONGER than the prior (dark-pagoda) build because this clip is
          bright and busy: a >=0.84 floor across the whole height so the blurred
          glass card resolves dark enough for the white inks and the Google button.
          Base colour is the design-language true-black #080807. */}
      <div
        aria-hidden
        className="auth-scrim-desktop"
        style={{
          background:
            'linear-gradient(180deg, rgba(8,8,7,0.90) 0%, rgba(8,8,7,0.84) 32%, rgba(8,8,7,0.86) 68%, rgba(8,8,7,0.93) 100%)',
        }}
      />

      {/* Mobile-only scrim (<748px) — a localised vertical band, darkest through
          the centre where the near-full-width card sits, fading toward the top and
          bottom so the foliage stays vivid around the card. STRONGER than the prior
          build (0.72→0.82 through the card band) because this poster is brighter;
          tuned so all five inks clear WCAG AA against the poster's brightest lit
          foliage. */}
      <div
        aria-hidden
        className="auth-scrim-mobile"
        style={{
          background:
            'linear-gradient(180deg, rgba(8,8,7,0.28) 0%, rgba(8,8,7,0.70) 20%, rgba(8,8,7,0.82) 32%, rgba(8,8,7,0.82) 84%, rgba(8,8,7,0.28) 100%)',
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

          {/* Mode toggle — now the LAST element INSIDE the card (was a sibling
              below it). A 1px hairline (the card's own border colour) separates
              it from the terms line. Living inside the card guarantees the
              returning-user path can never fall below the fold. */}
          <div
            className="mt-5 pt-5 text-sm"
            style={{ borderTop: '1px solid rgba(255,255,255,0.16)', color: 'var(--auth-dim)' }}
          >
            {isSignup ? 'Already have an account?' : 'New to CreditIQ?'}{' '}
            <button
              type="button"
              onClick={() => setMode(isSignup ? 'signin' : 'signup')}
              className="font-medium underline underline-offset-4"
              style={{ color: 'var(--copper-4)' }}
            >
              {isSignup ? 'Sign in' : 'Create an account'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
