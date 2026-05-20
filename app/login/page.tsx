'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Logo } from '@/components/Logo';
import { Shield, Star, Zap, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const signInWithGoogle = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `https://creditiq.app/auth/callback?next=/dashboard`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
  };

  return (
    <main className="min-h-screen flex" style={{ overflowX: 'hidden' }}>

      {/* Left — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 grain" style={{ background: 'linear-gradient(135deg, #0f1f35 0%, #1B3A5C 60%, #0d2540 100%)' }}>
        <Logo size="md" showWordmark={true} />
        <div className="space-y-6">
          {[
            { icon: TrendingUp, text: 'See all your points in one dashboard — HDFC, Axis, Amex combined' },
            { icon: Zap, text: 'AI finds the highest-value redemption for your exact portfolio' },
            { icon: Shield, text: 'Zero affiliate bias — we rank cards by value, not by commission' },
            { icon: Star, text: 'Live devaluation alerts before your points lose value' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(201,151,46,0.15)' }}>
                <Icon className="w-4 h-4" style={{ color: '#C9972E' }} />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{text}</p>
            </div>
          ))}
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>93+ cards · 17 banks · India · UAE · Singapore</p>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Logo size="md" showWordmark={true} />
          </div>

          <h1 className="font-display text-3xl mb-2" style={{ color: 'var(--text)' }}>Welcome back</h1>
          <p className="mb-8" style={{ color: 'var(--text-muted)' }}>Sign in to see your card portfolio and points dashboard.</p>

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border font-medium text-sm transition-all"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)', color: 'var(--text)', opacity: loading ? 0.7 : 1 }}
          >
            {/* Google SVG */}
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {loading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* Coming soon - email */}
          <div className="rounded-xl p-4 border text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Email / mobile OTP login coming soon</p>
          </div>

          <p className="text-xs text-center mt-6" style={{ color: 'var(--text-dim)' }}>
            By signing in you agree to our{' '}
            <Link href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>
          </p>

          <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs text-center mb-4" style={{ color: 'var(--text-dim)' }}>No account needed for:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Card comparison', 'Smart Match', 'Points optimizer', 'Calculators'].map(f => (
                <span key={f} className="text-xs px-2.5 py-1 rounded-full border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>{f}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
