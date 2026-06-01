'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Header } from '@/components/Header'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
      else setChecking(false)
    })
  }, [])

  const handleGoogleLogin = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://creditiq.app/auth/callback' },
    })
  }

  if (checking) {
    return (
      <>
        <Header />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08080E' }}>
          <div style={{ width: 32, height: 32, border: '2px solid #C9972E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 16px 80px', background: '#08080E' }}>
        <div style={{ width: '100%', maxWidth: 420, borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 24, background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#1B3A5C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="2" fill="#C9972E" opacity="0.9"/>
                <rect x="2" y="9" width="20" height="3" fill="#1B3A5C"/>
                <rect x="5" y="14" width="5" height="2" rx="1" fill="white" opacity="0.6"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>CreditIQ</div>
              <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Intelligence</div>
            </div>
          </div>

          {/* Heading */}
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Welcome back</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Sign in to see your card portfolio and points dashboard.</p>
          </div>

          {/* Google button */}
          <button onClick={handleGoogleLogin} disabled={loading}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, fontWeight: 600, fontSize: 15, background: '#fff', color: '#111', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <button disabled style={{ width: '100%', padding: '14px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, opacity: 0.4, cursor: 'not-allowed', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', background: 'transparent' }}>
            Email / mobile OTP login coming soon
          </button>

          <div style={{ borderRadius: 12, padding: 16, background: 'rgba(201,151,46,0.06)', border: '1px solid rgba(201,151,46,0.15)' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(201,151,46,0.8)', margin: '0 0 10px' }}>No account needed for:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Card comparison', 'Smart Match', 'Points optimizer', 'Calculators'].map(f => (
                <span key={f} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>{f}</span>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 12, textAlign: 'center', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
            By signing in you agree to our{' '}
            <a href="/privacy" style={{ color: '#C9972E', textDecoration: 'underline' }}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </>
  )
}
