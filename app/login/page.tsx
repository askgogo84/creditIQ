'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
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
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg, #08080E)' }}>
        <div className="w-8 h-8 border-2 border-[#C9972E] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg, #08080E)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 flex flex-col gap-6"
        style={{
          background: 'var(--card, #111118)',
          border: '1px solid var(--border, rgba(255,255,255,0.08))',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1B3A5C] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="5" width="20" height="14" rx="2" fill="#C9972E" opacity="0.9"/>
              <rect x="2" y="9" width="20" height="3" fill="#1B3A5C"/>
              <rect x="5" y="14" width="5" height="2" rx="1" fill="white" opacity="0.6"/>
            </svg>
          </div>
          <div>
            <div className="font-bold text-lg" style={{ color: 'var(--text, #fff)', fontFamily: 'Syne, sans-serif' }}>CreditIQ</div>
            <div className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted, rgba(255,255,255,0.4))' }}>Intelligence</div>
          </div>
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text, #fff)', fontFamily: 'Syne, sans-serif' }}>
            Welcome back
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted, rgba(255,255,255,0.5))' }}>
            Sign in to see your card portfolio and points dashboard.
          </p>
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium transition-all hover:opacity-90 disabled:opacity-60"
          style={{ background: '#fff', color: '#111' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'var(--border, rgba(255,255,255,0.08))' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted, rgba(255,255,255,0.3))' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border, rgba(255,255,255,0.08))' }} />
        </div>

        {/* Email coming soon */}
        <button
          disabled
          className="w-full py-3 px-4 rounded-xl text-sm font-medium opacity-40 cursor-not-allowed"
          style={{ border: '1px solid var(--border, rgba(255,255,255,0.1))', color: 'var(--text, #fff)' }}
        >
          Email / mobile OTP login coming soon
        </button>

        {/* No account needed */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(201,151,46,0.06)', border: '1px solid rgba(201,151,46,0.15)' }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: 'rgba(201,151,46,0.8)' }}>
            No account needed for:
          </p>
          <div className="flex flex-wrap gap-2">
            {['Card comparison', 'Smart Match', 'Points optimizer', 'Calculators'].map(f => (
              <span
                key={f}
                className="text-xs px-2 py-1 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted, rgba(255,255,255,0.5))' }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs text-center" style={{ color: 'var(--text-muted, rgba(255,255,255,0.3))' }}>
          By signing in you agree to our{' '}
          <a href="/privacy" className="underline hover:text-[#C9972E]">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}
